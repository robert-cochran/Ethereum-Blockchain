import React, {Component} from 'react';
import ViewDataTable from '../../components/ViewDataTable';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import { Decrypt } from '../../encryption';
import { SignatureVerifier } from '../../signature';

import _ from "lodash";

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class viewDataAsPatientEncrypted extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            lastId: 0,
            dataEntries: [],
            privateKey: ''
        }
        this.getLastId = this.getLastId.bind(this);
        this.getData = this.getData.bind(this);
        this.updatePrivateKey = this.updatePrivateKey.bind(this);
    }

    componentWillMount() {
        const self = this;
        window.web3.eth.getAccounts((err, res) => {                   
            self.address = res[0];
        });
        this.deployed = '';
        MyContract.setProvider(provider);
        MyContract.deployed().then((instance) => {
          this.deployed = instance;
        });
    }

    getLastId() {
        const instance = this.deployed;
        instance.getNextAvailableRecordId(
            {from: this.address}
        ).then((result) => {
            this.setState({
                lastId: result.toNumber()
            });
            this.getData();
        }).catch(function(error) {
            console.log(error);
        });
    }

    getData() {
        const { lastId, privateKey } = this.state;
        const dataEntries = [{}];
        const self = this;
        Promise.all(_.map(_.range(0, lastId), (i) => {
            const instance = this.deployed;
            return instance.getRecordWithMetaDataAsPatient(
                i, {from: this.address}
            ).then((data) => {
                const encryptedData = window.web3.toAscii(data[0]);
                const signedHash = window.web3.toAscii(data[1]);
                const authorAddress = data[2];
                this.setState({
                    loaded: true
                });

                return Promise.all([instance.publicKeys(
                    authorAddress, {from: this.address}
                ), encryptedData, signedHash, authorAddress]);
            }).then(([publicKeyStruct, encryptedData, signedHash, authorAddress]) => {
                const providerPublicKey = publicKeyStruct[1];
                const providerId = publicKeyStruct[0]

                const decrypt = new Decrypt(providerPublicKey, privateKey);
                const decryptedData = decrypt.decrypt(encryptedData);
                return {
                    decryptedData, signedHash, providerPublicKey, providerId
                };
            }).then(({decryptedData, signedHash, providerPublicKey, providerId}) => {
                const verifier = new SignatureVerifier(providerPublicKey);
                const validMessage = verifier.verify(decryptedData, signedHash);
                dataEntries.push({
                    data: decryptedData,
                    author: providerId
                });
            }).catch(function(error) {
                console.log(error);
            });
        })).then(() => {
            self.setState({
                dataEntries
            });
        });
    };

    updatePrivateKey(event, newValue) {
        this.setState({
            privateKey: newValue
        });
    }

    render() {

    const { loaded, dataEntries, privateKey } = this.state;
        return (
            <div>
                <TextField 
                    id="privateKey"
                    hintText="Private Key"
                    value={privateKey}
                    style={{width: '600px'}}
                    onChange={this.updatePrivateKey}
                    multiLine
                />
                <br />
                <RaisedButton
                    primary
                    label="Get Patient Data"
                    onClick={this.getLastId}
                />
                {!loaded ? null : (
                    <div>
                        <h4>Data:</h4>
                        <ViewDataTable tableData={dataEntries}/>
                    </div>
                )}
            </div>
        )
    }
}

export default viewDataAsPatientEncrypted;
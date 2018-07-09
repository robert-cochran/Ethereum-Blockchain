import React, {Component} from 'react';
import ViewDataTable from '../../components/ViewDataTable';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import { Decrypt } from '../../encryption';
import { SignatureVerifier } from '../../signature';

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
            privateKey: '',
            patientAddress: ''
        }
        this.getLastId = this.getLastId.bind(this);
        this.getData = this.getData.bind(this);
        this.updatePrivateKey = this.updatePrivateKey.bind(this);
        this.updatePatientAddress = this.updatePatientAddress.bind(this);
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
        instance.getPatientNextAvailableRecordId(
            this.state.patientAddress,
            {from: this.address}
        ).then((result) => {
            this.setState({
                lastId: result.toNumber()
            }, this.getData);
        }).catch(function(error) {
            console.log(error);
        });
    }

    getData() {
        const { lastId, privateKey, patientAddress } = this.state;
        const dataEntries = [{}];
        const self = this;
        for (let i = 0; i <= lastId; i++) {
            const instance = this.deployed;
            instance.getRecordWithMetaDataAsProvider(
                patientAddress, i, {from: this.address}
            ).then((data) => {
                const encryptedData = window.web3.toAscii(data[0]);
                const signedHash = window.web3.toAscii(data[1]);
                const authorAddress = data[2];
                
                if (/^0x0+$/.test(authorAddress) && lastId === 0) {
                    this.setState({
                        loaded: true, dataEntries: []
                    });
                    throw new Error();
                }

                this.setState({
                    loaded: true
                });

                return Promise.all([
                    instance.publicKeys(authorAddress, {from: this.address}),
                    instance.publicKeys(patientAddress, {from: this.address}),
                    encryptedData, signedHash, authorAddress
                ]);
            }).then(([authorKeyStruct, patientKeyStruct, encryptedData, signedHash, authorAddress]) => {
                const patientPublicKey = patientKeyStruct[1];
                const authorPublicKey = authorKeyStruct[1];
                const authorId = authorKeyStruct[0];

                const decrypt = new Decrypt(patientPublicKey, privateKey);
                const decryptedData = decrypt.decrypt(encryptedData);

                return {
                    decryptedData, signedHash, authorPublicKey, authorId
                };
            }).then(({decryptedData, signedHash, authorPublicKey, authorId}) => {
                const verifier = new SignatureVerifier(authorPublicKey);
                const validMessage = verifier.verify(decryptedData, signedHash);
                dataEntries.push({
                    data: decryptedData,
                    author: authorId
                });
                self.setState({
                    dataEntries
                });
            }).catch(function(error) {
                console.log(error);
            });
        }
    };

    updatePrivateKey(event, newValue) {
        this.setState({
            privateKey: newValue
        });
    }

    updatePatientAddress(event, newValue) {
        this.setState({
            patientAddress: newValue
        });
    }

    render() {

    const { loaded, dataEntries, privateKey, patientAddress } = this.state;
        return (
            <div>
                <TextField 
                    id="patientAdress"
                    hintText="Patient Address"
                    value={patientAddress}
                    style={{width: '600px'}}
                    onChange={this.updatePatientAddress}
                    multiLine
                />
                <br />
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
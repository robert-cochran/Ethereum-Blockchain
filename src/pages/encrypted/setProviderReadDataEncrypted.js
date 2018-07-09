import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import { Decrypt, Encrypt } from '../../encryption';
import { SignatureVerifier } from '../../signature';

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class setProviderReadDataEncrypted extends Component {

    constructor() {
        super();
        this.state = {
            providerId: '',
            privateKey: '',
            permissionFlag: true
        }
        this.updateProviderId = this.updateProviderId.bind(this);
        this.updatePrivateKey = this.updatePrivateKey.bind(this);
        this.setProvider = this.setProvider.bind(this);
        this.getLastId = this.getLastId.bind(this);
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

    updateProviderId(event, newValue) {
        this.setState({
            providerId: newValue
        });
    };

    updatePrivateKey(event, newValue) {
        this.setState({
            privateKey: newValue
        });
    };

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
        const self = this;
        let encryptedData;
        for (let i = 0; i < lastId; i++) {
            const instance = this.deployed;
            instance.getRecordWithMetaDataAsPatient(
                i, {from: this.address}
            ).then((data) => {
                encryptedData = window.web3.toAscii(data[0]);
                const signedHash = window.web3.toAscii(data[1]);
                const authorAddress = data[2];
                this.setState({
                    loaded: true
                });

                return Promise.all([
                    instance.publicKeys(authorAddress, {from: this.address}),
                    instance.publicKeys(this.state.providerId, {from: this.address}),
                    encryptedData, signedHash, authorAddress
                ]);
            }).then(([authorKeyStruct, providerKeyStruct, encryptedData, signedHash, authorAddress]) => {
                const authorPublicKey = authorKeyStruct[1];
                const providerPublicKey = providerKeyStruct[1];

                const decrypt = new Decrypt(authorPublicKey, privateKey);
                const decryptedData = decrypt.decrypt(encryptedData);
                return {
                    decryptedData, signedHash, providerPublicKey, authorPublicKey
                };
            }).then(({decryptedData, signedHash, providerPublicKey, authorPublicKey}) => {
                const verifier = new SignatureVerifier(authorPublicKey);
                const validMessage = verifier.verify(decryptedData, signedHash);
                self.setProvider(decryptedData, providerPublicKey, i)
            }).catch(function(error) {
                console.log(error);
            });
        }
    };

    setProvider(decryptedData, providerPublicKey, i) {
        const self = this;
        const { providerId, privateKey } = this.state;
        const instance = this.deployed;

        const encrypt = new Encrypt(privateKey, providerPublicKey);
        const encryptedData = encrypt.encrypt(decryptedData);

        instance.addProviderEncryptedData(
            providerId, encryptedData, i, {from: this.address}
        ).then((result) => {
            self.setState({
                permissionFlag: true
            });
        }).catch(function(error) {
            console.log(error);
        });
    }

    render() {
        const { providerId, permissionFlag, privateKey } = this.state;
        return (
            <div>
                <h4>Add Provider (Read):</h4>
                <TextField 
                    id="addProvider"
                    value={providerId}
                    onChange={this.updateProviderId}
                    style={{width: '600px'}}
                    hintText="Provider ID"
                />
                <br />
                <TextField 
                    id="addProvider"
                    value={privateKey}
                    onChange={this.updatePrivateKey}
                    style={{width: '600px'}}
                    hintText="Private Key"
                />
                <br />
                <RaisedButton
                    primary
                    label="Set Provider (Read)"
                    onClick={this.getLastId}
                />
                {permissionFlag ? null : (
                    <p 
                        style={{color: '#FF0000'}}
                    >
                        Provider not set.
                    </p>
                )}
            </div>
        );
    }
}

export default setProviderReadDataEncrypted;
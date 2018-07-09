import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class setProvidersAsPatientEncrypted extends Component {

    constructor() {
        super();
        this.state = {
            providerToBeSet: '',
            permissionFlag: true
        }
        this.updateProviderToBeSet = this.updateProviderToBeSet.bind(this);
        this.setProvider = this.setProvider.bind(this);
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

    updateProviderToBeSet(event, newValue) {
        this.setState({
            providerToBeSet: newValue
        });
    };

    setProvider() {
        const self = this;
        const { providerToBeSet } = this.state;
        const instance = this.deployed;
        instance.authoriseProvider(
            providerToBeSet, {from: this.address}
        ).then((result) => {
            this.setState({
                providerToBeSet: '',
            });
        }).catch(function(error) {
            console.log(error);
            self.setState({
                permissionFlag: false
            });
        });
    }

    render() {
        const { providerToBeSet, permissionFlag } = this.state;
        return (
            <div>
                <h4>Add Provider:</h4>
                <TextField
                    id="addProvider"
                    value={providerToBeSet}
                    onChange={this.updateProviderToBeSet}
                    style={{width: '500px'}}
                    hintText="Provider"
                />
                <br />
                <RaisedButton
                    primary
                    label="Set Provider"
                    onClick={this.setProvider}
                />
                {permissionFlag ? null : (
                    <p 
                        style={{color: '#FF0000'}}
                    >
                        Provider not set - this provider does not have an associated account.
                    </p>
                )}
            </div>
        );
    }
}

export default setProvidersAsPatientEncrypted;
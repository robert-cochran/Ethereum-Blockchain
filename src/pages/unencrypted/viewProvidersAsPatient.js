import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import ViewProvidersTable from '../../components/ViewProvidersTable';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class viewProvidersAsPatient extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            providersRead: [],
            providersWrite: [],
            providerToBeSet: '',
            providerToBeDeleted: '',
            readCheck: false,
            writeCheck: false
        }
        this.getProvidersRead = this.getProvidersRead.bind(this);
        this.getProvidersWrite = this.getProvidersWrite.bind(this);
        this.updateProviderToBeSet = this.updateProviderToBeSet.bind(this);
        this.updateProviderToBeDeleted = this.updateProviderToBeDeleted.bind(this);
        this.updateReadCheck = this.updateReadCheck.bind(this);
        this.updateWriteCheck = this.updateWriteCheck.bind(this);
        this.setProvider = this.setProvider.bind(this);
        this.setProviderRead = this.setProviderRead.bind(this);
        this.setProviderWrite = this.setProviderWrite.bind(this);
        this.deleteProvider = this.deleteProvider.bind(this);
        this.updateTable = this.updateTable.bind(this);
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
          this.getProvidersRead();
        });
    }

    getProvidersRead() {
        const instance = this.deployed;
        this.setState({
            loaded: false
        });
        instance.getReaders(
            {from: this.address}
        ).then((providersRead) => {  
            this.setState({
                providersRead,
            });
            this.getProvidersWrite();
        }).catch(function(error) {
            console.log(error);
        });
    };

    getProvidersWrite() {
        const instance = this.deployed;
        instance.getWriters(
            {from: this.address}
        ).then((providersWrite) => {  
            this.setState({
                providersWrite,
                loaded: true
            });
        }).catch(function(error) {
            console.log(error);
        });
    }

    updateProviderToBeSet(event, newValue) {
        this.setState({
            providerToBeSet: newValue
        });
    };

    updateProviderToBeDeleted(event, newValue) {
        this.setState({
            providerToBeDeleted: newValue
        });
    };

    updateReadCheck(event, isInputChecked) {
        this.setState({
            readCheck: isInputChecked
        });
    }

    updateWriteCheck(event, isInputChecked) {
        this.setState({
            writeCheck: isInputChecked
        });
    }

    setProvider() {
        const { readCheck, writeCheck, providerToBeSet,
            providersRead, providersWrite } = this.state;
        const readExists = providersRead.includes(providerToBeSet);
        const writeExists = providersWrite.includes(providerToBeSet);

        if (readCheck && !readExists) {
            this.setProviderRead(providerToBeSet, true);
        } else if (!readCheck && readExists) {
            this.setProviderRead(providerToBeSet, false);
        }
        if (writeCheck && !writeExists) {
            this.setProviderWrite(providerToBeSet, true);
        } else if (!writeCheck && writeExists) {
            this.setProviderWrite(providerToBeSet, false);
        }
        this.setState({
            providerToBeSet: '',
            readCheck: false,
            writeCheck: false
        });
    }

    setProviderRead(provider, accessFlag) {
        const instance = this.deployed;
        instance.grantReadAccess(
            provider, accessFlag, {from: this.address}
        ).then((result) => {    
        }).catch(function(error) {
            console.log(error);
        });
    }

    setProviderWrite(provider, accessFlag) {
        const instance = this.deployed;
        instance.grantWriteAccess(
            provider, accessFlag, {from: this.address}
        ).then((result) => {    
        }).catch(function(error) {
            console.log(error);
        });
    }

    deleteProvider() {
        const { providerToBeDeleted } = this.state;
        this.setProviderRead(providerToBeDeleted, false);
        this.setProviderWrite(providerToBeDeleted, false);
        this.setState({
            providerToBeDeleted: ''
        });
    }

    updateTable() {
        this.getProvidersRead();
    }

    render() {
        const { loaded, providerToBeSet, providerToBeDeleted, providersRead, providersWrite,
            readCheck, writeCheck } = this.state;
        return !loaded ? null : (
            <div>
                <h4>View Providers:</h4>
                <ViewProvidersTable
                    providersRead={providersRead}
                    providersWrite={providersWrite}
                    update={this.updateTable}
                />
                <h4>Add Provider:</h4>
                <TextField 
                    id="addProvider"
                    value={providerToBeSet}
                    onChange={this.updateProviderToBeSet}
                    style={{width: '500px'}}
                    hintText="Provider"
                />
                <Checkbox
                    label="Read"
                    checked={readCheck}
                    onCheck={this.updateReadCheck}
                />
                <Checkbox
                    label="Write"
                    checked={writeCheck}
                    onCheck={this.updateWriteCheck}
                />
                <RaisedButton
                    primary
                    label="Set Provider"
                    onClick={this.setProvider}
                />
                {((providersWrite.length === 0) && (providersRead.length === 0)) ? null :
                    (
                        <div>
                            <h4>Delete provider</h4>
                            <TextField 
                                id="deleteProvider"
                                value={providerToBeDeleted}
                                onChange={this.updateProviderToBeDeleted}
                                style={{width: '500px'}}
                            />
                            <RaisedButton
                                primary
                                label="Delete Provider"
                                onClick={this.deleteProvider}
                            />
                        </div>
                    )
                }
            </div>
        );
    }
}

export default viewProvidersAsPatient;
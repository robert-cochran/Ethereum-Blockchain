import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import ViewProvidersTable from '../../components/ViewProvidersTable';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class viewProvidersAsGuardian extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            providersRead: [],
            providersWrite: [],
            providerToBeSet: '',
            providerToBeDeleted: '',
            readCheck: false,
            writeCheck: false,
            patientId: '',
            permissionFlag: true
        }
        this.getProvidersRead = this.getProvidersRead.bind(this);
        this.getProvidersWrite = this.getProvidersWrite.bind(this);
        this.updatePatientId = this.updatePatientId.bind(this);
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
        });
    }

    getProvidersRead() {
        const self = this;
        const { patientId } = this.state;
        const instance = this.deployed;
        this.setState({
            loaded: false
        });
        instance.getPatientReaders(
            patientId, {from: this.address}
        ).then((providersRead) => {  
            this.setState({
                providersRead,
            });
            this.getProvidersWrite();
        }).catch(function(error) {
            console.log(error);
            self.setState({
                permissionFlag: false
            });
        });
    };

    getProvidersWrite() {
        const { patientId } = this.state;
        const instance = this.deployed;
        instance.getPatientWriters(
            patientId, {from: this.address}
        ).then((providersWrite) => {  
            this.setState({
                providersWrite,
                loaded: true,
            });
        }).catch(function(error) {
            console.log(error);
        });
    }

    updatePatientId(event, newValue) {
        this.setState({
            patientId: newValue
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
        const { patientId } = this.state;
        const instance = this.deployed;
        instance.grantReadAccessForPatient(
            patientId, provider, accessFlag, {from: this.address}
        ).then((result) => {    
            console.log("provider (read) set");
            this.getProvidersRead();
        }).catch(function(error) {
            console.log(error);
        });
    }

    setProviderWrite(provider, accessFlag) {
        const { patientId } = this.state;
        const instance = this.deployed;
        instance.grantWriteAccessForPatient(
            patientId, provider, accessFlag, {from: this.address}
        ).then((result) => {    
            console.log("provider (write) set");
            this.getProvidersRead();
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
            readCheck, writeCheck, patientId, permissionFlag } = this.state;
        return (
            <div>
                <TextField 
                    id="patientId"
                    style={{width: '500px'}}
                    value={patientId}
                    onChange={this.updatePatientId}
                    hintText="Patient ID"
                />
                <br />
                <RaisedButton
                    primary
                    label="View Patient Providers"
                    onClick={this.getProvidersRead}
                />
                {permissionFlag ? null : (
                    <p>You are not a guardian for this patient!</p>
                )}
                {!loaded ? null : (
                    <div>
                        <ViewProvidersTable
                            providersRead={providersRead}
                            providersWrite={providersWrite}
                            update={this.updateTable}
                        />
                        <p>Add Provider</p>
                        <TextField 
                            id="addProvider"
                            value={providerToBeSet}
                            onChange={this.updateProviderToBeSet}
                            style={{width: '500px'}}
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
                        {((providersWrite.length === 1) && (providersRead.length === 1)) ? null :
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
                )}
            </div>
        );
    }
}

export default viewProvidersAsGuardian;
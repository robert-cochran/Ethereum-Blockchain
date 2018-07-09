import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import ViewDataTable from '../../components/ViewDataTable';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class viewDataAsOther extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            patientId: '',
            lastId: 0,
            dataEntries: [],
            permissionFlag: true
        }
        this.getPatientLastId = this.getPatientLastId.bind(this);
        this.requestData = this.requestData.bind(this);
        this.updatePatientId = this.updatePatientId.bind(this);
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

    getPatientLastId() {
        const self = this;
        const { patientId } = this.state;
        const instance = this.deployed;
        instance.getPatientLastId(
            patientId, {from: this.address}
        ).then((result) => {
            this.setState({
                lastId: result.toNumber(),
            });
            this.requestData();
        }).catch(function(error) {
            console.log(error);
            self.setState({
                permissionFlag: false
            });
        });
    }

    requestData() {
        const { lastId, patientId } = this.state;
        const dataEntries = [];
        const self = this;
        for (let i = 0; i < (lastId+1); i++) {
            const instance = this.deployed;
            instance.requestData(
                patientId, i, {from: this.address}
            ).then((data) => {
                instance.getPatientDataAuthor(
                    patientId, i, {from: this.address}
                ).then((author) => {
                    dataEntries.push({
                        data: window.web3.toAscii(data),
                        author
                    });
                    self.setState({
                        dataEntries,
                        loaded: true,
                        patientId: ''
                    });
                });
            }).catch(function(error) {
                console.log(error);
            })
        }
    };

    updatePatientId(event, newValue) {
        this.setState({
            patientId: newValue
        });
    }

    render() {
        const { loaded, dataEntries, patientId, permissionFlag } = this.state;
        return (
            <div>
                <h4>Patient Data:</h4>
                <TextField 
                    id="patientId"
                    hintText="Patient Id"
                    style={{width: '500px'}}
                    value={patientId}
                    onChange={this.updatePatientId}
                />
                <br />
                <RaisedButton
                    primary
                    label="Request Patient Data"
                    onClick={this.getPatientLastId}
                />
                {permissionFlag ? null : (
                    <p 
                        style={{color: '#FF0000'}}
                    >
                        You do not have permission to view data for this patient.
                    </p>
                )}
                {!loaded ? null : (
                    <ViewDataTable tableData={dataEntries}/>
                )}
            </div>
        );
    }
}

export default viewDataAsOther;
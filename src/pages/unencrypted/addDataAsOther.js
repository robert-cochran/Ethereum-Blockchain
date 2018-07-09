import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class addDataAsOther extends Component {	

	constructor() {
		super();
		this.state = {
			dataToAdd: '',
			patientId: '',
			permissionFlag: true
		}
		this.addData = this.addData.bind(this);
		this.updateDataToAdd = this.updateDataToAdd.bind(this);
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

	addData() {
		const self = this;
		const { patientId, dataToAdd } = this.state;
		const data = window.web3.fromAscii(dataToAdd);
		const instance = this.deployed;
        instance.addDataForPatient(
        	patientId, data, {from: this.address}
        ).then((result) => {
            this.setState({
            	dataToAdd: '',
            	patientId: ''
            });
        }).catch(function(error) {
        	console.log(error);
        	self.setState({
        		permissionFlag: false
        	})
        });
	}

	updateDataToAdd(event, newValue) {
		this.setState({
			dataToAdd: newValue
		});
	}

	updatePatientId(event, newValue) {
		this.setState({
			patientId: newValue
		});
	}

	render() {
		const { dataToAdd, patientId, permissionFlag } = this.state;
		return(
			<div>
				<h4>Add Patient Data:</h4>
				<TextField 
                    id="patientId"
                    hintText="Patient Id"
                    style={{width: '600px'}}
                    value={patientId}
                    onChange={this.updatePatientId}
                />
                <br />
				<TextField 
					id="addData"
					hintText="Patient Data"
					value={dataToAdd}
					style={{width: '600px'}}
					onChange={this.updateDataToAdd}
					multiLine
				/>
				<br />
				<RaisedButton
					primary
					label="Add Patient Data"
					onClick={this.addData}
				/>
				{permissionFlag ? null : (
                    <p 
                    	style={{color: '#FF0000'}}
                    >
                    	Data not added. You don't have access to add data for this patient.
                    </p>
                )}
			</div>
		);
	}
}

export default addDataAsOther;
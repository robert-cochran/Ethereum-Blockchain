import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class addDataAsPatient extends Component {	

	constructor() {
		super();
		this.state = {
			dataToAdd: ''
		}
		this.addData = this.addData.bind(this);
		this.updateDataToAdd = this.updateDataToAdd.bind(this);
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
		const { dataToAdd } = this.state;
		const data = window.web3.fromAscii(dataToAdd);
		const instance = this.deployed;
        instance.addData(
        	data, {from: this.address}
        ).then((result) => {
            this.setState({
            	dataToAdd: ''
            });
        }).catch(function(error) {
        	console.log(error)
        });
	}

	updateDataToAdd(event, newValue) {
		this.setState({
			dataToAdd: newValue
		});
	}

	render() {
		const { dataToAdd } = this.state;
		return(
			<div>
				<h4>Add Data:</h4>
				<TextField 
					id="addData"
					value={dataToAdd}
					onChange={this.updateDataToAdd}
					style={{width: '600px'}}
					multiLine
					hintText="Patient Data"
				/>
				<br />
				<RaisedButton
					primary
					label="Add Data"
					onClick={this.addData}
				/>
			</div>
		);
	}
}

export default addDataAsPatient;
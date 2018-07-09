import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import { Encrypt, make_public } from '../../encryption';
import { private_sign, SignatureGenerator } from '../../signature';

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class addDataAsPatientEncrypted extends Component {	

	constructor() {
		super();
		this.state = {
			dataToAdd: '',
			privateKey: ''
		}
		this.addData = this.addData.bind(this);
		this.updateDataToAdd = this.updateDataToAdd.bind(this);
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

	addData() {
		const { dataToAdd, privateKey } = this.state;
		const instance = this.deployed;
		const publicKey = make_public(privateKey);

        const encrypt = new Encrypt(privateKey, publicKey);
        const encryptedData = encrypt.encrypt(dataToAdd);

        const signFunc = private_sign(privateKey);
        const sigMaker = new SignatureGenerator(signFunc);
        sigMaker.sign(dataToAdd).then((signedData) => {
	        instance.addRecord(
	        	this.address, encryptedData, 'string', signedData, {from: this.address}
	        ).then((result) => {
	            this.setState({
	            	dataToAdd: '',
	            	privateKey: ''
	            });
	        }).catch(function(error) {
	        	console.log(error);
	        });
		});
    }

	updateDataToAdd(event, newValue) {
		this.setState({
			dataToAdd: newValue
		});
	}

	updatePrivateKey(event, newValue) {
		this.setState({
			privateKey: newValue
		});
	}

	render() {
		const { dataToAdd, privateKey } = this.state;
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
				<TextField 
					id="privateKey"
					value={privateKey}
					onChange={this.updatePrivateKey}
					style={{width: '600px'}}
					multiLine
					hintText="Private Key"
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

export default addDataAsPatientEncrypted;
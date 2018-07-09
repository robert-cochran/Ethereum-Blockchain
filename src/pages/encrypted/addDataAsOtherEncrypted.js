import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import { Encrypt } from '../../encryption';
import { private_sign, SignatureGenerator } from '../../signature';
 
import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class addDataAsOtherEncrypted extends Component {	

	constructor() {
		super();
		this.state = {
			dataToAdd: '',
			patientId: '',
			privateKey: '',
			permissionFlag: true
		}
		this.addData = this.addData.bind(this);
		this.updateDataToAdd = this.updateDataToAdd.bind(this);
		this.updatePatientId = this.updatePatientId.bind(this);
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
		const { patientId, dataToAdd, privateKey } = this.state;
		const instance = this.deployed;

        instance.publicKeys(
            patientId, {from: this.address}
        ).then((publicKeyStruct) => {
            const patientPublicKey = publicKeyStruct[1];
            const encrypt = new Encrypt(privateKey, patientPublicKey);
	        const encryptedData = encrypt.encrypt(dataToAdd);

	        const signFunc = private_sign(privateKey);
	        const sigMaker = new SignatureGenerator(signFunc);
	        sigMaker.sign(dataToAdd).then((signedData) => {
		        instance.addRecord(
		        	patientId, encryptedData, 'string', signedData, {from: this.address}
		        ).then((result) => {
		            this.setState({
		            	dataToAdd: '',
		            	privateKey: '',
		            	patientId: ''
		            });
		        }).catch(function(error) {
		        	console.log(error);
		        });
			});
        }).catch(function(error) {
            console.log(error);
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
	
	updatePrivateKey(event, newValue) {
		this.setState({
			privateKey: newValue
		});
	}

	render() {
		const { dataToAdd, patientId, privateKey, permissionFlag } = this.state;
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

export default addDataAsOtherEncrypted;
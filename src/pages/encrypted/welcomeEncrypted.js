import React, {Component} from 'react';
import { Link } from 'react-router-dom';

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class welcomeEncrypted extends Component {

	constructor() {
		super();
		this.state = {
			loaded: false,
			hasAccount: false
		}
        this.checkIfRegisteredAccount = this.checkIfRegisteredAccount.bind(this);
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
          setTimeout(function() {
                self.checkIfRegisteredAccount();
            }, 200)
        });
	}

	checkIfRegisteredAccount() {
        const instance = this.deployed;
        instance.publicKeys(
            this.address, {from: this.address}
        ).then((publicKeyStruct) => {
            const hasAccount = publicKeyStruct[2];
            this.setState({
            	hasAccount,
            	loaded: true
            });
        }).catch(function(error) {
            console.log(error);
        });
	}

    render() {
    	const { loaded, hasAccount } = this.state;
    	return !loaded ? null : (
            <div>
                {hasAccount ? 
                	<h3>Welcome! You have an account!</h3> :
                	<div>
                		<h3>Welcome! You don't have an account!</h3>
                        <Link to = "/registerAccount">Please register an account!</Link>
                	</div>
                }
            </div>
        );
    }
}

export default welcomeEncrypted;

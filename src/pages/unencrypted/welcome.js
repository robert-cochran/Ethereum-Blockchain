import React, {Component} from 'react';
import { Link } from 'react-router-dom';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class welcome extends Component {

	constructor() {
		super();
		this.state = {
			loaded: false,
			hasAccount: false
		}
        this.checkIfOpenAccount = this.checkIfOpenAccount.bind(this);
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
          this.checkIfOpenAccount();
        });
	}

	checkIfOpenAccount() {
        const instance = this.deployed;
        instance.hasAccount(
            {from: this.address}
        ).then((hasAccount) => {
            console.log(hasAccount);
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
                        <Link to = "/openAccount">If you are a patient, then please open an account!</Link>
                	</div>
                }
            </div>
        );
    }
}

export default welcome;

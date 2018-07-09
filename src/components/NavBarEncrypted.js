import React, {Component} from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import { Link } from 'react-router-dom';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import AccountCircle from 'material-ui/svg-icons/action/account-circle';
import Home from 'material-ui/svg-icons/action/home';
import Visibility from 'material-ui/svg-icons/action/visibility';
import Add from 'material-ui/svg-icons/content/add';
import Hospital from 'material-ui/svg-icons/maps/local-hospital';

import healthCareDataEncrypted from '../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

const style = {
	drawer: {
		top: '64px',
		width: '20%'
	}
}

class NavBar extends Component {

	constructor() {
		super();
		this.state = {
			loaded: false,
			hasAccount: false,
			interval: null
		}
        this.checkIfRegisteredAccount = this.checkIfRegisteredAccount.bind(this);
        this.checkLoop = this.checkLoop.bind(this);
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
                self.checkLoop();
            }, 200)
        });
	}

	checkLoop() {
		const self = this;
		const interval = setInterval(function() {
			self.checkIfRegisteredAccount();
		}, 3000);
		this.setState({
			interval
		});
	}

	checkIfRegisteredAccount() {
		const { hasAccount, interval } = this.state;
		if (hasAccount) {
			clearInterval(interval);
		}
        const instance = this.deployed;
        instance.publicKeys(
            this.address, {from: this.address}
        ).then((publicKeyStruct) => {
            const hasAccount = publicKeyStruct[2];
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
            <Drawer
            	containerStyle={style.drawer}
            >
	          <MenuItem
	          	containerElement={<Link to = "/homeEncrypted" />}
	          	primaryText="Home"
	          	leftIcon={<Home />}
	          />
	          {(!hasAccount ?
	          	<MenuItem
	          		containerElement={<Link to = "/registerAccount" />}
		          	primaryText="Register Account"
		          	leftIcon={<AccountCircle />}
		          /> 
	          	: <div>
	          	  <Divider />
	          	  <Subheader>Patient</Subheader>
		          <MenuItem
		          	containerElement={<Link to = "/viewDataEncrypted/patient" />}
		          	primaryText="View Data"
		          	leftIcon={<Visibility />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/addDataEncrypted/patient" />}
		          	primaryText="Add Data"
		          	leftIcon={<Add />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/viewProvidersEncrypted/patient" />}
		          	primaryText="Add Provider (Write)"
		          	leftIcon={<Hospital />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/setProviderReadEncrypted/patient" />}
		          	primaryText="Add Provider (Read)"
		          	leftIcon={<Hospital />}
		          />
		        </div>
		    )}
	          <Divider />
	          <Subheader>Provider</Subheader>
	          <MenuItem
	          	containerElement={<Link to = "/viewDataEncrypted/other" />}
	          	primaryText="View Patient Data"
	          	leftIcon={<Visibility />}
	          />
	          <MenuItem
	          	containerElement={<Link to = "/addDataEncrypted/other" />}
	          	primaryText="Add Patient Data"
	          	leftIcon={<Add />}
	          />
		    </Drawer>
        );
    }
}

export default NavBar;

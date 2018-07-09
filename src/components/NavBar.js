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
import People from 'material-ui/svg-icons/social/people';
import Hospital from 'material-ui/svg-icons/maps/local-hospital';

import healthCareData from '../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

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
        instance.hasAccount({from: this.address}).catch(function(error) {
            console.log(error);
        }).then((hasAccount) => {
            console.log(hasAccount);
            this.setState({
            	hasAccount,
            	loaded: true,
            });
        })
	}

    render() {
    	const { loaded, hasAccount } = this.state;
        return !loaded ? null : (
            <Drawer
            	containerStyle={style.drawer}
            >
	          <MenuItem
	          	containerElement={<Link to = "/home" />}
	          	primaryText="Home"
	          	leftIcon={<Home />}
	          />
	          {(!hasAccount ? 
	          	<MenuItem
	          		containerElement={<Link to = "/openAccount" />}
		          	primaryText="Open Account"
		          	leftIcon={<AccountCircle />}
		          />
	          	: <div>
	          	  <Divider />
	          	  <Subheader>Patient</Subheader>
		          <MenuItem
		          	containerElement={<Link to = "/viewData/patient" />}
		          	primaryText="View Data"
		          	leftIcon={<Visibility />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/addData/patient" />}
		          	primaryText="Add Data"
		          	leftIcon={<Add />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/viewGuardian/patient" />}
		          	primaryText="Edit Guardian"
		          	leftIcon={<People />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/viewProviders/patient" />}
		          	primaryText="Edit Providers"
		          	leftIcon={<Hospital />}
		          />
		        </div>
		    )}
		          <Divider />
		          <Subheader>Guardian</Subheader>
		          <MenuItem
		          	containerElement={<Link to = "/viewData/other" />}
		          	primaryText="View Patient Data"
		          	leftIcon={<Visibility />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/addData/other" />}
		          	primaryText="Add Patient Data"
		          	leftIcon={<Add />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/viewGuardian/guardian" />}
		          	primaryText="Edit Patient Guardian"
		          	leftIcon={<People />}
		          />
		          <MenuItem
		          	containerElement={<Link to = "/viewProviders/guardian" />}
		          	primaryText="Edit Patient Providers"
		          	leftIcon={<Hospital />}
		          />

	          <Divider />
	          <Subheader>Provider</Subheader>
	          <MenuItem
	          	containerElement={<Link to = "/viewData/other" />}
	          	primaryText="View Patient Data"
	          	leftIcon={<Visibility />}
	          />
	          <MenuItem
	          	containerElement={<Link to = "/addData/other" />}
	          	primaryText="Add Patient Data"
	          	leftIcon={<Add />}
	          />
		    </Drawer>
        );
    }
}

export default NavBar;

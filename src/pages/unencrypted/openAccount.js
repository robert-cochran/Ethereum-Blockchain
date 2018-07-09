import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class openAccount extends Component {

    constructor() {
        super();
        this.state = {
            opened: false
        }
        this.openAccount = this.openAccount.bind(this);
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

    openAccount() {
        const instance = this.deployed;
        instance.openAccount(
            {from: this.address}
        ).then((result) => {
            this.setState({
                opened: true
            });
        }).catch(function(error) {
            console.log(error);
        });
    };

    render() {
        const { opened } = this.state;
        return opened ? <h3>Congratulations! You now have an account!</h3> : 
            <div>
                <h3>Welcome! You don't have an account!</h3>
                <RaisedButton
                    primary
                    label="Open Account"
                    onClick={this.openAccount}
                />
            </div>
    }
}

export default openAccount;
import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { get_web3_public_key } from "../../signature"
import * as utils from "ethereumjs-util";

import healthCareDataEncrypted from '../../contracts/EncryptedHealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareDataEncrypted);

class RegisterAccount extends Component {

    constructor() {
        super();
        this.state = {
            registered: false
        }
        this.registerAccount = this.registerAccount.bind(this);
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

    registerAccount() {
        const instance = this.deployed;

        get_web3_public_key().then((buf) => {
            const publicKey = utils.bufferToHex(buf);
            return instance.createAccount(
                publicKey, {from: this.address}
            )
        }).then((result) => {
            this.setState({
                registered: true
            });
        }).catch(function(error) {
            console.log(error);
        });
    };

    render() {
        const { registered } = this.state;
        return registered ? <h3>Congratulations! You now have an account!</h3> : 
            <div>
                <h3>Welcome! You don't have an account!</h3>
                <RaisedButton
                    primary
                    label="Register Account"
                    onClick={this.registerAccount}
                />
            </div>
    }
}

export default RegisterAccount;
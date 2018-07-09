import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class viewGuardianAsPatient extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            guardian: '',
            guardianToBeSet: ''
        }
        this.getGuardian = this.getGuardian.bind(this);
        this.updateGuardianToBeSet = this.updateGuardianToBeSet.bind(this);
        this.setGuardian = this.setGuardian.bind(this);
        this.deleteGuardian = this.deleteGuardian.bind(this);
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
          this.getGuardian();
        });
    }

    getGuardian() {
        const instance = this.deployed;
        instance.getCurrentGuardian(
            {from: this.address}
        ).then((guardian) => {
            if (guardian === ZERO_ADDRESS) {
                guardian = "No guardian set!";
            }    
            this.setState({
                guardian,
                loaded: true
            });
        }).catch(function(error) {
            console.log(error);
        })
    };

    updateGuardianToBeSet(event, newValue) {
        this.setState({
            guardianToBeSet: newValue
        });
    }

    setGuardian() {
        const { guardianToBeSet } = this.state;
        const instance = this.deployed;
        instance.setGuardian(
            this.address, guardianToBeSet, true, {from: this.address}
        ).then((guardian) => {    
            this.setState({
                guardian: guardianToBeSet,
                guardianToBeSet: ''
            });
        }).catch(function(error) {
            console.log(error);
        });
    }

    deleteGuardian() {
        const { guardian } = this.state;
        const instance = this.deployed;
        instance.setGuardian(
            this.address, guardian, false, {from: this.address}
        ).then((guardian) => {    
            this.setState({
                guardian: "0x0000000000000000000000000000000000000000"
            })
        }).catch(function(error) {
            console.log(error);
        });
    }

    render() {

    const { loaded, guardian, guardianToBeSet } = this.state;
        return !loaded ? null : (
            <div>
                <h4>Patient Guardian:</h4>
                <p>{guardian}</p>
                {(guardian !== ZERO_ADDRESS) ? null :
                    (<RaisedButton
                        primary
                        label="Delete Guardian"
                        onClick={this.deleteGuardian}
                    />)
                }
                <h4>Set Guardian:</h4>
                <TextField 
                    id="setGuardian"
                    value={guardianToBeSet}
                    onChange={this.updateGuardianToBeSet}
                    style={{width: '500px'}}
                    hintText="Guardian"
                />
                <br />
                <RaisedButton
                    primary
                    label="Set Guardian"
                    onClick={this.setGuardian}
                />
            </div>
        );
    }
}

export default viewGuardianAsPatient;
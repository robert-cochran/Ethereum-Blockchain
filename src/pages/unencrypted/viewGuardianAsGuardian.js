import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import healthCareData from '../../contracts/HealthcareData.json';
const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class viewGuardianAsGuardian extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            guardian: '',
            guardianToBeSet: '',
            permissionFlag: true,
            patientId: ''
        }
        this.getGuardian = this.getGuardian.bind(this);
        this.updateGuardianToBeSet = this.updateGuardianToBeSet.bind(this);
        this.updatePatientId = this.updatePatientId.bind(this);
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
        });
    }

    getGuardian() {
        const self = this;
        const { patientId } = this.state;
        const instance = this.deployed;
        this.setState({
            loaded: false
        });
        instance.getPatientCurrentGuardian(
            patientId, {from: this.address}
        ).then((guardian) => {
            if (guardian === ZERO_ADDRESS) {
                guardian = "No guardian set!";
            }    
            this.setState({
                guardian,
                loaded: true,
            });
        }).catch(function(error) {
            console.log(error);
            self.setState({
                permissionFlag: false
            });
        })
    };

    updateGuardianToBeSet(event, newValue) {
        this.setState({
            guardianToBeSet: newValue
        });
    }

    setGuardian() {
        const { guardianToBeSet, patientId } = this.state;
        const instance = this.deployed;
        instance.setGuardian(
            patientId, guardianToBeSet, true, {from: this.address}
        ).then((guardian) => {    
            this.setState({
                guardian: guardianToBeSet,
                guardianToBeSet: '',
            });
            this.getGuardian();
        }).catch(function(error) {
            console.log(error);
        })
    }

    deleteGuardian() {
        const { guardian, patientId } = this.state;
        const instance = this.deployed;
        instance.setGuardian(
            patientId, guardian, false, {from: this.address}
        ).then((guardian) => {    
            this.setState({
                guardian: "0x0000000000000000000000000000000000000000",
            })
        }).catch(function(error) {
            console.log("error");
        })
    }

    updatePatientId(event, newValue) {
        this.setState({
            patientId: newValue
        });
    }

    render() {

    const { loaded, guardian, guardianToBeSet, permissionFlag, patientId } = this.state;
        return (
            <div>
                <h4>Patient Guardian:</h4>
                <TextField 
                    id="patientId"
                    style={{width: '500px'}}
                    value={patientId}
                    onChange={this.updatePatientId}
                    hintText="Patient Id"
                />
                <br />
                <RaisedButton
                    primary
                    label="View Patient Guardian"
                    onClick={this.getGuardian}
                />
                {permissionFlag ? null : (
                    <p 
                        style={{color: '#FF0000'}}
                    >
                        You are not a guardian for this patient.
                    </p>
                )}
                {!loaded ? null: (
                    <div>
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
                        <RaisedButton
                            primary
                            label="Set Guardian"
                            onClick={this.setGuardian}
                        />
                    </div>
                )}

            </div>
        );
    }
}

export default viewGuardianAsGuardian;
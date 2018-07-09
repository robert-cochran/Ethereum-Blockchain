import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import { MuiThemeProvider } from 'material-ui/styles';
import Lock from 'material-ui/svg-icons/action/lock';
import Unlock from 'material-ui/svg-icons/action/lock-open';
import IconButton from 'material-ui/IconButton';
import AppBar from 'material-ui/AppBar';
import './App.css';
import NavBar from './components/NavBar';
import NavBarEncrypted from './components/NavBarEncrypted';
import welcome from './pages/unencrypted/welcome';
import openAccount from './pages/unencrypted/openAccount';

import viewDataAsPatient from './pages/unencrypted/viewDataAsPatient';
import addDataAsPatient from './pages/unencrypted/addDataAsPatient';
import viewGuardianAsPatient from './pages/unencrypted/viewGuardianAsPatient';
import viewProvidersAsPatient from './pages/unencrypted/viewProvidersAsPatient';

import viewGuardianAsGuardian from './pages/unencrypted/viewGuardianAsGuardian';
import viewProvidersAsGuardian from './pages/unencrypted/viewProvidersAsGuardian';

import viewDataAsOther from './pages/unencrypted/viewDataAsOther';
import addDataAsOther from './pages/unencrypted/addDataAsOther';

import welcomeEncrypted from './pages/encrypted/welcomeEncrypted';
import registerAccount from './pages/encrypted/registerAccount';
import addDataAsPatientEncrypted from './pages/encrypted/addDataAsPatientEncrypted';
import addDataAsOtherEncrypted from './pages/encrypted/addDataAsOtherEncrypted';
import viewDataAsPatientEncrypted from './pages/encrypted/viewDataAsPatientEncrypted';
import viewDataAsOtherEncrypted from './pages/encrypted/viewDataAsOtherEncrypted';
import setProvidersAsPatientEncrypted from './pages/encrypted/setProvidersAsPatientEncrypted';
import setProviderReadDataEncrypted from './pages/encrypted/setProviderReadDataEncrypted';

import * as signature from "./signature";
import * as utils from "ethereumjs-util";
window.signature = signature;
window.utils = utils;

const style = {
	div: {
		marginLeft: '22%',
		marginTop: '2%'
	}
}

class App extends Component {

	constructor() {
		super();
		this.state = {
			encryptedFlag: false
		};
		this.setTheme = this.setTheme.bind(this);
	}

	setTheme() {
		const { encryptedFlag } = this.state;
		this.setState({
			encryptedFlag: !encryptedFlag
		});
	}

	render() {
		const { encryptedFlag } = this.state;
		return (
			<MuiThemeProvider>
				<div>
			        <AppBar
		                title="Healthcare-BlockChain Project"
		                iconElementLeft={
		                	<IconButton
		                		onClick={this.setTheme}
		                	>
		                		{encryptedFlag ? <Unlock /> : <Lock />}
		                	</IconButton>
		                }
		                style={encryptedFlag ? {backgroundColor: '#023059'} : null}
		            />
		            {encryptedFlag ? <NavBarEncrypted /> : <NavBar />}
			            <div style={style.div}>
			                <Route exact path="/home" component={welcome} />
			                <Route path="/openAccount" component={openAccount} />

			                <Route path="/viewData/patient" component={viewDataAsPatient} />
			                <Route path="/addData/patient" component={addDataAsPatient} />
			                <Route path="/viewGuardian/patient" component={viewGuardianAsPatient} />
			                <Route path="/viewProviders/patient" component={viewProvidersAsPatient} />

			                <Route path="/viewGuardian/guardian" component={viewGuardianAsGuardian} />
			                <Route path="/viewProviders/guardian" component={viewProvidersAsGuardian} />

			                <Route path="/viewData/other" component={viewDataAsOther} />
			                <Route path="/addData/other" component={addDataAsOther} />


			                <Route exact path="/homeEncrypted" component={welcomeEncrypted} />
			                <Route path="/registerAccount" component={registerAccount} />
			                <Route path="/addDataEncrypted/patient" component={addDataAsPatientEncrypted} />
			                <Route path="/addDataEncrypted/other" component={addDataAsOtherEncrypted} />
			                <Route path="/viewDataEncrypted/patient" component={viewDataAsPatientEncrypted} />
							<Route path="/viewDataEncrypted/other" component={viewDataAsOtherEncrypted} />
			                <Route path="/viewProvidersEncrypted/patient" component={setProvidersAsPatientEncrypted} />
			                <Route path="/setProviderReadEncrypted/patient" component={setProviderReadDataEncrypted} />
			                
			            </div>
			    </div>
			</MuiThemeProvider>
		);
  }
}

export default App;

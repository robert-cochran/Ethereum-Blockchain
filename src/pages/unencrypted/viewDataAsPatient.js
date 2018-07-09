import React, {Component} from 'react';
import ViewDataTable from '../../components/ViewDataTable';

import healthCareData from '../../contracts/HealthcareData.json';

import _ from "lodash";

const provider = window.web3.currentProvider;
const contract = require("truffle-contract");
const MyContract = contract(healthCareData);

class viewDataAsPatient extends Component {

    constructor() {
        super();
        this.state = {
            loaded: false,
            lastId: 0,
            dataEntries: []
        }

        this.address = window.web3.eth.accounts[0];

        this.getLastId = this.getLastId.bind(this);
        this.getData = this.getData.bind(this);
    }

    componentWillMount() {
        this.deployed = '';
        MyContract.setProvider(provider);
        MyContract.deployed().then((instance) => {
          this.deployed = instance;
        }).then(this.getLastId);
    }

    getLastId() {
        const instance = this.deployed;
        instance.getLastId.call(
            {from: this.address}
        ).then((result) => {
            this.setState({
                lastId: result.toNumber(),
            });
        }).then(this.getData).catch((error) => {
            console.error("Error getting last ID");
            console.log(this);
            console.error(error);
        })
    }

    getData() {
        const { lastId } = this.state;
        const dataEntries = [];
        const recordPromises = _.map(_.range(0, lastId + 1), (i) => {
            const instance = this.deployed;
            return instance.viewData.call(
                i, {from: this.address}
            ).then((data) => {
                const authorPromise = instance.getDataAuthor(
                    i, {from: this.address}
                );
                return Promise.all([data, authorPromise]);
            }).then(([data, author]) => {
                dataEntries.push({
                    data: window.web3.toAscii(data),
                    author
                });
                this.setState({
                    dataEntries,
                    loaded: true
                });
            }).catch(function(error) {
                console.error("error w/", i);
                console.error(error);
            });
        });
        return Promise.all(recordPromises);
    };

    render() {

    const { loaded, dataEntries } = this.state;
        return !loaded ? null : (
            <div>
                <h4>Data:</h4>
                <ViewDataTable tableData={dataEntries}/>
            </div>
        );
    }
}

export default viewDataAsPatient;
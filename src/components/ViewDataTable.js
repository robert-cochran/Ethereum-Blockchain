import React, {Component} from 'react';
import {
  Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn,
} from 'material-ui/Table';
import Verified from 'material-ui/svg-icons/action/verified-user';
import Unknown from 'material-ui/svg-icons/action/help';

import { CSVLink } from 'react-csv';

const AUTHORISED_PROVIDERS = [
  "0x21ac9A964beDf2AdF1B66Dff666871F1AC6a5B61",
  "0x786A5115c719057AdF209e03a8cBa6898232DD00"
];

const style = {
  table: {
    width: '90%'
  },
  authorised: {
    width: '15%'
  },
  data: {
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  }
}

class ViewDataTable extends Component {

  isVerified(author) {
    const verified = AUTHORISED_PROVIDERS.includes(author);
    if (verified) {
      return <Verified />;
    }
    return <Unknown />;
  }

  processData() {
    const { tableData } = this.props;
    const rows = [];
    for (let i = 1; i < tableData.length; i++) {
      rows.push(
        <TableRow key={i}>
          <TableRowColumn style={style.data}>{tableData[i].data}</TableRowColumn>
          <TableRowColumn>{tableData[i].author}</TableRowColumn>
          <TableRowColumn
            style={style.authorised}
          >
            {this.isVerified(tableData[i].author)}
          </TableRowColumn>
        </TableRow>
      );
    }
    return rows;
  }

  render() {
      const { tableData } = this.props;
      const modifiedTableData = tableData;
      if (tableData.length === 1) {
        return (
          <h4>No patient data available!</h4>
        )
      }
      return(
          <div>
            <Table style={style.table}>
              <TableHeader displaySelectAll={false}>
                <TableRow>
                  <TableHeaderColumn>Data</TableHeaderColumn>
                  <TableHeaderColumn>Author</TableHeaderColumn>
                  <TableHeaderColumn style={style.authorised}>Verified/Unknown</TableHeaderColumn>
                </TableRow>
              </TableHeader>
              <TableBody displayRowCheckbox={false}>
                {this.processData()}
              </TableBody>
            </Table>
            <CSVLink
              filename={"PatientData.csv"}
              data={modifiedTableData.slice(1)}
            >
              Export Patient Data
            </CSVLink>
          </div>
      );
  }
}

export default ViewDataTable;

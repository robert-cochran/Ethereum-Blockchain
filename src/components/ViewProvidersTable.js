import React, {Component} from 'react';
import {
  Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn,
} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import Done from 'material-ui/svg-icons/action/done';
import Close from 'material-ui/svg-icons/navigation/close';
import Refresh from 'material-ui/svg-icons/navigation/refresh';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const style = {
  table: {
    width: '90%'
  },
  provider: {
    width: '50%'
  }
}

class ViewProvidersTable extends Component {

  processData() {
    const { providersRead, providersWrite } = this.props;
    const rows = [];
    const allProviders = providersWrite.concat(providersRead);
    const uniqueProviders = allProviders.filter(function(item, pos, self) {
      return self.indexOf(item) === pos;
    });
    
    for (let i = 0; i < uniqueProviders.length; i++) {
      if (uniqueProviders[i] !== ZERO_ADDRESS) {
        let readFlag, writeFlag = 0;
        if (providersRead.includes(uniqueProviders[i])) {
          readFlag = 1;
        }
        if (providersWrite.includes(uniqueProviders[i])) {
          writeFlag = 1;
        }

        rows.push(
          <TableRow key={i}>
            <TableRowColumn style={style.provider}>{uniqueProviders[i]}</TableRowColumn>
            <TableRowColumn>{readFlag ? <Done /> : <Close />}</TableRowColumn>
            <TableRowColumn>{writeFlag ? <Done /> : <Close />}</TableRowColumn>
          </TableRow>
        );
      }
    }
    return rows;
  }

  render() {
    const { providersWrite, providersRead } = this.props; 
    if ((providersWrite.length === 0) && (providersRead.length === 0)) {
      return (
        <p>No current providers!</p>
      );
    }
    return(
      <div>
        <Table style={style.table}>
          <TableHeader displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn style={style.provider}>Providers</TableHeaderColumn>
              <TableHeaderColumn>Read</TableHeaderColumn>
              <TableHeaderColumn>Write</TableHeaderColumn>
              <TableHeaderColumn>
                <IconButton 
                  onClick={this.props.update}
                >
                  <Refresh />
                </IconButton>
              </TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {this.processData()}
          </TableBody>
        </Table>
      </div>
    );
  }
}

export default ViewProvidersTable;

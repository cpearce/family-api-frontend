import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class AccountInfo extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['account']);
    }
    render() {
        console.log(this.props.account);
        const canEdit = (this.props.account.is_editor ||
                         this.props.account.is_staff) ? "Yes" : "No";
        return (
            <div className="account-information">
                <h3>Account Information</h3>
                <table>
                    <tbody>
                        <tr>
                            <td><span className="field-title">Username:</span></td>
                            <td>{this.props.account.username}</td>
                        </tr>
                        <tr>
                            <td><span className="field-title">First name:</span></td>
                            <td>{this.props.account.first_name}</td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Last name:</span></td>
                            <td>{this.props.account.last_name}</td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Email:</span></td>
                            <td>{this.props.account.email}</td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Can Edit:</span></td>
                            <td>{canEdit}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
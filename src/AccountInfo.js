import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class AccountInfo extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['account', 'callbacks']);
        assertHasProps(props.callbacks, ['createAccount']);
    }
    render() {
        console.log(this.props.account);
        const canEdit = (this.props.account.is_editor ||
                         this.props.account.is_staff) ? "Yes" : "No";
        const maybeRequestEdit =
            (canEdit === "Yes") ? null : (
                <tr>
                    <td colSpan="2">
                        <p>
                            With the shared account can view records, but cannot make changes.
                        </p>
                        <p>
                            If you want to add records for you or your family, feel free
                            to create an account with edit access by clicking the button below.
                            Accounts with edit access can add individuals to the database,
                            and edit the individuals they have added.
                        </p>
                        <p>
                            If you want to edit records added by other people, please
                            contact the administrator to request "staff" privileges.
                        </p>
                        <button onClick={() => this.props.callbacks.createAccount()}>
                            Create account with edit access
                        </button>
                    </td>
                </tr>
            );
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
                        {maybeRequestEdit}
                    </tbody>
                </table>
            </div>
        );
    }
}
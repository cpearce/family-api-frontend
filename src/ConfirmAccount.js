import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class ResetPassword extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['callbacks', 'server', 'token']);
        assertHasProps(props.callbacks, ['logout']);
        this.state = {
            password1: '',
            password2: '',
            submitting: false,
            errors: [],
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.submit = this.submit.bind(this);
        this.canSubmit = this.canSubmit.bind(this);
    }

    render() {

        const maybeErrors = (this.state.errors && this.state.errors.length > 0) ?
        (
            <tr>
                <td colSpan="2">
                    {this.state.errors.map(e => (<p className='error-text'>{e}</p>))}
                </td>
            </tr>
        ) : null;
        return (
            <div>
                <table>
                    <tbody>
                        <tr>
                            <td><span className="field-title">Enter password:</span></td>
                            <td>
                                <input
                                    type="password"
                                    id="password1"
                                    value={this.state.password1}
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Confirm password:</span></td>
                            <td>
                                <input
                                    type="password"
                                    id="password2"
                                    value={this.state.password2}
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        {maybeErrors}
                    </tbody>
                </table>
                <button onClick={this.submit} disabled={!this.canSubmit()}>Set Password</button>
            </div>
        );
    }

    canSubmit() {
        return this.state.password1 === this.state.password2 &&
               this.state.password1.length >= 10;
    }

    async submit(event) {
        if (!this.canSubmit()) {
            throw new Error("Submitted but should not be able to!");
        }
        try {
            const button = event.target;
            button.disabled = true;
            const result = await this.props.server.resetPassword({
                token: this.props.token,
                password: this.state.password1,
            })
            button.disabled = false;
            if (!result.ok) {
                const errors = (result.errors && result.errors.length > 0) ? result.errors : ["unknown error"];
                this.setState({
                    errors: errors
                });
                return;
            }

            // Succcessfully reset password. Logout, and re-login.
            this.props.callbacks.logout();

        } catch (e) {
            console.log("Error confirming account: " + e.message);
            this.setState({
                errors: [e.message]
            })
            return;
        }
        this.setState({
            success: true,
            errors: [],
        });
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

}
export class ConfirmAccount extends Component {

    render() {
        return (
            <div>
                <p>To complete account creation, set a password.</p>
                <p>Passwords must be at least 10 characters long.</p>
                <ResetPassword
                    callbacks={this.props.callbacks}
                    server={this.props.server}
                    token={this.props.token}
                />
            </div>
        )
    }
}

export class ResetLogin extends Component {
    render() {
        return (
            <div>
                Set a new password.
                <ResetPassword
                    callbacks={this.props.callbacks}
                    server={this.props.server}
                    token={this.props.token}
                />
            </div>
        );
    }
}
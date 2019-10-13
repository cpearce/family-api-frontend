import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class CreateAccount extends Component {

    constructor(props) {
        super(props);
        assertHasProps(props, ['callbacks', 'server']);
        this.state = {
            email: "",
            first_name: "",
            last_name: "",
            username: "",
            errors: [],
            success: false,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.submit = this.submit.bind(this);
    }

    render() {
        if (this.state.success) {
            return (
                <div>
                    <p>We've sent you an email to confirm your account.</p>
                    <p>It may take a few minutes to come through.</p>
                    <p>Click on the link we emailed you to complete creating your account!</p>
                </div>
            )
        }

        const maybeErrors = (this.state.errors && this.state.errors.length > 0) ?
        (
            <tr>
                <td colSpan="2">
                    {this.state.errors.map(e => (<p className='error-text'>{e}</p>))}
                </td>
            </tr>
        ) : null;
        return (
            <div className="account-information">
                <h3>Account Information</h3>
                <table>
                    <tbody>
                        <tr>
                            <td><span className="field-title">Username:</span></td>
                            <td>
                                <input
                                    type="text"
                                    value={this.state.username}
                                    id="username"
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td><span className="field-title">First name:</span></td>
                            <td>
                                <input
                                    type="text"
                                    value={this.state.first_name}
                                    id="first_name"
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Last name:</span></td>
                            <td>
                                <input
                                    type="text"
                                    value={this.state.last_name}
                                    id="last_name"
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td><span className="field-title">Email:</span></td>
                            <td>
                                <input
                                    type="email"
                                    value={this.state.email}
                                    id="email"
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <div>
                                    <p>
                                        We'll send an email to your email address with a link to
                                        confirm account creation.
                                    </p>
                                </div>
                                <button onClick={this.submit}>Create Account</button>
                            </td>
                        </tr>
                        {maybeErrors}
                    </tbody>
                </table>
            </div>
        );
    }

    async submit(event) {
        console.log("submit");
        if (!this.state.username) {
            window.alert("Please enter username.");
            return;
        }
        if (document.querySelector("input[type=email]:invalid") || !this.state.email) {
            window.alert("Please enter a valid email address.");
            return;
        }
        if (!this.state.first_name) {
            window.alert("Please enter First Name.");
            return;
        }
        if (!this.state.last_name) {
            window.alert("Please enter Last Name.");
            return;
        }
        const button = event.target;
        button.disabled = true;
        try {
            const result = await this.props.server.createAccount({
                username: this.state.username,
                email: this.state.email,
                first_name: this.state.first_name,
                last_name: this.state.last_name,
            });
            if (!result.ok) {
                this.setState({
                    errors: result.errors
                });
                button.disabled = false;
                return;
            }
        } catch (e) {
            this.props.callbacks.error(e);
        }

        this.setState({
            success: true,
            errors: [],
        })
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }
}
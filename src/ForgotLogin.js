import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class ForgotLogin extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['server']);
        this.state = {
            email: "",
            message: null,
        };
        this.submit = this.submit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    async submit(event) {
        try {
            const button = event.target;
            button.disabled = true;
            const ok = await this.props.server.requestAccountRecovery(this.state.email);
            button.disabled = false;
            const success = "If there's an account for that email," +
                "we've sent you you username and a link to reset your password.";
            const failure = "Something went wrong...";
            this.setState({
                message: ok ? success : failure,
            })
        } catch (e) {
            console.log("Error reset login! " + e.message);
        }
    }

    render() {
        if (this.state.message !== null) {
            return (
                <div>
                    {this.state.message}
                </div>
            );
        }
        return (
            <div>
                <p>Enter your email address below, and we'll email you your username, and a link with which to reset your password.</p>
                <table>
                    <tbody>
                        <tr>
                            <td><span className="field-title">Email Address:</span></td>
                            <td>
                                <input
                                    type="email"
                                    id="email"
                                    value={this.state.email}
                                    onChange={this.handleInputChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <button onClick={this.submit}>Recover Account</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

}
import React, { Component } from 'react';

function ShowErrorMessage(props) {
    if (props.message) {
        return (
            <div>{props.message}</div>
        );
    }
    return null;
}

export class LoginBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
    };
    this.handleLogin = this.handleLogin.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleLogin(event) {
    event.preventDefault();
    this.props.login(this.state.username, this.state.password);
  }

  render() {
    return (
        <div>
            <ShowErrorMessage message={this.props.message} />
            <form className="LoginBox" onSubmit={this.handleLogin}>
                <label>
                Username:
                <input
                    type="text"
                    name="username"
                    value={this.state.username}
                    onChange={this.handleInputChange}
                />
                </label>
                <br />
                <label>
                Password:
                <input
                    type="password"
                    name="password"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                />
                </label>
                <br />
                <input type="submit" value="Login" />
            </form>
        </div>
    );
  }
}

export class LogoutBox extends Component {
  constructor(props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleLogout(event) {
    event.preventDefault();
    this.props.logout();
  }

  render() {
    return (
      <div className="LogoutBox">
        <form onSubmit={this.handleLogout}>
          <input type="submit" value="Logout" />
        </form>
      </div>
    );
  }
}
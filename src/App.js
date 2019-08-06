import React, {Component} from 'react';
import logo from './logo.svg';
import {LoginBox,LogoutBox} from './LoginBox.js';
import './App.css';

const screen = {
  INITIAL: 0,
  LOGIN: 1,
  SEARCH: 2,
};


const backend_server = "http://127.0.0.1:8000/api/v1/";
const AUTH_TOKEN = "authToken";

class App extends Component {
  constructor(props) {
    super(props);
    let token = localStorage.getItem(AUTH_TOKEN);
    this.state = {
      screen: screen.INITIAL,
      token: token,
      loginErrorMessage: null,
    };
    this.logout = this.logout.bind(this);
    this.login = this.login.bind(this);
  }

  async login(username, password) {
    console.log("login u:" + username + " p:" + password);
    const url = backend_server + 'login/';
    const init = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify({
          username: username,
          password: password,
        }),
    };

    let response = await fetch(url, init);
    console.log("Response status: " + response.status);
    let json = await response.json();
    console.log(json);
  if (response.ok) {
      this.setState({token: json.token});
      localStorage.setItem(AUTH_TOKEN, json.token);
      console.log("Set auth token to " + json.token);
    } else {
      this.setState({loginErrorMessage: "Login failed"});
    }
  }

  async logout() {
    console.log("logout");
    const url = backend_server + "logout/";
    const init = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + this.state.token,
      },
      mode: 'cors',
      cache: 'default',
    };
    let response = await fetch(url, init);
    console.log("Response status: " + response.status);
    this.setState({token: null});
  }

  loginScreen() {
    return (
      <LoginBox
        message={this.state.loginErrorMessage}
        login={this.login}
      />
    )
  }

  render() {
    if (!this.state.token) {
      return this.loginScreen();
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        <LogoutBox
          logout={this.logout}
        />
      </div>
    );
  }
}

export default App;

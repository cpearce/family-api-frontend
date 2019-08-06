import React, {Component} from 'react';
import {LoginBox} from './LoginBox.js';
import {Search} from './Search.js';
import {List} from './List.js';
import './App.css';

const screen = {
  INITIAL: 0,
  SEARCH: 1,
  LIST: 2,
  LOGOUT: 3,
};


const backend_server = "http://127.0.0.1:8000/api/v1/";
const AUTH_TOKEN = "authToken";

function Header(props) {
  const items = [
    { text: "Search", click: props.search, key: screen.SEARCH},
    { text: "List", click: props.list, key: screen.LIST, },
    { text: "Logout", click: props.logout, key: undefined },
  ];

  const navBarItems = items.map(
    (item) => (
      <li key={"navbar-" + item.text} className="nav-item">
        <button disabled={(props.page === item.key)} className="nav-button" onClick={item.click}>{item.text}</button>
      </li>
    )
  );

  return (
    <ul className="navbar">
        <li className="navbar-brand">
            Family Tree
        </li>
        {navBarItems}
    </ul>
  )
}

function Main(props) {
  switch (props.screen) {
    case screen.SEARCH: {
      return (
        <Search
          individuals={props.individuals}
          detailCallback={props.detailCallback}
        />
      )
    }
    case screen.LIST: {
      return (
        <List
          individuals={props.individuals}
          detail={props.detailCallback}
        />
      )
    }
    default: {
      return null;
    }
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    let token = localStorage.getItem(AUTH_TOKEN);
    this.state = {
      screen: screen.SEARCH,
      token: token,
      loginErrorMessage: null,
      individuals: null,
    };

    this.downloadIndividuals();

    this.logout = this.logout.bind(this);
    this.login = this.login.bind(this);
    this.searchIndividuals = this.searchIndividuals.bind(this);
    this.listIndividuals = this.listIndividuals.bind(this);
    this.detailCallback = this.detailCallback.bind(this);
  }

  async downloadIndividuals() {
    if (!this.state.token) {
      // Can't download.
      return;
    }

    const url = backend_server + 'individuals/';
    const init = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + this.state.token,
        },
        mode: 'cors',
        cache: 'default',
    };

    let response = await fetch(url, init);
    console.log("Individual download response status: " + response.status);
    let json = await response.json();
    if (response.ok) {
      this.setState({individuals: json});
      console.log("Set individuals state to " + json.length + " individuals");
    }
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
      this.downloadIndividuals();
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

  listIndividuals() {
    this.setState({screen: screen.LIST});
  }

  searchIndividuals() {
    this.setState({screen: screen.SEARCH});
  }

  detailCallback(individual_id) {
    console.log("detailCallback " + individual_id);
  }

  render() {
    if (!this.state.token) {
      return this.loginScreen();
    }
    return (
      <div className="App">
        <Header
          page={this.state.screen}
          logout={this.logout}
          list={this.listIndividuals}
          search={this.searchIndividuals}
        />
        <Main
          individuals={this.state.individuals}
          detailCallback={this.detailCallback}
          screen={this.state.screen}
        />
      </div>
    );
  }
}

export default App;

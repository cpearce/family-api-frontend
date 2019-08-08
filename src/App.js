import React, {Component} from 'react';
import {LoginBox} from './LoginBox.js';
import {Search} from './Search.js';
import {IndividualDetail} from './IndividualDetail.js';
import './App.css';

const screen = {
  DOWNLOADING: 0,
  SEARCH: 1,
  DETAIL: 2,
  LOGOUT: 3,
};


const backend_server = "http://127.0.0.1:8000/api/v1/";
const FAMILIES_URL = backend_server + 'families/';
const INDIVIDUALS_URL = backend_server + 'individuals/';
const AUTH_TOKEN = "authToken";

function Header(props) {
  const items = [
    { text: "Search", click: props.search, key: screen.SEARCH},
    { text: "Logout", click: props.logout, key: undefined },
  ];

  const navBarItems = items.map(
    (item) => (
      <li key={"navbar-" + item.text} className="nav-item">
        <button
          disabled={(props.screen === item.key)}
          className="nav-button"
          onClick={item.click}
        >
          {item.text}
        </button>
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
  switch (props.screen.id) {
    case screen.DOWNLOADING:
      return (
        <div>
          Downloading data...
        </div>
      );
    case screen.SEARCH: {
      return (
        <Search
          individuals={props.individuals}
          detailCallback={props.detailCallback}
        />
      )
    }
    case screen.DETAIL: {
      return (
        <IndividualDetail
          idToIndividual={props.idToIndividual}
          idToFamily={props.idToFamily}
          individualId={props.screen.individualId}
          detailCallback={props.detailCallback}
        />
      );
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
    console.log("Token retrieved from storage: " + token);

    this.state = {
      screen: { id: screen.DOWNLOADING },
      token: token,
      loginErrorMessage: null,
      individuals: null,
      families: null,
      idToIndividual: null,
      idToFamily: null,
    };

    this.ensureDataDownloaded();

    this.logout = this.logout.bind(this);
    this.login = this.login.bind(this);
    this.searchIndividuals = this.searchIndividuals.bind(this);
    this.detailCallback = this.detailCallback.bind(this);
  }

  async downloadJsonData(url) {
    console.log("Downloading " + url);
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
    if (response.status === 401) {
      // Unauthorized. Token may have expired.
      this.logout();
    }
    console.log("Download " + url + " response status: " + response.status);
    if (!response.ok) {
      throw new Error("Download failed with status: " + response.status);
    }
    return await response.json();
  }

  async downloadIndividuals() {
    let json = await this.downloadJsonData(INDIVIDUALS_URL);
    let idToIndividual = new Map(
      json.map((i) => [i.id, i])
    );
    this.setState({
      individuals: json,
      idToIndividual: idToIndividual
    });
    console.log("Set individuals state to " + json.length + " individuals");
  }

  async downloadFamilies() {
    let json = await this.downloadJsonData(FAMILIES_URL);
    let idToFamily = new Map(
      json.map((f) => [f.id, f])
    );
    this.setState({
      families: json,
      idToFamily: idToFamily,
    });
    console.log("Set families state to " + json.length + " families");
  }

  async ensureDataDownloaded() {
    if (!this.state.token) {
      // Can't download.
      return;
    }
    await Promise.all([this.downloadIndividuals(), this.downloadFamilies()]).then(
      ()=> {
        this.setState({screen: {id: screen.SEARCH }});
      }
    ).catch(
      (e)=>{
        console.log("Caught error " + e.message);
      }
    );
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
      this.ensureDataDownloaded();
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
    console.log("Logout response status: " + response.status);
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

  searchIndividuals() {
    this.setState({
      screen: {
        id: screen.SEARCH
      }
    });
  }

  async detailCallback(individualId) {
    console.log("detailCallback " + individualId);
    this.setState({
      screen: {
        id: screen.DETAIL,
        individualId: individualId,
      }
    });
  }

  render() {
    if (!this.state.token) {
      return this.loginScreen();
    }
    return (
      <div className="App">
        <Header
          screen={this.state.screen}
          logout={this.logout}
          search={this.searchIndividuals}
        />
        <Main
          individuals={this.state.individuals}
          idToIndividual={this.state.idToIndividual}
          idToFamily={this.state.idToFamily}
          detailCallback={this.detailCallback}
          screen={this.state.screen}
        />
      </div>
    );
  }
}

export default App;

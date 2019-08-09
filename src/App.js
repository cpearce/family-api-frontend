import React, {Component} from 'react';
import {LoginBox} from './LoginBox.js';
import {Search} from './Search.js';
import {IndividualDetail} from './IndividualDetail.js';
import {EditIndividual} from './EditIndividual.js';
import './App.css';

const screen = {
  DOWNLOADING: 0,
  SEARCH: 1,
  DETAIL: 2,
  LOGOUT: 3,
  EDIT: 4,
};


const backend_server = "http://127.0.0.1:8000/api/v1/";
const FAMILIES_URL = backend_server + 'families/';
const INDIVIDUALS_URL = backend_server + 'individuals/';
const AUTH_TOKEN = "authToken";

function Header(props) {
  const items = [
    { text: "Search", click: props.callbacks.search, key: screen.SEARCH},
    { text: "Logout", click: props.callbacks.logout, key: undefined },
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
          database={props.database}
          callbacks={props.callbacks}
        />
      )
    }
    case screen.DETAIL: {
      return (
        <IndividualDetail
          individualId={props.screen.individualId}
          database={props.database}
          callbacks={props.callbacks}
        />
      );
    }
    case screen.EDIT: {
      return (
        <EditIndividual
          individualId={props.screen.individualId}
          database={props.database}
          callbacks={props.callbacks}
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
      screen: {
        id: screen.DOWNLOADING
      },
      token: token,
      loginErrorMessage: null,
      database: {
        individuals: null,
        families: null,
        idToIndividual: null,
        idToFamily: null,
      },
    };

    this.ensureDataDownloaded();

    this.callbacks = {
      logout: this.logout.bind(this),
      login: this.login.bind(this),
      search: this.searchIndividuals.bind(this),
      detail: this.detailCallback.bind(this),
      edit: this.editCallback.bind(this),
      save: this.saveCallback.bind(this),
    };
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

  async ensureDataDownloaded() {
    if (!this.state.token) {
      // Can't download.
      return;
    }

    let individuals = [];
    let families = [];

    await Promise.all([
      new Promise(async (resolve, reject) => {
        individuals = await this.downloadJsonData(INDIVIDUALS_URL);
        console.log("Downloaded " + individuals.length + " individuals");
        resolve();
      }),
      new Promise(async (resolve, reject) => {
        families = await this.downloadJsonData(FAMILIES_URL);
        console.log("Downloaded " + families.length + " families");
        resolve();
      }),
    ]).then(
      () => {
        let idToIndividual = new Map(
          individuals.map((i) => [i.id, i])
        );
        let idToFamily = new Map(
          families.map((f) => [f.id, f])
        );
        this.setState({
          screen: {
            id: screen.SEARCH
          },
          database: {
            individuals: individuals,
            families: families,
            idToIndividual: idToIndividual,
            idToFamily: idToFamily,
          },
        });
        console.log("Set individuals state to " + individuals.length + " individuals");
        console.log("Set families state to " + families.length + " families");
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

  async saveCallback(individual) {
    let method = individual.id ? "PATCH" : "PUT";
    let suffix = individual.id ? (individual.id + "/") : "";
    const url = backend_server + "individuals/" + suffix;
    const fields = [
      'id',
      'first_names',
      'last_name',
      'sex',
      'birth_date',
      'birth_location',
      'death_date',
      'death_location',
      'buried_date',
      'buried_location',
      'occupation',
    ];
    let body = {};
    for (const field of fields) {
      if (individual[field]) {
        body[field] = individual[field];
      }
    }
    const init = {
      method: method,
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + this.state.token,
      },
      mode: 'cors',
      cache: 'default',
      body: JSON.stringify(body),
    };
    let response = await fetch(url, init);
    if (response.ok) {
      // Update the individual in our data model, to match what should
      // be on the server.
      this.setState((state, props) => {
        let i = state.idToIndividual.get(individual.id);
        for (const field in body) {
          i[field] = body[field];
        }
        return state;
      });
    } else {
      console.log(method + " failed! " + response.status);
    }
  }

  loginScreen() {
    return (
      <LoginBox
        message={this.state.loginErrorMessage}
        login={this.callbacks.login}
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

  detailCallback(individualId) {
    console.log("detailCallback " + individualId);
    this.setState({
      screen: {
        id: screen.DETAIL,
        individualId: individualId,
      }
    });
  }

  editCallback(individualId) {
    console.log("edit " + individualId);
    this.setState({
      screen: {
        id: screen.EDIT,
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
          callbacks={this.callbacks}
        />
        <Main
          database={this.state.database}
          callbacks={this.callbacks}
          screen={this.state.screen}
        />
      </div>
    );
  }
}

export default App;

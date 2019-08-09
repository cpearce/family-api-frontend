import { LoginBox } from './LoginBox.js';
import React, { Component } from 'react';
import { Search } from './Search.js';
import { IndividualDetail } from './IndividualDetail.js';
import { EditIndividual } from './EditIndividual.js';
import { ServerConnection } from './ServerConnection.js';
import './App.css';

const screen = {
    LOGIN: 0,
    DOWNLOADING: 1,
    SEARCH: 2,
    DETAIL: 3,
    EDIT: 4,
};

function Header(props) {
    const items = props.screen.id === screen.LOGIN ? [] : [
        { text: "Search", click: props.callbacks.search, key: screen.SEARCH },
        { text: "Logout", click: props.callbacks.logout, key: undefined },
    ];

    const navBarItems = items.map(
        (item) => (
            <li key={"navbar-" + item.text} className="nav-item">
                <button
                    disabled={(props.screen.id === item.key)}
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
        case screen.LOGIN:
            return (
                <LoginBox
                    message={props.screen.message}
                    login={props.callbacks.login}
                />
            );
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

function listToMap(list) {
    return new Map(
        list.map((i) => [i.id, i])
    );
}

class App extends Component {
    constructor(props) {
        super(props);

        this.server = new ServerConnection();

        this.state = {
            screen: {
                id: screen.LOGIN
            },
            database: {
                individuals: null,
                families: null,
                idToIndividual: null,
                idToFamily: null,
            },
        };

        this.callbacks = {
            logout: this.logout.bind(this),
            login: this.login.bind(this),
            search: this.searchIndividuals.bind(this),
            detail: this.detailCallback.bind(this),
            edit: this.editCallback.bind(this),
            save: this.saveCallback.bind(this),
        };

        // TODO: Poll server for user's priveleges, and if we're
        // authenticated, download data.
    }

    async setData(data) {
        this.setState({
            screen: {
                id: screen.SEARCH
            },
            database: {
                individuals: data.individuals,
                families: data.families,
                idToIndividual: listToMap(data.individuals),
                idToFamily: listToMap(data.families),
            },
        });
    }

    error(message) {
        console.log("error: " + message);
        this.setState({
            screen: {
                id: screen.LOGIN,
                message: message,
            }
        });
    }

    async login(username, password) {
        console.log("login u:" + username + " p:" + password);
        try {
            await this.server.login(username, password);
            this.setState({
                screen: {
                    id: screen.DOWNLOADING
                }
            });
            this.setData(await this.server.ensureDataDownloaded());
            await this.callbacks.search();
        } catch (e) {
            this.error("Login Failed: " + e.message);
        }
    }

    async logout() {
        console.log("logout");
        try {
            await this.server.logout();
            this.setState({
                screen: {
                    id: screen.LOGIN
                }
            });
        } catch (e) {
            this.error(e.message);
        }
    }

    async saveCallback(individual) {
        try {
            this.server.saveIndividual(individual);

            // Re-pull all the data, so we're all up to date.
            this.setState({
                screen: {
                    id: screen.DOWNLOADING
                }
            });
            this.setData(await this.server.ensureDataDownloaded());

        } catch (e) {
            this.error(e.message);
        }
    }

    loginScreen() {
        return (
            <LoginBox
                message={this.state.screen.message}
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

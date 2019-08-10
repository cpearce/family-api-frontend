import { LoginBox } from './LoginBox.js';
import React, { Component } from 'react';
import { Search } from './Search.js';
import { IndividualDetail } from './IndividualDetail.js';
import { EditIndividual } from './EditIndividual.js';
import { ServerConnection } from './ServerConnection.js';
import './App.css';

function Header(props) {
    const isLoginPage = window.location.pathname === "/" ||
                        window.location.pathname === "/login";
    const items = isLoginPage ? [] : [
        { text: "Home", click: props.callbacks.search, path: "/individuals" },
        { text: "Logout", click: props.callbacks.logout, path: "" },
    ];

    const navBarItems = items.map(
        (item) => (
            <li key={"navbar-" + item.text} className="nav-item">
                <button
                    disabled={(item.path === window.location.pathname)}
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
            path: window.location.pathname,
            database: null,
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
        // TODO: This is confusing, as if we have a token, we actually
        // download the data, but still show the login screen.
        this.server.ensureDataDownloaded().then(
            this.setData.bind(this)
        ).catch(
            () => console.log("Failed to download initial data")
        );
    }

    async setData(data) {
        this.setState({
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
        const path = "/error"
        window.history.pushState({}, "Error", path);
        this.setState({
            path: path,
            error: message
        });
    }

    async login(username, password) {
        console.log("login u:" + username + " p:" + password);
        try {
            await this.server.login(username, password);
            this.navigate("Individuals", "/individuals");
            this.setData(await this.server.ensureDataDownloaded());
        } catch (e) {
            this.error("Login Failed: " + e.message);
        }
    }

    async logout() {
        console.log("logout");
        try {
            await this.server.logout();
            this.navigate("Family Tree: Login", "/login");
        } catch (e) {
            this.error(e.message);
        }
    }

    async saveCallback(individual) {
        try {
            await this.server.saveIndividual(individual);
            // Re-pull all the data, so we're all up to date.
            this.setState({
                database: null,
            });
            this.setData(await this.server.ensureDataDownloaded());
            this.detailCallback(individual.id);
        } catch (e) {
            this.error(e.message);
        }
    }

    searchIndividuals() {
        this.navigate("Individuals", "/individuals");
    }

    detailCallback(individualId) {
        this.navigate("Individual detail", "/individuals/" + individualId);
    }

    editCallback(individualId) {
        console.log("edit " + individualId);
        this.navigate("Edit Individual", "/individuals/" + individualId + "/edit");
    }

    navigate(title, path) {
        window.history.pushState({}, title, path);
        this.setState({path: path});
    }

    render() {
        const header = (
            <Header
                path={this.state.path}
                screen={this.state.screen}
                callbacks={this.callbacks}
            />
        );
        console.log("App.render " + window.location.pathname);

        // URL: /error
        if (this.state.path === "/error") {
            return (
                <div>
                    Error; {this.state.error}
                </div>
            );
        }

        // URL: / or /login
        if (this.state.path === "/" || this.state.path === "/login") {
            return (
                <div>
                    {header}
                    <LoginBox
                        login={this.callbacks.login}
                    />
                </div>
            );
        }

        // We have a non-entry/fatal URL, wait until we have data...
        if (this.state.database === null) {
            return (
                <div>
                    {header}
                    <div>Awaiting download of data...</div>
                </div>
            );
        }

        // URL: /individuals
        if (this.state.path === "/individuals") {
            return (
                <div>
                    {header}
                    <Search
                        database={this.state.database}
                        callbacks={this.callbacks}
                    />
                </div>
            );
        }
        const chunks = window.location.pathname.split("/").filter(nonNull);
        if (chunks.length >= 2 && chunks[0] === "individuals") {
            const id = parseInt(chunks[1]);
            if (isNaN(id)) {
                return (
                    <div>Invalid individual id</div>
                );
            }
            if (chunks.length === 2) {
                // URL: /individuals/$id
                return (
                    <div>
                        {header}
                        <IndividualDetail
                            individualId={id}
                            database={this.state.database}
                            callbacks={this.callbacks}
                        />
                    </div>
                );
            }

            if (chunks.length === 3 && chunks[2] === "edit") {
                // URL: /individuals/$id/edit
                return (
                    <div>
                        {header}
                        <EditIndividual
                            individualId={id}
                            database={this.state.database}
                            callbacks={this.callbacks}
                        />
                    </div>
                );
            }
        }

        // Not a valid route, error!
        return (
            <div>Invalid path</div>
        );
    }
}

function nonNull(x) {
    return x;
}

export default App;

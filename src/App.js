import { LoginBox } from './LoginBox.js';
import React, { Component } from 'react';
import { SearchIndividuals } from './Search.js';
import { IndividualDetail } from './IndividualDetail.js';
import { EditIndividual } from './EditIndividual.js';
import { Header } from './Header.js';
import { ServerConnection } from './ServerConnection.js';
import { Descendants, Ancestors } from './Descendants.js';
import './App.css';

class App extends Component {
    constructor(props) {
        super(props);

        this.server = new ServerConnection();

        this.state = {
            path: window.location.pathname,
            database: null,
            canEdit: null,
        };

        this.callbacks = {
            logout: this.logout.bind(this),
            login: this.login.bind(this),
            search: this.searchIndividuals.bind(this),
            detail: this.detailCallback.bind(this),
            edit: this.editCallback.bind(this),
            error: this.error.bind(this),
            descendants: this.descendants.bind(this),
            ancestors: this.ancestors.bind(this),
        };

        window.addEventListener("popstate", ((e) => {
            this.setState({
                path: window.location.pathname
            });
        }));

        // Ensure we start at the login screen.
        if (this.state.path === "/") {
            // Note: We can't call our navigate() function here, as it calls
            // setState(), which won't work in a constructor as we're not
            // mounted yet.
            this.state.path = "/login";
            window.history.pushState({}, "Family Tree: Login", this.state.path);
        }

        // If we have a stored access token, test it, and download
        // data. If we don't, or the token has expired, this will
        // cause us to show a login page.
        // Note: this is async, but we don't await its completion.
        this.connect();
    }

    isConnected() {
        return this.state.canEdit !== null;
    }

    async connect() {
        console.log("App.connect()");
        try {
            let account = await this.server.checkAccount();
            // Our stored token is still valid. Show the individuals list.
            console.log("conect() succeeded");
            console.log("Can edit: " + account.can_edit);
            this.setState({
                canEdit: account.can_edit,
            });
            // Show search page after login.
            if (this.state.path === "/login") {
                this.searchIndividuals();
            }
        } catch (e) {
            // Stored token must have not worked. We should show a login page.
            console.log("Initial connect failed. Error=" + e.message);
            this.navigate("Family Tree", "/login");
            return;
        }
    }

    error(e) {
        if (e.hasOwnProperty("message") && e.hasOwnProperty("lineNumber") && e.hasOwnProperty("fileName")) {
            console.log(`Exception: '${e.message} ${e.fileName}:${e.lineNumber}`)
        } else {
            console.log("error: " + e);
        }
        // const path = "/error"
        // window.history.pushState({}, "Error", path);
        // this.setState({
        //     path: path,
        //     error: e,
        // });
    }

    async login(username, password) {
        console.log("login u:" + username + " p:" + password);
        this.setState({
            loginInProgress: true,
        });
        try {
            await this.server.login(username, password);
            let account = await this.server.checkAccount();
            console.log("Can edit: " + account.can_edit);
            this.navigate("Individuals", "/individuals", { canEdit: account.can_edit });
        } catch (e) {
            this.error("Login Failed: " + e.message);
        } finally {
            this.setState({
                loginInProgress: false,
            });
        }
    }

    async logout() {
        console.log("logout");
        try {
            await this.server.logout();
            this.navigate("Family Tree: Login", "/login", {canEdit: null});
        } catch (e) {
            this.error(e.message);
        }
    }

    searchIndividuals() {
        this.navigate("Individuals", "/individuals");
    }

    detailCallback(individual) {
        if (!individual) {
            console.log("Error: detailCallback called with null individual.");
            return;
        }
        this.navigate("Individual detail", "/individuals/" + individual.id);
    }

    editCallback(individual) {
        console.log("edit " + individual.id);
        if (this.state.canEdit) {
            this.navigate("Edit Individual", "/individuals/" + individual.id + "/edit");
        } else {
            this.error("Tried to edit, but you don't have edit privileges!");
        }
    }

    ancestors(individual) {
        if (!individual) {
            console.log("Error: ancestors called with null individual.");
            return;
        }
        this.navigate("Individual ancestors", "/individuals/" + individual.id + "/ancestors");
    }

    descendants(individual) {
        if (!individual) {
            console.log("Error: descendants called with null individual.");
            return;
        }
        this.navigate("Individual descendants", "/individuals/" + individual.id + "/descendants");
    }

    navigate(title, path, otherState={}) {
        console.log("Navigate " + path);
        window.history.pushState({}, title, path);
        this.setState({
            ...otherState,
            path: path
        });
    }

    render() {
        const header = (
            <Header
                path={this.state.path}
                screen={this.state.screen}
                callbacks={this.callbacks}
                canEdit={this.state.canEdit}
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

        // URL: /login
        if (this.state.path === "/login") {
            if (this.state.loginInProgress) {
                return (
                    <div>Logging in...</div>
                );
            }
            if (!this.isConnected()) {
                return (
                    <div>
                        {header}
                        <LoginBox
                            login={this.callbacks.login}
                        />
                    </div>
                );
            }
        }

        // URL: /individuals
        if (this.state.path === "/individuals") {
            return (
                <div>
                    {header}
                    <SearchIndividuals
                        label="Search individuals"
                        server={this.server}
                        selectedCallback={this.callbacks.detail}
                        errorCallback={this.callbacks.error}
                    />
                </div>
            );
        }

        // URL: /individuals/add
        if (this.state.path === "/individuals/add") {
            return (
                <div>
                    {header}
                    <EditIndividual
                        server={this.server}
                        callbacks={this.callbacks}
                        canEdit={this.state.canEdit}
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
                            server={this.server}
                            callbacks={this.callbacks}
                            canEdit={this.state.canEdit}
                        />
                    </div>
                );
            }

            if (chunks.length === 3) {
                if (chunks[2] === "edit") {
                    // URL: /individuals/$id/edit
                    return (
                        <div>
                            {header}
                            <EditIndividual
                                individualId={id}
                                server={this.server}
                                callbacks={this.callbacks}
                            />
                        </div>
                    );
                }
                if (chunks[2] === "descendants") {
                    // URL: /individuals/$id/descendants
                    return (
                        <div className="main">
                            {header}
                            <Descendants
                                individualId={id}
                                server={this.server}
                                callbacks={this.callbacks}
                            />
                        </div>
                    );
                }
                if (chunks[2] === "ancestors") {
                    // URL: /individuals/$id/ancestors
                    return (
                        <div className="main">
                            {header}
                            <Ancestors
                                individualId={id}
                                server={this.server}
                                callbacks={this.callbacks}
                            />
                        </div>
                    );
                }
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

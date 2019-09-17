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
        { text: "Individuals", click: props.callbacks.search, path: "/individuals" },
        ...(props.canEdit ? [{ text: "Add", click: props.callbacks.addIndividual, path: "/individuals/add" }] : []),
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

function contains(collection, element) {
    for (const value of collection) {
        if (value === element) {
            return true;
        }
    }
    return false;
}

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
            save: this.saveCallback.bind(this),
            addIndividual: this.addIndividualCallback.bind(this),
            deleteIndividual: this.deleteIndividual.bind(this),
            addFamily: this.addFamilyCallback.bind(this),
            saveFamily: this.saveFamily.bind(this),
            deleteFamily: this.deleteFamily.bind(this),
        };

        window.addEventListener("popstate", ((e) => {
            this.setState({
                path: window.location.pathname
            });
        }));

        // If we have a stored access token, test it, and download
        // data. If we don't, or the token has expired, this will
        // cause us to show a login page.
        // Note: this is async, but we don't await its completion.
        this.connect();
    }

    async connect() {
        console.log("App.connect()");
        try {
            let account = await this.server.checkAccount();
            // Our stored token is still valid. Show the individuals list.
            console.log("Can edit: " + account.can_edit);
            if (this.state.path === "/login") {
                this.navigate("Individuals", "/individuals", { canEdit: account.can_edit });
            } else {
                this.setState({
                    canEdit: account.can_edit,
                });
            }
        } catch (e) {
            // Stored token must have not worked. We should show a login page.
            console.log("Initial connect failed. Error=" + e.message);
            this.navigate("Family Tree", "/login");
            return;
        }
        // Connected. Try to download data. This is fatal if it fails.
        try {
            this.setData(await this.server.ensureDataDownloaded());
        } catch (e) {
            this.error("Failed to download data.");
        }
    }

    setData(data) {
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
        this.setState({
            loginInProgress: true,
        });
        try {
            await this.server.login(username, password);
            let account = await this.server.checkAccount();
            console.log("Can edit: " + account.can_edit);
            this.navigate("Individuals", "/individuals", { canEdit: account.can_edit });
            this.setData(await this.server.ensureDataDownloaded());
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
            this.navigate("Family Tree: Login", "/login", { database: null });
        } catch (e) {
            this.error(e.message);
        }
    }

    updateIndividual(individual) {
        // Updates individual in local copy of DB to match.
        // May need to add to DB if individual is new.
        this.setState((state, props) => {
            let individuals = this.state.database.individuals;
            if (!this.state.database.idToIndividual.get(individual.id)) {
                individuals.push(individual);
            } else {
                for (let i = 0; i < individuals.length; i++) {
                    if (individuals[i].id === individual.id) {
                        individuals[i] = individual;
                        break;
                    }
                }
            }
            this.state.database.idToIndividual.set(individual.id, individual);
            return state;
        });
    }

    async saveCallback(individual) {
        try {
            let updatedIndividual = await this.server.saveIndividual(individual);
            this.updateIndividual(updatedIndividual);
            this.detailCallback(updatedIndividual.id);
        } catch (e) {
            this.error(e.message);
        }
    }

    async deleteIndividual(individualId) {
        try {
            await this.server.deleteIndividual(individualId);
            // Update our copy of the database after changes.
            this.setState((state, props) => {
                this.state.database.individuals = this.state.database.individuals.filter(
                    (i) => i.id !== individualId
                );
                this.state.database.idToIndividual.delete(individualId);
                return state;
            });

            this.searchIndividuals();
        } catch (e) {
            this.error(e.message);
        }
    }

    async addIndividualCallback() {
        try {
            const individual = await this.server.newIndividual()
            console.log("Created individual " + individual.id);
            this.updateIndividual(individual);
            this.navigate("Edit Individual", "/individuals/" + individual.id + "/edit");
        } catch (e) {
            this.error(e.message);
        }
    }

    updateFamily(family) {
        // Updates individual in local copy of DB to match.
        // May need to add to DB if individual is new.
        this.setState((state, props) => {
            let families = this.state.database.families;
            if (!this.state.database.idToFamily.get(family.id)) {
                families.push(family);
            } else {
                for (let i = 0; i < families.length; i++) {
                    if (families[i].id === family.id) {
                        families[i] = family;
                        break;
                    }
                }
            }
            this.state.database.idToFamily.set(family.id, family);
            // Ensure all partners in the family have the family id
            // in their partners_in_family list.
            for (const individualId of family.partners) {
                let individual = this.state.database.idToIndividual.get(individualId);
                if (!contains(individual.partner_in_families, family.id)) {
                    individual.partner_in_families.push(family.id);
                }
            }
            return state;
        });
    }

    async addFamilyCallback(partnerId) {
        try {
            console.log("Creating family for partner=" + partnerId);
            const family = await this.server.newFamily(partnerId);
            console.log("Created family " + family.id);
            this.updateFamily(family);
        } catch (e) {
            this.error(e.message);
        }
    }

    async saveFamily(family) {
        try {
            console.log("Saving family " + family.id);
            family = await this.server.saveFamily(family);
            this.updateFamily(family);
        } catch (e) {
            this.error(e.message);
        }
    }

    async deleteFamily(familyId) {
        try {
            await this.server.deleteFamily(familyId);
            // Update our copy of the database after changes.
            this.setState((state, props) => {
                this.state.database.families = this.state.database.families.filter(
                    i => i.id !== familyId
                );
                const family = this.state.database.idToFamily.get(familyId);
                for (const id of family.partners) {
                    let individual = this.state.database.idToIndividual.get(id);
                    individual.partner_in_families = individual.partner_in_families.filter(
                        id => id !== family.id
                    );
                }
                this.state.database.idToFamily.delete(familyId);
                return state;
            });
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
        if (this.state.canEdit) {
            this.navigate("Edit Individual", "/individuals/" + individualId + "/edit");
        } else {
            this.error("Tried to edit, but you don't have edit privileges!");
        }
    }

    navigate(title, path, otherState={}) {
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

        // URL: / or /login
        if (this.state.path === "/" || this.state.path === "/login") {
            if (this.state.loginInProgress) {
                return (
                    <div>Logging in...</div>
                );
            }
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

        // URL: /individuals/add
        if (this.state.path === "/individuals/add") {
            return (
                <div>
                    {header}
                    <EditIndividual
                        database={this.state.database}
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
                            database={this.state.database}
                            callbacks={this.callbacks}
                            canEdit={this.state.canEdit}
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

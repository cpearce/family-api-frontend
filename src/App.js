import { LoginBox } from './LoginBox.js';
import React, { Component } from 'react';
import { AccountInfo } from './AccountInfo.js';
import { CreateAccount } from './CreateAccount.js';
import { SearchIndividuals } from './Search.js';
import { IndividualDetail } from './IndividualDetail.js';
import { EditIndividual } from './EditIndividual.js';
import { Header } from './Header.js';
import { ServerConnection } from './ServerConnection.js';
import { Descendants, Ancestors } from './Descendants.js';
import { ConfirmAccount, ResetLogin } from './ConfirmAccount.js';
import { ForgotLogin } from './ForgotLogin.js';
import './App.css';
import { assertHasProps } from './Utils.js';

class App extends Component {
    constructor(props) {
        super(props);

        this.server = new ServerConnection();

        this.state = {
            serverResponsive: false,
            account: null,
            path: window.location.hash.replace("#", ''),
            database: null,
        };

        this.callbacks = {
            account: this.accountInfoCallback.bind(this),
            createAccount: this.createAccountCallback.bind(this),
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
                path: window.location.hash.replace("#", ''),
            });
        }));

        // Ensure we start at the login screen.
        if (this.state.path === "") {
            // Note: We can't call our navigate() function here, as it calls
            // setState(), which won't work in a constructor as we're not
            // mounted yet.
            this.state.path = "login";
            window.history.pushState({}, "Family Tree: Login", "#" + this.state.path);
        }

        // Ping the server, to ensure it's awake. Heroku puts it to sleep
        // after an hour of inactivity.
        this.ensureServerResponsive();
    }

    async ensureServerResponsive() {
        for (let attempts = 1; attempts <= 5; attempts++) {
            try {
                await this.server.ping();
                this.setState({
                    serverResponsive: true,
                });
                this.connect();
                return;
            } catch (e) {
                console.log("Failed to ping server...")
            }
        }
    }

    isConnected() {
        return this.state.account !== null;
    }


    async connect() {
        console.log("App.connect()");
        // If we have a stored access token, test it, and download
        // data. If we don't, or the token has expired, this will
        // cause us to show a login page.
        // Note: this is async, but we don't await its completion.
        try {
            let account = await this.server.checkAccount();
            assertHasProps(account, ['username', 'is_staff', 'is_editor',
                'first_name', 'last_name', 'email']);

            // Our stored token is still valid. Show the individuals list.
            console.log("conect() succeeded");
            console.log("username: " + account.username);
            console.log("is_staff: " + account.is_staff);
            console.log("is_editor: " + account.is_editor);
            this.setState({
                account: account,
            });
            // Show search page after login.
            if (this.state.path === "login") {
                this.searchIndividuals();
            }
        } catch (e) {
            // Stored token must have not worked. We should show a login page.
            console.log("Initial connect failed. Error=" + e.message);
            if (!this.isLoggedOutPath()) {
                this.navigate("Family Tree", "login");
            }
            return;
        }
    }

    isLoggedOutPath() {
        const chunks = this.state.path.split("/").filter(nonNull);
        return chunks[0] === 'recover-account' ||
            chunks[0] === 'confirm-account' ||
            chunks[0] === 'reset-password';
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
            assertHasProps(account, ['username', 'is_staff', 'is_editor',
                'first_name', 'last_name', 'email']);
            console.log("username: " + account.username);
            console.log("is_staff: " + account.is_staff);
            console.log("is_editor: " + account.is_editor);
            this.navigate("Individuals", "individuals", {
                account: account,
            });
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
            this.navigate("Family Tree: Login", "login", {
                account: null,
            });
        } catch (e) {
            this.error(e.message);
        }
    }

    searchIndividuals(state) {
        this.navigate("Individuals", "individuals", state || {});
    }

    detailCallback(individual) {
        if (!individual) {
            console.log("Error: detailCallback called with null individual.");
            return;
        }
        this.navigate("Individual detail", "individuals/" + individual.id);
    }

    editCallback(individual) {
        console.log("edit " + individual.id);
        if ((this.state.account.is_editor &&
             this.state.account.username === individual.owner) ||
            this.state.account.is_staff) {
            this.navigate("Edit Individual", "individuals/" + individual.id + "/edit");
        } else {
            this.error("Tried to edit, but you can only edit individuals you created!");
        }
    }

    createAccountCallback() {
        this.navigate("Create account", "create-account");
    }

    accountInfoCallback() {
        this.navigate("Account details", "account");
    }

    ancestors(individual) {
        if (!individual) {
            console.log("Error: ancestors called with null individual.");
            return;
        }
        this.navigate("Individual ancestors", "individuals/" + individual.id + "/ancestors");
    }

    descendants(individual) {
        if (!individual) {
            console.log("Error: descendants called with null individual.");
            return;
        }
        this.navigate("Individual descendants", "individuals/" + individual.id + "/descendants");
    }

    navigate(title, path, otherState={}) {
        console.log("Navigate " + path);
        window.history.pushState({}, title, "#" + path);
        this.setState({
            ...otherState,
            path: window.location.hash.replace("#", ''),

        });
    }

    forgotPassword() {
        this.navigate("Forgot password", "forgot-login", {});
    }

    render() {
        const chunks = this.state.path.split("/").filter(nonNull);

        const header = (
            <Header
                path={this.state.path}
                callbacks={this.callbacks}
                server={this.server}
                account={this.state.account}
            />
        );
        console.log("App.render " + this.state.path);

        if (!this.state.serverResponsive) {
            return (
                <div>
                    {header}
                    Connecting to server...
                </div>
            );
        }

        // URL: /error
        if (this.state.path === "error") {
            return (
                <div>
                    Error; {this.state.error}
                </div>
            );
        }

        // URL: /login
        if (this.state.path === "login") {
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
                            forgotPassword={this.forgotPassword.bind(this)}
                        />
                    </div>
                );
            }
        }

        if (this.state.path === "forgot-login") {
            return (
                <div>
                    {header}
                    <ForgotLogin
                        server={this.server}
                    />
                </div>
            );
        }

        if (chunks.length === 2 && chunks[0] === "reset-password") {
            // URL: reset-password/$token
            return (
                <div>
                    {header}
                    <ResetLogin
                        callbacks={this.callbacks}
                        server={this.server}
                        token={chunks[1]}
                    />
                </div>
            );
        }

        if (chunks.length === 2 && chunks[0] === "confirm-account") {
            // URL: confirm-account/$token
            return (
                <div>
                    {header}
                    <ConfirmAccount
                        token={chunks[1]}
                        callbacks={this.callbacks}
                        server={this.server}
                    />
                </div>
            );
        }

        if (!this.isConnected()) {
            return (
                <div>
                    Testing server connection...
                </div>
            );
        }

        // URL: individuals
        if (this.state.path === "individuals") {
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

        // URL: individuals/add
        if (this.state.path === "individuals/add") {
            return (
                <div>
                    {header}
                    <EditIndividual
                        server={this.server}
                        callbacks={this.callbacks}
                    />
                </div>
            );
        }

        if (this.state.path === "account") {
            return (
                <div>
                    {header}
                    <AccountInfo
                        account={this.state.account}
                        callbacks={this.callbacks}
                    />
                </div>
            );
        }

        if (this.state.path === "create-account") {
            return (
                <div>
                    {header}
                    <CreateAccount
                        callbacks={this.callbacks}
                        server={this.server}
                    />
                </div>
            );
        }

        if (chunks.length >= 2 && chunks[0] === "individuals") {
            const id = parseInt(chunks[1]);
            if (isNaN(id)) {
                return (
                    <div>Invalid individual id</div>
                );
            }
            if (chunks.length === 2) {
                // URL: individuals/$id
                return (
                    <div>
                        {header}
                        <IndividualDetail
                            individualId={id}
                            server={this.server}
                            callbacks={this.callbacks}
                            account={this.state.account}
                        />
                    </div>
                );
            }

            if (chunks.length === 3) {
                if (chunks[2] === "edit") {
                    // URL: individuals/$id/edit
                    return (
                        <div>
                            {header}
                            <EditIndividual
                                individualId={id}
                                server={this.server}
                                callbacks={this.callbacks}
                                account={this.state.account}
                            />
                        </div>
                    );
                }
                if (chunks[2] === "descendants") {
                    // URL: individuals/$id/descendants
                    return (
                        <div>
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
                    // URL: individuals/$id/ancestors
                    return (
                        <div>
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

const backend_server = "http://127.0.0.1:8000/api/v1/";
const FAMILIES_URL = backend_server + 'families/';
const INDIVIDUALS_URL = backend_server + 'individuals/';
const AUTH_TOKEN = "authToken";

export class ServerConnection {
    constructor() {
        this.token = localStorage.getItem(AUTH_TOKEN);
        console.log("Token retrieved from storage: " + this.token);
        this.ensureDataDownloaded.bind(this);
    }

    async downloadJsonData(url) {
        console.log("Downloading " + url);
        const init = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
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
        if (!this.token) {
            // Can't download.
            throw new Error("Login required.");
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
        ]);
        return {
            individuals: individuals,
            families: families,
        };
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
        if (response.ok && json.token) {
            this.token = json.token;
            localStorage.setItem(AUTH_TOKEN, this.token);
        } else {
            throw new Error("Login failed: " + await response.text());
        }
    }

    async logout() {
        console.log("logout");
        const url = backend_server + "logout/";
        const init = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
        };
        let response = await fetch(url, init);
        console.log("Logout response status: " + response.status);
        this.token = null;
        window.localStorage.removeItem(AUTH_TOKEN);
    }

    async saveIndividual(individual) {
        let method = individual.id ? "PATCH" : "PUT";
        let suffix = individual.id ? (individual.id + "/") : "";
        const url = backend_server + "individuals/" + suffix;
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(individual),
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to save Individual; code " + response.status);
        }
        return await response.json();
    }

}
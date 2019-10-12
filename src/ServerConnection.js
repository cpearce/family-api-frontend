import { assertHasProps } from "./Utils";

// If the REACT_APP_BACKEND environment variable was set a build time, use that
// as the URL of our backend server, otherwise point to Heroku.
const backend_server =
    process.env.REACT_APP_BACKEND || "https://guarded-lowlands-11681.herokuapp.com/api/v1/";
const FAMILIES_URL = backend_server + 'families/';
const INDIVIDUALS_URL = backend_server + 'individuals/';
const AUTH_TOKEN = "authToken";

export class ServerConnection {
    constructor() {
        this.token = localStorage.getItem(AUTH_TOKEN);
        console.log("Token retrieved from storage: " + this.token);
        this.ensureDataDownloaded.bind(this);
        this.individuals = new Map();
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

    async ping() {
        const url = backend_server + "ping/";
        const init = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            cache: 'default',
        };

        let response = await fetch(url, init);
        return response.status === 200;
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

    async individual(id) {
        let individual = this.individuals.get(id);
        if (individual) {
            return individual;
        }
        individual = await this.downloadJsonData(INDIVIDUALS_URL + id + "/");
        this.updateCache([individual]);
        return individual;
    }

    async verboseIndividual(id) {
        const data = await this.downloadJsonData(INDIVIDUALS_URL + id + "/verbose");
        this.updateCache([data.individual, ...data.parents]);
        for (const family of data.families) {
            this.updateCache([family.spouse || [], ...family.children]);
        }
        return data;
    }

    async searchIndividuals(query) {
        console.log("Search Individuals: " + query);
        const url = backend_server + "search-individuals/" + query;
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
        console.log("Search " + url + " response status: " + response.status);
        if (!response.ok) {
            throw new Error("Search failed with status: " + response.status);
        }
        const individuals = await response.json();
        this.updateCache(individuals);
        return individuals;
    }

    async searchFamilies(query) {
        console.log("Search Families: " + query);
        const url = backend_server + "families/search/" + query + "/";
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
        console.log("Search " + url + " response status: " + response.status);
        if (!response.ok) {
            throw new Error("Search failed with status: " + response.status);
        }
        const families = await response.json();
        return families;
    }

    async descendants(individualId) {
        console.log("Descendants of " + individualId);
        const url = backend_server + "individuals/" + individualId + "/descendants";
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
        console.log("Descendatns " + url + " response status: " + response.status);
        if (!response.ok) {
            throw new Error("Descendants failed with status: " + response.status);
        }
        const descendants = await response.json();
        return descendants;
    }

    async ancestors(individualId) {
        console.log("Ancestors of " + individualId);
        const url = backend_server + "individuals/" + individualId + "/ancestors";
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
        console.log("Ancestors " + url + " response status: " + response.status);
        if (!response.ok) {
            throw new Error("Ancestors failed with status: " + response.status);
        }
        const ancestors = await response.json();
        return ancestors;
    }

    updateCache(individuals) {
        for (const individual of individuals) {
            this.individuals.set(individual.id, individual);
        }
    }

    async newIndividual() {
        let method = "POST";
        const url = backend_server + "individuals/";
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to create new Individual; code " + response.status);
        }
        return await response.json();
    }

    async saveIndividual(individual) {
        let method = individual.id ? "PATCH" : "POST";
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

    async deleteIndividual(individualId) {
        const url = backend_server + "individuals/" + individualId;
        const init = {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to delete Individual:  " + response.status);
        }
    }

    async newFamily(partnerIds) {
        console.log(`ServerConnection.newFamily(${partnerIds}) typeof=${typeof(partnerIds)}`);
        let method = "POST";
        const url = backend_server + "families/";
        const family = {
            partners: partnerIds,
            children: [],
        };
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(family),
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to create new family; code " + response.status);
        }
        return await response.json();
    }

    async saveFamily(family) {
        console.log("saveFamily(" + JSON.stringify(family) + ")");
        let method = "PUT";
        const url = backend_server + "families/" + family.id + "/";
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(family),
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to save family; code " + response.status);
        }
        return await response.json();
    }

    async deleteFamily(familyId) {
        const url = backend_server + "families/" + familyId + "/";
        const init = {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
        };
        let response = await fetch(url, init);
        if (!response.ok) {
            throw new Error("Failed to delete Family:  " + response.status);
        }
    }

    async checkAccount() {
        if (!this.token) {
            throw new Error("No access token");
        }
        const url = backend_server + "account/";
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
        console.log("Check account response status: " + response.status);
        if (response.status === 401) {
            this.token = null;
            throw new Error("Token expired");
        }
        if (!response.ok) {
            throw new Error("Request failed: " + await response.text());
        }
        return await response.json();
    }

    async createAccount(data) {
        assertHasProps(data, ['username', 'email', 'first_name', 'last_name']);
        let method = "POST";
        const url = backend_server + "create-account/";
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(data),
        };
        let response = await fetch(url, init);
        if (response.status >= 500) {
            throw new Error("Internal server error on request account creation; code " + response.status);
        }
        return await response.json();
    }

    async resetPassword(data) {
        assertHasProps(data, ['token', 'password']);
        let method = "POST";
        const url = backend_server + "reset-password/";
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + this.token,
            },
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(data),
        };
        let response = await fetch(url, init);
        console.log("Confirm account response: " + response.status);
        if (!response.status >= 500) {
            throw new Error("Error on request account confirmation; code " + response.status);
        }
        return await response.json();
    }
}
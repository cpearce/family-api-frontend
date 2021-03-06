import React, { Component } from 'react';
import {assertHasProps, nameAndLifetimeOf} from './Utils.js'


const SEARCH_TYPE = {
    FAMILY: 1,
    INDIVIDUAL: 2,
};

class Search extends Component {
    constructor(props, massage, type) {
        super(props);
        assertHasProps(props, [
            'server',
            'selectedCallback',
            'label',
        ]);
        this.massage = massage;
        this.type = type;
        if (this.type !== SEARCH_TYPE.INDIVIDUAL && this.type !== SEARCH_TYPE.FAMILY) {
            throw TypeError("Invalid Search type.");
        }
        this.state = {
            query: "",
            results: null,
            searching: false,
        };
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.searchCount = 0;
        this.timeout = null;
    }

    handleQueryChange(event) {
        console.log("handleQueryChange");
        this.setState({
            [event.target.name]: event.target.value,
            searching: true,
            results: null,
        });
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        const query = event.target.value;
        this.timeout = setTimeout(
            () => this.search(query),
            250
        );
    }

    postSearch(query) {
        if (query === "") {
            return [];
        }
        if (this.type === SEARCH_TYPE.INDIVIDUAL) {
            return this.props.server.searchIndividuals(query);
        }
        if (this.type === SEARCH_TYPE.FAMILY) {
            return this.props.server.searchFamilies(query);
        }
        throw TypeError("Invalid Search type.");
    }

    async search(query) {
        this.searchCount++;
        const searchCount = this.searchCount;
        try {
            const results = await this.postSearch(query);
            if (searchCount !== this.searchCount) {
                // Another search has started. Ignore result.
                return;
            }
            this.setState({
                results: results,
                searching: false,
            })
        } catch (e) {
            this.props.callback.error(e.message);
        }
    }

    searchResults() {
        if (this.state.searching) {
            return (<div>Searching...</div>);
        }
        if (this.state.results === null) {
            return "";
        }
        if (this.state.results.length === 0) {
            return (<div>No results found.</div>);
        }
        const results = this.state.results.map(
            (i) => this.massage(i, this.props.selectedCallback)
        );
        return (
            <div>
                <ul>{results}</ul>
            </div>
        );
    }

    render() {
        const cancelButton = this.props.cancelButtonCallback && this.props.cancelButtonText
            ? (
                <button onClick={this.props.cancelButtonCallback}>{this.props.cancelButtonText}</button>
            ) : null;
        return (
            <div>
                <label htmlFor="search-box">{this.props.label}:</label>
                <input
                    name="query"
                    type="text"
                    size="30"
                    placeholder="Enter name to search for"
                    value={this.state.query}
                    onChange={this.handleQueryChange}
                />
                {cancelButton}
                {this.searchResults()}
            </div>
        );
    }
}

function individual_to_str(i, callback) {
    return (
        <li key={"individual_search"+i.id}>
            <button className="searchResult" onClick={() => callback(i)}>{nameAndLifetimeOf(i)}</button>
        </li>
    )
}

export class SearchIndividuals extends Search {
    constructor(props) {
        super(props, individual_to_str, SEARCH_TYPE.INDIVIDUAL);
    }
}

function family_to_str(f, callback) {
    return (
        <li key={"family_search"+f.id}>
            <button className="searchResult" onClick={() => callback(f)}>{f.name}</button>
        </li>
    )
}
export class SearchFamilies extends Search {
    constructor(props) {
        super(props, family_to_str, SEARCH_TYPE.FAMILY);
    }
}

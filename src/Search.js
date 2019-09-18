import React, { Component } from 'react';

function lifetime(individual) {
    if (!individual.birth_date && !individual.death_date) {
        return "";
    }
    return "("
        + (individual.birth_date || "?")
        + " - "
        + (individual.death_date || "?")
        + ")";
}

export class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: "",
            results: [],
        };
        this.detailCallback = props.callbacks.detail;
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.searchCount = 0;
        this.timeout = null;
    }

    handleQueryChange(event) {
        console.log("handleQueryChange");
        this.setState({
            [event.target.name]: event.target.value
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

    async search(query) {
        this.searchCount++;
        const searchCount = this.searchCount;
        try {
            const results = await this.props.server.searchIndividuals(query);
            if (searchCount !== this.searchCount) {
                // Another search has started. Ignore result.
                return;
            }
            this.setState({
                results: results,
            })
        } catch (e) {
            this.props.callbacks.error(e.message);
        }
    }

    render() {
        const searchResults = this.state.results.map(
            (i) => {
                const name = i.first_names + " " + i.last_name + " " + lifetime(i);
                return (
                    <li key={i.id}>
                        <button onClick={() => this.detailCallback(i.id)}>{name}</button>
                    </li>
                )
            }
        );
        return (
            <div>
                <label htmlFor="search-box">Search individuals:</label>
                <input
                    name="query"
                    type="text"
                    size="30"
                    placeholder="Enter name to search for"
                    value={this.state.query}
                    onChange={this.handleQueryChange}
                />
                <ul>{searchResults}</ul>
            </div>
        );
    }
}

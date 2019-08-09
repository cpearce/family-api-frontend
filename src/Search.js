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
        };
        this.detailCallback = props.callbacks.detail;
        this.handleQueryChange = this.handleQueryChange.bind(this);
    }

    filteredIndividuals() {
        const pattern = this.state.query.toLowerCase();
        const f = !this.state.query
            ? () => true
            : (i) => {
                return i.last_name.toLowerCase().match(pattern) ||
                    i.first_names.toLowerCase().match(pattern);
            };
        let results = this.props.database.individuals.filter(f);
        let cmp = (a, b) => {
            let a_str = (a.first_names + " " + a.last_name).toLowerCase();
            let b_str = (b.first_names + " " + b.last_name).toLowerCase();
            return a_str.localeCompare(b_str);
        };
        results.sort(cmp);
        return results;
    }

    handleQueryChange(event) {
        console.log("handleQueryChange");
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render() {
        let searchResults = null;
        let count = this.props.database.individuals.length;
        const filtered = this.filteredIndividuals();
        searchResults = filtered.map(
            (i) => {
                const name = i.first_names + " " + i.last_name + " " + lifetime(i);
                return (
                <li key={i.id}>
                    <button onClick={()=>this.detailCallback(i.id)}>{name}</button>
                </li>
                )
            }
        );
        count = filtered.length + " / " + count;
        return (
            <div>
                <label htmlFor="search-box">Search {count} individuals:</label>
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

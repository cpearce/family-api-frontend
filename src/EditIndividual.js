import React, { Component } from 'react';
import { FamiliesOfList } from './EditFamily.js';

export class EditIndividual extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.deleteIndividual = this.deleteIndividual.bind(this);

        const individual = (id) => {
            return props.database.idToIndividual.get(id);
        }

        const partnersOf = (f) => {
            // Make a copy of the partners list.
            let partners = f.partners.slice();
            // Partners list is a list of individuals' ids.
            // Sort partners list so the male partner is first.
            let cmp = (a, b) => {
                return individual(a).sex > individual(b).sex;
            };
            partners.sort(cmp);
            // Convert names to lastname + firstname.
            const names = partners.map(
                (id) => {
                    const i = individual(id);
                    return i.last_name + ", " + i.first_names;
                }
            );
            // Ensure if the spouse is unknown, we render something that makes
            // that obvious.
            while (names.length < 2) {
                names.push("Unknown");
            }
            return names.join(" & ");
        };
        this.child_in_family_options =
            [[0, ""]].concat(
            props.database.families.map(
                (f) => [f.id, partnersOf(f)]
            ));
        this.child_in_family_options.sort((a,b) => a[1].localeCompare(b[1]));

        console.log(individual(this.props.individualId));
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    initialState() {
        const idToIndividual = this.props.database.idToIndividual;
        const individual = idToIndividual.get(this.props.individualId);
        return {
            id: individual ? (individual.id || null) : null,
            first_names: individual ? (individual.first_names || "") : "",
            last_name: individual ? (individual.last_name || "") : "",
            sex: individual ? (individual.sex || "?") : "?",
            birth_date: individual ? (individual.birth_date || "") : "",
            birth_location: individual ? (individual.birth_location || "") : "",
            death_date: individual ? (individual.death_date || "") : "",
            death_location: individual ? (individual.death_location || "") : "",
            buried_date: individual ? (individual.buried_date || "") : "",
            buried_location: individual ? (individual.buried_location || "") : "",
            occupation: individual ? (individual.occupation || "") : "",
            child_in_family: individual ? (individual.child_in_family || "") : "",
            families: individual ? (individual.partner_in_families || []) : [],
        };
    }

    deleteIndividual() {
        if (!this.props.individualId) {
            return;
        }
        const msg =
            "Do you really want to delete this\n" +
            "individual from the database?";
        if (window.confirm(msg)) {
            this.props.callbacks.deleteIndividual(this.props.individualId);
        }
    }

    save() {
        // Make a copy of individual's data, with fields in a format
        // suitable for sending to server.
        const stringFields = [
            'first_names',
            'last_name',
            'birth_location',
            'death_location',
            'buried_location',
            'occupation',
        ];
        let data = {};
        for (const field of stringFields) {
            data[field] = this.state[field];
        }

        // Django Rest Framework's serializers expect empty dates to be
        // "null", rather than an empty string.
        const nullableFields = [
            'id', 'birth_date', 'death_date',
            'buried_date', 'child_in_family'
        ];
        for (let field of nullableFields) {
            data[field] = this.state[field] || null;
        }

        // The 'sex' field is either 'M', 'F', or '?'.
        data.sex = this.state.sex;
        if (data.sex !== 'M' && data.sex !== 'F') {
            data.sex = "?";
        }

        this.props.callbacks.save(data);
    }

    cancel() {
        this.props.callbacks.detail(this.props.individualId);
    }

    render() {
        const child_in_family_options = this.child_in_family_options.map(
            f => (
                <option key={f[0]} value={f[0]}>{f[1]}</option>
            )
        );
        const maybeDeleteButton = !this.props.individualId ? null : (
            <button onClick={this.deleteIndividual}>Delete Individual</button>
        );

        return (
            <div>
                <div>
                    ID: {this.state.id}
                </div>
                <div>
                    <label htmlFor="last_name">Last Name:</label>
                    <input
                        type="text"
                        value={this.state.last_name}
                        id="last_name"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="first_names">First Names:</label>
                    <input
                        type="text"
                        value={this.state.first_names}
                        id="first_names"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="sex">Sex:</label>
                    <select
                        id="sex"
                        value={this.state.sex}
                        onChange={this.handleInputChange}
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="?">Unknown</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="birth_date">Birth Date:</label>
                    <input
                        type="date"
                        value={this.state.birth_date}
                        id="birth_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="birth_location">Birth Location:</label>
                    <input
                        type="text"
                        value={this.state.birth_location}
                        id="birth_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_date">Death Date:</label>
                    <input
                        type="date"
                        value={this.state.death_date}
                        id="death_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_location">Death Location:</label>
                    <input
                        type="text"
                        value={this.state.death_location}
                        id="death_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_date">Buried Date:</label>
                    <input
                        type="date"
                        value={this.state.buried_date}
                        id="buried_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_location">Buried Location:</label>
                    <input
                        type="text"
                        value={this.state.buried_location}
                        id="buried_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="occupation">Occupation:</label>
                    <input
                        type="text"
                        value={this.state.occupation}
                        id="occupation"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="child_in_family">Child of family:</label>
                    <select
                        id="child_in_family"
                        value={this.state.child_in_family}
                        onChange={this.handleInputChange}
                    >
                        {child_in_family_options}
                    </select>
                </div>
                <div>
                    <button onClick={this.save}>Save Changes</button>
                    <button onClick={this.cancel}>Discard Unsaved Changes</button>
                    {maybeDeleteButton}
                </div>
                <FamiliesOfList
                    callbacks={this.props.callbacks}
                    database={this.props.database}
                    individualId={this.props.individualId}
                    families={this.state.families}
                />
            </div>
        );
    }
}

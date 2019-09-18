import React, { Component } from 'react';
import { FamiliesOfList } from './EditFamily.js';

export class EditIndividual extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.deleteIndividual = this.deleteIndividual.bind(this);
        this.init();
    }
    async init() {
        try {
            // Should be cached if we came from the view individual screen...
            const data = await this.props.server.verboseIndividual(this.props.individualId);
            this.setState({
                data: data
            });
        } catch (e) {
            this.props.callbacks.error(e.message + e.fileName + e.lineNumber);
        }
/*
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
        */
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    deleteIndividual() {
        /*
        if (!this.props.individualId) {
            return;
        }
        const msg =
            "Do you really want to delete this\n" +
            "individual from the database?";
        if (window.confirm(msg)) {
            this.props.callbacks.deleteIndividual(this.props.individualId);
        }
        */
    }

    save() {
        /*
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
        */
    }

    cancel() {
        this.props.callbacks.detail(this.props.individualId);
    }

    render() {
        const child_in_family_options = null;
        /*
        const child_in_family_options = this.child_in_family_options.map(
            f => (
                <option key={f[0]} value={f[0]}>{f[1]}</option>
            )
        );
        */
        const maybeDeleteButton = !this.props.individualId ? null : (
            <button onClick={this.deleteIndividual}>Delete Individual</button>
        );

        if (!this.state.data) {
            return (
                <div>
                    Awaiting data download...
                </div>
            );
        }

        const individual = this.state.data.individual;

        return (
            <div>
                <div>
                    ID: {individual.id}
                </div>
                <div>
                    <label htmlFor="last_name">Last Name:</label>
                    <input
                        type="text"
                        value={individual.last_name}
                        id="last_name"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="first_names">First Names:</label>
                    <input
                        type="text"
                        value={individual.first_names}
                        id="first_names"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="sex">Sex:</label>
                    <select
                        id="sex"
                        value={individual.sex}
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
                        value={individual.birth_date}
                        id="birth_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="birth_location">Birth Location:</label>
                    <input
                        type="text"
                        value={individual.birth_location}
                        id="birth_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_date">Death Date:</label>
                    <input
                        type="date"
                        value={individual.death_date}
                        id="death_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_location">Death Location:</label>
                    <input
                        type="text"
                        value={individual.death_location}
                        id="death_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_date">Buried Date:</label>
                    <input
                        type="date"
                        value={individual.buried_date}
                        id="buried_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_location">Buried Location:</label>
                    <input
                        type="text"
                        value={individual.buried_location}
                        id="buried_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="occupation">Occupation:</label>
                    <input
                        type="text"
                        value={individual.occupation}
                        id="occupation"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="child_in_family">Child of family:</label>
                    <select
                        id="child_in_family"
                        value={individual.child_in_family}
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
                    {...this.props.callbacks}
                    individualId={this.props.individualId}
                    families={this.state.data.families}
                />
            </div>
        );
    }
}

import React, { Component } from 'react';
import { FamiliesOfList } from './EditFamily.js';
import { SearchToSelectFamily } from './SearchToSelect.js';
import './Editable.css';


export class EditIndividual extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.deleteIndividual = this.deleteIndividual.bind(this);
        this.addFamilyCallback = this.addFamilyCallback.bind(this);
        this.deleteFamilyCallback = this.deleteFamilyCallback.bind(this);
        this.setChildOfFamily = this.setChildOfFamily.bind(this);

        this.invalidate();

        if (!this.props.callbacks.error) {
            throw TypeError("Need error callback");
        }
        this.retrieving = false;
    }
    async invalidate() {
        if (this.retrieving) {
            return;
        }
        this.retrieving = true;
        try {
            // Should be cached if we came from the view individual screen...
            const data = await this.props.server.verboseIndividual(this.props.individualId);
            const individual = data.individual;
            this.setState({
                data: data,
                id: individual.id || 0,
                first_names: individual.first_names || "",
                last_name: individual.last_name || "",
                sex: individual.sex || "?",
                birth_date: individual.birth_date || "",
                birth_location: individual.birth_location || "",
                death_date: individual.death_location || "",
                death_location: individual.death_location || "",
                occupation: individual.occupation || "",
                child_in_family: individual.child_in_family || 0,
            });
        } catch (e) {
            this.props.callbacks.error(e);
        }
        this.retrieving = false;
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    deleteIndividual() {
        if (!this.props.individualId || !this.state.data || !this.state.data.individual) {
            return;
        }
        const msg =
            "Do you really want to delete this\n" +
            "individual from the database?";
        if (window.confirm(msg)) {
            this.props.callbacks.deleteIndividual(this.state.data.individual);
        }
    }

    async save() {
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

        try {
            await this.props.server.saveIndividual(data);
        } catch (e) {
            this.props.callbacks.error(e);
        }

    }

    async addFamilyCallback(partnerIds) {
        await this.props.callbacks.addFamily(partnerIds);
        // Adding a new family will cause data change. So re-fretch the data.
        await this.invalidate();
    }

    async deleteFamilyCallback(familyId) {
        await this.props.callbacks.deleteFamily(familyId);
        await this.invalidate();
    }

    cancel() {
        this.props.callbacks.detail(this.state.data.individual);
    }

    async setChildOfFamily(family) {
        this.setState((state, props) => {
            state.data.child_in_family = family.id;
            state.data.parents_family = family;
            return state;
        });
    }

    render() {
        const maybeDeleteButton = !this.props.individualId ? null : (
            <button onClick={this.deleteIndividual}>Delete Individual</button>
        );

        if (!this.state.data || this.state.id !== this.props.individualId) {
            this.invalidate();
            return (
                <div>
                    Awaiting data download...
                </div>
            );
        }

        // const individual = this.state.data.individual;
        const parents_family_name = this.state.data.parents_family ? this.state.data.parents_family.name : "Unknown";
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
                    <SearchToSelectFamily
                        furledLabel={"Child of: " + (parents_family_name)}
                        unfurledLabel="Search for parents"
                        text="Change"
                        callback={this.setChildOfFamily}
                        error={this.props.error}
                        server={this.props.server}
                    />
                </div>
                <div>
                    <button onClick={this.save}>Save Changes</button>
                    <button onClick={this.cancel}>Discard Unsaved Changes</button>
                    {maybeDeleteButton}
                </div>
                <FamiliesOfList
                    server={this.props.server}
                    individualId={this.props.individualId}
                    families={this.state.data.families}
                    addFamilyCallback={this.addFamilyCallback}
                    deleteFamilyCallback={this.deleteFamilyCallback}
                    error={this.props.callbacks.error}
                    invalidate={this.invalidate}
                />
            </div>
        );
    }
}

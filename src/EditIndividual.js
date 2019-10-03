import React, { Component } from 'react';
import { FamiliesOfList } from './EditFamily.js';
import { SearchToSelectFamily } from './SearchToSelect.js';
import './Editable.css';
import {nameAndLifetimeOf} from './Utils.js';


const MUTABLE_FIELDS = [
    'first_names',
    'last_name',
    'sex',
    'birth_date',
    'birth_location',
    'death_date',
    'death_location',
    'buried_date',
    'buried_location',
    'baptism_date',
    'baptism_location',
    'occupation',
    'note',
    'child_in_family_id',
    'parents_family',
];

export class EditIndividual extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.save = this.save.bind(this);
        this.revert = this.revert.bind(this);
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
            const state = {
                data: data,
                id: individual.id || 0,
                first_names: individual.first_names || "",
                last_name: individual.last_name || "",
                sex: individual.sex || "?",
                birth_date: individual.birth_date || "",
                birth_location: individual.birth_location || "",
                death_date: individual.death_date || "",
                death_location: individual.death_location || "",
                buried_date: individual.buried_date || "",
                buried_location: individual.buried_location || "",
                baptism_date: individual.baptism_date || "",
                baptism_location: individual.baptism_location || "",
                occupation: individual.occupation || "",
                note: individual.note || "",
                child_in_family_id: individual.child_in_family_id || 0,
                parents_family: data.parents_family || null,
                base: {
                }
            };
            for (const prop of MUTABLE_FIELDS) {
                state.base[prop] = state[prop];
            }
            this.setState(state);
        } catch (e) {
            this.props.callbacks.error(e);
        }
        this.retrieving = false;
    }

    setBaseState() {
        this.setState((state, props) => {
            for (const prop of MUTABLE_FIELDS) {
                state.base[prop] = state[prop];
            }
            return state;
        });
    }

    hasUnsavedChanges() {
        for (const prop of MUTABLE_FIELDS) {
            if (this.state[prop] !== this.state.base[prop]) {
                console.log(`${prop} differs '${this.state[prop]}' != '${this.state.base[prop]}'`);
                return true;
            }
        }
        return false;
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    async deleteIndividual() {
        if (!this.props.individualId || !this.state.data || !this.state.id) {
            return;
        }
        const msg =
            "Do you really want to delete\n" +
            nameAndLifetimeOf(this.state.data.individual) + "?";
        if (window.confirm(msg)) {
            try {
                await this.props.server.deleteIndividual(this.state.id);
                this.props.callbacks.search();
            } catch (e) {
                this.props.callbacks.error(e.message);
            }
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
            'baptism_location',
            'occupation',
            'note',
        ];
        let data = {};
        for (const field of stringFields) {
            data[field] = this.state[field];
        }

        // Django Rest Framework's serializers expect empty dates to be
        // "null", rather than an empty string.
        const nullableFields = [
            'id', 'birth_date', 'death_date',
            'buried_date', 'baptism_date', 'child_in_family_id'
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
            this.setBaseState();
        } catch (e) {
            this.props.callbacks.error(e);
        }
    }

    async addFamilyCallback(partnerIds) {
        try {
            await this.props.server.newFamily(partnerIds);
        } catch (e) {
            this.props.callbacks.error(e.message);
        }
        // Adding a new family will cause data change. So re-fretch the data.
        await this.invalidate();
    }

    async deleteFamilyCallback(familyId) {
        console.log("deleteFamily is passed a familyId rather than an object");
        try {
            await this.props.server.deleteFamily(familyId);
        } catch (e) {
            this.props.error(e);
        }
        await this.invalidate();
    }

    revert() {
        this.setState((state, props) => {
            for (const prop of MUTABLE_FIELDS) {
                state[prop] = state.base[prop];
            }
            return state;
        });
    }

    async setChildOfFamily(family) {
        this.setState((state, props) => {
            state.child_in_family_id = family.id;
            state.parents_family = family;
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

        const htmlInput = (id, type) => {
            return (
                <input
                    type={type}
                    value={this.state[id]}
                    id={id}
                    onChange={this.handleInputChange}
                />
            );
        };

        const sexHtml = (
            <select
                id="sex"
                value={this.state.sex}
                onChange={this.handleInputChange}
            >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="?">Unknown</option>
            </select>
        );

        const parents_family_name = this.state.parents_family
            ? this.state.parents_family.name : "Unknown";
        const childOf = (
            <SearchToSelectFamily
                furledLabel={parents_family_name}
                unfurledLabel="Search for parents"
                text="Change"
                callback={this.setChildOfFamily}
                error={this.props.error}
                server={this.props.server}
            />
        );

        // [label, input]
        const fields = [
            ["Last Name", htmlInput("last_name", "text")],
            ["First Names", htmlInput("first_names", "text")],
            ["Sex", sexHtml],
            ["Birth Date", htmlInput("birth_date", "date")],
            ["Birth Location", htmlInput("birth_location", "text")],
            ["Death Date", htmlInput("death_date", "date")],
            ["Death Location", htmlInput("death_location", "text")],
            ["Buried Date", htmlInput("buried_date", "date")],
            ["Buried Location", htmlInput("buried_location", "text")],
            ["Baptism Date", htmlInput("baptism_date", "date")],
            ["Baptism Location", htmlInput("baptism_location", "text")],
            ["Occupation", htmlInput("occupation", "text")],
            ["Child Of", childOf]
        ];

        const fieldsRows = fields.map(f => {
            return (
                <tr key={f[0]}>
                    <td>
                        <span className="field-title">{f[0]}:</span>
                    </td>
                    <td>
                        {f[1]}
                    </td>
                </tr>
            );
        });

        const note = (
            <tr key="note-textarea">
                <td>
                    <span className="field-title">Note:</span>
                </td>
                <td>
                    <textarea
                        id="note" rows="10" cols="60" value={this.state.note}
                        onChange={this.handleInputChange}>
                    </textarea>
                </td>
            </tr>
        );

        return (
            <div className="edit-individual-detail">
                <table className="edit-individual-detail-table">
                    <tbody>
                        <tr>
                            <td><span className="field-title">ID:</span></td>
                            <td>{this.state.id}</td>
                        </tr>
                        {fieldsRows}
                        {note}
                    </tbody>
                </table>

                <div>
                    <button onClick={this.save} disabled={!this.hasUnsavedChanges()}>Save changes</button>
                    <button onClick={this.revert} disabled={!this.hasUnsavedChanges()}>Discard unsaved changes to individual</button>
                    {maybeDeleteButton}
                </div>
                <FamiliesOfList
                    server={this.props.server}
                    individualId={this.props.individualId}
                    families={this.state.data.families}
                    callbacks={this.props.callbacks}
                    addFamilyCallback={this.addFamilyCallback}
                    deleteFamilyCallback={this.deleteFamilyCallback}
                    error={this.props.callbacks.error}
                    invalidate={this.invalidate}
                />
            </div>
        );
    }
}

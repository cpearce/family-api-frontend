import React, { Component } from 'react';
import './Editable.css';
import { SearchToSelectPerson } from './SearchToSelect.js';
import { assertHasProps, nameOf } from './Utils.js';

export class FamiliesOfList extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, [
            'addFamilyCallback',
            'server',
            'individualId',
        ]);
        this.addFamily = this.addFamily.bind(this);
    }

    addFamily(spouse) {
        this.props.addFamilyCallback([this.props.individualId, spouse.id]);
    }

    render() {
        const families = this.props.families.map(
            family => (
                <EditFamily
                    {...this.props}
                    key={"family-"+family.id}
                    family={family}
                />
            )
        );
        return (
            <div>
                Families:
                {families}

                <SearchToSelectPerson
                    furledLabel="Add Family"
                    unfurledLabel="Search for spouse:"
                    text="Add Family with spouse"
                    server={this.props.server}
                    error={this.props.error}
                    callback={this.addFamily}
                />
            </div>
        )
    }
}

export class EditFamily extends Component {
    constructor(props) {
        super(props);

        assertHasProps(props, ['family', 'deleteFamilyCallback', 'server']);
        assertHasProps(props.family, ['id', 'spouse']);

        this.handleInputChange = this.handleInputChange.bind(this);
        this.partner_options = [];
        this.addChildCallback = this.addChildCallback.bind(this);
        this.removeChild = this.removeChild.bind(this);
        this.deleteFamily = this.deleteFamily.bind(this);
        this.setPartner = this.setPartner.bind(this);
        this.save = this.save.bind(this);
        this.revert = this.revert.bind(this);
        this.state = {
            id: this.props.family.id,
            married_date: this.props.family.married_date || "",
            married_location: this.props.family.married_location || "",
            individualId: this.props.individualId.id,
            spouse: this.props.family.spouse || "",
            children: this.props.family.children || [],
        };
        this.originalState = {};
        this.setBaseState(this.state);
    }

    setBaseState(obj) {
        for (const prop in obj) {
            this.originalState[prop] = obj[prop];
        }
    }

    revert() {
        this.setState((state, props) => {
            for (const prop in this.originalState) {
                state[prop] = this.originalState[prop];
            }
            return state;
        });
    }

    hasUnsavedChanges() {
        for (const prop in this.originalState) {
            if (this.state[prop] !== this.originalState[prop]) {
                return true;
            }
        }
        return false;
    }

    removeChild(child) {
        this.setState((state, props) => {
            state.children = state.children.filter(kid => kid.id !== child.id);
            return state;
        });
    }

    deleteFamily() {
        const msg =
            "Do you really want to delete\n" +
            "this family?"
        if (!window.confirm(msg)) {
            return;
        }
        this.props.deleteFamilyCallback(this.state.id);
    }

    async save() {
        let partners = [this.props.individualId];
        if (this.state.partner) {
            partners = partners.concat([this.state.spouse]);
        }

        const children = this.state.children.map(i => i.id);
        let data = {
            id: this.state.id || null,
            married_date: this.state.married_date || null,
            married_location: this.state.married_location || "",
            partners: partners,
            children: children || [],
        };

        if (data.id === null) {
            console.log("id is null when saving family!");
        } else {
            try {
                console.log("Saving family " + data.id);
                await this.props.server.saveFamily(data);
                this.setBaseState(data);
            } catch (e) {
                this.props.error(e.message);
            }
        }


    }

    setPartner(individual) {
        this.setState({
            spouse: individual
        });
    }

    render() {
        // console.log("Render children: " + this.state.children);

        const children_in_family = this.state.children.map(
            child => (
                <li key={"child-" + child.id}>
                    {nameOf(child)}
                    <button
                        onClick={() => this.removeChild(child) }
                        title="Remove a child from a family. Does not delete the child from the database.">
                            Remove from family
                    </button>
                </li>
            )
        );
        return (
            <div className="editable-family">
                <div>
                    ID: {this.state.id}
                </div>
                <div>
                    <SearchToSelectPerson
                        furledLabel={"Partner: " + nameOf(this.state.spouse)}
                        unfurledLabel="Search for spouse"
                        text="Change"
                        callback={this.setPartner}
                        error={this.props.error}
                        server={this.props.server}

                    />
                </div>
                <div>
                    <label htmlFor="married_date">Marriage Date (optional):</label>
                    <input
                        type="date"
                        value={this.state.married_date}
                        id="married_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="married_location">Marriage Location (optional):</label>
                    <input
                        type="text"
                        id="married_location"
                        value={this.state.married_location}
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    Children in family:
                    <ul>
                        { children_in_family }
                        <li>
                            <SearchToSelectPerson
                                furledLabel=""
                                unfurledLabel="Search for child to add"
                                text="Add Child"
                                server={this.props.server}
                                error={this.props.error}
                                callback={this.addChildCallback}
                            />
                        </li>
                    </ul>
                </div>
                <div>
                    <button onClick={this.save}  disabled={!this.hasUnsavedChanges()}>Save</button>
                    <button onClick={this.revert} disabled={!this.hasUnsavedChanges()}>Discard unsaved changes to family</button>
                    <button onClick={this.deleteFamily}>Remove family</button>
                </div>
            </div>
        );
    }

    addChildCallback(child) {
        // console.log("Add child " + child.id + " type=" + (typeof child.id));
        this.setState((state, props) => {
            state.children.push(child);
            return state;
        });
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }
}

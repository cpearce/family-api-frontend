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

function childArrayEquals(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) {
            return false;
        }
    }
    return true;
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
            married_date: this.props.family.married_date || "",
            married_location: this.props.family.married_location || "",
            spouse: this.props.family.spouse || null,
            children: this.props.family.children.concat() || [],
            base: {
                married_date: this.props.family.married_date || "",
                married_location: this.props.family.married_location || "",
                spouse: this.props.family.spouse || null,
                children: this.props.family.children.concat() || [],
            }
        };
    }

    setBaseState() {
        this.setState((state, props) => {
            state.base.married_date = state.married_date || "";
            state.base.married_location = state.married_location || "";
            state.base.children = state.children.concat() || [];
            state.base.spouse = state.spouse || null;
            return state;
        });
    }

    revert() {
        this.setState((state, props) => {
            state.married_date = state.base.married_date || "";
            state.married_location = state.base.married_location || "";
            state.children = state.base.children.concat() || [];
            state.spouse = state.base.spouse || null;
            return state;
        });
    }

    hasUnsavedChanges() {
        if (this.state.married_date !== this.state.base.married_date ||
            this.state.married_location !== this.state.base.married_location ||
            ((this.state.spouse === null) !== (this.state.base.spouse === null)) ||
            (this.state.spouse && this.state.base.spouse &&
                this.state.spouse.id !== this.state.base.spouse.id) ||
            !childArrayEquals(this.state.children, this.state.base.children)) {
            return true;
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
        this.props.deleteFamilyCallback(this.props.individualId);
    }

    async save() {
        let partners = [this.props.individualId];
        if (this.state.spouse) {
            partners = partners.concat([this.state.spouse.id]);
        }

        const children = this.state.children.map(i => i.id);
        let data = {
            id: this.props.family.id,
            married_date: this.state.married_date || null,
            married_location: this.state.married_location || "",
            partners: partners,
            children: children || [],
        };

        // all wrong, need to be saving spouse as spouse, nto as partner.

        if (data.id === null) {
            console.log("id is null when saving family!");
        } else {
            try {
                console.log("Saving family " + data.id);
                await this.props.server.saveFamily(data);
                this.setBaseState();
            } catch (e) {
                this.props.error(e);
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
                    ID: {this.props.family.id}
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

import React, { Component } from 'react';
import './Editable.css';

export class FamiliesOfList extends Component {
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
                <button
                    onClick={() => this.props.callbacks.addFamily(this.props.individualId)}
                >
                    Add family
                </button>
            </div>
        )
    }
}

class AddChild extends Component {

    constructor(props) {
        super(props);
        this.state = {
            furled: true,
            childId: 0,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.addClick = this.addClick.bind(this);
        this.reset = this.reset.bind(this);
    }

    addClick() {
        this.props.callback(parseInt(this.state.childId));
        this.reset();
    }

    reset() {
        this.setState({furled: true, childId: 0});
    }

    render() {
        if (this.state.furled) {
            return (
                <div>
                    <button onClick={()=> this.setState({furled: false})}>Add Child</button>
                </div>
            );
        }
        return (
            <div>
                <select
                    id="childId"
                    value={this.state.childId}
                    onChange={this.handleInputChange}
                >
                    <option key="childId-0" value="0"></option>
                    {this.props.options.map(c => (
                        <option
                            key={"childId-"+c[0]}
                            value={c[0]}
                        >
                            {c[1]}
                        </option>
                    ))}
                </select>
                <button onClick={this.addClick} disabled={this.state.childId === 0}>Confirm</button>
                <button onClick={this.reset}>Cancel</button>
            </div>
        );
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }
}

function sortOptionsByLastName(options) {
    let cmp = (a, b) => {
        return a[1].toLowerCase().localeCompare(b[1].toLowerCase());
    };
    options.sort(cmp);
}

export class EditFamily extends Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        // this.state = this.initialState();
        this.partner_options = [];
        // this.partner_options =
        //     this.props.database.individuals
        //         // Individuals other than the individualId
        //         .filter(i => i.id !== this.props.individualId)
        //         // Mapped to their name and id
        //         .map(i => [i.id, i.last_name + ", " + i.first_names]);
        // sortOptionsByLastName(this.partner_options);
        this.addChildCallback = this.addChildCallback.bind(this);
        this.removeChild = this.removeChild.bind(this);
        this.removeFamily = this.removeFamily.bind(this);
        this.save = this.save.bind(this);
        this.state = {
            id: this.props.family.id,
            married_date: this.props.family.married_date,
            married_location: this.props.family.married_location,
            individualId: this.props.individualId.id,
            spouse: this.props.family.spouse,
            children: this.props.family.children,
        };
    }

    nameOf(individual) {
        return !individual ? "" : individual.last_name + ", " + individual.first_names;
    }

    removeChild(child) {
        this.setState((state, props) => {
            state.children = state.children.filter(kid => kid.id !== child.id);
            return state;
        });
    }

    removeFamily() {
        this.props.callbacks.deleteFamily(this.state.id);
    }

    save() {
        let partners = [this.props.individualId];
        if (this.state.partner) {
            partners = partners.concat([this.state.partner]);
        }

        let data = {
            id: this.state.id || null,
            married_date: this.state.married_date || null,
            married_location: this.state.married_location || "",
            partners: partners,
            children: this.state.children || [],
        };

        if (data.id === null) {
            console.log("id is null when saving family!");
        } else {
            this.props.callbacks.saveFamily(data);
        }
    }

    render() {
        console.log("Render children: " + this.state.children);

        const children_in_family = this.state.children.map(
            child => (
                <li key={"child-" + child.id}>
                    {this.nameOf(child)}
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
                    <label htmlFor="partner">Partner:</label>
                    <select
                        id="partner"
                        value={this.state.partner}
                        onChange={this.handleInputChange}
                    >
                        <option key="partner-0" value="0"></option>
                        {this.partner_options.map(p => (
                            <option
                                key={"partner-"+p[0]}
                                value={p[0]}
                            >
                                {p[1]}
                            </option>
                        ))}
                    </select>
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
                            <AddChild
                                options={this.addChildOptions()}
                                callback={this.addChildCallback}
                                database={this.props.database}
                            />
                        </li>
                    </ul>
                </div>
                <div>
                    <button onClick={this.save}>Save</button>
                    <button onClick={this.revert}>Revert</button>
                    <button onClick={this.removeFamily}>Remove family</button>
                </div>
            </div>
        );
    }

    addChildOptions() {
        return [];
        // // List of ids of individuals to not include as potential children.
        // const exclude = [
        //     this.state.partner,
        //     this.props.individualId.id,
        //     ...this.state.children
        // ];
        // let options = this.props.database.individuals
        //     // ids which aren't in the exclude list
        //     .filter(id => !exclude.includes(id))
        //     // Convert to [id, name]
        //     .map(i => [i.id, i.last_name + ", " + i.first_names]);
        // sortOptionsByLastName(options);
        // return options;
    }

    addChildCallback(id) {
        console.log("Add child " + id + " type=" + (typeof id));
        this.setState((state, props) => {
            state.children.push(id);
            console.log("Children: " + state.children);
            return state;
        });
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }
}

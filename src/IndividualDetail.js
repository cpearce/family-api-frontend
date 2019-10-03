import React, { Component } from 'react';
import {nameAndLifetimeOf} from './Utils.js';


function formatEvent(date, location) {
    if (!date && !location) {
        return "";
    }
    let s = "";
    if (date) {
        s += date;
    }
    if (location) {
        if (s) {
            s += ", ";
        }
        s += location;
    }
    return s;
}



function formatChildren(familyId, children, detailCallback) {
    if (children.length === 0) {
        return null;
    }
    let first = true;
    const f = (child) => {
        const leftColumn = first ? (<span className="field-title">Children:</span>) : null;
        first = false;
        return (
            <tr key={familyId + "-" + child.id}>
                <td>
                    {leftColumn}
                </td>
                <td>
                    <button onClick={() => detailCallback(child)}>
                        {nameAndLifetimeOf(child)}
                    </button>
                </td>
            </tr>
        );
    };
    return children.map(f);
}

function formatFamilies(individualId, families, detailCallback) {

    const f = (family) => {
        const spouse = family.spouse;
        const children = family.children;
        return (
            <table key={"family" + family.id} className="family">
                <tbody>
                    <tr>
                        <td>
                            <span className="field-title">Partner:</span>
                        </td>
                        <td>
                            <button onClick={() => detailCallback(spouse)}>
                                {nameAndLifetimeOf(spouse)}
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="field-title">Married:</span>
                        </td>
                        <td>
                            {formatEvent(family.married_date, family.married_location)}
                        </td>
                    </tr>
                    {formatChildren(family.id, children, detailCallback)}
                </tbody>

            </table>
        );
    }
    return families.map(f);
}

function formatParents(parents, detailCallback) {
    let first = true;
    const f = (p) => {
        const leftColumn = first ? (<span className="field-title">Parents:</span>) : null;
        first = false;
        return (
            <tr key={"parent-" + p.id}>
                <td>
                    {leftColumn}
                </td>
                <td>
                    <button onClick={() => detailCallback(p)}>{
                        nameAndLifetimeOf(p)}
                    </button>
                </td>
            </tr>
        );
    };
    return parents.map(f);
}

export class IndividualDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.retrieving = false;
    }
    async retrieve() {
        if (this.retrieving) {
            return;
        }
        this.retrieving = true;
        try {
            const data = await this.props.server.verboseIndividual(this.props.individualId);
            this.setState({
                data: data
            });
            console.log("Downloaded.");
        } catch (e) {
            this.props.callbacks.error(e.message + e.fileName + e.lineNumber);
        }
        this.retrieving = false;
    }
    render() {
        if (!this.state.data || this.state.data.individual.id !== this.props.individualId) {
            this.retrieve();
            return (
                <div>
                    Retrieving data...
                </div>
            );
        }
        const individual = this.state.data.individual;
        console.log(JSON.stringify(individual));
        const families = this.state.data.families;
        const parents = this.state.data.parents;

        const birth = formatEvent(individual.birth_date, individual.birth_location);
        const death = formatEvent(individual.death_date, individual.death_location);
        const buried = formatEvent(individual.buried_date, individual.buried_location);
        const editButton = !this.props.canEdit ? null : (
            <div>
                <button onClick={() => this.props.callbacks.edit(individual)}>
                    Edit
                </button>
            </div>
        );
        const sex = individual.sex === "M" ? "Male" :
            (individual.sex === "F" ? "Female" : "?");
        const notes = (
                <div id="notes">
                    <span className="field-title">Notes:</span>
                    {individual.note ? individual.note : null}
                </div>
            );

        const fields = [
            ["Last name", individual.last_name],
            ["First names", individual.first_names],
            ["Sex", sex],
            ["Birth", birth],
            ["Death", death],
            ["Buried", buried],
            ["Occupation", individual.occupation],
        ];

        const fieldsRows = fields.map(x => {
            return (
                <tr key={x[0]}>
                    <td>
                        <span className="field-title">{x[0]}:</span>
                    </td>
                    <td>
                        {x[1]}
                    </td>
                </tr>
            )
        });

        const parentsRows = formatParents(parents, this.props.callbacks.detail);

        const familiesRows = formatFamilies(
            this.props.individualId,
            families,
            this.props.callbacks.detail);


        return (
            <div className="individual-detail">
                <div id="name">
                    {individual.first_names + " " + individual.last_name}
                </div>
                <table className="individual-detail-table">
                    <tbody>
                        {fieldsRows}
                        {parentsRows}
                    </tbody>
                </table>

                <span className="field-title">Families:</span>
                {familiesRows}
                {notes}
                <div>
                    <button onClick={() => this.props.callbacks.descendants(individual)}>
                        View Descendants Tree
                    </button>
                </div>
                <div>
                    <button onClick={() => this.props.callbacks.ancestors(individual)}>
                        View Ancestors Tree
                    </button>
                </div>
                {editButton}
            </div>
        );
    }
}

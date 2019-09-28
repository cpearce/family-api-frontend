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
    const f = (child) => (
        <li key={familyId + "-" + child.id}>
            <button onClick={() => detailCallback(child)}>
                {nameAndLifetimeOf(child)}
            </button>
        </li>
    );
    return (
        <div>
            Children:
            <ul>
                {children.map(f)}
            </ul>
        </div>
    );
}

function formatFamilies(individualId, families, detailCallback, idToIndividual) {
    const f = (family) => {
        const spouse = family.spouse;
        const children = family.children;
        return (
            <li key={family.id}>
                <div className="spouse">
                    Partner:
                    <button onClick={() => detailCallback(spouse)}>
                        {nameAndLifetimeOf(spouse)}
                    </button>
                </div>
                <div>Married: {formatEvent(family.married_date, family.married_location)}</div>
                {formatChildren(family.id, children, detailCallback)}
            </li>
        );
    }
    return (
        <div>
            Families:
            <ul>
                {families.map(f)}
            </ul>
        </div>
    );
}

function formatParents(parents, detailCallback) {
    const f = (p) => (
        <li key={"parent-" + p.id}>
            <button onClick={() => detailCallback(p)}>{
                nameAndLifetimeOf(p)}
            </button>
        </li>
    );
    return (
        <div>
            Parents:
            <ul>
                {parents.map(f)}
            </ul>
        </div>
    );
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
        return (
            <div>
                <div id="name">
                    {individual.first_names + " " + individual.last_name}
                </div>
                <div id="sex">
                    Sex: {sex}
                </div>
                <div id="birth">
                    Born: {birth}
                </div>
                <div id="death">
                    Died: {death}
                </div>
                <div id="buried">
                    Buried: {buried}
                </div>
                <div id="occupation">
                    Occupation: {individual.occupation}
                </div>
                <div id="parents">
                    {formatParents(parents, this.props.callbacks.detail)}
                </div>
                <div id="families">
                    {formatFamilies(
                        this.props.individualId,
                        families,
                        this.props.callbacks.detail)}
                </div>
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

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

function nameAndLifetimeOf(individual) {
    const l = lifetime(individual);
    return individual.first_names + " " + individual.last_name + (l ? (" - " + l) : "");
}

function formatChildren(family, detailCallback) {
    if (family.children.length === 0) {
        return null;
    }
    const f = (c) => (
        <li key={family.id + "-" + c.id}>
            <button onClick={()=>detailCallback(c.id)}>{nameAndLifetimeOf(c)}</button>
        </li>
    );
    return (
        <div>
            Children:
            <ul>
                {family.children.map(f)}
            </ul>
        </div>
    );
}

function formatFamilies(families, detailCallback) {
    const f = (f) => (
        <li key={f.id}>
            <div className="spouse">
                Partner: <button onClick={()=>detailCallback(f.spouse.id)}>{nameAndLifetimeOf(f.spouse)}</button>
            </div>
            <div>Married: {formatEvent(f.married_date, f.married_location)}</div>
            {formatChildren(f, detailCallback)}
        </li>
    );
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
            <button onClick={()=>detailCallback(p.id)}>{nameAndLifetimeOf(p)}</button>
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
    render() {
        const individual = this.props.individual.individual;
        const families = this.props.individual.families;
        const parents = this.props.individual.parents;

        const birth = formatEvent(individual.birth_date, individual.birth_location);
        const death = formatEvent(individual.death_date, individual.death_location);
        const buried = formatEvent(individual.burried_date, individual.buried_location);
        const sex = individual.sex === "M" ? "Male" :
                    (individual.sex === "F" ? "Female" : "?");
        return (
            <div>
                <div id="name">
                    {individual.first_names + " "  + individual.last_name}
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
                    {formatParents(parents, this.props.detailCallback)}
                </div>
                <div id="families">
                    {formatFamilies(families, this.props.detailCallback)}
                </div>
            </div>
        );
    }
}

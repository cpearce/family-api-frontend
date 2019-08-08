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

function formatChildren(familyId, children, detailCallback) {
    if (children.length === 0) {
        return null;
    }
    const f = (c) => (
        <li key={familyId + "-" + c.id}>
            <button onClick={()=>detailCallback(c.id)}>{nameAndLifetimeOf(c)}</button>
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
    const f = (f) => {
        const partners = f.partners.filter((id) => id !== individualId)
                                   .map((id) => idToIndividual.get(id));
        if (partners.length !== 1) {
            return null;
        }
        const spouse = partners[0];
        const children = f.children.map(
            (id) => idToIndividual.get(id)
        );
        return (
        <li key={f.id}>
            <div className="spouse">
                Partner: <button onClick={()=>detailCallback(spouse.id)}>{nameAndLifetimeOf(spouse)}</button>
            </div>
            <div>Married: {formatEvent(f.married_date, f.married_location)}</div>
            {formatChildren(f.id, children, detailCallback)}
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

function parentsOf(individual, idToIndividual, idToFamily) {
    if (!individual.child_in_family) {
        return [];
    }
    const family = idToFamily.get(individual.child_in_family);
    if (!family) {
        return [];
    }
    return family.partners.map(
        (id) => idToIndividual.get(id)
    );
}

export class IndividualDetail extends Component {
    render() {
        const idToIndividual = this.props.idToIndividual;
        const idToFamily = this.props.idToFamily;

        const individual = idToIndividual.get(this.props.individualId);
        const families = individual.partner_in_families.map(
            (id) => idToFamily.get(id)
        );
        const parents = parentsOf(individual, idToIndividual, idToFamily)

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
                    {formatFamilies(this.props.individualId, families, this.props.detailCallback, idToIndividual)}
                </div>
            </div>
        );
    }
}

export function assertHasProps(obj, props) {
    for (const p of props) {
        if (!obj.hasOwnProperty(p)) {
            throw TypeError(`Expected property ${p} not found`);
        }
    }
}

export function nameOf(individual) {
    return individual ? individual.last_name + ", " + individual.first_names : "Unknown";
}

export function lifetimeOf(individual) {

    return lifetime(individual);
}

export function getYear(date) {
    if (!date) {
        return null;
    }
    // All runs of digits, filtered to extact those of 4-digit length.
    const matches = Array.from(
        date.matchAll(/(\d+)/g), x => x[0])
            .filter(x => x.length === 4);
    for (const match of matches) {
        return parseInt(match);
    }
    return null;
}

//TODO: USe 1 consistently!
export function lifetime(individual) {
    if (!individual || (!individual.birth_date && !individual.death_date)) {
        return "";
    }
    const birth = getYear(individual.birth_date) || "?";
    const death = getYear(individual.death_date) || "?";
    return "(" + birth + " - " + death + ")";
}

export function nameAndLifetimeOf(individual) {
    const l = lifetime(individual);
    return nameOf(individual) + (l ? (" - " + l) : "");
}

export function contains(collection, element) {
    for (const value of collection) {
        if (value === element) {
            return true;
        }
    }
    return false;
}

export function assertHasProps(obj, props) {
    for (const p of props) {
        if (!obj.hasOwnProperty(p)) {
            throw TypeError(`Expected property ${p} not found`);
        }
    }
}

export function nameOf(individual) {
    // TODO: Include lifetime in this!
    return individual ? individual.last_name + ", " + individual.first_names : "Unknown";
}

export function lifetime(individual) {
    if (!individual || (!individual.birth_date && !individual.death_date)) {
        return "";
    }
    return "("
        + (individual.birth_date || "?")
        + " - "
        + (individual.death_date || "?")
        + ")";
}

export function nameAndLifetimeOf(individual) {
    const l = lifetime(individual);
    return nameOf(individual) + (l ? (" - " + l) : "");
}

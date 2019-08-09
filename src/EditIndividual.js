import React, { Component } from 'react';

export class EditIndividual extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.save = this.save.bind(this);
        this.revert = this.revert.bind(this);
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }

    initialState() {
        const idToIndividual = this.props.idToIndividual;
        const individual = idToIndividual.get(this.props.individualId);
        return {
            id: individual.id || "",
            first_names: individual.first_names || "",
            last_name: individual.last_name || "",
            sex: individual.sex || "",
            birth_date: individual.birth_date || "",
            birth_location: individual.birth_location || "",
            death_date: individual.death_date || "",
            death_location: individual.death_location || "",
            buried_date: individual.buried_date || "",
            buried_location: individual.buried_location || "",
            occupation: individual.occupation || "",
        };
    }

    save() {
        this.props.saveCallback(this.state)
    }

    revert() {
        this.setState(this.initialState());
    }

    render() {
        return (
            <div>
                <div>
                    <label htmlFor="last_name">Last Name:</label>
                    <input
                        type="text"
                        value={this.state.last_name}
                        id="last_name"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="first_names">First Names:</label>
                    <input
                        type="text"
                        value={this.state.first_names}
                        id="first_names"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="sex">Sex:</label>
                    <select
                        id="sex"
                        value={this.state.sex}
                        onChange={this.handleInputChange}
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="?">Unknown</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="birth_date">Birth Date:</label>
                    <input
                        type="date"
                        value={this.state.birth_date}
                        id="birth_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="birth_location">Birth Location:</label>
                    <input
                        type="text"
                        value={this.state.birth_location}
                        id="birth_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_date">Death Date:</label>
                    <input
                        type="date"
                        value={this.state.death_date}
                        id="death_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="death_location">Death Location:</label>
                    <input
                        type="text"
                        value={this.state.death_location}
                        id="death_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_date">Buried Date:</label>
                    <input
                        type="date"
                        value={this.state.buried_date}
                        id="buried_date"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="buried_location">Buried Location:</label>
                    <input
                        type="text"
                        value={this.state.buried_location}
                        id="buried_location"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="occupation">Occupation:</label>
                    <input
                        type="text"
                        value={this.state.occupation}
                        id="occupation"
                        onChange={this.handleInputChange}
                    />
                </div>
                <div>
                    <button onClick={this.save}>Save</button>
                    <button onClick={this.revert}>Revert</button>
                </div>
            </div>
        );
    }
}

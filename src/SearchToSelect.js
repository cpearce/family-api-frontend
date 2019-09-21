import React, { Component } from 'react';
import './Editable.css';
import { SearchIndividuals, SearchFamilies } from './Search.js';
import {assertHasProps} from './Utils.js'


const SELECT_TYPE = {
    FAMILY: 1,
    INDIVIDUAL: 2,
};

export class SearchToSelect extends Component {

    constructor(props, type) {
        super(props);
        assertHasProps(props, [
            'server',
            'error',
            'callback',
            'furledLabel',
            'unfurledLabel',
            'text',
        ]);

        this.type = type;
        if (this.type !== SELECT_TYPE.INDIVIDUAL && this.type !== SELECT_TYPE.FAMILY) {
            throw TypeError("Invalid Search type.");
        }

        this.state = {
            furled: true,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.addClick = this.addClick.bind(this);
        this.reset = this.reset.bind(this);

    }

    addClick(child) {
        this.props.callback(child);
        this.reset();
    }

    reset() {
        this.setState({furled: true});
    }

    searchBox() {
        const label = this.props.unfurledLabel || null;
        if (this.type === SELECT_TYPE.INDIVIDUAL) {
            return (
                <SearchIndividuals
                    selectedCallback={this.addClick}
                    label={label}
                    server={this.props.server}
                    cancelButtonCallback={this.reset}
                    cancelButtonText="Cancel"
                />
            );
        }
        if (this.type === SELECT_TYPE.FAMILY) {
            return (
                <SearchFamilies
                    selectedCallback={this.addClick}
                    label={label}
                    server={this.props.server}
                    cancelButtonCallback={this.reset}
                    cancelButtonText="Cancel"
                />
            );
        }
        throw TypeError("Invalid Search type.");
    }

    render() {

        if (this.state.furled) {
            const label = this.props.furledLabel || null;
            return (
                <div>
                   {label} <button onClick={()=> this.setState({furled: false})}>{this.props.text}</button>
                </div>
            );
        }
        return (
            <div>
                {this.searchBox()}
            </div>
        );
    }

    handleInputChange(event) {
        this.setState({
            [event.target.id]: event.target.value
        });
    }
}

export class SearchToSelectPerson extends SearchToSelect {
    constructor(props) {
        super(props, SELECT_TYPE.INDIVIDUAL);
    }
}

export class SearchToSelectFamily extends SearchToSelect {
    constructor(props) {
        super(props, SELECT_TYPE.FAMILY);
    }
}

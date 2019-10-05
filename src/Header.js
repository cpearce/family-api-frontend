import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class Header extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['isStaff', 'isEditor', 'callbacks']);
        assertHasProps(props.callbacks, ['edit', 'error', 'search', 'logout']);
        this.addIndividual = this.addIndividual.bind(this);
    }

    async addIndividual() {
        try {
            const individual = await this.props.server.newIndividual()
            console.log("Created individual " + individual.id);
            this.props.callbacks.edit(individual);
        } catch (e) {
            this.props.callbacks.error(e.message);
        }
    }

    render() {
        const isLoginPage = window.location.pathname === "/" ||
                            window.location.pathname === "/login";
        const canEdit = this.props.isStaff || this.props.isEditor;
        const items = isLoginPage ? [] : [
            { text: "Search Individuals", click: this.props.callbacks.search, path: "/individuals" },
            ...(canEdit ? [{ text: "Add Individual", click: this.addIndividual, path: "/individuals/add" }] : []),
            { text: "Logout", click: this.props.callbacks.logout, path: "" },
        ];

        const navBarItems = items.map(
            (item) => (
                <li key={"navbar-" + item.text} className="nav-item">
                    <button
                        disabled={(item.path === window.location.pathname)}
                        className="nav-button"
                        onClick={item.click}
                    >
                        {item.text}
                    </button>
                </li>
            )
        );

        return (
            <ul className="navbar">
                <li className="navbar-brand">
                    Family Tree
                </li>
                {navBarItems}
            </ul>
        )
    }
}
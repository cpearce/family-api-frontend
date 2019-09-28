import React, { Component } from 'react';

export class Header extends Component {
    constructor(props) {
        super(props);
        this.addIndividual = this.addIndividual.bind(this);
    }

    async addIndividual() {
        try {
            const individual = await this.server.newIndividual()
            console.log("Created individual " + individual.id);
            this.props.callbacks.edit(individual);
        } catch (e) {
            this.error(e.message);
        }
    }

    render() {
        const isLoginPage = window.location.pathname === "/" ||
                            window.location.pathname === "/login";
        const items = isLoginPage ? [] : [
            { text: "Individuals", click: this.props.callbacks.search, path: "/individuals" },
            ...(this.props.canEdit ? [{ text: "Add", click: this.addIndividual, path: "/individuals/add" }] : []),
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
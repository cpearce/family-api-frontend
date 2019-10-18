import React, { Component } from 'react';
import { assertHasProps } from './Utils';

export class Header extends Component {
    constructor(props) {
        super(props);
        assertHasProps(props, ['account', 'callbacks', 'path']);
        if (props.account) {
            assertHasProps(props.account, ['username', 'is_staff', 'is_editor',
                'first_name', 'last_name', 'email']);
        }
        assertHasProps(props.callbacks, ['account', 'edit', 'error', 'search', 'logout']);
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
        const isLoginPage = this.props.account === null;
        const canEdit = this.props.account &&
            (this.props.account.is_staff || this.props.account.is_editor);
        const isAdding = this.props.path.match('individuals/.*/edit');
        const items = isLoginPage ? [] : [
            {
                text: "Search Individuals",
                click: this.props.callbacks.search,
                disabled: this.props.path === "individuals",
            },
            ...(canEdit ? [{
                text: !isAdding ? "Add Individual" : "Add another individual",
                click: this.addIndividual,
                disabled: false,
            }] : []),
            {
                text: 'Account',
                click: this.props.callbacks.account,
                disabled: this.props.path === "account",
            },
            {
                text: "Logout",
                click: this.props.callbacks.logout,
                disabled: this.props.path === "",
            },
        ];

        const navBarItems = items.map(
            (item) => (
                <li key={"navbar-" + item.text} className="nav-item">
                    <button
                        disabled={item.disabled}
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
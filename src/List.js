import React, { Component } from 'react';

export class List extends Component {
  constructor(props) {
    super(props);
    this.state = {
        individuals: props.individuals,
    };
    this.detailCallback = props.detailCallback;
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleLogin(event) {
    event.preventDefault();
    this.props.login(this.state.username, this.state.password);
  }

  render() {
    return (
        <div>
        </div>
    );
  }
}

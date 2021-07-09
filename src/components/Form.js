import React from 'react';
import {Button} from 'antd';



export default class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            curInput: ''
        }
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleSubmit(e) {
        e.preventDefault();
        this.props.sendMsg(this.state.curInput); 
        return false;
    }
    handleInputChange(e) {
        this.setState({
            curInput: e.target.value
        })
    }
    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    <input onChange={this.handleInputChange} />
                </label>
                <Button type="primary" htmlType="submit">{this.props.btnText}</Button>
            </form>
        )
    }
}

import { Tag, Button, Space } from "antd";
import { Color, UserState } from "../utils"
import React from 'react';

class LogBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(e) {
        this.setState({
            username: e.target.value
        });
    }
    handleSubmit(e) {
        //TODO:valid username
        e.preventDefault();
        const isLogin = this.props.userstate != UserState.OFFLINE;
        if (isLogin) {
            this.props.handleLogout();
        } else {

            this.props.handleLogin(this.state.username);
        }
    }
    render() {
        const userstate = this.props.userstate;
        const isLogin = userstate != UserState.OFFLINE;
        const greeting = isLogin ? (

            <span style={{ color: 'white' }}>Hello,{this.state.username}</span>
        ) : (
            <label>

                <input placeholder="请输入昵称" htmlType="text" onChange={this.handleChange} />
            </label>
        );
        return (
            <Space>

                <form onSubmit={this.handleSubmit} style={{ lineHeight: 'normal' }}>

                    {greeting}
                    <Button type="primary" htmlType="submit">{isLogin ? '退出' : '登录'}</Button>
                </form>

            </Space>
        )
    }
}

export default LogBar;
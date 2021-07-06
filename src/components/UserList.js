import { Tag,Button,Space } from "antd";
import { Color, UserState } from "../utils"
import React from 'react';


class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userlist: []
        }
        this.props.socket.on('userlist_change', (userlist) => {
            console.log('userlist_change');
            this.handleChange(userlist);
        });
    }
    handleChange(userlist) {
        this.setState({
            userlist
        })
    }
    componentDidMount(){
        this.props.socket.on('userlist_change', (userlist) => {
            console.log('userlist_change');
            this.handleChange(userlist);
        });
    }
    componentWillUnmount(){
        this.props.socket.off('userlist_change');
    }
    render() {
        return (
            <div style={{padding:10,minWidth:150,maxWidth:200}}>
                <b>在线用户：</b>
                <ul>
                    {this.state.userlist.map((user) => {
                        return <li>{user.name}<Tag color={UserState.toColor(user.state)}>
                        {UserState.toString(user.state)}
                    </Tag></li>
                    })}
                </ul>
            </div>
        )
    }
}

export default UserList;
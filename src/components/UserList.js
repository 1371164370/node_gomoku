import { Tag,Button,Card,List } from "antd";
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
            <Card title={'在线用户'}>
                {this.state.userlist.map((user) =>(
                <div>
                    <Tag color={UserState.toColor(user.state)}>
                {UserState.toString(user.state)}</Tag>{user.name}
                </div>))}
            </Card>
            
        )
    }
}

export default UserList;
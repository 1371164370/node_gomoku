import React from 'react';
import { Input, Button, Divider } from 'antd';
import { Message } from '../utils'
import { Layout } from 'antd';
import './ChatRoom.css'

const { TextArea } = Input;
const { Header, Footer, Content } = Layout;


class ChatRoom extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            msglist: [],
            curinput: ""
        }

        this.handleInputChange = this.handleInputChange.bind(this);
        this.sendMsg = this.sendMsg.bind(this);
    }
    componentDidMount() {
        this.props.socket.on('receive_msg', (msg) => {
            msg.type = Message.OTHER;
            this.addMsg(msg);
        })
    }
    addMsg(msg) {
        this.setState((preState) => {
            preState.msglist.push(msg);
            return {
                msglist: preState.msglist
            };
        })
    }
    handleInputChange(e) {
        this.setState({
            curinput: e.target.value
        })
    }
    componentWillUnmount() {
        this.props.socket.off('receive_msg');
    }
    sendMsg() {
        const msg = new Message(this.props.username, this.state.curinput)
        this.props.socket.emit('send_msg', msg);
        msg.type = Message.SELF;
        this.addMsg(msg);
    }
    render() {


        return (
            <Layout>
                <h1>ChatRoom</h1>
                <section className="msg-box noscroll" onScroll={db_scrollFadeout}>
                    {this.state.msglist.map(msg => {
                        return (
                            <OneMessage msg={msg} />
                        )
                    })}
                </section>
                <Footer>
                    <form onSubmit={(e) => { e.preventDefault(); return false; }}>
                        <label>
                            <input onChange={this.handleInputChange} />
                        </label>
                        <Button type="primary" htmlType="submit" onClick={this.sendMsg}>发送</Button>

                    </form>
                </Footer>
            </Layout>
        )
    }
}

function OneMessage(props) {
    let classname = "self-msg";
    if (props.msg.type == Message.OTHER) {
        classname = "other-msg";
    }
    return (
        <div className={classname}>
            <h4>{props.msg.name}</h4>
            <div>{props.msg.text}</div>
        </div>
    )
}
function debounce(ms){
    let timer;
    return function(e){
        if(timer){
            clearTimeout(timer)
        }
        e.target.setAttribute('class','msg-box');
        timer = setTimeout(()=>{
            e.target.setAttribute('class','msg-box noscroll');
        },ms)
    }
}
const db_scrollFadeout=debounce(1000);
export default ChatRoom;
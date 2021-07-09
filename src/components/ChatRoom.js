import React from 'react';
import { Input, Button, Divider, message } from 'antd';
import { Message } from '../utils'
import { Layout } from 'antd';
import Form from './Form'
import './ChatRoom.css'

const { TextArea } = Input;
const { Header, Footer, Content } = Layout;


class ChatRoom extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            msglist: [],
        }

        this.scrollContainer=React.createRef();
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
    componentWillUnmount() {
        this.props.socket.off('receive_msg');
    }
    sendMsg(curInput) {
        const msg = new Message(this.props.username,curInput)
        this.props.socket.emit('send_msg', msg);
        msg.type = Message.SELF;
        this.addMsg(msg);
    }
    getSnapshotBeforeUpdate(){
        const curNode=this.scrollContainer.current;
        // message.info(curNode.scrollTop,curNode.scrollHeight,curNode.clientHeight);
        return curNode.scrollTop>=curNode.scrollHeight-curNode.clientHeight-5
        && curNode.scrollTop<=curNode.scrollHeight-curNode.clientHeight+5;
    }
    componentDidUpdate(nextProps,nextState,atBottom){
        const curNode=this.scrollContainer.current;
        if(atBottom){
            curNode.scrollTop=curNode.scrollHeight-curNode.clientHeight
        }else{
            message.info(`新消息`);
        }
    }
    render() {


        return (
            <Layout>
                <section className="msg-box noscroll" onScroll={db_scrollFadeout} ref={this.scrollContainer}>
                    {this.state.msglist.map(msg => {
                        return (
                            <OneMessage msg={msg} />
                        )
                    })}
                </section>
                <Footer style={{backgroundColor:'GrayText'}}>
                    <Form  btnText={'发送'} sendMsg={this.sendMsg}/>
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
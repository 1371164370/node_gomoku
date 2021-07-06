import Board from "./components/Board";
import ChatRoom from "./components/ChatRoom";
import LogBar from "./components/LogBar";
import UserList from "./components/UserList";
import React from "react";
import ReactDOM from "react-dom"
import { UserState, LoginInfo, Player } from "./utils"
import { Layout, Button, Tag, message ,Tabs} from "antd"
import './app.css';

const {TabPane} = Tabs;
const { Header, Content, Sider } = Layout;


class App extends React.Component {
    constructor(props) {
        super(props);

        this.socket = null;//TODO:handle error
        this.state = {
            userstate: UserState.OFFLINE
        };
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.createSocket = this.createSocket.bind(this);
        this.startMatch = this.startMatch.bind(this);
        this.cancelMatch = this.cancelMatch.bind(this);
        this.endGame = this.endGame.bind(this);
    }
    handleLogin(username) {
        this.createSocket();
        this.socket.emit('login', new LoginInfo(username), (userinfo) => {
            this.setState(
                userinfo
            )
        });
        this.handleUserstateChange();
    }
    handleUserstateChange() {
        this.socket.on('selfstate_change', (userstate) => {
            this.setState({
                userstate
            })
        })
    }
    startMatch() {
        this.socket.emit('quick_match');

        this.socket.on('begin_game', (enemy) => {
            this.setState({
                enemy
            })
        })
        this.socket.on('end_game', (name) => {
            this.setState({
                enemy: null
            })
            this.socket.off('end_game');
            message.info(`${name} has leaved`);
        })
    }
    endGame() {
        this.socket.emit('end_game');
        this.setState({
            enemy: null
        })
        this.socket.off('being_game')
    }
    cancelMatch() {
        this.socket.emit('cancel_pending');
    }
    createSocket() {
        this.socket = io(); // connect to server
        this.socket.on('connect_error', () => {
            message.error('failed to connect to server');
            this.socket = null;
        });
    }
    handleLogout() {
        this.socket.disconnect();
        this.socket = null;
        this.setState({
            userstate: UserState.OFFLINE,
            enemy: null
        })
    }
    render() {
        const userstate = this.state.userstate;
        const isLogin = (userstate != UserState.OFFLINE);
        console.log('isLogin', isLogin);
        const isNotMatching = (userstate != UserState.PENDING);
        const isNotGaming = (userstate != UserState.GAMING);
        return (
            <Layout >
                <Header style={{
                    justifyContent: "space-around",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: ""
                }}>
                    <Tag color={UserState.toColor(userstate)}>
                        {UserState.toString(userstate)}
                    </Tag>
                    {isLogin && isNotGaming && 
                        (<Button onClick={isNotMatching ? this.startMatch : this.cancelMatch}>{isNotMatching ? '开始匹配' : '取消匹配'}</Button>)}
                    <LogBar handleLogin={this.handleLogin} userstate={this.state.userstate}
                        handleLogout={this.handleLogout} />
                </Header>

                <Layout>
                    <Sider breakpoint={"sm"} style={{backgroundColor:"aliceblue"}}>
                        {isLogin && <UserList socket={this.socket} />}

                    </Sider>
                    <Content>
                        <Tabs>
                            <TabPane tab={"Chat Room"} key="1">{isLogin && <ChatRoom username={this.state.username} socket={this.socket} />}</TabPane>
                            <TabPane tab={"Game Room"} key="2">{this.state.enemy &&
                            <section>
                                <div>{this.state.username} vs {this.state.enemy.name}</div>
                                <Board cols_num="10" rows_num="10" square_size="30" enemy={this.state.enemy} socket={this.socket} endGame={this.endGame} />

                            </section>}</TabPane>
                        </Tabs>
                    
                    </Content>

                </Layout>
            </Layout>
        )
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('#root')
)
const Koa = require("koa");
const staticFiles = require("koa-static");
const IO = require("koa-socket-2");
const path = require("path");


const app = new Koa();
const io = new IO();

app.use(staticFiles(path.resolve(__dirname, "public")))

io.attach(app);

app.io.on('connection', (socket) => {
    console.log('player connected');
    socket.on('login', (info, fn) => {
        // player is ready to join a match

        const player = new Player(socket, info.name)
        fn({ username: player.name, userstate: player.state });
        player.proxy = new Proxy(player, {
            set: function (obj, prop, value) {
                obj[prop] = value;
                if (prop === 'state') {
                    console.log(`userstate change to ${value}`, obj.name);
                    broadcastUserListChange(obj);
                }
                return true;
            }
        });
        all_players.push(player);
        player.proxy.state = UserState.ONLINE;
        console.log('player ' + info.name + ' login');

    });
});



app.listen(3000, () => {
    console.log('server start at port 3000');
});

class EnemyInfo {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}

class UserState {
    static OFFLINE = 0;
    static ONLINE = 1;
    static PENDING = 2;
    static GAMING = 3;
    static toString(usertate) {
        const stateMap = new Map([
            [UserState.OFFLINE, 'offline'],
            [UserState.ONLINE, 'online'],
            [UserState.PENDING, 'pending'],
            [UserState.GAMING, 'gaming'],
        ])

        return stateMap.get(usertate);
    }
}
class Color {
    static oppositeColor(color) {
        return color == Color.WHITE ? Color.BLACK : Color.WHITE;
    }
    static EMPTY = 0;
    static WHITE = 1;
    static BLACK = 2;
    static toString(color) {
        const colorMap = new Map([
            [Color.EMPTY, 0],
            [Color.WHITE, 'white'],
            [Color.BLACK, 'black']
        ])
        return colorMap.get(color);
    }
}
function getAllPlayerInfo() {
    return all_players.map((player) => {
        return {
            name: player.name,
            state: player.state,
        }
    })
}
function broadcastUserListChange(player) {
    const all_playerintro = getAllPlayerInfo();
    console.log(`broadcast`, all_playerintro);
    player.socket.broadcast.emit('userlist_change', all_playerintro);
    player.socket.emit('userlist_change', all_playerintro);
    player.socket.emit('selfstate_change', player.state);
}

var g_pending_players = [];
var all_players = [];

class Match {
    constructor(player0, player1) {
        this.players = [player0, player1];
        player0.match = this;
        player1.match = this;
        player0.proxy.state = UserState.GAMING;
        player1.proxy.state = UserState.GAMING;
        player0.color = Color.BLACK;
        player1.color = Color.WHITE;

        console.log(player0.name + ' vs ' + player1.name);

        this.players[0].socket.emit('begin_game', new EnemyInfo(player1.name, player1.color));
        this.players[1].socket.emit('begin_game', new EnemyInfo(player0.name, player0.color));

        this.players[0].addEvent('step', (info) => {
            this.handle_step(this.players[0], info);
        });
        this.players[1].addEvent('step', (info) => {
            this.handle_step(this.players[1], info);
        });

        this.players[0].addEvent('end_game', () => {
            this.handle_end(this.players[0]);
        })
        this.players[1].addEvent('end_game', () => {
            this.handle_end(this.players[1]);
        })
    }
    handle_step(player,info) {
        // forward info to another player
        console.log(player.name + ' step(' + info.x + ', ' + info.y + ')');
        const other_player = this.players.find(p=>p!=player);
        other_player.socket.emit('step', info);
    }
    handle_end(player) {
        // forward info to another player
        player.proxy.state = UserState.ONLINE;
        player.match=null;
        console.log(player.name, 'end_game');
        player.removeEvent('step');
        const other_player = this.players.find(p=>p!=player);
        other_player.proxy.state = UserState.ONLINE;
        other_player.socket.emit('end_game', player.name);
        other_player.match=null;
        other_player.removeEvent('step');
    }
}

class Player {
    constructor(socket, name) {
        this.socket = socket;
        this.name = name;
        this.color = null;
        this.state = UserState.ONLINE;
        this.eventMap=new Map();
        this.match = null;

        const qm_fn=() => {
            this.proxy.state = UserState.PENDING;
            if (g_pending_players.length >= 1) {
                // join the match
                const other = g_pending_players.pop();
                console.log(`${other.name} succeed in matching`)
                console.log(`${this.name} succeed in matching`)
                new Match(other, this);
            } else {
                // wait other players
                console.log(`${this.name} is matching`);
                g_pending_players.push(this);
            }
        }
        this.addEvent('quick_match',qm_fn);
        this.socket.on('disconnect', () => {

            let idx = all_players.indexOf(this);
            all_players.splice(idx, 1);
            broadcastUserListChange(this);
            console.log(`player ${this.name} disconnected (${UserState.toString(this.proxy.state)})`)
            if (this.proxy.state == UserState.GAMING) {
                this.match.handle_end(this);
            } else if (this.proxy.state == UserState.PENDING) {
                // remove from pending list
                g_pending_players = g_pending_players.filter((v) => {
                    return v != this;
                });
            }
        });
        this.socket.on('cancel_pending', () => {
            g_pending_players.splice(g_pending_players.indexOf(this), 1);
            this.proxy.state = UserState.ONLINE;
        })
        this.socket.on('send_msg', (msg) => {
            this.socket.broadcast.emit('receive_msg', msg);
        })
    }
    addEvent(event,fn){
        this.eventMap.set(event,fn);
        this.socket.on(event,fn);
    }
    removeEvent(event){
        const fn =this.eventMap.get(event);
        this.socket.off(event,fn);
    }
}
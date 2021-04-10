class LoginInfo {
    constructor(name) {
        this.name = name;
    }
}

class MatchInfo {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}

class StepInfo {
    constructor(x, y, win) {
        this.x = x;
        this.y = y;
        this.win = win;
    }
}

class Color {};
Color.BLACK = 0;
Color.WHITE = 1;

class PlayerState {};
PlayerState.CONNECTED = 0;
PlayerState.PENDING = 1;
PlayerState.PLAYING = 2;

var g_pending_players = [];

class Match {
    constructor(player0, player1) {
        this.players = [player0, player1];
        player0.match = this;
        player1.match = this;
        player0.state = PlayerState.PLAYING;
        player1.state = PlayerState.PLAYING;
        player0.color = Color.BLACK;
        player1.color = Color.WHITE;

        console.log(player0.name + ' vs ' + player1.name);

        this.players[0].socket.emit('begin_match', new MatchInfo(player1.name, player1.color));
        this.players[1].socket.emit('begin_match', new MatchInfo(player0.name, player0.color));

        this.players[0].socket.on('step', (info) => {
            this.handle_step(0, info);
        });
        this.players[1].socket.on('step', (info) => {
            this.handle_step(1, info);
        });
    }

    handle_step(idx, info) {
        // forward info to another player
        var player = this.players[0];
        console.log(player.name + ' step(' + info.x + ', ' + info.y + ', ' + info.win + ')');
        var other_player = this.players[(idx + 1) % 2];
        other_player.socket.emit('step', info);
    }

    player_disconnect(player) {
        this.players = this.players.filter((v) => {
            return v != player;
        });
        if (this.players.length == 0) {
            console.log('match finished');
        }
    }
}

class Player {
    constructor(socket, name) {
        this.socket = socket;
        this.name = name;
        this.color = null;
        this.state = PlayerState.CONNECTED;
        this.match = null;

        this.socket.on('disconnect', () => {
            if (this.state == PlayerState.PLAYING) {
                console.log('player ' + this.name + ' disconnected (PLAYING)');
                this.match.player_disconnect(this);
                this.match = null;
            } else if (this.state == PlayerState.PENDING) {
                // remove from pending list
                console.log('player ' + this.name + ' disconnected (PENDING)');
                g_pending_players = g_pending_players.filter((v) => {
                    return v != this;
                });
            }
        });
    }
}

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static('web'));

io.on('connection', (socket) => {
    console.log('player connected');
    socket.on('login', (info) => {
        // player is ready to join a match
        var player = new Player(socket, info.name);
        player.state = PlayerState.CONNECTED;
        console.log('player ' + info.name + ' login');
        if (g_pending_players.length >= 1) {
            // join the match
            other = g_pending_players.pop();
            new Match(other, player);
        } else {
            // wait other players
            player.state = PlayerState.PENDING;
            g_pending_players.push(player);
        }
    });
});

server.listen(3000, () => {
    console.log('server start at port 3000');
});
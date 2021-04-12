//登录时C→S发送的信息
class LoginInfo {
    constructor(name) {
        this.name = name;
    }
}
//登录后S→C发送的匹配到的对手信息和对手棋色，黑子先行
class MatchInfo {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}
//每次落子的位置及落子方是否胜利
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
Color.EMPTY = 2;
Color.opposite = function (color) {
    if (color == this.BLACK)
        return this.WHITE;
    else if (color == this.WHITE)
        return this.BLACK;
    else
        return null;
}

class PlayerState {};
PlayerState.CONNECTED = 0;
PlayerState.PENDING = 1;
PlayerState.PLAYING = 2;

class Player {};
Player.REMOTE = 0;
Player.LOCAL = 1;

class Board {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.pieces = new Array(w * h);
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i] = Color.EMPTY;
        };
    }

    get_piece(x, y) {
        return this.pieces[y * this.w + x];
    }

    set_piece(x, y, color, check) {
        this.pieces[y * this.w + x] = color;
        if (!check) {
            return false;
        }

        let count = 1;
        // 判断竖排是否有5个了
        if (count < 5) {
            let cy = y - 1;
            while (cy > y - 5 && cy >= 0) {
                if (this.get_piece(x, cy) != color) {
                    break;
                }
                count++;
                cy--;
            }
            cy = y + 1;
            while (cy < y + 5 && cy < this.h) {
                if (this.get_piece(x, cy) != color) {
                    break;
                }
                count++;
                cy++;
            }
        }

        // 判断横排是否有5个了
        if (count < 5) {
            count = 1;
            let cx = x - 1;
            while (cx > x - 5 && cx >= 0) {
                if (this.get_piece(cx, y) != color) {
                    break;
                }
                count++;
                cx--;
            }
            cx = x + 1;
            while (cx < x + 5 && cx < this.w) {
                if (this.get_piece(cx, y) != color) {
                    break;
                }
                count++;
                cx++;
            }
        }

        //判断左边的斜排
        if (count < 5) {
            count = 1;
            let cx = x - 1;
            let cy = y - 1
            while (cx > x - 5 && cx >= 0 && cy > y - 5 && cy >= 0) {
                if (this.get_piece(cx, cy) != color) {
                    break;
                }
                count++;
                cx--;
                cy--;
            }
            cx = x + 1;
            cy = y + 1;
            while (cx < x + 5 && cx < this.w && cy < y + 5 && cy < this.h) {
                if (this.get_piece(cx, cy) != color) {
                    break;
                }
                count++;
                cx++;
                cy++;
            }
        }

        //判断右边的斜排
        if (count < 5) {
            count = 1;
            let cx = x + 1;
            let cy = y - 1
            while (cx < x + 5 && cx < this.w && cy > y - 5 && cy >= 0) {
                if (this.get_piece(cx, cy) != color) {
                    break;
                }
                count++;
                cx++;
                cy--;
            }
            cx = x - 1;
            cy = y + 1;
            while (cx > x - 5 && cx >= 0 && cy < y + 5 && cy < this.h) {
                if (this.get_piece(cx, cy) != color) {
                    break;
                }
                count++;
                cx--;
                cy++;
            }
        }

        return count >= 5;
    }
}

function end_game(win) {
    setTimeout(() => {
        confirm(`you ${win ? 'win':'lose'}!`);
        location.reload();
    }, 10);
}

// global variable
let socket = null;
let color = null; // local player color
let board = null;
let is_your_turn = true;
let colorSet = {
    2: "blank",
    1: "white",
    0: "black"
}



// init board
function init_gamer_info(self_name,opp_name){
    $(".game-info").text(`${self_name} vs ${opp_name}`);
}
function init_board(board) {
    let gameBoard = $("div.game-section").empty();
    let container = $("<div class='container'>").width(board.w * 30).height(board.h * 30);
    for (let i = 0; i < board.h; i++) {
        for (let j = 0; j < board.w; j++) {
            let c = board.get_piece(i, j);
            let qizi = $(`<div class='${colorSet[c]} grid'>`);
            container.append(qizi);
        }
    }

    gameBoard.append(container);
    $("div.grid").on("click", function () {
        console.log('board clicked');
        if (!is_your_turn) {
            return false;
        }
        let index = $(this).index();

        let y = parseInt(index / board.w);
        let x = index % board.w;

        console.log(`${x}, ${y}`);
        if (board.get_piece(x, y) != Color.EMPTY)
            return;

        let win = updateBoard(x, y);
        socket.emit('step', new StepInfo(x, y, win));

        if (is_your_turn && win) {
            end_game(true);
        }
        is_your_turn = false;
    })
    return container;
}

function updateBoard(x, y) {
    console.log('is your turn: ' + is_your_turn);
    if (!is_your_turn) {
        board.set_piece(x, y, Color.opposite(color), false);
        $("div.grid").eq(x + y * board.w).attr("class", `${colorSet[Color.opposite(color)]} grid`);
        return false;
    }

    let win = board.set_piece(x, y, color, true);
    $("div.grid").eq(x + y * board.w).attr("class", `${colorSet[color]} grid`);
    return win;
}

// connect to server

window.onload = function () {
    socket = io(); // connect to server
    socket.on('connect_error', () => {
        alert('failed to connect to server');
        socket = null;
    });

    let obtnSave = document.getElementById("btnSave");
    let oUserName = document.getElementById("userName");
    let oLayer = document.getElementById("layer");
    // shotcut
    oUserName.onkeyup = function (ev) {
        let oEv = ev || window.event;
        if (oEv.keyCode == 13) {
            obtnSave.onclick();
        }
    }

    obtnSave.onclick = function () {
        let sname = oUserName.value.trim();
        if (sname.length < 1) {
            alert("Please input player name");
            oUserName.focus();
            return false;
        }

        if (socket) {
            socket.emit('login', new LoginInfo(sname));
            let waitting_str="";
            setInterval(()=>{
                waitting_str+=".";
                if(waitting_str=="....."){
                    waitting_str="";
                }
                $("div.remind-info").text(`${sname}登录成功，正在匹配${waitting_str}`)
            },500)
            
            // login success
            socket.on('begin_match', function (data) {
                color = Color.opposite(data.color);
                let is_black = color == Color.BLACK;
                alert(is_black ? "你持黑子" : "你持白子");
                is_your_turn = is_black;

                board = new Board(15, 15);
                oLayer.style.display = 'none';
                init_board(board);
                init_gamer_info(sname,data.name);
            });

            socket.on("step", function (data) {
                updateBoard(data.x, data.y);
                if (data.win) {
                    end_game(false);
                }
                is_your_turn = true;
            });
        }
    };

}
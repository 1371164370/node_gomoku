import React from "react";
import { Color, UserState } from "../utils"
import { Button, Space, Tag } from 'antd';


class Board extends React.Component {
    constructor(props) {
        super(props);
        const squares = Array(parseInt(this.props.cols_num));
        for (let i = 0; i < squares.length; i++) {
            squares[i] = Array(parseInt(this.props.rows_num)).fill(Color.EMPTY);
        }
        this.state = {
            squares,
            turn: Color.BLACK,
            yourcolor: Color.oppositeColor(this.props.enemy.color)
        };
        this.handleSquareClick = this.handleSquareClick.bind(this);

    }
    resetBoard() {
        this.setState(() => {
            const squares = Array(parseInt(this.props.cols_num));
            for (let i = 0; i < squares.length; i++) {
                squares[i] = Array(parseInt(this.props.rows_num)).fill(Color.EMPTY);
            };
            return {
                squares,
                turn: Color.BLACK,
            };
        })
    }
    /**
     *   ______y_______->
     *  |
     *  |
     * x|
     *  |
     *  |
     */
    index2xy(index) {
        const cols = this.props.cols_num;
        const [x, y] = [parseInt(index / cols), index % cols];
        console.log('x,y', x, y);
        return [x, y];
    }
    isLegal(x, y) {
        if (this.state.squares[x][y] || this.isOutOfBound(x, y)) {
            return false;
        }
        return true;
    }
    isOutOfBound(x, y) {
        if (x < 0 || y < 0 || x >= this.props.rows_num || y >= this.props.cols_num) {
            return true;
        }
        return false;
    }
    placePiece(x, y) {
        let color = this.state.turn;

        this.setState(preState => {
            preState.squares[x][y] = preState.turn;
            console.log('preState', preState.squares);
            return {
                squares: preState.squares,
                turn: Color.oppositeColor(preState.turn)
            }
        });
        console.log('was placed', this.state.squares, x, y);
        if (this.isWin(x, y, color)) {
            this.resetBoard();
            setTimeout(_ => alert(`${Color.toString(color)} win!`), 100);
        };
    }
    scanInLine(x, y, color, pos_dir) {
        const neg_dir = [-pos_dir[0], -pos_dir[1]];
        let count = 1;
        const squares = this.state.squares;
        for (let i = 1; i < 5; i++) {
            let [cur_x, cur_y] = [x + neg_dir[0] * i, y + neg_dir[1] * i];
            if ((!this.isOutOfBound(cur_x, cur_y)) && squares[cur_x][cur_y] == color) {
                count++;
            } else {
                break;
            }
        }
        for (let i = 1; i < 5; i++) {
            let [cur_x, cur_y] = [x + pos_dir[0] * i, y + pos_dir[1] * i];
            if ((!this.isOutOfBound(cur_x, cur_y)) && squares[cur_x][cur_y] == color) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }
    isWin(x, y, color) {
        //up clockwise
        const dir = [[-1, 0], [-1, 1], [0, 1], [1, 1]];
        let max_count = 0;
        for (let i = 0; i < dir.length; i++) {
            let count = this.scanInLine(x, y, color, dir[i]);
            max_count = Math.max(max_count, count);
        }
        console.log('count', max_count);
        if (max_count >= 5) {
            return true;
        }
        return false;
    }
    componentDidMount() {
        const fn=(step) => {
            console.log(`start listen enemy step`);
            if (step) {
                this.placePiece(step.x, step.y);
            }
        };
        this.props.socket.on('step',fn )
    }
    handleSquareClick(index) {
        if (this.state.yourcolor != this.state.turn) {
            alert("its not your turn");
            return;
        }
        const [x, y] = this.index2xy(index);
        console.log('before place', this.state.squares, x, y);
        let color = null;
        if (this.isLegal(x, y)) {
            if (this.props.socket) {
                console.log('emit',x,y)
                this.props.socket.emit('step', { x, y, id: Symbol() });
            }
            this.placePiece(x, y);
            console.log('after place', this.state.squares);
        } else {
            alert('illegal place');
        }
    }
    componentWillUnmount(){
        this.props.socket.off('step');
    }
    render() {
        const squares = this.state.squares.flat();
        console.log('render squares', squares);
        const boardItems = squares.map((e, index) =>
            <Square color={e} key={index} index={index} handleSquareClick={this.handleSquareClick} />)
        const style = {
            display: 'grid',
            gridTemplateColumns: `repeat(${this.props.cols_num}, ${this.props.square_size}px`,
            gridTemplateRows: `repeat(${this.props.rows_num}, ${this.props.square_size}px)`
        }
        return (
            <div>
                Next turn:{Color.toString(this.state.turn)} | Your piece color:{Color.toString(this.state.yourcolor)}
                <div className="board" style={style}>
                    {boardItems}
                </div>
                <div>
                    <Button onClick={this.props.endGame}>退出</Button>
                </div>
            </div>
        )
    }
}
class Square extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }
    handleClick(e) {
        console.log('was clicked', e.target.attributes.index.value);
        this.props.handleSquareClick(e.target.attributes.index.value);
    }
    render() {
        const color = Color.toString(this.props.color);
        return (
            <button className={"square " + (color != 0 ? color : '')}
                index={this.props.index} onClick={this.handleClick}>
            </button>
        )
    }
}
export default Board;
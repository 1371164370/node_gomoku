class LoginInfo {
    constructor(name) {
        this.name = name;
    }
}
class UserState{
    static OFFLINE=0;
    static ONLINE=1;
    static PENDING=2;
    static GAMING=3;
    static toString(usertate){
        const stateMap=new Map([
            [UserState.OFFLINE,'offline'],
            [UserState.ONLINE,'online'],
            [UserState.PENDING,'pending'],
            [UserState.GAMING,'gaming'],
        ])

        return stateMap.get(usertate);
    }
    static toColor(usertate){
        const stateMap=new Map([
            [UserState.OFFLINE,'gray'],
            [UserState.ONLINE,'green'],
            [UserState.PENDING,'yellow'],
            [UserState.GAMING,'blue'],
        ])

        return stateMap.get(usertate);
    }
}
class Message{
    constructor(name,text){
        this.name=name;
        this.text=text;
    }
    static OTHER=0;
    static SELF=1;
}
class Color {
    static oppositeColor(color) {
        return color == Color.WHITE ? Color.BLACK :Color.WHITE;
    }
    static EMPTY=0;
    static WHITE=1;
    static BLACK=2;
    static toString(color){
        const colorMap=new Map([
            [Color.EMPTY,0],
            [Color.WHITE,'white'],
            [Color.BLACK,'black']   
        ])
        return colorMap.get(color);
    }
}
class BoardState{
    static REMOTE=1;
    static LOCAL=0;
}
class Player{
    constructor(name,color){
        this.name=name;
        this.color=color;
    }
}

export {UserState,Color,Player,LoginInfo,Message};
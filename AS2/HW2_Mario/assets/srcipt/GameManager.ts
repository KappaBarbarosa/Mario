import StartManager from "./StartManager";

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export class GameManager extends cc.Component {
    @property(cc.AudioClip)
    Gamebgm: cc.AudioClip = null;
    @property(cc.AudioClip)
    WinMusic: cc.AudioClip = null;
    @property(cc.AudioClip)
    Losebgm: cc.AudioClip = null;
    Score: cc.Node = null;
    Coin: cc.Node = null;
    Life: cc.Node = null;
    SLife: cc.Node = null;
    World: cc.Node = null;
    Time: cc.Node = null;
    isWin: boolean = false;
    wincount: number = 0;
    Duration: number = 200;
    RemainTime: number = 0;
    TimeInterval: number = 1;
    TotalCoin: number = 0;
    TotalScore: number = 0;
    TotalLife: number = 3;
    isBig: boolean = false;
    isReload: boolean = false;
    DieForTimeUp: number = 0;
    CurWorld: string;
    Player: cc.Node = null;
    SecondPlayer: cc.Node = null;
    MultiData = {
        active: false,
        isControl: false,
        Path: "",
        Fdie: false,
        Sdie: false
    }
    CurRoomData: any;
    startTimer() {
        this.RemainTime = this.Duration;
        this.schedule(this.updateTimer, this.TimeInterval, this.RemainTime, 0);
    }
    updateTimer() {
        this.RemainTime -= this.TimeInterval;
        this.Time.getComponent(cc.Label).string = this.RemainTime.toString().padStart(3, "0");
        if (this.isWin) this.updateScore(100);
        if (this.RemainTime <= 0) {
            this.stopTimer("Timeup");
        }
    }
    updateCoin(addCoin: number) {
        if (this.MultiData.active) {
            if (this.CurRoomData.Coin == 99) this.updateLife(1), this.updateSlife(1), this.CurRoomData.Coin = 0;
            else this.CurRoomData.Coin += addCoin;
            this.Coin.getComponent(cc.Label).string = "x" + this.CurRoomData.Coin.toString().padStart(2, "0");
        } else {
            if (this.TotalCoin == 99) this.updateLife(1), this.TotalCoin = 0;
            else this.TotalCoin += addCoin;
            this.Coin.getComponent(cc.Label).string = "x" + this.TotalCoin.toString().padStart(2, "0");
        }

    }
    updateScore(addScore: number) {
        if (this.MultiData.active) {
            this.CurRoomData.Score = this.CurRoomData.Score + addScore > 9999999 ? 9999999 : this.CurRoomData.Score + addScore;
            this.Score.getComponent(cc.Label).string = this.CurRoomData.Score.toString().padStart(7, "0");
        } else {
            this.TotalScore = this.TotalScore + addScore > 9999999 ? 9999999 : this.TotalScore + addScore;
            this.Score.getComponent(cc.Label).string = this.TotalScore.toString().padStart(7, "0");
        }
    }
    updateLife(addLife: number) {
        if (this.MultiData.active) {
            if (this.CurRoomData.FP.Life < 99) {
                this.CurRoomData.FP.Life = this.CurRoomData.FP.Life + addLife > 99 ? 99 : this.CurRoomData.FP.Life + addLife;
                this.Life.getComponent(cc.Label).string = "x" + this.CurRoomData.FP.Life.toString().padStart(2, "0");;
            }
        } else {
            if (this.TotalLife < 99) {
                this.TotalLife = this.TotalLife + addLife > 99 ? 99 : this.TotalLife + addLife;
                this.Life.getComponent(cc.Label).string = "x" + this.TotalLife.toString().padStart(2, "0");;
            }
        }


    }
    updateSlife(addLife: number) {
        if (this.CurRoomData.SP.Life < 99) {
            this.CurRoomData.SP.Life = this.CurRoomData.SP.Life + addLife > 99 ? 99 : this.CurRoomData.SP.Life + addLife;
            this.SLife.getComponent(cc.Label).string = "x" + this.CurRoomData.SP.Life.toString().padStart(2, "0");;
        }
    }
    stopTimer(Reason: string) {
        if (this.MultiData.isControl || !this.MultiData.active) {
            this.unschedule(this.updateTimer);
            if (Reason == "Timeup" ) {
                if (this.Player != null)
                    this.Player.getComponent("player").Die("TimeUp");
                if (this.SecondPlayer != null)
                    this.SecondPlayer.getComponent("player").Die("TimeUP");
            }
        }
    }
    Victory() {
        this.stopBgm();
        this.isWin = true;
        this.stopTimer("win");
        this.schedule(this.updateTimer, 0.01, this.RemainTime, 0);
        this.scheduleOnce(() => {
            var GameMsg = {
                Score: this.TotalScore,
                Coin: this.TotalCoin,
                World: this.CurWorld,
                Life: this.TotalLife,
                isBig: this.Player.getComponent("player").isbig
            }
            cc.director.loadScene('LevelSelect');
            var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
            SSMgr.Reason = "Win";
            SSMgr.Msg = GameMsg;
        }, 5)
        cc.audioEngine.playEffect(this.WinMusic, false);
    }
    MultiVictory(isf: boolean) {
        if (this.wincount == 1 || isf && this.CurRoomData.SP.Life == 0 || !isf && this.CurRoomData.FP.Life == 0) {
            this.stopBgm();
            this.isWin = true;
            this.CurRoomData.ClearFirstStage = true;
            cc.audioEngine.playEffect(this.WinMusic, false);
            if (this.MultiData.isControl) {
                this.stopTimer("win");
                this.schedule(this.updateTimer, 0.01, this.RemainTime, 0);
            } else this.schedule(this.updateTimer, 0.01, this.RemainTime, 0);
            this.scheduleOnce(() => {
                if (this.CurRoomData.FP.Life == 0) this.CurRoomData.FP.Life = 1;
                if (this.CurRoomData.SP.Life == 0) this.CurRoomData.SP.Life = 1;
                cc.director.loadScene('LevelSelect');
                var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
                SSMgr.Reason = this.CurWorld;
                SSMgr.Msg = this.CurRoomData;
            }, 5)
        } else this.wincount++;

    }
    onLoad(): void {

        cc.game.addPersistRootNode(this.node);
    }
    UpdatePlayerStatus(UserData, level: string) {
        this.TotalCoin = UserData.Coin;
        this.TotalLife = UserData.Life;
        this.TotalScore = UserData.Score
        this.CurWorld = level;
        this.isBig = UserData.isBig;
    }
    UpdateRoomStatus(RoomData, level: string, IsControl: boolean) {
        this.CurWorld = level;
        this.MultiData.active = true;
        this.MultiData.isControl = IsControl;
        this.MultiData.Path = "MultiGame/Room/" + RoomData.Email + "/Game/GameManager";
        this.CurRoomData = RoomData;
    }
    Reload() {
        if (this.isReload && this.MultiData.active) {
            this.isReload = false;
            return;
        }
        this.isReload = true;
        this.DieForTimeUp = 0;
        var MC = cc.find("Canvas/Main Camera");
        this.Time = MC.getChildByName("Time");
        this.Score = MC.getChildByName("Score");
        this.Coin = MC.getChildByName("Coin");
        this.World = MC.getChildByName("World");
        this.World.getComponent(cc.Label).string = "World:" + this.CurWorld;
        this.Life = MC.getChildByName("Life");
        this.wincount = 0;
        this.Player = cc.find("Canvas/GAME/player")
        if (this.MultiData.active) {
            this.Player.getComponentInChildren(cc.Label).string = this.CurRoomData.FP.Nickname;
            this.Player.getComponent("player").Able(true, this.MultiData.isControl);
            this.SecondPlayer = cc.find("Canvas/GAME/Splayer");
            this.SecondPlayer.active = true;
            this.SecondPlayer.getComponentInChildren(cc.Label).string = this.CurRoomData.SP.Nickname;
            this.SecondPlayer.getComponent("player").Able(false, !this.MultiData.isControl);
            this.SLife = MC.getChildByName("SLife");
            this.SecondPlayer.active = true;
            this.SLife.active = true;
            this.updateSlife(0);
            this.MultiData.Sdie=false;
            this.MultiData.Fdie=false;
            if (!this.MultiData.isControl) //接收主要端的manager資訊
                firebase.database().ref(this.MultiData.Path).on("value", snapshot => {
                    var ComingData = snapshot.val();
                    if (ComingData.Coin != this.CurRoomData.Coin) {
                        this.CurRoomData.Coin = ComingData.Coin;
                        this.Coin.getComponent(cc.Label).string = "x" + ComingData.Coin.toString().padStart(2, "0");
                    }
                    if (ComingData.Score != this.CurRoomData.Score) {
                        this.CurRoomData.Score = ComingData.Score;
                        this.Score.getComponent(cc.Label).string = this.CurRoomData.Score.toString().padStart(7, "0");
                    }
                    if (ComingData.FLife != this.CurRoomData.FP.Life) {
                        this.CurRoomData.FP.Life = ComingData.FLife;
                        this.Life.getComponent(cc.Label).string = "x" + this.CurRoomData.FP.Life.toString().padStart(2, "0");;
                    }
                    if (ComingData.SLife != this.CurRoomData.SP.Life) {
                        this.CurRoomData.SP.Life = ComingData.SLife;
                        this.SLife.getComponent(cc.Label).string = "x" + this.CurRoomData.SP.Life.toString().padStart(2, "0");;
                    }
                    if (ComingData.RTime != this.RemainTime) {
                        this.RemainTime = ComingData.RTime;
                        this.Time.getComponent(cc.Label).string = this.RemainTime.toString().padStart(3, "0");
                    }

                })
        }
        this.updateCoin(0);
        this.updateScore(0);
        this.updateLife(0);

        this.playBGM();
        this.isWin = false;
        if (this.MultiData.isControl || !this.MultiData.active) this.startTimer();
    }
    protected onDestroy(): void {
        firebase.database().ref(this.MultiData.Path).off();
    }
    public CloseConnect(){
        if(this.MultiData.isControl)    this.MultiData.isControl = false;
        else firebase.database().ref(this.MultiData.Path).off();
    }
    GameOverLoad() {
        this.Score = cc.find("Canvas/Score");
        if (this.MultiData.active) this.Score.getComponent(cc.Label).string = this.CurRoomData.Score.toString().padStart(7, "0");
        else this.Score.getComponent(cc.Label).string = this.TotalScore.toString().padStart(7, "0");
        cc.audioEngine.playEffect(this.Losebgm, false);
    }
    stopBgm() {
        cc.audioEngine.stopMusic();
    }
    playBGM() {
        cc.audioEngine.playMusic(this.Gamebgm, true);
    }
    LoseOneLife() { 
        if (this.TotalLife <= 0) {
            cc.find('StartSceneManager').getComponent("StartManager").GameOver();
        }
        else {
            this.updateLife(-1);
            var GameMsg = {
                Score: this.TotalScore,
                Coin: this.TotalCoin,
                World: this.CurWorld,
                Life: this.TotalLife,
                isBig: false
            }
            cc.director.loadScene('LevelSelect');
            var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
            SSMgr.Reason = "Lose";
            SSMgr.Msg = GameMsg;
        }
    }
    MultiLoseLife(isF: boolean) {
        if (this.CurRoomData.FP.Life == 0 && this.CurRoomData.SP.Life == 0) {
            this.stopBgm();
            this.CloseConnect();
            this.stopTimer("lose");
            cc.director.loadScene("GameOver")
        } else {
            if (this.DieForTimeUp > 0) {
                this.updateLife(-1);
                this.updateSlife(-1);
                this.CurRoomData.FP.isBig = this.CurRoomData.SP.isBig = false;
                cc.director.loadScene('LevelSelect');
                var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
                SSMgr.Reason = this.CurWorld;
                SSMgr.Msg = this.CurRoomData;
                return;
            }
            if (isF) {
                if (this.CurRoomData.FP.Life != 0) {
                    this.updateLife(-1);
                    if (this.SecondPlayer.getComponent("player").Diecount == 0) { //復活到玩家2上面
                        this.Player.getComponent("player").anim.play("Idle");
                        this.Player.x = this.SecondPlayer.x;
                        this.Player.y = this.SecondPlayer.y+50;
                        this.Player.getComponent("player").Respawn();
                    } else {
                        this.CurRoomData.FP.isBig = this.CurRoomData.SP.isBig = false;
                        this.stopBgm();
                        cc.director.loadScene('LevelSelect');
                        var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
                        SSMgr.Reason = this.CurWorld;
                        SSMgr.Msg = this.CurRoomData;
                    }
                }
                else this.MultiData.Fdie=true;
            }
            else {
                if (this.CurRoomData.SP.Life != 0) {
                    this.updateSlife(-1);
                    if (this.Player.getComponent("player").Diecount == 0) { //復活到玩家1上面
    
                        this.SecondPlayer.getComponent("player").anim.play("Idle");
                        this.SecondPlayer.x= this.Player.x;
                        this.SecondPlayer.y = this.Player.y+50;
                        this.SecondPlayer.getComponent("player").Respawn(this.Player.x, this.Player.y + 50);
                    } else {
                        this.CurRoomData.FP.isBig = this.CurRoomData.SP.isBig = false;
                        this.stopBgm();
                        cc.director.loadScene('LevelSelect');
                        var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
                        SSMgr.Reason = this.CurWorld;
                        SSMgr.Msg = this.CurRoomData;
                    }
                } else this.MultiData.Sdie=true;
            }

        }
    }
    isAble():boolean{
        return !this.MultiData.active || this.MultiData.isControl;
    }
    protected update(dt: number): void {
        if (this.MultiData.isControl) {
            firebase.database().ref(this.MultiData.Path).set({
                Coin: this.CurRoomData.Coin,
                Score: this.CurRoomData.Score,
                RTime: this.RemainTime,
                FLife: this.CurRoomData.FP.Life,
                SLife: this.CurRoomData.SP.Life,
            });
        }
    }

}

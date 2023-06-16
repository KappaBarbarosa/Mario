import LSMario from "./LSPlayer";

const { ccclass, property } = cc._decorator;
declare const firebase: any;

@ccclass
export default class StartManager extends cc.Component {
    @property(cc.AudioClip)
    StartBGM: cc.AudioClip = null;
    @property(cc.AudioClip)
    PipeEffect: cc.AudioClip = null;

    SSGroup: cc.Node = null;
    LGGroup: cc.Node = null;
    FinalGroup: cc.Node = null;
    ModeGroip: cc.Node = null;
    MultiGroup: cc.Node = null;
    Email: cc.Label = null;
    Password: cc.Label = null;
    Player: cc.Node = null;
    SecondPlayer: cc.Node = null;
    Reason: string = null;
    Msg: any = 0;
    isStart:boolean=false;
    CurUserData: any = null;
    CurRoomData: any = null;
    onLoad(): void {

        cc.game.addPersistRootNode(this.node);
        //this.Reload("start",0);
        this.Reason = "start",
            this.Msg = 0;

    }
    Reload() {
        cc.debug.setDisplayStats(false);
        cc.director.getPhysicsManager().enabled = true;
        cc.audioEngine.playMusic(this.StartBGM, true);
        var Camera = cc.find("Canvas/Main Camera");
        this.SSGroup = Camera.getChildByName("SSGroup");
        this.LGGroup = Camera.getChildByName("LGGroup");
        this.FinalGroup = Camera.getChildByName("FinalGroup");
        this.ModeGroip = Camera.getChildByName("ModeGroup");
        this.MultiGroup = Camera.getChildByName("MultiGroup")
        this.Player = cc.find("Canvas/Main Camera/LS/player");
        this.isStart=false;
        this.Email = this.LGGroup.getChildByName("EmailBox").getComponentInChildren(cc.EditBox).textLabel;
        this.Password = this.LGGroup.getChildByName("PassWordBox").getComponentInChildren(cc.EditBox).textLabel;
        if (this.Reason != "start") {
            this.SSGroup.active = false;
            if (this.Reason == "Again") {
                this.ToNextStage("Again");
            } else {
                if(this.Reason=="1-1" || this.Reason=="1-2"){
                    this.CurRoomData = this.Msg;
                    this.CurRoomData.FP.Life= this.CurRoomData.FP.Life<1?1:this.CurRoomData.FP.Life;
                    this.CurRoomData.SP.Life= this.CurRoomData.SP.Life<1?1:this.CurRoomData.SP.Life;
                    this.MultiPlay(this.CurRoomData, this.Reason,false);
                }else{
                    this.CurUserData.Coin = this.Msg.Coin;
                    this.CurUserData.Life = this.Msg.Life;
                    this.CurUserData.Score = this.Msg.Score;
                    this.CurUserData.isBig = this.Msg.isBig;
                    if (!this.CurUserData.CleadFirstStage)
                        this.CurUserData.CleadFirstStage = this.Reason == "Win";
                    firebase.database().ref("UserData/" + this.CurUserData.Email).set(this.CurUserData, () => { this.ToNextStage(this.Msg.World); })
                }
            }
        }

    }
    GameOver() {
        this.CurUserData.Coin = 0;
        this.CurUserData.Life = 3;
        this.CurUserData.Score = 0;
        this.CurUserData.isBig = false
        this.CurUserData.CleadFirstStage = false;
        firebase.database().ref("UserData/" + this.CurUserData.Email).set(this.CurUserData, () => { cc.director.loadScene("GameOver"); })
    }
    GameStart() {
        this.SSGroup.active = false;
        this.LGGroup.active = true;
    }
    GameBack() {
        if(this.LGGroup.active){
            this.SSGroup.active = true;
            this.LGGroup.active = false;
        } else if(this.ModeGroip.active){
            this.ModeGroip.active=false;
            this.LGGroup.active=true;
        }else if(this.MultiGroup.active){
            this.MultiGroup.active=false;
            this.ModeGroip.active=true;
        }
        
    }
    Login() {
        firebase.auth().signInWithEmailAndPassword(this.Email.string, this.Password.string)
            .then((userCredential) => {
                firebase.database().ref("UserData/" + this.Email.string.replace(".", "c")).once("value", snapshot => {
                    this.CurUserData = snapshot.val();
                    this.LGGroup.active = false;
                    this.ModeGroip.active = true;
                    //this.ToNextStage("LG", snapshot.val())
                })
            })
            .catch(e => alert(e.message));
    }
    Signin() {

        firebase.auth().createUserWithEmailAndPassword(this.Email.string, this.Password.string)
            .then((userCredential) => {
                let Nickname = prompt("請輸入暱稱");
                var NewUserData = {
                    Score: 0,
                    Coin: 0,
                    Life: 3,
                    isBig: false,
                    CleadFirstStage: false,
                    Nickname: Nickname,
                    Email: this.Email.string.replace(".", "c")
                }
                var Path = "UserData/" + this.Email.string.replace(".", "c");
                firebase.database().ref(Path).set(NewUserData, () => {
                    this.CurUserData = NewUserData;
                    this.LGGroup.active = false;
                    this.ModeGroip.active = true;
                    //this.ToNextStage("LG", NewUserData)
                });
            }).catch(e => { alert(e.message); });

    }
    ToMultiStage() {
        this.ModeGroip.active = false;
        this.MultiGroup.active = true;
    }
    CreateMultiGame() {
        firebase.database().ref("MultiGame/Room/" + this.CurUserData.Email).set(this.CurRoomData = {
            isBlank: true,
            ClearFirstStage: true,
            Score: 0,
            Coin: 0,
            FP: {
                Life: 3,
                isBig: false,
                Nickname: this.CurUserData.Nickname
            },
            SP: {
                Life: 3,
                isBig: false,
                Nickname: "摳摳"
            },
            Email: this.CurUserData.Email
        }, () => {
            this.MultiGroup.getChildByName("BTN").active=false;
            this.MultiGroup.getChildByName("WaitingLabel").active=true;
            firebase.database().ref("MultiGame/Room/" + this.CurUserData.Email).on("value",snapshot=>this.MultiPlay(snapshot.val(),"coco",true))
        })
    }
    JoinMultiGame() {
        var Email:string = prompt("請輸入對方Email");
        if(Email!=null){
            var ref = firebase.database().ref("MultiGame/Room/"+Email.replace(".","c"));
            ref.once("value",snapshot=>{
                var RoomData;
                if((RoomData= snapshot.val())!=null){
                    if(RoomData.isBlank==false) alert("該房間已滿")
                    else{
                        RoomData.isBlank=false;
                        RoomData.SP.Nickname = this.CurUserData.Nickname;
                        ref.set(RoomData,()=> this.MultiPlay(RoomData,"coco",false));
                    }
                }else alert("該用戶不存在，或是並無開啟房間");
            })
        }
    }

    MultiPlay(RoomData,World: string,islis:boolean) { //進入多人大廳，創建者(true)跟加入者(false)會呼叫這個函數
        if(RoomData.isBlank) return;
        this.CurRoomData=RoomData;
        if(islis) firebase.database().ref("MultiGame/Room/" + this.CurUserData.Email).off("value")
        this.MultiGroup.active = false;
        this.FinalGroup.active = true;
        if (this.CurRoomData.ClearFirstStage) {
            this.FinalGroup.getChildByName("1-2").color = cc.color(255, 255, 255);
            this.FinalGroup.getChildByName("Block").active = false;
            this.FinalGroup.getChildByName("Fwall").active = false;
        }
        var StatusBoard = this.FinalGroup.getChildByName("StatusBoard");
        StatusBoard.getChildByName("Score").getComponent(cc.Label).string = this.CurRoomData.Score.toString().padStart(7, "0");
        StatusBoard.getChildByName("Coin").getComponent(cc.Label).string = "x" + this.CurRoomData.Coin.toString().padStart(2, "0");
        StatusBoard.getChildByName("Life").getComponent(cc.Label).string = "x" + this.CurRoomData.FP.Life.toString().padStart(2, "0");
        StatusBoard.getChildByName("SPLife").active=true;
        StatusBoard.getChildByName("SPLife").getComponent(cc.Label).string = "x" + this.CurRoomData.SP.Life.toString().padStart(2, "0");
        var mx, my;
        this.Player = cc.find("Canvas/Main Camera/LS/Firstplayer");  
        this.SecondPlayer = cc.find("Canvas/Main Camera/LS/Secondplayer")      
        if (World == "1-1") {
            this.SecondPlayer.x=this.Player.x = -277;
            this.SecondPlayer.y=this.Player.y = -185;
            mx = 10;
            my = 0;
        } else if (World == "1-2") {
            this.SecondPlayer.x=this.Player.x = 285;
            this.SecondPlayer.y=this.Player.y  = -185;
            mx = -15; my = 0;
        } else { mx = 0;my = 10;}
        this.SecondPlayer.active=this.Player.active = true;
        this.Player.getComponent("OnlinePlayer").anim.play(this.CurRoomData.FP.isBig ? "BigIdle" : "Idle");
        this.Player.getChildByName("NickName").getComponent(cc.Label).string = this.CurRoomData.FP.Nickname;
        this.Player.getChildByName("NickName").y = this.CurRoomData.FP.isBig ? 35 : 23;

        this.SecondPlayer.getComponent("OnlinePlayer").anim.play(this.CurRoomData.SP.isBig ? "BigIdle" : "Idle");
        this.SecondPlayer.getChildByName("NickName").getComponent(cc.Label).string = this.CurRoomData.SP.Nickname;
        this.SecondPlayer.getChildByName("NickName").y = this.CurRoomData.SP.isBig ? 35 : 23;

        var callback = cc.callFunc(() => { this.Player.getComponent('OnlinePlayer').Able(this.CurRoomData.FP.isBig,true,this.CurRoomData.Email,this.CurUserData.Email) }, this.Player);
        var Scallback = cc.callFunc(() => { this.SecondPlayer.getComponent('OnlinePlayer').Able(this.CurRoomData.SP.isBig,false,this.CurRoomData.Email,this.CurUserData.Email) }, this.SecondPlayer);
        var CAnim = cc.sequence(cc.moveBy(0.3, cc.v2(mx, my)),cc.moveBy(0.3, cc.v2(mx, my)),cc.moveBy(0.3, cc.v2(mx, my)),callback);
        var BAnim = cc.sequence(cc.moveBy(0.3, cc.v2(mx, my)),cc.moveBy(0.3, cc.v2(mx, my)),cc.moveBy(0.3, cc.v2(mx, my)),Scallback);
        this.Player.runAction(CAnim);
        cc.audioEngine.playEffect(this.PipeEffect, false);
        this.scheduleOnce(()=>{
        cc.audioEngine.playEffect(this.PipeEffect, false);
        this.SecondPlayer.runAction(BAnim)},1.5);
    }

    ToNextStage(World: string) {
        if (World !== "1-1" && World !== "1-2") {
            this.ModeGroip.active = false;
        } else this.SSGroup.active = false;

        this.FinalGroup.active = true;

        if (this.CurUserData.CleadFirstStage) {
            this.FinalGroup.getChildByName("1-2").color = cc.color(255, 255, 255);
            this.FinalGroup.getChildByName("Block").active = false;
            this.FinalGroup.getChildByName("Fwall").active = false;
        }
        var StatusBoard = this.FinalGroup.getChildByName("StatusBoard");
        StatusBoard.getChildByName("Score").getComponent(cc.Label).string = this.CurUserData.Score.toString().padStart(7, "0");
        StatusBoard.getChildByName("Coin").getComponent(cc.Label).string = "x" + this.CurUserData.Coin.toString().padStart(2, "0");
        StatusBoard.getChildByName("Life").getComponent(cc.Label).string = "x" + this.CurUserData.Life.toString().padStart(2, "0");
        cc.audioEngine.playEffect(this.PipeEffect, false);
        var mx, my;
        if (World == "1-1") {
            this.Player.x = -277;
            this.Player.y = -185;
            mx = 10;
            my = 0;
        } else if (World == "1-2") {
            this.Player.x = 285;
            this.Player.y = -185;
            mx = -15;
            my = 0;
        } else {
            mx = 0;
            my = 10;
        }
        this.Player.active = true;
        this.Player.getComponent("LSPlayer").anim.play(this.CurUserData.isBig ? "BigIdle" : "Idle");
        this.Player.getChildByName("NickName").getComponent(cc.Label).string = this.CurUserData.Nickname;
        this.Player.getChildByName("NickName").y = this.CurUserData.isBig ? 35 : 23;

        var callback = cc.callFunc(() => { this.Player.getComponent('LSPlayer').Able(this.CurUserData.isBig) }, this.Player);
        var CAnim = cc.sequence(
            cc.moveBy(0.3, cc.v2(mx, my)),
            cc.moveBy(0.3, cc.v2(mx, my)),
            cc.moveBy(0.3, cc.v2(mx, my)),
            callback
        );
        this.Player.runAction(CAnim);
    }
    StartGame(level: string) {
        cc.audioEngine.playEffect(this.PipeEffect, false);
        if(this.isStart) return;
        this.isStart=true;
       if(this.SecondPlayer==null)  cc.find('GameManager').getComponent("GameManager").UpdatePlayerStatus(this.CurUserData, level);
       else cc.find('GameManager').getComponent("GameManager").UpdateRoomStatus(this.CurRoomData, level,this.CurRoomData.Email===this.CurUserData.Email);
        this.scheduleOnce(() => {
            cc.audioEngine.stopMusic();
            var bl = cc.find("Canvas/Main Camera/Black");
            bl.active = true;
            var lab = bl.getChildByName("Life");
            if(this.SecondPlayer==null) lab.getComponent(cc.Label).string = "x" + this.CurUserData.Life.toString().padStart(2, "0");
            else{
                var llab = bl.getChildByName("SPLife");
                llab.active = true;
                lab.getComponent(cc.Label).string = "x" + this.CurRoomData.FP.Life.toString().padStart(2, "0");
                llab.getComponent(cc.Label).string = "x" + this.CurRoomData.SP.Life.toString().padStart(2, "0");
            }
            
            lab.getChildByName("WorldLabel").getComponent(cc.Label).string = "world " + level;
        }, 3);
        this.scheduleOnce(() => { cc.director.loadScene(level) }, 6);
    }
    
}
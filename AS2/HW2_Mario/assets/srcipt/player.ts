// ===================== TODO 4-1 =====================
// 1. Import class GameManager from GameManager.ts

import { GameManager } from "./GameManager";

// ====================================================

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class OGMario extends cc.Component {

    kDown: boolean = false;
    khold: boolean = false;
    lrDown: boolean = false;
    rrDown: boolean = false;
    public isbig: boolean = false;
    isMuteki: boolean = false;
    isWin: number = 0
    PresolveCheck: boolean = false;
    isJump: boolean = false;
    isTransform: boolean = false;
    jumpcount: number = 0;
    Diecount: number = 0;
    playerSpeed: number;
    elapsedTime: number;
    hold: number;
    InletPositionX: number;
    InletPositionY: number;
    isfirst: boolean;
    iscontrol: boolean;
    Path: string = null;
    rb: cc.RigidBody;
    bc: cc.PhysicsBoxCollider;
    sp: cc.Sprite;

    @property(cc.AudioClip)
    JumpEffect: cc.AudioClip = null;
    @property(cc.AudioClip)
    DieBGM: cc.AudioClip = null;
    @property(cc.AudioClip)
    PowerUp: cc.AudioClip = null;
    @property(cc.AudioClip)
    PowerDown: cc.AudioClip = null;
    @property(cc.AudioClip)
    Stomp: cc.AudioClip = null;
    @property(cc.AudioClip)
    Kick: cc.AudioClip = null;
    @property(cc.Node)
    Outlet: cc.Node;
    @property(cc.Node)
    Inlet: cc.Node;
    @property(cc.Node)
    Mask: cc.Node;
    @property(cc.Node)
    Nick: cc.Node;
    @property(cc.Node)
    AnotherPlayer: cc.Node;
    private spf;
    private anim = null;
    private animState = null;
    private MGR: GameManager;
    private playerMove(dt) {

        if (this.isWin == 1) {
            this.node.x += 100 * dt;
            this.Nick.scaleX = 0.2;
        } else if (this.isWin == 2) {

        }
        else if (this.Diecount == 0 && this.isTransform == false) {
            this.playerSpeed = 0;
            if (this.lrDown) {
                this.playerSpeed = -200;
                this.node.scaleX = -1;
                this.Nick.scaleX = -0.2;
                if ((this.animState == null || this.animState.name == "Idle" || this.animState.name == "MarioTransform"))
                    this.animState = this.isbig ? this.anim.play("BigMarioMove") : this.anim.play("SmallMario");
            } else if (this.rrDown) {
                this.playerSpeed = 200;
                this.node.scaleX = 1;
                this.Nick.scaleX = 0.2;
                if ((this.animState == null || this.animState.name == "Idle" || this.animState.name == "MarioTransform"))
                    this.animState = this.isbig ? this.anim.play("BigMarioMove") : this.anim.play("SmallMario");
            } else {
                if (this.animState != null && this.animState.name != "SMJump" && this.animState.name != "BigJump" && this.animState.name != "SMKick" && this.animState.name != "BigKick") {
                    if (this.isbig) this.anim.play("BigIdle");
                    else this.anim.play("Idle");
                    this.animState = null;
                }
            }
            if (this.iscontrol || !this.MGR.MultiData.active) this.node.x += this.playerSpeed * dt;

            if (this.kDown && Math.abs(this.rb.linearVelocity.y) < 0.00000000000001) this.jump();
            //else if(this.kDown && this.MGR.MultiData.active && !this.iscontrol) this.jump();

        }

    }
    private jump() {
        if (this.animState == null || this.animState.name != "SMJump" || this.animState.name != "BigJump")
            this.animState = this.isbig ? this.anim.play("BigJump") : this.anim.play("SMJump");
        cc.audioEngine.playEffect(this.JumpEffect, false);
        if (this.iscontrol || !this.MGR.MultiData.active) this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, 300)
        this.isJump = true;
        this.kDown = false;

    }
    private kick() {
        if (this.animState == null || this.animState.name != "SMKick" || this.animState.name != "BigKick") {
            if (this.isTransform) this.isbig ? this.anim.playAdditive("BigKick") : this.anim.playAdditive("SMKick");
            else this.animState = this.isbig ? this.anim.play("BigKick") : this.anim.play("SMKick");
        }
        cc.audioEngine.playEffect(this.Kick, false);
        if (this.iscontrol || !this.MGR.MultiData.active) this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, 150)
        this.isJump = true;
    }
    private Die(Reason: string) {
        console.log("die for" +Reason);
        
        if (this.Diecount == 0 && this.isWin == 0) {
            this.Diecount = 1;
            if (Reason == "TimeUp") {
                if (this.iscontrol || this.MGR.MultiData.active == false) {
                    cc.audioEngine.stopMusic();
                    cc.audioEngine.playEffect(this.DieBGM, false);
                    this.MGR.DieForTimeUp++;
                }
            }
            else if (this.AnotherPlayer.getComponent("player").Diecount == 1 || this.MGR.MultiData.active == false) {
                cc.audioEngine.stopMusic();
                cc.audioEngine.playEffect(this.DieBGM, false);
                this.MGR.stopTimer("dead");
            }
            let DiePower = Reason == "Enemy" ? 2000 : "DieLine" ? 7500 : 15000;
            if (this.iscontrol || this.MGR.MultiData.active == false) this.getComponent(cc.RigidBody).applyForceToCenter(new cc.Vec2(0, DiePower), true);
            this.node.getComponent(cc.PhysicsBoxCollider).enabled = false;
            this.anim.play("SmallDie");

        }

    }
    public Respawn(X: number, Y: number) {
        this.animState = null;
        this.isbig = false;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.Diecount = 0;
        this.node.getComponent(cc.PhysicsBoxCollider).enabled = true;
        this.isMuteki = true;
        this.startBlinking();
    }
    private Reload() {
        if (this.MGR.MultiData.active){
            if(this.MGR.DieForTimeUp<2) 
                this.MGR.MultiLoseLife(this.isfirst);
        }
        else
            this.MGR.LoseOneLife();
    }
    onLoad() {
        if(this.node.active){
            cc.director.getPhysicsManager().enabled = true;
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
            this.rb = this.getComponent(cc.RigidBody);
            this.bc = this.getComponent(cc.PhysicsBoxCollider);
            this.sp = this.getComponent(cc.Sprite);
            cc.debug.setDisplayStats(false);
            this.MGR = cc.find('GameManager').getComponent("GameManager");
            this.MGR.Reload();
            this.anim = this.getComponent(cc.Animation);
            if (this.MGR.MultiData.active == false) {
                this.isbig = this.MGR.isBig
                if (this.isbig) this.anim.play("BigIdle");
                else this.anim.play("Idle");
            }
    
            this.Diecount = 0;
        }

    }
    Able(isFirst: boolean, isControl: boolean) {
        this.isfirst = isFirst;
        this.MGR = cc.find('GameManager').getComponent("GameManager");
        if (this.isfirst) this.Path = "MultiGame/Room/" + this.MGR.CurRoomData.Email + "/Game/FP";
        else this.Path = "MultiGame/Room/" + this.MGR.CurRoomData.Email + "/Game/SP";
        this.iscontrol = isControl;
        this.getComponent(cc.RigidBody).gravityScale = this.iscontrol ? 2 : 0;
        this.anim = this.getComponent(cc.Animation);
        if (!this.iscontrol) {
            firebase.database().ref(this.Path).on("value", snapshot => {
                if(snapshot.val()!=null){
                    var Data = snapshot.val();
                    //console.log(Data);
                    if(this.node!=null){
                        this.node.x = Data.px;
                        this.node.y = Data.py;
                    }
                    this.kDown = Data.kd;
                    this.rrDown = Data.rd;
                    this.lrDown = Data.ld;
                    this.khold = Data.kh;
                    if(this.isbig!=Data.isBIG){
                        this.isbig = Data.isBIG;
                        if(Data.isBIG)this.ToBig();
                        else this.ToSmall();
                    }
                }

            })

        }

        this.isbig = this.isfirst ? this.MGR.CurRoomData.FP.isBig : this.MGR.CurRoomData.SP.isBig

        this.anim.play(this.isbig ? "BigIdle" : "Idle");
    }
    protected onDestroy(): void {
        if (this.MGR.MultiData.active && !this.iscontrol) firebase.database().ref(this.Path).off();
    }
    onKeyDown(event) {
        if (this.iscontrol || !this.MGR.MultiData.active) {
            if (event.keyCode == cc.macro.KEY.space) {
                if (this.khold == false) {
                    this.kDown = true;
                    this.khold = true;
                } else this.kDown = false
            }
            else if (event.keyCode == cc.macro.KEY.left) this.lrDown = true;
            else if (event.keyCode == cc.macro.KEY.right) this.rrDown = true;
            else if (event.keyCode == cc.macro.KEY.k) this.Die("Die");
        }
    }
    onKeyUp(event) {
        if (this.iscontrol || !this.MGR.MultiData.active) {
            if (event.keyCode == cc.macro.KEY.space) this.kDown = this.khold = false;
            else if (event.keyCode == cc.macro.KEY.left) this.lrDown = false;
            else if (event.keyCode == cc.macro.KEY.right) this.rrDown = false;
        }
    }
    onPreSolve(contact, self, other) {
        if (other.node.name === "FromTop" && this.rb.linearVelocity.y >= 0) contact.setEnabled(false);
        if (other.tag == 1)
            contact.setEnabled(false);

    }
    onBeginContact(contact, self, other) {
        var normal = contact.getWorldManifold().normal;
        var Oname = other.node.name;
        if (this.Diecount == 0) {
            if (normal.y < 0) {
                if (this.isJump && this.animState != null && this.animState.name != "MarioTransform" && this.animState.name != "AntiTransform") {

                    if (this.isbig) this.anim.play("BigIdle");
                    else this.anim.play("Idle");
                    this.animState = null;
                }
                this.isJump = false;
                this.jumpcount = 0;
            }

            if (Oname === "DieLine") this.Die("DieLine");
            if (other.tag == 1 && this.Diecount == 0 ) {
                if (other.node.name == "Turtle" && other.getComponent("Turtle").Attackable()) {
                    if (normal.y < -0)
                        this.kick();
                   if(this.MGR.isAble()) other.getComponent(other.node.name).Die(normal);
                } else if (normal.y < -0) {

                    this.kick();
                    if(this.MGR.isAble())  other.getComponent(other.node.name).Die(normal);
                    if (this.jumpcount < 20) {
                        this.jumpcount += 2;
                        this.MGR.updateScore(this.jumpcount * 100);
                    } else this.MGR.updateLife(1);

                } else if (this.isMuteki == false) {
                    if (this.isbig) {
                        this.ToSmall();
                    } else this.Die("Enemy");
                }
            }
            else if (Oname === "Spike") {
                if (!this.isMuteki) {
                    if (this.isbig) {
                       this.ToSmall();
                    } else this.Die("Enemy");
                }
            }
            else if (Oname === "Obox" && normal.y > 0 && this.isbig) {
                other.node.active = false;
                other.node.enabled = false;
                other.node.removeFromParent();
            }
            else if (Oname === "SuperMash") {
                other.getComponent("Mash").eaten();
                if (!this.isbig) {
                    this.ToBig();
                } else {
                    cc.audioEngine.playEffect(this.Stomp, false);
                }
                this.MGR.updateScore(1000);
            } else if (Oname === "Flag" && this.isWin == 0) {
                other.getComponent("flag").ChangeFlag();
                this.isWin = 1;
                this.scheduleOnce(() => { this.isWin = 2 }, 3);
                if (this.MGR.MultiData.active) this.MGR.MultiVictory(this.isfirst);
                else this.MGR.Victory();
            } else if (Oname == "LeftMazeDetect" && (this.iscontrol || !this.MGR.MultiData.active)) {
                if (this.lrDown) {
                    this.Outlet.active = true;
                    this.Inlet.getComponent(cc.Sprite).enabled = false;
                    this.Inlet.setParent(this.Mask.parent);
                    this.Inlet.x = this.InletPositionX;
                    this.Inlet.y = this.InletPositionY;
                } else {
                    this.Outlet.active = false;
                    this.Inlet.getComponent(cc.Sprite).enabled = true;
                    this.Mask.setPosition(this.node.position);
                    this.InletPositionX = this.Inlet.x;
                    this.InletPositionY = this.Inlet.y;
                    this.Inlet.setParent(this.Mask)
                }

            } else if (Oname == "RightMazeDetect" && (this.iscontrol || !this.MGR.MultiData.active)) {
                if (this.rrDown) {
                    this.Outlet.active = true;
                    this.Inlet.getComponent(cc.Sprite).enabled = false;
                    this.Inlet.setParent(this.Mask.parent);
                    this.Inlet.x = this.InletPositionX;
                    this.Inlet.y = this.InletPositionY;
                } else {
                    this.Outlet.active = false;
                    this.Inlet.getComponent(cc.Sprite).enabled = true;
                    this.Mask.setPosition(this.node.position);
                    this.InletPositionX = this.Inlet.x;
                    this.InletPositionY = this.Inlet.y;
                    this.Inlet.setParent(this.Mask)
                }
            }
        }
    }
    ToBig(){
        this.isTransform = true;
        this.isbig = true;
        this.node.height = 28;
        this.node.width = 16;
        this.bc.size = new cc.Size(16, 28);
        this.bc.offset.y = 14;
        this.bc.apply();
        cc.audioEngine.playEffect(this.PowerUp, false);
        this.animState = this.anim.play("MarioTransform");
    }
    ToSmall(){
        this.isTransform = true;
        this.isbig = false;
        this.isMuteki = true;
        cc.audioEngine.playEffect(this.PowerDown, false);
        this.animState = this.anim.play("AntiTransform");
    }
    MUP() {
        this.isTransform = false;
    }
    update(dt: number): void {
        this.playerMove(dt);
        if (this.Inlet != null) {
            if (this.Inlet.parent == this.Mask) {
                this.Mask.setPosition(this.node.position);
                this.Inlet.x = this.InletPositionX - this.Mask.x;
                this.Inlet.y = this.InletPositionY - this.Mask.y;
            }
        }
        if (this.iscontrol && this.MGR.MultiData.active && this.Path != null) {
            firebase.database().ref(this.Path).update({
                px: this.node.x,
                py: this.node.y,
                kd: this.kDown,
                ld: this.lrDown,
                rd: this.rrDown,
                kh: this.khold,
                isBIG: this.isbig,
            });
        }
    }

    startBlinking() {
        this.node.height = 16;
        this.node.width = 12;
        this.bc.size = new cc.Size(12, 16);
        this.bc.offset.y = 8;
        this.bc.apply();

        this.elapsedTime = 0;
        this.spf = this.sp.spriteFrame
        this.schedule(this.updateBlink, 0.1);
    }
    stopBlinking() {
        this.isMuteki = false;
        this.unschedule(this.updateBlink);
    }
    updateBlink(dt) {
        this.elapsedTime += dt;
        if (this.elapsedTime >= 1) {
            this.stopBlinking();
            return;
        }
        if (this.elapsedTime % 0.1 <= 0.05) {
            this.sp.spriteFrame = null;
        } else {
            this.sp.spriteFrame = this.spf;
        }
    }

}

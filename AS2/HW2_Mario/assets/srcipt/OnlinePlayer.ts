// ===================== TODO 4-1 =====================
// 1. Import class GameManager from GameManager.ts

import { GameManager } from "./GameManager";
import StartManager from "./StartManager";

// ====================================================

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class OnlineMario extends cc.Component {


    CMD = {
        kDown: false,
        khold: false,
        lrDown: false,
        rrDown: false
    }
    isbig: boolean = false;
    isfirst: boolean = false;
    IsControl: boolean = false;
    isJump: boolean = false;
    Nick: cc.Node = null;
    ToPlay: boolean = false;
    playerSpeed: number;
    hold: number;
    Path: string;
    rb: cc.RigidBody;
    bc: cc.PhysicsBoxCollider;
    sp: cc.Sprite;
    ref: any;
    world: string = "no";
    @property(cc.AudioClip)
    JumpEffect: cc.AudioClip = null;
    SSManager: StartManager = null;

    private spf;
    private anim = null;
    private animState = null;
    private MGR: GameManager;
    private playerMove(dt) {
        this.playerSpeed = 0;
        if (this.CMD != null && this.CMD.lrDown) {
            this.playerSpeed = -200;
            this.Nick.scaleX = -0.2;
            this.node.scaleX = -2;
            if ((this.animState == null || this.animState.name == "Idle" || this.animState.name == "MarioTransform"))
                this.animState = this.isbig ? this.anim.play("BigMarioMove") : this.anim.play("SmallMario");
        } else if (this.CMD != null && this.CMD.rrDown) {
            this.playerSpeed = 200;
            this.Nick.scaleX = 0.2;
            this.node.scaleX = 2;
            if ((this.animState == null || this.animState.name == "Idle" || this.animState.name == "MarioTransform"))
                this.animState = this.isbig ? this.anim.play("BigMarioMove") : this.anim.play("SmallMario");
        } else {
            if (this.animState != null && this.animState.name != "SMJump" && this.animState.name != "BigJump") {
                if (this.isbig) this.anim.play("BigIdle");
                else this.anim.play("Idle");
                this.animState = null;
            }
        }
        if (this.IsControl) this.rb.linearVelocity = cc.v2(this.playerSpeed, this.rb.linearVelocity.y);
        if (this.CMD.kDown && this.rb.linearVelocity.y == 0) this.jump();

    }
    private jump() {
        if (this.animState == null || this.animState.name != "SMJump" || this.animState.name != "BigJump")
            this.animState = this.isbig ? this.anim.play("BigJump") : this.anim.play("SMJump");
        cc.audioEngine.playEffect(this.JumpEffect, false);
        if (this.IsControl) {
            this.rb.linearVelocity = cc.v2(0, 300);
            this.CMD.kDown = false;
        }
        this.isJump = true;


    }
    onLoad() {

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.anim = this.getComponent(cc.Animation);
        this.anim.play("Idle");
        this.Nick = this.node.getChildByName("NickName");
        this.SSManager = cc.find('StartSceneManager').getComponent("StartManager");
        this.CMD.kDown = this.CMD.khold = this.CMD.rrDown = this.CMD.lrDown = false;

    }
    onKeyDown(event) {
        if (!this.ToPlay && this.IsControl) {
            let now = new Date();
            //console.log("keydown上傳時間: "+ now.getTime());
            if (event.keyCode == cc.macro.KEY.space) {
                //firebase.database().ref(this.Path).update({
                //    kDown: this.CMD.khold == false,
                //    khold: true,
                //    LatestCmd: now.getTime()
                //})
                this.CMD.kDown = this.CMD.khold == false;
                this.CMD.khold = true;

            }
            else if (event.keyCode == cc.macro.KEY.left) {
                //firebase.database().ref(this.Path).update({ lrDown: true ,LatestCmd: now.getTime()})
                this.CMD.lrDown = true;
            }
            else if (event.keyCode == cc.macro.KEY.right) {
                // firebase.database().ref(this.Path).update({ rrDown: true ,LatestCmd: now.getTime()})
                this.CMD.rrDown = true;
            }
        }
    }
    onKeyUp(event) {
        if (!this.ToPlay && this.IsControl) {
            let now = new Date();
            //console.log("keyUP上傳時間: "+ now.getTime());
            if (event.keyCode == cc.macro.KEY.space) this.CMD.kDown = this.CMD.khold = false;
            else if (event.keyCode == cc.macro.KEY.left) this.CMD.lrDown = false;
            else if (event.keyCode == cc.macro.KEY.right) this.CMD.rrDown = false;
        }
    }
    public Able(isBig: boolean, isFirst: boolean, RoomEmail: string, UserEmail: string) {
        this.isbig = isBig;
        this.isfirst = isFirst;
        this.IsControl = this.isfirst ? RoomEmail == UserEmail : RoomEmail != UserEmail;
        this.Path = this.isfirst ? "MultiGame/Room/" + RoomEmail + "/cmd/FP" : "MultiGame/Room/" + RoomEmail + "/cmd/SP"
        if (!this.IsControl) {
            firebase.database().ref(this.Path).on("value", snapshot => {
                var Data = snapshot.val();
                this.node.x = Data.px;
                this.node.y = Data.py;
                this.CMD.kDown = Data.kd;
                this.CMD.rrDown = Data.rd;
                this.CMD.lrDown = Data.ld;
                this.CMD.khold = Data.kh;
            })
        }
        this.rb = this.addComponent(cc.RigidBody);
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.enabledContactListener = true;
        this.rb.fixedRotation = true;
        this.rb.gravityScale = this.IsControl ? 2 : 0;

        this.bc = this.addComponent(cc.PhysicsBoxCollider);
        if (isBig) {
            this.anim.play("BigIdle")
            this.bc.size = new cc.Size(16, 28);
            this.bc.offset.y = 14;
        } else {
            this.anim.play("Idle")
            this.bc.size = new cc.Size(12, 16);
            this.bc.offset.y = 8;
        }
        this.bc.apply();


    }
    onPreSolve(contact, self, other) {
        var normal = contact.getWorldManifold().normal;
        if (normal.x < 0 && other.node.name == "1-1" || normal.x > 0 && other.node.name == "1-2") {
            contact.setEnabled(false);
        }

    }
    protected onDestroy(): void {
        firebase.database().ref(this.Path).off();
    }
    onBeginContact(contact, self, other) {

        var normal = contact.getWorldManifold().normal;
        var Oname = other.node.name;
        if ((normal.x < 0 && Oname == "1-1" || normal.x > 0 && Oname == "1-2") && !this.ToPlay) {
            if (this.isbig) this.anim.play("BigIdle");
            else this.anim.play("Idle");
            this.ToPlay = true;
            this.Nick.active = false;
            this.world = Oname;
            var speed = normal.x < 0 && Oname == "1-1" ? -100 : 100;
            this.rb.linearVelocity = cc.v2(speed, 0);
            this.scheduleOnce(() => { this.rb.linearVelocity = cc.v2(0, 0) }, 3);
            this.SSManager.StartGame(Oname);
        }
        if (normal.y < 0) {
            if (this.isJump && this.animState != null && this.animState.name != "MarioTransform" && this.animState.name != "AntiTransform") {
                if (this.isbig) this.anim.play("BigIdle");
                else this.anim.play("Idle");
                this.animState = null;
            }
            this.isJump = false;
        }
    }
    update(dt: number): void {
        if (this.rb != null) {
           if(this.ToPlay == false)  this.playerMove(dt);
            if (this.IsControl) {
                firebase.database().ref(this.Path).update({
                    px: this.node.x,
                    py: this.node.y,
                    kd: this.CMD.kDown,
                    ld: this.CMD.lrDown,
                    rd: this.CMD.rrDown,
                    kh: this.CMD.khold,
                    world: this.world
                });
            }
        }
    }
}

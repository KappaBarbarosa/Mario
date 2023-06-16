// ===================== TODO 4-1 =====================
// 1. Import class GameManager from GameManager.ts

import { GameManager } from "./GameManager";
import StartManager from "./StartManager";

// ====================================================

const { ccclass, property } = cc._decorator;

@ccclass
export default class LSMario extends cc.Component {

    kDown: boolean = false;
    khold: boolean = false;
    lrDown: boolean = false;
    rrDown: boolean = false;
    isbig: boolean = false;
    isJump: boolean = false;
    Nick:cc.Node = null;
    ToPlay:boolean=false;
    playerSpeed: number;
    hold: number;

    rb: cc.RigidBody;
    bc: cc.PhysicsBoxCollider;
    sp: cc.Sprite;

    @property(cc.AudioClip)
    JumpEffect: cc.AudioClip = null;
    SSManager:StartManager=null;

    private spf;
    private anim = null;
    private animState = null;
    private MGR: GameManager;
    private playerMove(dt) {
        this.playerSpeed = 0;
        if (this.lrDown) {
            this.playerSpeed = -200;
            this.Nick.scaleX=-0.2;
            this.node.scaleX = -2;
            if ((this.animState == null || this.animState.name == "Idle" || this.animState.name == "MarioTransform"))
                this.animState = this.isbig ? this.anim.play("BigMarioMove") : this.anim.play("SmallMario");
        } else if (this.rrDown) {
            this.playerSpeed = 200;
            this.Nick.scaleX=0.2;
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
        this.rb.linearVelocity = cc.v2(this.playerSpeed,this.rb.linearVelocity.y);
        if (this.kDown && this.rb.linearVelocity.y == 0) this.jump();

    }
    private jump() {
        if (this.animState == null || this.animState.name != "SMJump" || this.animState.name != "BigJump")
            this.animState = this.isbig ? this.anim.play("BigJump") : this.anim.play("SMJump");
        cc.audioEngine.playEffect(this.JumpEffect, false);
        this.rb.linearVelocity = cc.v2(0,300)
        this.isJump = true;
        this.kDown = false;

    }
    onLoad() {
        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.anim = this.getComponent(cc.Animation);
        this.anim.play("Idle");
        this.Nick = this.node.getChildByName("NickName");
        this.SSManager =  cc.find('StartSceneManager').getComponent("StartManager");

    }
    onKeyDown(event) {
        if (event.keyCode == cc.macro.KEY.space) {
            if (this.khold == false) {
                this.kDown = true;
                this.khold = true;
            } else this.kDown = false
        }
        else if (event.keyCode == cc.macro.KEY.left) this.lrDown = true;
        else if (event.keyCode == cc.macro.KEY.right) this.rrDown = true;
    }
    onKeyUp(event) {
        if (event.keyCode == cc.macro.KEY.space) this.kDown = this.khold = false;
        else if (event.keyCode == cc.macro.KEY.left) this.lrDown = false;
        else if (event.keyCode == cc.macro.KEY.right) this.rrDown = false;

    }
    public Able(isBig:boolean) {     
        this.isbig = isBig;
        this.rb = this.addComponent(cc.RigidBody);
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.enabledContactListener = true;
        this.rb.fixedRotation = true;
        this.rb.gravityScale=2;
        
        this.bc = this.addComponent(cc.PhysicsBoxCollider);
        if(isBig){
            this.anim.play("BigIdle")
            this.bc .size = new cc.Size(16, 28);
            this.bc .offset.y = 14;
        }else{
            this.anim.play("Idle")
            this.bc.size =  new cc.Size(12, 16);
            this.bc .offset.y = 8;
        }
        this.bc .apply();
        
        
    }
    onPreSolve(contact, self, other){
        var normal = contact.getWorldManifold().normal;
        if(normal.x<0 && other.node.name=="1-1"||normal.x>0 && other.node.name=="1-2"){
            contact.setEnabled(false);
        }

    }
    onBeginContact(contact, self, other) {
  
        var normal = contact.getWorldManifold().normal;
        var Oname = other.node.name;
        if((normal.x<0 && Oname=="1-1" ||normal.x>0 && Oname=="1-2" ) &&!this.ToPlay){
            if (this.isbig) this.anim.play("BigIdle");
            else this.anim.play("Idle");
            this.ToPlay=true; 
            this.Nick.active=false;
            var speed = normal.x<0 && Oname=="1-1" ? -100:100;
            this.rb.linearVelocity = cc.v2(speed,0);
            this.scheduleOnce(()=>{this.rb.linearVelocity=cc.v2(0,0)},3);
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
       // this.node.width= this.isbig?32:24;
        if(this.rb!=null && this.ToPlay==false){
            this.playerMove(dt);
        }
        
    }
}

import { GameManager } from "./GameManager";

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class Goomba extends cc.Component {
    rb: cc.RigidBody;
    speed: number;
    isDie: boolean = false;
    private anim = null;
    private animState = null;
    public face: number;
    index: number;
    MGR: GameManager
    Path: string
    @property(cc.Node)
    player: cc.Node = null;
    Splayer: cc.Node= null;
    onLoad(): void {
        this.speed = 100;
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.animState = this.anim.play("GoombaMove");
        this.face = 1;
        this.Splayer = cc.find("Canvas/Game/Splayer");
        this.MGR = cc.find('GameManager').getComponent("GameManager");
        if (this.MGR.MultiData.active) {
            this.index = this.node.parent.children.indexOf(this.node);
            this.Path = "MultiGame/Room/" + this.MGR.CurRoomData.Email + "/Game/EnemyM/" + this.index;
            if(!this.MGR.MultiData.isControl)
                firebase.database().ref(this.Path).on("value", snapshot => {
                    if(snapshot.val()!=null){
                        if(this.node!=null){
                            this.node.x = snapshot.val().X;
                            this.node.y = snapshot.val().Y;
                        }
                        if(!this.isDie && snapshot.val().ID) this.Die(0);
                    }
                })
        }

    }
    public Dead() {
        this.node.active = false;
        this.enabled = false;
        if(!this.MGR.isAble())
            firebase.database().ref(this.Path).off();
        this.node.removeFromParent();
    }
    public Die(normal) {
  
        
        this.isDie = true;
        if(this.MGR.MultiData.active)
            if (this.MGR.MultiData.isControl) {
                firebase.database().ref(this.Path).set({
                    X: this.node.x,
                    Y: this.node.y,
                    ID:this.isDie,
                })
            }
        //this.node.runAction(cc.moveBy(0.01, cc.v2(0, 6)))
        this.animState = this.anim.play("GoombaDead");
    }
    public AnotherDie() {
        this.node.scaleY = -1;
        this.scheduleOnce(this.Dead, 5);
        this.isDie = true;
    }
    update(dt: number): void {
        if(this.MGR.MultiData.Fdie && this.MGR.MultiData.active && this.player!=this.Splayer) this.player = this.Splayer;
        if (!this.isDie) {
            if (this.MGR.isAble()) {
                if ((this.player != null && (this.node.x - this.player.x <= 650 )) || this.player == null) {
                    this.rb.linearVelocity = cc.v2(this.speed * this.face, this.rb.linearVelocity.y);
                    if (this.MGR.MultiData.isControl) {
                        firebase.database().ref(this.Path).set({
                            X: this.node.x,
                            Y: this.node.y,
                            ID:this.isDie,
                        })
                    }
                }
            }
        }
    }
    onPreSolve(contact, self, other) {
        if (this.isDie) contact.setEnabled(false);
    }
    onBeginContact(contact, self, other) {
        if (!this.isDie) {
            var worldManifold = contact.getWorldManifold();
            var normal = worldManifold.normal;
            if (other.tag != 3 && other.tag != 1) {
                if (other.node.name == "DieLine") this.Dead();
                if (normal.x >= 1) this.face *= -1;
                else if (normal.x <= -1) this.face *= -1;
            }
        }


    }
}
import { GameManager } from "./GameManager";

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class Turtle extends cc.Component {
    rb: cc.RigidBody;
    speed: number;
    isDie: boolean = false;
    ColidCount: number = 0;
    public State: number = 0;
    Waiting: boolean = false;
    private anim = null;
    private animState = null;
    public face: number;
    index: number;
    Path: String
    @property(cc.Node)
    player: cc.Node = null;
    private MGR: GameManager;
    //0 = normal, 1 = fake dead, 2 =come back,3= run
    onLoad(): void {
        this.speed = 100;
        this.anim = this.getComponent(cc.Animation);
        this.anim.play("TurtleMove");
        this.face = -1;
        this.State = 0;
        this.MGR = cc.find('GameManager').getComponent("GameManager");
        if (this.MGR.MultiData.active) {
            this.index = this.node.parent.children.indexOf(this.node);
            this.Path = "MultiGame/Room/" + this.MGR.CurRoomData.Email + "/Game/EnemyM/" + this.index;
            if (!this.MGR.MultiData.isControl)
                firebase.database().ref(this.Path).on("value", snapshot => {
                    if (snapshot.val() != null) {
                        if(this.node!=null){
                            this.node.x = snapshot.val().X;
                            this.node.y = snapshot.val().Y;
                            this.node.scaleX = snapshot.val().SX;
                        }
                        if (this.State != snapshot.val().S) {
                            if ((this.State == 0 || this.State == 3) && snapshot.val().S == 1)
                                this.animState = this.anim.play("TurtleFakeDead");
                            else if ((this.State == 1 || this.State == 2) && snapshot.val().S == 3)
                                this.animState = this.anim.play("TurtleRun");
                            else if (snapshot.val().S == 2)
                                this.animState = this.anim.play("TurtleFakeDead");
                            else if (snapshot.val().S == 0)
                                this.animState = this.anim.play("TurtleMove");
                            this.State = snapshot.val().S;
                        }
                    }
                })
        }
    }
    public Dead() {
        this.node.active = false;
        this.enabled = false;
        if (!this.MGR.isAble())
            firebase.database().ref(this.Path).off();
        this.node.removeFromParent();
    }
    public Attackable() {
        return this.State == 2 || this.State == 1;
    }
    public Die(normal) {
        if (this.State == 0 || this.State == 3) {
            if (normal.y < -0) {
                this.State = 1;
                this.Waiting = true;
                this.scheduleOnce(this.Comeback, 4);
                this.animState = this.anim.play("TurtleFakeDead");
            }
        } else {
            this.face = normal.x > 0 ? -1 : 1;
            this.Waiting = false;
            this.State = 3;
            this.animState = this.anim.play("TurtleRun");
        }

    }
    Comeback() {
        if (this.Waiting) {
            this.State = 2;
            this.anim.play("TurtleCB");
            this.scheduleOnce(this.ReturnToNormal, 2);
        }

    }
    ReturnToNormal() {
        if (this.Waiting) {
            this.State = 0;
            this.anim.play("TurtleMove");
        }
    }
    update(dt: number): void {
        if (!this.isDie) {
            if ((this.player != null && (this.node.x - this.player.x <= 650)) || this.player == null) {
                if (this.MGR.MultiData.active == false || this.MGR.MultiData.isControl) {
                    if (this.State == 0) {
                        this.node.x += -1 * this.speed * this.face * dt;
                        this.node.scaleX = this.face;
                    } else if (this.State == 3) {
                        this.node.x += -2 * this.speed * this.face * dt;
                    }
                    if (this.MGR.MultiData.isControl) {
                        firebase.database().ref(this.Path).set({
                            X: this.node.x,
                            Y: this.node.y,
                            S: this.State,
                            SX: this.node.scaleX,
                        })
                    }
                }

            }
        }
    }
    public AnotherDie() {
        this.node.scaleY = -1;
        this.scheduleOnce(this.Dead, 5);
        this.isDie = true;
    }
    onPreSolve(contact, self, other) {
        if (other.tag == 1 || this.isDie) contact.setEnabled(false);

    }
    onBeginContact(contact, self, other) {
        if (!this.isDie) {
            var worldManifold = contact.getWorldManifold();
            var normal = worldManifold.normal;
            if (other.node.name == "DieLine") this.Dead();
            if (other.tag == 1 && this.State == 3) {
                if (this.ColidCount < 40) {
                    this.ColidCount += 2;
                    this.MGR.updateScore(this.ColidCount * 100);
                } else this.MGR.updateLife(1);
                other.getComponent(other.node.name).AnotherDie();
            }
            if (other.tag != 3 && other.tag != 1) {
                if (normal.x >= 0.5) this.face *= -1;
                else if (normal.x <= -0.5) this.face *= -1;
            }
        }


    }
}
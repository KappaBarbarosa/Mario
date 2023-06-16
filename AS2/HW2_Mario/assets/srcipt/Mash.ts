import { GameManager } from "./GameManager";

const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class Mash extends cc.Component {
    rb: cc.RigidBody;
    speed: number;
    index: number;
    MGR: GameManager
    Path: string
    iseaten: boolean = false;
    onLoad(): void {
        this.speed = 100;
        this.MGR = cc.find('GameManager').getComponent("GameManager");
        if (this.MGR.MultiData.active) this.Path = "MultiGame/Room/" + this.MGR.CurRoomData.Email + "/Game/MashM/"
    }
    public Able() {
        this.rb = this.addComponent(cc.RigidBody);
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.enabledContactListener = true;
        this.rb.fixedRotation = true;
        this.MGR = cc.find('GameManager').getComponent("GameManager");
        var boxcoli = this.addComponent(cc.PhysicsBoxCollider);
        boxcoli.size = new cc.Size(16, 16);
        boxcoli.apply();
    }

    update(dt: number): void {
        if (this.getComponent(cc.RigidBody) !== null) {
            if (this.MGR.isAble()) this.node.x += this.speed * dt;
            if (this.MGR.MultiData.isControl) {
                firebase.database().ref(this.Path + this.index).set({
                    X: this.node.x,
                    Y: this.node.y,
                    IE: this.iseaten,
                })
            }
        }
    }
    public ON() {
        if (!this.MGR.isAble()) {
            firebase.database().ref(this.Path + this.index).on("value", snapshot => {
                if (snapshot.val() != null) {
                    if(this.node!=null){
                        this.node.x = snapshot.val().X;
                        this.node.y = snapshot.val().Y;
                    }
                    if (this.iseaten != snapshot.val().IE) {
                        this.eaten();
                    }
                }

            })
        }
    }
    protected onDestroy(): void {
        if (!this.MGR.isAble())
            firebase.database().ref(this.Path + this.index).off();
    }
    eaten() {

        this.iseaten = true;
        if (this.MGR.MultiData.active)
            if (this.MGR.MultiData.isControl) {
                firebase.database().ref(this.Path).set({
                    X: this.node.x,
                    Y: this.node.y,
                    IE: this.iseaten,
                })
            }
        this.node.active = false;
        this.node.removeFromParent();
    }
    onBeginContact(contact, self, other) {

        var worldManifold = contact.getWorldManifold();
        var normal = worldManifold.normal;
        if (other.node.name == "DieLine") {
            this.node.active = false;
            this.node.removeFromParent();
        }
        if (normal.x >= 1) this.speed *= -1;
        else if (normal.x <= -1) this.speed *= -1;
    }
}
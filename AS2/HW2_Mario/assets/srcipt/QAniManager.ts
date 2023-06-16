const { ccclass, property } = cc._decorator;

@ccclass
export default class QAnimationManager extends cc.Component {
    private anim = null;
    private animState = null;
    private IsColided = false;
    @property(cc.Prefab)
    coinPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    MashPrefab: cc.Prefab = null;
    @property(cc.AudioClip)
    CoinEffect: cc.AudioClip = null;
    @property(cc.AudioClip)
    MashEffect: cc.AudioClip = null;
    private item = null;
    onLoad() {
        this.node.zIndex = 11;
        this.anim = this.getComponent(cc.Animation);
        this.animState = this.anim.play("QboxRotate");
        if (this.coinPrefab != null) {
            this.item = cc.instantiate(this.coinPrefab);
            this.node.parent.addChild(this.item);
            this.item.setPosition(this.node.x + 8, this.node.y + 8);
        } else if (this.MashPrefab != null) {
            this.item = cc.instantiate(this.MashPrefab);
            var MashM = cc.find("Canvas/GAME/MashM");
            
            this.node.parent.addChild(this.item);
            this.item.setPosition(this.node.x + 8, this.node.y + 8);
            this.item.setParent(MashM);
            this.item.getComponent("Mash").index = MashM.childrenCount;
            this.item.getComponent("Mash").ON();
        }
        if (this.item != null) {
            this.item.zIndex = 10;
        }

    }
    onBeginContact(contact, self, other) {
        var worldManifold = contact.getWorldManifold();
        var normal = worldManifold.normal;
        if (other.tag == 3 && normal.y < 0 && this.animState != null && !this.IsColided) {
            this.animState = null;
            this.anim.play("QboxIdle");

            var bounceAnim = cc.sequence(
                cc.moveBy(0.1, cc.v2(0, 10)),
                cc.moveBy(0.1, cc.v2(0, -10))
            );
            this.node.runAction(bounceAnim);
            if (this.item != null) {
                var BAnim = cc.sequence(
                    cc.moveBy(0.3, cc.v2(0, 50)),
                    cc.moveBy(0.3, cc.v2(0, -50))
                );

                if (this.coinPrefab != null) {
                    var gameMGR = cc.find('GameManager').getComponent("GameManager")
                    if (gameMGR != null) {
                        gameMGR.updateCoin(1);
                        gameMGR.updateScore(200);
                    }

                    cc.audioEngine.playEffect(this.CoinEffect, false);
                    this.item.getComponent(cc.Animation).play("CoinRotate");
                    this.item.runAction(BAnim);
                }

                else {
                    cc.audioEngine.playEffect(this.MashEffect, false);
                    var callback = cc.callFunc(this.item.getComponent('Mash').Able, this.item);
                    var CAnim = cc.sequence(
                        cc.moveBy(0.3, cc.v2(0, 20)), callback
                    );
                    this.item.runAction(CAnim);
                }
            }

        }
    }
    ColidDone() {
        this.animState = null;
        this.anim.play("QboxIdle");
        this.anim.off("lastframe", this.ColidDone)
        this.IsColided = true;
    }
}
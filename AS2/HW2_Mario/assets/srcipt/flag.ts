const { ccclass, property } = cc._decorator;

@ccclass
export default class Flag extends cc.Component {
    @property(cc.SpriteFrame)
    RedFlag:cc.SpriteFrame = null;
    ChangeFlag(){
        this.getComponent(cc.Sprite).spriteFrame = this.RedFlag; 
    }
}
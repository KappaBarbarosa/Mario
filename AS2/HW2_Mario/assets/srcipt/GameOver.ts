
const { ccclass, property } = cc._decorator;
declare const firebase: any;
@ccclass
export default class StartManager extends cc.Component {

    protected onLoad(): void {
        cc.debug.setDisplayStats(false);
        cc.find('GameManager').getComponent("GameManager").GameOverLoad();
    }
    Quit() {
        var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
        SSMgr.Reason = "start";
        cc.director.loadScene('LevelSelect');

    }
    Again() {
        if(cc.find('GameManager').getComponent("GameManager").MultiData.active)
            alert("Can not Again in 2 player mode!")
        else{
            var SSMgr = cc.find('StartSceneManager').getComponent("StartManager")
            SSMgr.Reason = "Again";
            cc.director.loadScene('LevelSelect');
        }  
    }

}
import StartManager from "./StartManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Turtle extends cc.Component {
    SSMGR:StartManager
    protected onLoad(): void {
        this.SSMGR= cc.find('StartSceneManager').getComponent("StartManager")
        this.SSMGR.Reload();
    }
    GameStart() {
        this.SSMGR.GameStart();
    }
    Login(){
        this.SSMGR.Login();
    }
    SignIn(){
        this.SSMGR.Signin();
    }
    TonextStage(){
        this.SSMGR.ToNextStage("LG");
    }
    TomultiStage(){
        this.SSMGR.ToMultiStage();
    }
    CreatMultiGame(){
        this.SSMGR.CreateMultiGame();
    }
    JoinMultiGame(){
        this.SSMGR.JoinMultiGame();
    }
    GameBack() {
        this.SSMGR.GameBack();
    }
    GameEnd() {
        cc.game.end();
    }
}
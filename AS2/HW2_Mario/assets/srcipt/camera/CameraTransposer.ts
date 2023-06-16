import { GameManager } from "../GameManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class CameraTransposer extends cc.Component {
    @property(cc.Node)
    followTarget: cc.Node = null;
    @property(cc.Node)
    AnotherTarget: cc.Node = null;
    @property(cc.Node)
    UI: cc.Node = null;
    @property(cc.Boolean)
    followX: boolean = true;
    @property(cc.Boolean)
    followY: boolean = true;
    minX: number = -184;
    minY: number = -126;
    maxX: number = 3200;
    maxY: number = -126; 
    offsetX: number = 0;
    offsetY: number = 0;
    MGR:GameManager=null;
    protected onLoad(): void {
        this.MGR = cc.find("GameManager").getComponent("GameManager");
    }
    update(dt) {
        let cameraLocalTransform = cc.mat4();
        this.node.getLocalMatrix(cameraLocalTransform);
        let targetWorldTransform = cc.mat4();
        var Target =this.followTarget ;
        if(this.MGR.MultiData.active){
            if(this.MGR.MultiData.isControl && this.MGR.MultiData.Fdie || !this.MGR.MultiData.isControl && !this.MGR.MultiData.Sdie)
                Target = this.AnotherTarget;
        }
        Target.getWorldMatrix(targetWorldTransform);
        let targetWorldTranslation = cc.v3(0, 0, 0);
        targetWorldTransform.getTranslation(targetWorldTranslation);
        let transformed = cc.v4(targetWorldTranslation.x, targetWorldTranslation.y, targetWorldTranslation.z).transformMat4(cameraLocalTransform);
        let targetPosition = cc.v2(transformed.x, transformed.y).add(cc.v2(-cc.view.getDesignResolutionSize().width /2, -cc.view.getDesignResolutionSize().height / 2));
       
        targetPosition = cc.v2(
            clamp(this.followX ? targetPosition.x : this.node.position.x, this.minX, this.maxX),
            clamp(this.followY ? targetPosition.y : this.node.position.y, this.minY, this.maxY)
        );  
      
        
        this.node.position = targetPosition;
        
    }
}
function clamp(x: number, a: number, b: number) {
    if (x < a) return a;
    if (x > b) return b;
    return x;
}
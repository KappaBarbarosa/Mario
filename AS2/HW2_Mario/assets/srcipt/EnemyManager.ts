const {ccclass, property} = cc._decorator;

@ccclass
export class EnemyManager extends cc.Component {
    @property(cc.Node)
    player:cc.Node=null;
    @property(cc.Prefab)
    GoombaPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    TurtlePrefab: cc.Prefab = null;
}

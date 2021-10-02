import * as BABYLON from 'babylonjs';
//import { AdvancedDynamicTexture , TextBlock, StackPanel} from 'babylonjs-gui';
import * as GUI from 'babylonjs-gui';
import * as HUD from './HudControls';
export default class debugUi {
    constructor(width, height){
        var guiPosition = {width:width, height:height -200};
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        var cross = new HUD.crosshair(guiPosition.width,guiPosition.height);
        cross.draw();
        cross.lines.forEach(x=> advancedTexture.addControl(x));
        this.speedInfo = new HUD.hudSimpleText(-100, -150);
        advancedTexture.addControl(this.speedInfo.element);
        this.powerInfo = new HUD.hudSimpleText(-88, -150);
        advancedTexture.addControl(this.powerInfo.element);
        this.compass = new HUD.compass(guiPosition.width,guiPosition.height);
        this.compass.draw();
        this.compass.elements.forEach(x=> advancedTexture.addControl(x));
    }
    set speed(sp){
        this.speedInfo.element.text = "V= " +sp.toFixed(2).toString();
    }
    set power(pwr){
        this.powerInfo.element.text = "P= " +pwr.toFixed(2).toString();
    }
    set heading(cmp){
        this.compass.angle = cmp;
        this.compass.draw();
    }
}



import * as BABYLON from 'babylonjs';
//import { AdvancedDynamicTexture , TextBlock, StackPanel} from 'babylonjs-gui';
import * as GUI from 'babylonjs-gui';
import * as HUD from '../hud/GuiHudControls';
export default class debugUi {
    constructor(width, height, scene){
        var guiPosition = {width:width, height:height -200};
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        var cross = new HUD.crosshair(guiPosition.width,guiPosition.height);
        cross.draw();
        cross.lines.forEach(x=> advancedTexture.addControl(x));
        this.speedInfo = new HUD.hudSimpleText(-100, -120);
        advancedTexture.addControl(this.speedInfo.element);
        this.powerInfo = new HUD.hudSimpleText(-88, -120);
        advancedTexture.addControl(this.powerInfo.element);
        this.compass = new HUD.compass(guiPosition.width,guiPosition.height);
        this.compass.draw();
        this.compass.elements.forEach(x=> advancedTexture.addControl(x));
        this.pitchLader = new HUD.pitchLader(guiPosition.width,guiPosition.height);
        this.pitchLader.angle = Math.PI/4;
        this.pitchLader.draw();
        advancedTexture.addControl(this.pitchLader.root);

        this.hudWindow = new GUI.Rectangle();
        //this.hudWindow.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        //this.hudWindow.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.hudWindow.widthInPixels = 250;
        this.hudWindow.heightInPixels = 250;
        //this.hudWindow.left = width/2 - containerWidth/2;
        //this.hudWindow.top = (height -(height - containerHeight )/2) -containerHeight;
        this.hudWindow.thickness = 1;   
        //advancedTexture.addControl(this.hudWindow);
        var manager = new GUI.GUI3DManager(scene);
        var panel = new GUI.PlanePanel();
        panel.margin = 0.2;
        manager.addControl(panel);
    }
    linkWithMesh(mesh){
        //this.hudWindow.linkWithMesh(mesh);
        //mesh.parent = this.hudWindow;
        //this.hudWindow.linkOffsetYInPixels = -100;
        
    }
    set speed(sp){
        this.speedInfo.element.text = "V= " +sp.toFixed(2).toString();
    }
    set power(pwr){
        //this.powerInfo.element.text = "P= " +pwr.toFixed(2).toString();
    }
    set heading(cmp){
        this.compass.angle = cmp;
        this.compass.draw();
    }
    setPitchAndRoll(pitch, roll){
        this.pitchLader.angle = pitch;
        this.pitchLader.rotation = roll;
        this.pitchLader.draw();
        this.powerInfo.element.text = roll.toFixed(2).toString();
        
    }
}



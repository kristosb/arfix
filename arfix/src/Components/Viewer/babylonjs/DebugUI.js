import * as BABYLON from 'babylonjs';
//import { AdvancedDynamicTexture , TextBlock, StackPanel} from 'babylonjs-gui';
import * as GUI from 'babylonjs-gui';
export default class debugUi {
    constructor(){
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var stackPanel = new GUI.StackPanel();
        stackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;   
        stackPanel.isVertical = true;
        advancedTexture.addControl(stackPanel);     

        this.text1 = new GUI.TextBlock();
        this.text1.text = "hello";
        this.text1.color = "green";
        this.text1.fontSize = 16;
        this.text1.height = "30px";
        stackPanel.addControl(this.text1);  
        this.text2 = new GUI.TextBlock();
        this.text2.text = "hello";
        this.text2.color = "green";
        this.text2.fontSize = 16;
        this.text2.height = "30px";
        stackPanel.addControl(this.text2); 
    }
    set speed(sp){
        this.text1.text = sp.toString();
    }
    set power(x){
        this.text2.text = x.toString();
    }
}



import * as BABYLON from 'babylonjs';
//import 'babylonjs-loaders';
import * as GUI from 'babylonjs-gui';
//import 'babylonjs-gui';

export default class SettingsGui {

    constructor(scene){
        this.scene = scene;
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, this.scene);    
        this.loadedGUI = null;
        this.create();
        this.numberOfBirds = 5; 
    }
    // Load a GUI from the snippet server.

    create(){
        this.init();
    }
    async init(){
        
        this.loadedGUI = await this.advancedTexture.parseFromSnippetAsync("#MMWSUI#43");
        this.advancedTexture.idealWidth = 1024*1.5;  
        this.advancedTexture.idealHeight = 1024*1.5;

        // Get a control by name a change a property.
        let backgroundBox = this.advancedTexture.getControlByName("BackgroundBox");
        backgroundBox.isVisible = true;


        let startButton = this.advancedTexture.getControlByName("StartGame");
        let exitButton = this.advancedTexture.getControlByName("ExitButton");
        let birdsNumber = this.advancedTexture.getControlByName("BirdsNumber");
        birdsNumber.text = "2"
        exitButton.onPointerClickObservable.add( () => {  
            backgroundBox.isVisible = false;
        });
        startButton.onPointerClickObservable.add( () => {  
            backgroundBox.isVisible = false;
        });
        function checkInput(input) {
            let key = input.currentKey;
            if ((key < "0" || key > "9") && key != ".") {
                input.addKey = false;
            }
        }

        birdsNumber.onBeforeKeyAddObservable.add((input) => {
            checkInput(input);
        });        
        birdsNumber.onTextChangedObservable.add((input) => {
            if(input.text == "") return;
            this.numberOfBirds = Math.min(30,parseInt(input.text));
            console.log(this.numberOfBirds);
        });
    }

}
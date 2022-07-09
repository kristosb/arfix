//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import {Clock} from './utils/Clock';

//import Game from './ecs/EcsJavelin';
import Game from './ecs/Game';
export default function canvas(canvas)  {
    //const canvas = document.getElementsByTagName("canvas").item(0);//.getElementById("canvas");
    //console.log("canv",canv);
    
    const FRAMERATE = 1/40;
    const fpcClock = new Clock();
    /*const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";*/
    const game = new Game();

    function onWindowResize() {
        //engine.resize();
    }
    function animate(){
        //game.step();
        //engine.runRenderLoop(function () {  
        //    if(fpcClock.timeIntervalCheck(FRAMERATE)){
               // game.step(fpcClock.getElapsedTime());  
        //    }
        //});
        game.step();
    }
    return {
        onWindowResize,
        //onMouseMove,
        animate
    }
}

import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import 'babylonjs-loaders';
import SkySim from './../scenery/SkySimulator.js';

import { createImmutableRef } from "@javelin/ecs"


export const UseScene = createImmutableRef(
  () => {
    const canvas = document.getElementsByTagName("canvas").item(0);
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";
    const scene = new BABYLON.Scene(engine);
    const followCamera = new BABYLON.FollowCamera("followcamera", new BABYLON.Vector3(0,0,-100), scene);
    followCamera.heightOffset = 1;
    //followCamera.rotationOffset = 180;
    followCamera.cameraAcceleration = 0.05   ;//0.06 
    followCamera.maxCameraSpeed = 1800;//1800
    followCamera.inertia = 20.0;//20
    followCamera.radius = -5;
    //followCamera.lockedTarget = mesh.object;
    followCamera.attachControl(canvas, false);
    
    scene.activeCamera = followCamera;

    const ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-0.7, 0.3, -0.7), scene); 
    ambientLight.position = new BABYLON.Vector3(0, 55, 5);
    ambientLight.intensity =0.8;
    ambientLight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
    ambientLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ambientLight.setEnabled(true); 

    const sunLight = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.7, -0.3, 0.7), scene); 
    sunLight.position = new BABYLON.Vector3(50,100,100);//new BABYLON.Vector3(0, 50, 0);
    sunLight.intensity = 2.3;
    sunLight.setEnabled(true); 
    
    console.log("scene effect created...")
    return { scene, engine, canvas, followCamera, ambientLight ,sunLight }
  },
  { shared: true },
)

export const UseKeyboard = createImmutableRef(
  () => {
    const {scene} = UseScene();
    //const actions = {a:1};
    var inputMap = {};
    const keys = ["w", "s", "a", "d", "q", "e", "p", "o", "m", "n", "1", "2", "k", "b", "9","0", "l"];
    keys.forEach(key=>inputMap[key] = {type:false,keyState:"up"});
    var actions = {keyAction:0,
                     keyActionTrig:1          
                    }; 
    actions.keyAction = function keyAction(key, onKeyFunc ){//= () => {}
                        if(inputMap[key].type) {
                            onKeyFunc();
                            }
                        }
    actions.keyActionTrig = function keyActionTrig(key, onKeyDownFunc = () => {},onKeyUpFunc = () => {}, onKeyHoldFunc = () => {} ){
                            if(inputMap[key].type) {
                                if(inputMap[key].keyState == "up") {
                                    inputMap[key].keyState = "down"; 
                                    onKeyDownFunc();
                                }
                                else {
                                    inputMap[key].keyState = "hold";
                                    onKeyHoldFunc();
                                }
                            }else{
                                if(inputMap[key].keyState != "up") {
                                    inputMap[key].keyState = "up";
                                    onKeyUpFunc();
                                }
                                
                            }
                        }
    //const sc = sceneBjs;
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type=evt.sourceEvent.type === "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type= false;
    }));
    return {actions};
  },
  { shared: true }
);
export const UseSky = createImmutableRef(() => {
  const { scene, followCamera, } = UseScene()
  const sky = new SkySim(scene, null, null, followCamera, 800);
  sky.transitionSunInclination(15*0.025);
  return sky
},
{ shared: true });
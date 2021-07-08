/*import * as THREE from 'three';
import SceneSubject from './SceneSubject';
import GeneralLights from './GeneralLights';
import { StereoButton } from 'stereogram';
import Hud from './Hud';*/
///Users/krystian/Documents/repositories/arfix/arfix/public/msft-lod.gltf
//import ball from '../../../../public/msft-lod.gltf';
//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
//import * as CANNON from './cannon.js';
import * as CANNON from 'cannon';
import SceneSubject from './SceneSubject';
import Airplane from './Airplane';
//import * as BABYLON from 'babylonjs';
//import { default as Ammo } from 'ammo.js/builds/ammo';

export default function canvas(canvas)  {
    var preserveSize = true;

    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    }
    
    const mousePosition = {
        x: 0,
        y: 0
    }
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    const scene = buildScene();
    const gravity = buildGravity();
    const camera = buildCamera(screenDimensions);
    const sceneSubjects = createSceneSubjects(scene);
    var tinyPlane = new Airplane(scene);//sceneSubjects[1].getAirplane();

    camera.parent = tinyPlane.meshAll[0];
    registerActions(scene, tinyPlane);

    function buildScene() {
        
        // Create a basic BJS Scene object
        const scene = new BABYLON.Scene(engine);

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        //const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
            // Lights
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.specular = BABYLON.Color3.Black();

        var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
        light2.position = new BABYLON.Vector3(0, 5, 5);
        // Return the created scene
        return scene;
    }

    function buildGravity() {
        var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
        var physicsPlugin = new BABYLON.CannonJSPlugin(undefined,undefined,CANNON);
        scene.enablePhysics(gravityVector, physicsPlugin);
        return null;
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 10, -10), scene);
        camera.rotation.y = -90;
        //const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1.5, new BABYLON.Vector3(0, 10, -10));
        //const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);

        // Target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.lowerRadiusLimit = 4;
        camera.upperRadiusLimit = 255;
        camera.wheelDeltaPercentage = 0.01;
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);
        return camera;
    }

    function createSceneSubjects(scene) {
        const sceneSubjects = new SceneSubject(scene);
        return sceneSubjects;
    }
    const showImpostors = function(scene) {

        const physicsViewer = new BABYLON.PhysicsViewer(scene);
        scene.meshes.forEach(mesh => {
            if (mesh.physicsImpostor == null) {
                // no physics impostor, skip
                return;
            }
            physicsViewer.showImpostor(mesh.physicsImpostor, mesh);
        });
    };
    function registerActions(scene, tinyPlane){
            // Keyboard events
        var inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        scene.onBeforeRenderObservable.add(() => {
            if (inputMap["z"]) {
                tinyPlane.lift += 0.1;
            }
            if (inputMap["x"]) {
                tinyPlane.lift -= 0.1;
            }
            if (inputMap["q"]) {
                tinyPlane.roll = -1;
                tinyPlane.applyRollForce(-1);
                //console.log(tinyPlane.roll);
                //tinyPlane.rudderControl(Math.PI/40);
            }
            if (inputMap["e"]) {
                tinyPlane.roll = 1;
                //console.log(tinyPlane.roll);
                tinyPlane.applyRollForce(1);
                //tinyPlane.rudderControl(-Math.PI/40);
            }
            if (inputMap["a"]) {
                tinyPlane.yaw = 1;
                tinyPlane.applyYawForce(1);
                //console.log("a");
            }
            if (inputMap["d"]) {
                tinyPlane.yaw = -1;
                tinyPlane.applyYawForce(-1);
                //console.log("d");
            }
            if (inputMap["w"]) {
                tinyPlane.pitch = 1;
                tinyPlane.applyPitchForce(1);
                //console.log("w");
            }
            if (inputMap["s"]) {
                tinyPlane.pitch = -1;
                tinyPlane.applyPitchForce(-1);
                //console.log("s");
            }
            if (inputMap["m"]) {
                tinyPlane.enginePower = tinyPlane.enginePower + 0.05;
                tinyPlane.speedModifier = 0.12;
                        
                //console.log(tinyPlane.enginePower);
            }else{
            //if(inputMap["n"]){
                tinyPlane.enginePower = tinyPlane.enginePower - 0.01;
                tinyPlane.speedModifier = 0;
            }
            if (inputMap["p"]) {
                //scene.debugLayer.show();
                showImpostors(scene);
            }
            if (inputMap["l"]) {
                //scene.debugLayer.show();
                var a = tinyPlane.velocity;
            }
          }
        );

    }

    function update() {

    }

    function onWindowResize() {
        engine.resize();
    }

    function animate(){
        engine.runRenderLoop(function(){
            scene.render();
        });

    }

    function onMouseMove(x, y) {

    }
    return {
        update,
        onWindowResize,
        onMouseMove,
        animate
    }
}
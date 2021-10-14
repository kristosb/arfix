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
import * as Ammo from 'ammojs';
//import * as CANNON from './cannon.js';
//import * as CANNON from 'cannon';


import SceneSubject from './SceneSubject';
import Airplane from './Airplane';
//import { CarFromBoxesData, ThreeWheelCar } from './VehiclesData';
import VehicleAmmo from './VehicleAmmo';
import { AirplaneChassis, AirplaneFromMesh, AirplaneWW2} from './VehiclesData.js';
import DebugUI from './DebugUI.js';
import HudPanel from './Hud';
import {Clock} from './Clock';


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
    const clock = new Clock();
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";

    const scene = buildScene();
    const physics = buildGravity();
    const camera = followCameraCreate();//buildCamera(screenDimensions);
    //camera.position = new BABYLON.Vector3(-4,0.1,-6);
    var ground = new SceneSubject();
    var inputMap = {};

    var vehicleData = null;
    var vehicle = null;
    var airplane = null;
    var hud = null;
    var assetsManager = new BABYLON.AssetsManager(scene);
    //var meshAirplaneTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/", "airplane.glb");
    var meshAirplaneTask = assetsManager.addMeshTask("airplane", "", process.env.PUBLIC_URL+"/assets/", "airplane-ww2-collision-scaled.glb");
    meshAirplaneTask.onSuccess = function (task) {
        //vehicleData = new AirplaneFromMesh(scene, task.loadedMeshes);//AirplaneChassis(scene);//
        vehicleData = new AirplaneWW2(scene, task.loadedMeshes);
        task.loadedMeshes.forEach((x,i)=>console.log(i,x.id));
        vehicle = new VehicleAmmo(scene, vehicleData);
        //vehicle = new VehicleAmmo(scene, new AirplaneFromMesh(scene, task.loadedMeshes));
        airplane = new Airplane(scene, vehicleData.chassisMesh, vehicleData.controls);
        //camera = followCameraCreate(vehicleData.chassisMesh);
        //firstPersonCamera(vehicleData.chassisMesh);
        camera.lockedTarget =  vehicleData.chassisMesh;
        hud = new HudPanel(scene, canvas);
        hud.linkWithMesh(vehicleData.chassisMesh);
	}
    /*var vehicleData1 = null;
    meshAirplaneTask1.onSuccess = function (task) {
        //vehicleData1 = new AirplaneFromMesh(scene, task.loadedMeshes);//AirplaneChassis(scene);//
        task.loadedMeshes.forEach((x,i)=>console.log(i,x.id));
	}*/
    assetsManager.onTaskSuccess = function (task){
        console.log("manager finished");
        //vehicle.chassisMesh.physicsImpostor.registerBeforePhysicsStep(actions());
        //vehicle.chassisMesh.physicsImpostor.beforeStep = actions();
        //hud = new DebugUI(canvas.width, canvas.height, scene);
        //hud.linkWithMesh(vehicleData.chassisMesh);

        //hud.lockToCamera(camera);
        //console.log("mesh",hud.hudMesh);
        //camera.lockedTarget =  hud.hudMesh;
        //hud.linkWithCamera(camera);
        registerActions(scene);
    }
    assetsManager.load();

    //showAxis(5,scene);
    //registerActions(scene);


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
        //var physicsPlugin = new BABYLON.AmmoJSPlugin(undefined, Ammo, undefined);
        var physicsPlugin = new BABYLON.AmmoJSPlugin(false, Ammo, undefined);
        //physicsPlugin.setTimeStep(16);
        
        //physicsPlugin.setTimeStep(1/10);
        //var physicsPlugin = new BABYLON.CannonJSPlugin(undefined,undefined,CANNON);
        scene.enablePhysics(gravityVector, physicsPlugin);
        var physicsEngine = scene.getPhysicsEngine();
        //physicsEngine.setSubTimeStep(1);

        return physicsPlugin;
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(-1,2,-1), scene);//BABYLON.Vector3(-120,20,-70)

        camera.wheelDeltaPercentage = 0.01;
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);

        return camera;
    }
    function followCameraCreate(mesh){
        var followCamera = new BABYLON.FollowCamera("followcamera", new BABYLON.Vector3(0,0,-100), scene);
        followCamera.heightOffset = 1;
        //followCamera.rotationOffset = 180;
        followCamera.cameraAcceleration = 0.05   ;//0.06
        
    
        followCamera.maxCameraSpeed = 1800;//1800
        followCamera.inertia = 20.0;//20
        followCamera.radius = -5;
        //followCamera.lockedTarget = mesh;
        followCamera.attachControl(canvas, false);
        
        scene.activeCamera = followCamera;
        return followCamera;
    }
    function firstPersonCamera(mesh){
        var targetCam = new BABYLON.TargetCamera("playerCamera", new BABYLON.Vector3(0, 2, -5), scene);
        targetCam.parent = mesh;
        scene.activeCamera = targetCam;
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
    function registerActions(scene){

            // Keyboard events
        //var inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));
        
        //);
        scene.onBeforeRenderObservable.add(() => {
            actions();
        });

    }
    function actions(){
        var pow = 1;

        //scene.onBeforePhysicsObservable.add( () => {
        //scene.onBeforeRenderObservable.add(() => {
            if(vehicle!==null){

            if (inputMap["q"]) {
                airplane.roll = -1;
            }
            if (inputMap["e"]) {
                airplane.roll = 1;
            }
            if (inputMap["a"]) {
                airplane.yaw = 1;
            }
            if (inputMap["d"]) {
                airplane.yaw = -1;
            }
            if (inputMap["w"]) {
                airplane.pitch = 1;
            }
            if (inputMap["s"]) {
                airplane.pitch = -1;
            }
            if (inputMap["m"]) {
                airplane.enginePower = airplane.enginePower + 0.05;//0.05
                airplane.speedModifier = 0.12; //0.12
            }
            if (inputMap["n"]) {
                airplane.enginePower = airplane.enginePower - 0.05;//0.05
            }


            
            if (inputMap["t"]) {
                vehicle.forward(40);
                //console.log(inputMap["t"]);
            }else if(inputMap["t"] !== null){
                vehicle.forward(0);
                //console.log(inputMap["t"]);
                inputMap["t"] = null;
            }

            if (inputMap["g"]) {
                vehicle.backward(20);
            }else if (inputMap["g"] !== null){
                vehicle.backward(0);
                inputMap["g"] = null;
            }


            if (inputMap["f"]) {
                vehicle.right(0.5);
            }else if (inputMap["f"] !== null ){
                vehicle.left(0);
                inputMap["f"] = null;
            }

            if (inputMap["h"]) {
                vehicle.left(0.5);
            }else if(inputMap["h"] !== null){
                vehicle.left(0);
                inputMap["h"] = null;
            }
            
            if (inputMap["b"]) {
                vehicle.brake(10);
            }else if( inputMap["b"] !== null){
                vehicle.unbrake();
                inputMap["b"] = null;
            }
          }
          if (inputMap["p"]) {
            showImpostors(scene);
            }
            if (inputMap["o"]) {
                scene.debugLayer.show();

            }
    }

    function update() {

    }

    function onWindowResize() {
        engine.resize();
    }

    //function vehicleUpdate(){
    //    if(vehicle!==null) vehicle.update();
    //}

    function hudUpdate(){
        if(airplane!==null){ 
            const elapsedTime = clock.getElapsedTime();
            hud.setRotation(new BABYLON.Vector3( 180 +BABYLON.Tools.ToDegrees(airplane.rotation.y),
                                                -BABYLON.Tools.ToDegrees(airplane.rotation.x),
                                                BABYLON.Tools.ToDegrees(airplane.rotation.z)));
            hud.setSpeed(airplane.velocity.z);
            hud.setPower(airplane.enginePower);
            hud.setAltitude(airplane.collision.position.y);
            hud.update(elapsedTime);
            //hud.speed = airplane.velocity.z;
            //hud.power = airplane.enginePower;
            //hud.heading = 180 +BABYLON.Tools.ToDegrees(airplane.rotation.y);
            //hud.setPitchAndRoll( -BABYLON.Tools.ToDegrees(airplane.rotation.x),BABYLON.Tools.ToDegrees(airplane.rotation.z));
        }
    }

    function animate(){

        //assetsManager.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                //actions();
                hudUpdate();
                scene.render();
                //vehicleUpdate();
            });
        //}
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
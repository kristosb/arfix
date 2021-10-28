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
//import 'babylonjs-materials';
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
import SkySim from './SkySimulator.js';
//import { SkyMaterial } from 'babylonjs-materials/sky/skyMaterial';
/*var addShadows = function(mesh){
    mesh.receiveShadows = true;
    shadowGenerator.addShadowCaster(mesh);
}*/

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
    const lights = buildLight(scene);
    const sky = new SkySim(scene, lights.sunLight, lights.ambientlight, camera, 1000);
    sky.makeClouds();
    //camera.position = new BABYLON.Vector3(-4,0.1,-6);
    var ground = new SceneSubject();
    var inputMap = {};
    var tinyAirplane = {vehicleData:null,vehicle:null, airplane:null, hud: null };
    var assetsManager = new BABYLON.AssetsManager(scene);
    //var meshAirplaneTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/", "airplane.glb");
    var meshAirplaneTask = assetsManager.addMeshTask("airplane", "", process.env.PUBLIC_URL+"/assets/", "airplane-ww2-collision-scaled.glb");
    meshAirplaneTask.onSuccess = function (task) {
        //vehicleData = new AirplaneFromMesh(scene, task.loadedMeshes);//AirplaneChassis(scene);//
        tinyAirplane.vehicleData = new AirplaneWW2(scene, task.loadedMeshes);
        
        //task.loadedMeshes.forEach((x,i)=>console.log(i,x.id));
        tinyAirplane.vehicle = new VehicleAmmo(scene, tinyAirplane.vehicleData);
        tinyAirplane.airplane = new Airplane(scene, tinyAirplane.vehicleData.chassisMesh, tinyAirplane.vehicleData.controls);
        //camera = followCameraCreate(vehicleData.chassisMesh);
        //firstPersonCamera(vehicleData.chassisMesh);
        camera.lockedTarget =  tinyAirplane.vehicleData.chassisMesh;
        tinyAirplane.hud = new HudPanel(scene, canvas);
        tinyAirplane.hud.linkWithMesh(tinyAirplane.vehicleData.chassisMesh);
        
	}

    assetsManager.onTaskSuccess = function (task){
        console.log("manager finished");
        registerActions(scene);
    }
    assetsManager.load();

    //showAxis(5,scene);


    function buildScene() {
        
        // Create a basic BJS Scene object
        const scene = new BABYLON.Scene(engine);
        //scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
        //scene.environmentTexture = BABYLON.BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;
        // Return the created scene
        return scene;
    }
    function buildLight(scene){
        // Light
        var sunLight = new BABYLON.PointLight("sunPointLight", new BABYLON.Vector3(0, 1, 0), scene);
        sunLight.intensity = 0.5;
        sunLight.setEnabled(true);
        var ambientlight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
        ambientlight.intensity =2;
        ambientlight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
        ambientlight.groundColor = new BABYLON.Color3(0, 0, 0);
        return {sunLight, ambientlight};
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
        /*scene.onBeforeRenderObservable.add(() => {
            actions();
        });*/

    }
    function actions(){
        //scene.onBeforePhysicsObservable.add( () => {
        //scene.onBeforeRenderObservable.add(() => {
            if(tinyAirplane.vehicle!==null){

            if (inputMap["q"]) {
                tinyAirplane.airplane.roll = -1;
            }
            if (inputMap["e"]) {
                tinyAirplane.airplane.roll = 1;
            }
            if (inputMap["a"]) {
                tinyAirplane.airplane.yaw = 1;
                tinyAirplane.vehicle.direction = 0.5;
            }
            if (inputMap["d"]) {
                tinyAirplane.airplane.yaw = -1;
                tinyAirplane.vehicle.direction = -0.5;
            }
            if (inputMap["w"]) {
                tinyAirplane.airplane.pitch = 1;
            }
            if (inputMap["s"]) {
                tinyAirplane.airplane.pitch = -1;
            }
            if (inputMap["m"]) {
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower + 0.05;//0.05
                tinyAirplane.airplane.speedModifier = 0.12; //0.12
                tinyAirplane.vehicle.acceleration = 40;
            }
            if (inputMap["n"]) {
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower - 0.05;//0.05
                tinyAirplane.vehicle.acceleration = -20;
            }
            
            if (inputMap["b"]) {
                tinyAirplane.vehicle.breakingForce = 10;
            }

            }
            if (inputMap["p"]) {
                showImpostors(scene);
            }
            if (inputMap["o"]) {
                scene.debugLayer.show();
            }
            if (inputMap["1"]) {
                sky.transitionSunInclination(0.025);
            }
            if (inputMap["2"]) {
                sky.transitionSunInclination(-0.025);
            }

    }

    function update() {

    }

    function onWindowResize() {
        engine.resize();
    }

    function hudUpdate(){
        if(tinyAirplane.airplane!==null){ 
            const elapsedTime = clock.getElapsedTime();
            tinyAirplane.hud.setRotation(new BABYLON.Vector3( 180 +BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.y),
                                                -BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.x),
                                                BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.z)));
            tinyAirplane.hud.setSpeed(tinyAirplane.airplane.velocity.z);
            tinyAirplane.hud.setPower(tinyAirplane.airplane.enginePower);
            tinyAirplane.hud.setAltitude(tinyAirplane.airplane.collision.position.y);
            tinyAirplane.hud.update(elapsedTime);
            }
    }

    function animate(){

        //assetsManager.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                actions();
                hudUpdate();
                sky.update();
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
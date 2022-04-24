//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
//import 'babylonjs-materials';
//import { ShadowOnlyMaterial } from "babylonjs-materials";
import * as Ammo from 'ammojs';
//import * as CANNON from './cannon.js';
import * as CANNON from 'cannon';
//import * as YUKA from 'yuka';

import SceneSubject from './SceneSubject';
import Airplane from './Airplane';
//import { CarFromBoxesData, ThreeWheelCar } from './VehiclesData';
//import VehicleAmmo from './VehicleAmmo';
import { AirplaneChassis, AirplaneFromMesh, AirplaneWW2} from './VehiclesData.js';
import DebugUI from './DebugUI.js';
import HudPanel from './Hud';
import {Clock} from './Clock';
import SkySim from './SkySimulator.js';
import OceanSim from './OceanSimulator.js';
import ShadowManager from './sahdowManager';
import Inspector from './instrumentation';
import Suspension from './Vehicle';
import Battleship from './BattleShip';

function createPhysicsImpostor(scene, entity, impostor, options, reparent) {
    if (entity == null) return;
    entity.checkCollisions = false;
    const parent = entity.parent;
    if (reparent === true) entity.parent = null;
    entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
    //console.log(entity.physicsImpostor.physicsBody);
    if (reparent === true) entity.parent = parent;
};

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
    //const debugUI = null;//new Inspector(engine);
    var sceneLoaded = false;
    const physics = buildGravity();
    const physicsViewer = new BABYLON.PhysicsViewer(scene);
    const camera = followCameraCreate();//buildCamera(screenDimensions);//
    const lights = buildLight(scene);
    const worldSize = 800;
    // yuka
    var nimitzCarrier = null;


    const sky = new SkySim(scene, lights.sunLight, lights.ambientlight, camera, worldSize);
    sky.makeClouds(worldSize);

    camera.maxZ = worldSize*1.4;
    var ocean = null;//new OceanSim(scene, worldSize);
    var ground = null;
    var groundShadow = null;
    groundShadow = new ShadowManager(lights.sunLight);
    var inputMap = {};
    const keys = ["w", "s", "a", "d", "q", "e", "p", "o", "m", "n", "1", "2", "k", "b"];
    //inputMap["k"] = {type:false,keyState:"up"};
    keys.forEach(key=>inputMap[key] = {type:false,keyState:"up"});
    var tinyAirplane = {
        vehicleData:null,
        vehicle:null, 
        airplane:null, 
        hud: null 
    };
    //var nimitz = null;
    var assetsManager = new BABYLON.AssetsManager(scene);
    var meshWorldTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/assets//", "achil_2.glb");
    var meshAirplaneTask = assetsManager.addMeshTask("airplane", "", process.env.PUBLIC_URL+"/assets/", "airplane-ww2-collision-scaled.glb");
    var meshCarrierTask = assetsManager.addMeshTask("nimitz", "", process.env.PUBLIC_URL+"/assets/", "nimitz_single_mesh.glb");
    meshWorldTask.onSuccess = function (task) {   
        var meshAll = task.loadedMeshes;
        meshAll[0].removeChild(meshAll[1]);
        const ground = meshAll[1]; 
        ground.setParent(null);  
        meshAll[0].dispose(); 
        ground.scaling = ground.scaling.multiplyByFloats(8,8,8); 
        ground.position.y = -1.2;
        ground.name = "terrain";
        /*ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.3 }, scene
        );*/
        
        //optimization
        ground.material.freeze();
        ground.freezeWorldMatrix();
        ground.doNotSyncBoundingInfo = true;
        groundShadow.addMesh(ground);
        ground.receiveShadows = true;
        console.log("world finished");
        
    }
    meshAirplaneTask.onSuccess = function (task) {
        tinyAirplane.vehicleData = new AirplaneWW2(scene, task.loadedMeshes, new BABYLON.Vector3(275, 6.5, 364),new BABYLON.Vector3(0,-Math.PI/2,0));
        //tinyAirplane.vehicleData.chassisMesh.rotate(BABYLON.Vector3.Up(), Math.PI/2); //rotation.x = Math.PI/2;//set(new BABYLON.Vector3(Math.PI/2,0,0));
        console.log("rot",tinyAirplane.vehicleData.chassisMesh.rotation);// = new BABYLON.Vector3(0,0,0);
        tinyAirplane.vehicle = new Suspension(scene, tinyAirplane.vehicleData);
        tinyAirplane.airplane = new Airplane(scene, tinyAirplane.vehicleData.chassisBody, tinyAirplane.vehicleData.controls);
        tinyAirplane.hud = new HudPanel(scene, canvas);
        tinyAirplane.hud.linkWithMesh(tinyAirplane.vehicleData.chassisMesh);  
        camera.lockedTarget =  tinyAirplane.vehicleData.chassisMesh; 
        //console.log(tinyAirplane.vehicleData.chassisMesh);
        tinyAirplane.vehicleData.chassisMesh.setAbsolutePosition(new BABYLON.Vector3(-10,5.7,-5));
        //tinyAirplane.vehicleData.chassisMesh.setAbsolutePosition(new BABYLON.Vector3(250+10,5.7,200+145));//new BABYLON.Vector3(60,8,100));
        tinyAirplane.vehicleData.visualMeshes[0].receiveShadows = true;
        groundShadow.addMesh(tinyAirplane.vehicleData.visualMeshes[0]);
        //optimization
        tinyAirplane.vehicleData.visualMeshes[0].material.freeze();
        console.log("airplane finished");
    }
    meshCarrierTask.onSuccess = function (task) {
        var nimitzMesh = task.loadedMeshes[0];
        nimitzCarrier = new Battleship(scene,nimitzMesh);
    }

    assetsManager.onFinish= function (task){
        registerActions(scene);
        ocean = new OceanSim(scene, worldSize);
        sceneLoaded = true;
        //showImpostors(scene);
        console.log("manager finished");
    }
    assetsManager.load();

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
        var sunLight = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.7, -0.3, 0.7), scene);
        sunLight.position = new BABYLON.Vector3(50,100,100);//new BABYLON.Vector3(0, 50, 0);
        sunLight.intensity = 2.3;
        sunLight.setEnabled(true);   

        var ambientlight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-0.7, 0.3, -0.7), scene);
        ambientlight.position = new BABYLON.Vector3(0, 55, 5);
        ambientlight.intensity =0.8;
        ambientlight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
        ambientlight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ambientlight.setEnabled(true);

        return {sunLight, ambientlight};
    }

    function buildGravity() {
        var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
        //var physicsPlugin = new BABYLON.AmmoJSPlugin(undefined, Ammo, undefined);
        //var physicsPlugin = new BABYLON.AmmoJSPlugin(false, Ammo, undefined);
        //physicsPlugin.setTimeStep(16);
        
        //physicsPlugin.setTimeStep(1/10);
        var physicsPlugin = new BABYLON.CannonJSPlugin(false,undefined,CANNON);
        scene.enablePhysics(gravityVector, physicsPlugin);
        var physicsEngine = scene.getPhysicsEngine();
        scene.physicsEnabled = false;
        //physicsEngine.setSubTimeStep(1);

        return physicsPlugin;
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
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type=evt.sourceEvent.type === "keydown";// evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};// +(evt.sourceEvent.type == "keydown")+(inputMap[evt.sourceEvent.key]==1);//
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type= false;//if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key] = {type:false,keyState:"up"};//+(evt.sourceEvent.type == "keydown");//-(inputMap[evt.sourceEvent.key]==1);//evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));

    }
    function actions(){
        if(tinyAirplane.vehicle!==null){
            keyAction("q", ()=>tinyAirplane.airplane.roll = -1);
            keyAction("e", ()=>tinyAirplane.airplane.roll = 1);
            /*keyAction("a", ()=>{
                tinyAirplane.airplane.yaw = 1;
                //tinyAirplane.vehicle.direction = 0.5;
                //tinyAirplane.vehicle.direction = -Math.PI/6;
            });
            keyAction("d", ()=>{
                tinyAirplane.airplane.yaw = -1;
                //tinyAirplane.vehicle.direction = -0.5;
                //tinyAirplane.vehicle.direction = Math.PI/6;
            });*/
            keyAction("w", ()=>tinyAirplane.airplane.pitch = 1);
            keyAction("s", ()=>tinyAirplane.airplane.pitch = -1);
            //keyActionTrig("w", ()=>tinyAirplane.vehicle.forward(5),()=>tinyAirplane.vehicle.forward(0));
            //keyActionTrig("s", ()=>tinyAirplane.vehicle.forward(-5),()=>tinyAirplane.vehicle.forward(0));
            keyActionTrig("d", ()=>{
                tinyAirplane.airplane.yaw = -1;
                tinyAirplane.vehicle.left(0.5);
                },()=>tinyAirplane.vehicle.left(0),
                ()=>tinyAirplane.airplane.yaw = -1);
            keyActionTrig("a", ()=>{
                tinyAirplane.airplane.yaw = 1;
                tinyAirplane.vehicle.right(0.5);
                },()=>tinyAirplane.vehicle.right(0),
                ()=>tinyAirplane.airplane.yaw = 1);
            keyAction("m", ()=> {
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower + 0.005;
                tinyAirplane.airplane.speedModifier = 0.12; //0.12
                //tinyAirplane.vehicle.acceleration = 20;//40
                
                //tinyAirplane.vehicle.vehicle.setWheelForce(400, 0);
                //tinyAirplane.vehicle.vehicle.setWheelForce(400, 1);
            });
            keyAction("n", ()=> {
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower - 0.005;
                //tinyAirplane.vehicle.acceleration = -20;//-20
            });
            keyActionTrig("b", ()=> tinyAirplane.vehicle.brake(5),
                               ()=> tinyAirplane.vehicle.unbrake(),
                               ()=> tinyAirplane.vehicle.brake(5));
        }

        keyActionTrig("o", ()=> scene.debugLayer.show());
        keyActionTrig("1", ()=> {
            sky.transitionSunInclination(0.025);
            groundShadow.updateOnce();
        });
        keyActionTrig("2",()=> {
            sky.transitionSunInclination(-0.025);
            groundShadow.updateOnce();
        });
        keyActionTrig("p", ()=> scene.physicsEnabled = !scene.physicsEnabled);
        
        //keyActionTrig("k", ()=> console.log("down"));//, x=>console.log("hold"));
            
    }

    function keyAction(key, onKeyFunc ){//= () => {}
        if(inputMap[key].type) {
            onKeyFunc();
        }
    }
    /*function keyActionTrig(key, onKeyDownFunc = () => {}, onKeyHoldFunc = () => {} ){
        if(inputMap[key].type) {
            if(inputMap[key].keyState == "up") {
                inputMap[key].keyState = "down"; 
                onKeyDownFunc();
            }
            else {
                inputMap[key].keyState = "hold";
                onKeyHoldFunc();
            }
        }

    }*/
    function keyActionTrig(key, onKeyDownFunc = () => {},onKeyUpFunc = () => {}, onKeyHoldFunc = () => {} ){
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

    function update() {

    }

    function onWindowResize() {
        engine.resize();
    }

    function hudUpdate(){
        //if(tinyAirplane.airplane!==null){ 
        if(!tinyAirplane.airplane) console.error("airplane modlel mesh error");
        const elapsedTime = clock.getElapsedTime();
        //console.log(elapsedTime);
        tinyAirplane.hud.setRotation(new BABYLON.Vector3( 180 +BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.y),
                                            -BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.x),
                                            BABYLON.Tools.ToDegrees(tinyAirplane.airplane.rotation.z)));
        tinyAirplane.hud.setSpeed(tinyAirplane.airplane.velocity.z);
        tinyAirplane.hud.setPower(tinyAirplane.airplane.enginePower);
        tinyAirplane.hud.setAltitude(tinyAirplane.airplane.collision.position.y);
        tinyAirplane.hud.update(elapsedTime);
            //}
    }
    function animate(){
        //assetsManager.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                if (sceneLoaded){
                    actions();
                    hudUpdate();
                    //tinyAirplane.vehicle.update();
                    nimitzCarrier.update();
                    //relativeVehicleForceUpdate();
                    //if (debugUI) debugUI.update();
                    scene.render();
                }
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

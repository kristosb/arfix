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
import Airship from './Airship';
import Birds from './Birds';
import vehicleParts from './VehicleComponents';
//import { createVehicle } from './ActorsShapes.js'

export default function canvas(canvas)  {
    var preserveSize = true;
    const FRAMERATE = 1/40;
    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    }
    
    const mousePosition = {
        x: 0,
        y: 0
    }
    //const clock = new Clock();
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";
    engine.stopRenderLoop();
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
    var airshipCarrier = null;
    var birdFlock = null;
    var recorder = null;
    const sky = new SkySim(scene, lights.sunLight, lights.ambientlight, camera, worldSize);
    sky.makeClouds(worldSize);

    camera.maxZ = worldSize*1.4;
    var ocean = null;//new OceanSim(scene, worldSize);
    var ground = null;
    var groundShadow = null;
    const fpcClock = new Clock();

    groundShadow = new ShadowManager(lights.sunLight);
    var inputMap = {};
    const keys = ["w", "s", "a", "d", "q", "e", "p", "o", "m", "n", "1", "2", "k", "b", "9","0"];
    keys.forEach(key=>inputMap[key] = {type:false,keyState:"up"});

    var assetsManager = new BABYLON.AssetsManager(scene);
    var meshWorldTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/assets//", "achil_2.glb");
    var meshAirplaneTask = assetsManager.addMeshTask("airplane", "", process.env.PUBLIC_URL+"/assets/", "airplane-ww2-collision-scaled.glb");
    var meshCarrierTask = assetsManager.addMeshTask("nimitz", "", process.env.PUBLIC_URL+"/assets/", "nimitz_single_mesh.glb");
    var meshBirdTask = assetsManager.addMeshTask("bird", "", process.env.PUBLIC_URL+"/assets/", "flying-gull.glb");
    var meshAirshipTask = assetsManager.addMeshTask("airship", "", process.env.PUBLIC_URL+"/assets/", "titan_parts_joined_uvmapped.glb");
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
    var aircraft = new vehicleParts();

    meshAirplaneTask.onSuccess = function (task) {
        aircraft.bluePrint = new AirplaneWW2(scene, task.loadedMeshes, new BABYLON.Vector3(275, 6.5, 364),new BABYLON.Vector3(0,-Math.PI/2,0));
        aircraft.suspension = new Suspension(scene, aircraft.bluePrint);
        aircraft.avionics = new Airplane(scene, aircraft.bluePrint.chassisBody, aircraft.bluePrint.controls);
        aircraft.hud = new HudPanel(scene, canvas);
        aircraft.hud.linkWithMesh(aircraft.bluePrint.chassisMesh); 
        camera.lockedTarget =  aircraft.bluePrint.chassisMesh; 
        aircraft.position = new BABYLON.Vector3(-10,5.7,-5);
        groundShadow.addMesh(aircraft.bluePrint.visualMeshes[0]);

        console.log("airplane finished");
    }
    meshCarrierTask.onSuccess = function (task) {
        var nimitzMesh = task.loadedMeshes[0];
        nimitzCarrier = new Battleship(scene,nimitzMesh);
    }
    meshAirshipTask.onSuccess = function (task) {
        var airshipMesh = task.loadedMeshes[0];
        airshipCarrier = new Airship(scene,airshipMesh,{debug:false});
    }
    meshBirdTask.onSuccess = function (task) {
        const gullModel = task.loadedMeshes[1];
        gullModel.scaling = new BABYLON.Vector3(0.012,0.012,0.012);
        gullModel.rotationQuaternion = new BABYLON.Vector3(0,-Math.PI/4,0).toQuaternion();
        gullModel.bakeCurrentTransformIntoVertices();
        console.log("gull",gullModel);
        var birds = [];
        //const vehicleMeshPrefab = createVehicle(scene, { size: 1 });
        for (let i = 0; i < 20; i++){
            //const gull = gullModel.clone('gull_'+i.toString());
            const gull = gullModel.createInstance('gull_'+i.toString());
            //gull.setEnabled(true);
            birds.push(gull);
        }
        //camera.lockedTarget =  birds[0]; 
        birdFlock = new Birds(scene, birds);
        //gullModel.dispose();

    }

    assetsManager.onFinish= function (task){
        registerActions(scene);
        ocean = new OceanSim(scene, worldSize);
        recorder = new BABYLON.VideoRecorder(engine);
        sceneLoaded = true;
        animate();
        console.log("manager finished");
    }
    assetsManager.load();


    function buildScene() {  
        // Create a basic BJS Scene object
        const scene = new BABYLON.Scene(engine);
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
        physicsPlugin.setTimeStep(1/30);
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
        if(aircraft.ready){
            keyAction("q", ()=>aircraft.steer(vehicleParts.DIR.TILT_LEFT));
            keyAction("e", ()=>aircraft.steer(vehicleParts.DIR.TILT_RIGHT));
            keyAction("w", ()=>aircraft.steer(vehicleParts.DIR.DOWN));
            keyAction("s", ()=>aircraft.steer(vehicleParts.DIR.UP));
            keyActionTrig("d", ()=>aircraft.steer(vehicleParts.DIR.LEFT),
                               ()=>aircraft.steer(vehicleParts.DIR.LEFT_RESET),
                               ()=>aircraft.steer(vehicleParts.DIR.LEFT_HOLD));
            keyActionTrig("a", ()=>aircraft.steer(vehicleParts.DIR.RIGHT),
                               ()=>aircraft.steer(vehicleParts.DIR.RIGHT_RESET),
                               ()=>aircraft.steer(vehicleParts.DIR.RIGHT_HOLD));   
            keyAction("m", ()=>aircraft.power(vehicleParts.DIR.POWER_UP));    
            keyAction("n", ()=>aircraft.power(vehicleParts.DIR.POWER_DOWN));     
            keyActionTrig("b", ()=> aircraft.brake(vehicleParts.DIR.BRAKE),
                               ()=> aircraft.brake(vehicleParts.DIR.UNBRAKE),
                               ()=> aircraft.brake(vehicleParts.DIR.BRAKE));   
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
        keyActionTrig("p", ()=> {
            scene.physicsEnabled = !scene.physicsEnabled;
            nimitzCarrier.pause = scene.physicsEnabled;
            airshipCarrier.pause = scene.physicsEnabled;
            birdFlock.pause = scene.physicsEnabled;
        });
        keyActionTrig("9", ()=> {
            if (BABYLON.VideoRecorder.IsSupported(engine)) {
                
                recorder.startRecording("test.webm", 0);
                console.log("start rec");
            }
        });
        keyActionTrig("0", ()=> {
            if (BABYLON.VideoRecorder.IsSupported(engine)) {
                
                recorder.stopRecording();
                console.log("stop rec");
            }
        });
        
        //keyActionTrig("k", ()=> console.log("down"));//, x=>console.log("hold"));
            
    }

    function keyAction(key, onKeyFunc ){//= () => {}
        if(inputMap[key].type) {
            onKeyFunc();
        }
    }

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
    function animate(){
        //assetsManager.onFinish = function (tasks) {
            //engine.stopRenderLoop();
            engine.runRenderLoop(function () {
                if (sceneLoaded){
                    //const elps = fpcClock.getDelta();
                    
                    if(fpcClock.timeIntervalCheck(FRAMERATE)){
                        actions();
                        aircraft.update();
                        birdFlock.update();
                        birdFlock.enemyPosition  = aircraft.position;
                        nimitzCarrier.update();
                        airshipCarrier.update();
                        //if (debugUI) debugUI.update();
                        //if(scene.physicsEnabled) 
                        scene.render();
                    }
                }
            });
        //}
    }


    return {
        update,
        onWindowResize,
        //onMouseMove,
        animate
    }
}

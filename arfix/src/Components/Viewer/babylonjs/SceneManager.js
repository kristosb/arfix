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

const DIR = {UP:1, DOWN:2,LEFT:3, RIGHT:4,  TILT_LEFT:5, TILT_RIGHT:6, BRAKE:7, LEFT_RESET:8, RIGHT_RESET:9, POWER_UP:10, POWER_DOWN:11, LEFT_HOLD:12, RIGHT_HOLD:13, UNBRAKE:14};
class vehicleParts{
    constructor(){
        this.bluePrint = null;
        this.suspension = null;
        this.avionics = null;
        this.hud = null;
        this.clock = new Clock();
    }
    set position(pos){
        this.bluePrint.chassisMesh.setAbsolutePosition(pos);
    }
    get ready(){
        return this.suspension!==null
    }
    
    steer(dir){
        switch(dir){
            case DIR.UP:
                //console.log("up");
                this.avionics.pitch = -1;
                break;
            case DIR.DOWN:
                //console.log("up");
                this.avionics.pitch = 1;
                break;
            case DIR.LEFT:
                //console.log("left");
                this.avionics.yaw = -1;
                this.suspension.left(0.5);
                break;
            case DIR.RIGHT:
                //console.log("right");
                this.avionics.yaw = 1;
                this.suspension.right(0.5);
                break;
            case DIR.LEFT_RESET:
                //console.log("left reset");
                this.suspension.left(0);
                break;
            case DIR.RIGHT_RESET:
                //console.log("right reset");
                this.suspension.right(0);
                break;
            case DIR.LEFT_HOLD:
                //console.log("left hold");
                this.avionics.yaw = -1;
                break;
            case DIR.RIGHT_HOLD:
                //console.log("right hold");
                this.avionics.yaw = 1;
                break;
            case DIR.TILT_LEFT:
                //console.log("tilt left");
                this.avionics.roll = -1;
                break;
            case DIR.TILT_RIGHT:
                //console.log("tilt right");
                this.avionics.roll = 1;
                break;
            default:
                console.log("vehicle invalid direction");
        }
    }
    power(val){
        switch(val){
            case DIR.POWER_UP:
                //console.log("power up");
                this.avionics.enginePower = this.avionics.enginePower + 0.005;
                this.avionics.speedModifier = 0.12;
                break;
            case DIR.POWER_DOWN:
                //console.log("power down");
                this.avionics.enginePower = this.avionics.enginePower - 0.005;
                break;
            default:
                console.log("vehicle invalid power");
        }
    }
    brake(val){
        switch(val){
            case DIR.BRAKE:
                this.suspension.brake(5);
                break;
            case DIR.UNBRAKE:
                this.suspension.unbrake();
                break;
            default:
                console.log("vehicle invalid power");
        }
    }

    update(){
        if(this.avionics!=null && this.hud!=null){ //console.error("airplane modlel mesh error");
            const elapsedTime = this.clock.getElapsedTime();
            //console.log(elapsedTime);
            this.hud.setRotation(new BABYLON.Vector3( 180 +BABYLON.Tools.ToDegrees(this.avionics.rotation.y),
                                                -BABYLON.Tools.ToDegrees(this.avionics.rotation.x),
                                                BABYLON.Tools.ToDegrees(this.avionics.rotation.z)));
            this.hud.setSpeed(this.avionics.velocity.z);
            this.hud.setPower(this.avionics.enginePower);
            this.hud.setAltitude(this.avionics.collision.position.y);
            this.hud.update(elapsedTime);
        }//else {console.log("nohud")}

    }
}

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
    //const clock = new Clock();
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
    keys.forEach(key=>inputMap[key] = {type:false,keyState:"up"});

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

    assetsManager.onFinish= function (task){
        registerActions(scene);
        ocean = new OceanSim(scene, worldSize);
        sceneLoaded = true;
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
            keyAction("q", ()=>aircraft.steer(DIR.TILT_LEFT));
            keyAction("e", ()=>aircraft.steer(DIR.TILT_RIGHT));
            keyAction("w", ()=>aircraft.steer(DIR.DOWN));
            keyAction("s", ()=>aircraft.steer(DIR.UP));
            keyActionTrig("d", ()=>aircraft.steer(DIR.LEFT),
                               ()=>aircraft.steer(DIR.LEFT_RESET),
                               ()=>aircraft.steer(DIR.LEFT_HOLD));
            keyActionTrig("a", ()=>aircraft.steer(DIR.RIGHT),
                               ()=>aircraft.steer(DIR.RIGHT_RESET),
                               ()=>aircraft.steer(DIR.RIGHT_HOLD));   
            keyAction("m", ()=>aircraft.power(DIR.POWER_UP));    
            keyAction("n", ()=>aircraft.power(DIR.POWER_DOWN));     
            keyActionTrig("b", ()=> aircraft.brake(DIR.BRAKE),
                               ()=> aircraft.brake(DIR.UNBRAKE),
                               ()=> aircraft.brake(DIR.BRAKE));   
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
            engine.runRenderLoop(function () {
                if (sceneLoaded){
                    actions();
                    aircraft.update();
                    nimitzCarrier.update();
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

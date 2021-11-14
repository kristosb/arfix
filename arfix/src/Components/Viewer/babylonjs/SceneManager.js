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
//import { ShadowOnlyMaterial } from "babylonjs-materials";
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
import ShadowManager from './sahdowManager';
//import { SkyMaterial } from 'babylonjs-materials/sky/skyMaterial';
/*var addShadows = function(mesh){
    mesh.receiveShadows = true;
    shadowGenerator.addShadowCaster(mesh);
}*/
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
    const physics = buildGravity();
    const physicsViewer = new BABYLON.PhysicsViewer(scene);
    const camera = followCameraCreate();//buildCamera(screenDimensions);//
    const lights = buildLight(scene);
    const worldSize = 800;
    const sky = new SkySim(scene, lights.sunLight, lights.ambientlight, camera, worldSize);
    sky.makeClouds(worldSize);
    //sky.transitionSunInclination(0.4);
    camera.maxZ = worldSize*1.4;
    /*console.log("max",camera.maxZ);

    console.log(lights.sunLight.shadowMinZ, lights.sunLight.shadowMaxZ );
    var dlh = new DirectionalLightHelper(lights.sunLight, camera);

    window.setTimeout(() => {
        scene.onAfterRenderObservable.add(() => dlh.buildLightHelper());
    }, 500);*/
    //camera.position = new BABYLON.Vector3(-4,0.1,-6);
    //var ground = new SceneSubject().makeTerrain(worldSize);
    var ground = null;
    var groundShadow = null;
    groundShadow = new ShadowManager(lights.sunLight );
    var inputMap = {};
    var tinyAirplane = {
        vehicleData:null,
        vehicle:null, 
        airplane:null, 
        hud: null 
    };
    var assetsManager = new BABYLON.AssetsManager(scene);
    var meshWorldTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/assets//", "achil_1_opt.glb");
    var meshAirplaneTask = assetsManager.addMeshTask("airplane", "", process.env.PUBLIC_URL+"/assets/", "airplane-ww2-collision-scaled.glb");
    meshWorldTask.onSuccess = function (task) {   
        var meshAll = task.loadedMeshes;
        meshAll[0].removeChild(meshAll[1]);
        const ground = meshAll[1];

        ground.setParent(null);   
        //ground.position.y -= 40; 
        ground.scaling = ground.scaling.multiplyByFloats(8,8,8);  
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.3 }, scene
        );
        /*let material = new BABYLON.StandardMaterial('standard', scene)
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5)
        material.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05)      
        ground.material= material;*/  
        meshAll[0].dispose();
        ground.receiveShadows = true;
        groundShadow.addMesh(ground);
        console.log("world finished");
        
    }
    meshAirplaneTask.onSuccess = function (task) {
        tinyAirplane.vehicleData = new AirplaneWW2(scene, task.loadedMeshes);
        tinyAirplane.vehicle = new VehicleAmmo(scene, tinyAirplane.vehicleData);
        tinyAirplane.airplane = new Airplane(scene, tinyAirplane.vehicleData.chassisMesh, tinyAirplane.vehicleData.controls);
        tinyAirplane.hud = new HudPanel(scene, canvas);
        tinyAirplane.hud.linkWithMesh(tinyAirplane.vehicleData.chassisMesh);  
        camera.lockedTarget =  tinyAirplane.vehicleData.chassisMesh; 
        //console.log(tinyAirplane.vehicleData.chassisMesh);
        tinyAirplane.vehicleData.chassisMesh.setAbsolutePosition(new BABYLON.Vector3(60,8,100));
        //buildShadows(camera, lights.sunLight,tinyAirplane.vehicleData.visualMeshes[0]);//camera, lights.sunLight, ground.cubes[1]);
        tinyAirplane.vehicleData.visualMeshes[0].receiveShadows = true;
        //groundShadow.addMesh(tinyAirplane.vehicleData.visualMeshes[0]);
        console.log("airplane finished");
    }

    assetsManager.onFinish= function (task){
        registerActions(scene);
        scene.physicsEnabled = false;
        //console.log("g",ground);
        
        //groundShadow.addMesh(tinyAirplane.vehicleData.visualMeshes[0]);
        console.log("manager finished");

    }
    assetsManager.load();
    //buildShadows(camera);
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
        //var sunLight = new BABYLON.PointLight("sunPointLight", new BABYLON.Vector3(0, 1, 0), scene);
        var sunLight = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        sunLight.position = new BABYLON.Vector3(50,10,100);//new BABYLON.Vector3(0, 50, 0);
        sunLight.intensity = 1;
        //sunLight.autoCalcShadowZBounds
        //sunLight.shadowMinZ = 0;
        //sunLight.shadowMaxZ = 30;
        sunLight.setEnabled(true);
        

        var ambientlight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
        ambientlight.position = new BABYLON.Vector3(0, 55, 5);
        ambientlight.intensity =2;
        ambientlight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
        ambientlight.groundColor = new BABYLON.Color3(0, 0, 0);
        ambientlight.setEnabled(true);
        return {sunLight, ambientlight};
    }
    function buildShadows(camera, light, mesh){//camera, light1, mesh){
        //console.log("box",light);
        //camera.maxZ=1000;
        engine.getCaps().maxVaryingVectors = 16;
        //var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, -1), scene);
        //light.intensity = 3;
        //light.position = new BABYLON.Vector3(0, 40, 0);
        //light.direction =new BABYLON.Vector3(0, -2, 0);
        //var torus = BABYLON.Mesh.CreateTorus("torus", 4, 2, 30, scene, false);
        //torus.position = new BABYLON.Vector3(0, 10,0);
        var shadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light);
        shadowGenerator.getShadowMap().renderList.push(mesh);
        shadowGenerator.lambda = 1;     //0 -full lin, 1 full log
        shadowGenerator.shadowMaxZ = camera.maxZ;
        //shadowGenerator.shadowMaxZ = 50;
        shadowGenerator.cascadeBlendPercentage = 0;
        shadowGenerator.depthClamp = false;
        shadowGenerator.splitFrustum();
        return shadowGenerator;
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
        scene.physicsEnabled = false;
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
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower + 0.005;
                tinyAirplane.airplane.speedModifier = 0.12; //0.12
                tinyAirplane.vehicle.acceleration = 40;
            }
            if (inputMap["n"]) {
                tinyAirplane.airplane.enginePower = tinyAirplane.airplane.enginePower - 0.005;
                tinyAirplane.vehicle.acceleration = -20;
            }
            
            if (inputMap["b"]) {
                tinyAirplane.vehicle.breakingForce = 10;
            }

            }
            if (inputMap["i"]) {
                showImpostors(scene);
            }
            if (inputMap["o"]) {
                scene.debugLayer.show();
            }
            if (inputMap["1"]) {
                sky.transitionSunInclination(0.025);
                groundShadow.updateOnce();
            }
            if (inputMap["2"]) {
                sky.transitionSunInclination(-0.025);
                groundShadow.updateOnce();
            }
            if (inputMap["p"]) {
                scene.physicsEnabled = !scene.physicsEnabled;
            }
            if (inputMap["k"]) {
                scene.physicsEnabled = !scene.physicsEnabled;
            }
            if(inputMap["u"]){
                scene.shadowsEnabled = !scene.shadowsEnabled;
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
                //if(sky) sky.update();
                scene.render();
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

class DirectionalLightHelper {

    constructor(light, camera) {
        this.scene = light.getScene();
        this.light = light;
        this.camera = camera;
        this._viewMatrix = BABYLON.Matrix.Identity();
        this._lightHelperFrustumLines = [];
    }

    getLightExtents() {
        const light = this.light;

        return {
            "min": new BABYLON.Vector3(light._orthoLeft, light._orthoBottom, light.shadowMinZ !== undefined ? light.shadowMinZ : this.camera.minZ),
            "max": new BABYLON.Vector3(light._orthoRight, light._orthoTop, light.shadowMaxZ !== undefined ? light.shadowMaxZ : this.camera.maxZ)
        };
    }

    getViewMatrix() {
        // same computation here than in the shadow generator
        BABYLON.Matrix.LookAtLHToRef(this.light.position, this.light.position.add(this.light.direction), BABYLON.Vector3.Up(), this._viewMatrix);
        return this._viewMatrix;
    }

    buildLightHelper() {
        if (this._oldPosition 
            && this._oldPosition.equals(this.light.position) 
            && this._oldDirection.equals(this.light.direction) 
            && this._oldAutoCalc === this.light.autoCalcShadowZBounds
            && this._oldMinZ === this.light.shadowMinZ
            && this._oldMaxZ === this.light.shadowMaxZ
        ) {
            return;
        }

        this._oldPosition = this.light.position;
        this._oldDirection = this.light.direction;
        this._oldAutoCalc = this.light.autoCalcShadowZBounds;
        this._oldMinZ = this.light.shadowMinZ;
        this._oldMaxZ = this.light.shadowMaxZ;

        this._lightHelperFrustumLines.forEach((mesh) => {
            mesh.dispose();
        });

        this._lightHelperFrustumLines = [];

        const lightExtents = this.getLightExtents();
        const lightView = this.getViewMatrix();

        if (!lightExtents || !lightView) {
            return;
        }

        const invLightView = BABYLON.Matrix.Invert(lightView);

        const n1 = new BABYLON.Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.min.z);
        const n2 = new BABYLON.Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.min.z);
        const n3 = new BABYLON.Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.min.z);
        const n4 = new BABYLON.Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.min.z);

        const near1 = BABYLON.Vector3.TransformCoordinates(n1, invLightView);
        const near2 = BABYLON.Vector3.TransformCoordinates(n2, invLightView);
        const near3 = BABYLON.Vector3.TransformCoordinates(n3, invLightView);
        const near4 = BABYLON.Vector3.TransformCoordinates(n4, invLightView);

        const f1 = new BABYLON.Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.max.z);
        const f2 = new BABYLON.Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.max.z);
        const f3 = new BABYLON.Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.max.z);
        const f4 = new BABYLON.Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.max.z);

        const far1 = BABYLON.Vector3.TransformCoordinates(f1, invLightView);
        const far2 = BABYLON.Vector3.TransformCoordinates(f2, invLightView);
        const far3 = BABYLON.Vector3.TransformCoordinates(f3, invLightView);
        const far4 = BABYLON.Vector3.TransformCoordinates(f4, invLightView);

        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("nearlines", { points: [near1, near2, near3, near4, near1] }, this.scene));
        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("farlines",  { points: [far1, far2, far3, far4, far1] }, this.scene));
        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("trlines", { points: [ near1, far1 ] }, this.scene));
        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("brlines", { points: [ near2, far2 ] }, this.scene));
        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("tllines", { points: [ near3, far3 ] }, this.scene));
        this._lightHelperFrustumLines.push(BABYLON.MeshBuilder.CreateLines("bllines", { points: [ near4, far4 ] }, this.scene));

        const makePlane = (name, color, positions) => {
            let plane = new BABYLON.Mesh(name + "plane", this.scene),
                mat = new BABYLON.StandardMaterial(name + "PlaneMat", this.scene);

            plane.material = mat;

            mat.emissiveColor = color;
            mat.alpha = 0.3;
            mat.backFaceCulling = false;
            mat.disableLighting = true;

            const indices = [0, 1, 2, 0, 2, 3];

            const vertexData = new BABYLON.VertexData();

            vertexData.positions = positions;
            vertexData.indices = indices;

            vertexData.applyToMesh(plane);

            this._lightHelperFrustumLines.push(plane);
        };

        makePlane("near",   new BABYLON.Color3(1, 0, 0),    [near1.x, near1.y, near1.z, near2.x, near2.y, near2.z, near3.x, near3.y, near3.z, near4.x, near4.y, near4.z ]);
        makePlane("far",    new BABYLON.Color3(0.3, 0, 0),  [far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, far4.x, far4.y, far4.z ]);
        makePlane("right",  new BABYLON.Color3(0, 1, 0),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, near2.x, near2.y, near2.z ]);
        makePlane("left",   new BABYLON.Color3(0, 0.3, 0),  [near4.x, near4.y, near4.z, far4.x, far4.y, far4.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
        makePlane("top",    new BABYLON.Color3(0, 0, 1),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far4.x, far4.y, far4.z, near4.x, near4.y, near4.z ]);
        makePlane("bottom", new BABYLON.Color3(0, 0, 0.3),  [near2.x, near2.y, near2.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
    }
}
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
import Vehicle from './Vehicle';
import {ThreeWheelCar,ThreeWheelAirplane} from './VehiclesData.js';
//import * as BABYLON from 'babylonjs';
//import { default as Ammo } from 'ammo.js/builds/ammo';
var showAxis = function (size, scene) {
    var makeTextPlane = function (text, color, size) {
        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
        var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
        plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
        plane.material.backFaceCulling = false;
        plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
        plane.material.diffuseTexture = dynamicTexture;
        return plane;
    };

    var axisX = BABYLON.Mesh.CreateLines("axisX", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
        new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
        new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
        new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    var zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
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


    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";

    const scene = buildScene();
    const physics = buildGravity();
    const camera = buildCamera(screenDimensions);
    camera.position = new BABYLON.Vector3(-4,-1.8,-6);
    var ground = new SceneSubject();
    //ground. = -30;// = new BABYLON.Vector3(0,-50,-500); 
    var tinyPlane = null;
    var vehicle = null;
    var assetsManager = new BABYLON.AssetsManager(scene);
    var meshAirplaneTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/", "airplane.glb");
    //var del = new ThreeWheelCar(scene);
    //console.log(del.chassisMesh);
    meshAirplaneTask.onSuccess = function (task) {
        //tinyPlane = new ThreeWheelAirplane(scene, task.loadedMeshes);
        vehicle = new Vehicle(scene, new ThreeWheelAirplane(scene, task.loadedMeshes));
	}
    assetsManager.load();
    //var vehicle = new Vehicle(scene,physics);
    /*var assetsManager = new BABYLON.AssetsManager(scene);
	var meshWorldTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/", "world.glb");
    //var meshAirplaneTask = assetsManager.addMeshTask("world task", "", process.env.PUBLIC_URL+"/", "airplane180.glb");
	meshWorldTask.onSuccess = function (task) {
        debug(task.loadedMeshes); 
	    task.loadedMeshes[0].position = BABYLON.Vector3.Zero();    
	}	*/
	/*meshAirplaneTask.onSuccess = function (task) {
        tinyPlane = new Airplane(scene,task.loadedMeshes, physics);
        tinyPlane.init();
        //task.loadedMeshes[0].rotate(new BABYLON.Vector3.Up(),Math.PI/4);
        registerActions(scene, tinyPlane);
        //camera.parent = tinyPlane.meshAll[5];
        //debug(task.loadedMeshes);
	    //task.loadedMeshes[0].position = BABYLON.Vector3.Zero();    
	}	
    assetsManager.load();*/
    //const sceneSubjects = createSceneSubjects(scene);
    //var tinyPlane = new Airplane(scene);//sceneSubjects[1].getAirplane();
    /*tinyPlane.init(function(){
        //console.log(this);
        //camera.parent = this.meshAll[0];
    });*/
    /*var tinyPlane = buildPlanePromise().then(x=>{
        camera.parent = x.meshAll[0];
        registerActions(scene, x);
    });*/

    //camera.parent = tinyPlane.meshAll[0];
    //registerActions(scene, tinyPlane);
    showAxis(5,scene);
    registerActions(scene, null);

    function debug(meshAll){
        meshAll.map(mesh => {
          if(mesh.hasOwnProperty('metadata'))
            if(mesh.metadata!==null)
              if(mesh.metadata.hasOwnProperty('gltf'))
                if(mesh.metadata.gltf.hasOwnProperty('extras')){
                  console.log(mesh.metadata.gltf.extras.type);
                  mesh.isVisible = false;
                  //console.log(mesh.metadata.gltf.extras.type);
                  if (mesh.metadata.gltf.extras.type ==='box'){
                    createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.1, restitution: 0  }, true);
                    //mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.0, restitution: 0.1}, scene);
                    //console.log("p")
                  }
                  if (mesh.metadata.gltf.extras.type ==='trimesh'){
                    createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.1, restitution: 0  }, true);
                  }
                }
        });
      }
    function createPhysicsImpostor(scene, entity, impostor, options, reparent) {
    if (entity == null) return;
    entity.checkCollisions = false;
    const parent = entity.parent;
    if (reparent === true) entity.parent = null;
    entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
    if (reparent === true) entity.parent = parent;
    }

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
    /*async function sceneInit(){
        const sceneSubjects = createSceneSubjects(scene);
        //var tinyPlane = new Airplane(scene);//sceneSubjects[1].getAirplane();
        var tinyPlane = await buildPlanePromise();
        camera.parent = tinyPlane.meshAll[0];
        registerActions(scene, tinyPlane);
        return tinyPlane;
    }
    function buildPlanePromise(){
        //return new Airplane(scene);
        var y = null
        return new Promise(function(myResolve, myReject) {
            var x = new Airplane(scene);
            myResolve(x);
        });
        //myPromise.then(res=>y=res);
        //console.log(y);
        //return y;
    }*/
    function buildGravity() {
        var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
        var physicsPlugin = new BABYLON.CannonJSPlugin(undefined,undefined,CANNON);
        scene.enablePhysics(gravityVector, physicsPlugin);
        return physicsPlugin;
    }

    function buildCamera({ width, height }) {
        const aspectRatio = width / height;
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(-10,2,-10), scene);//BABYLON.Vector3(-120,20,-70)
        //camera.rotation.y = -90;
        //const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1.5, new BABYLON.Vector3(-120,20,-70));
        //const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);

        // Target the camera to scene origin
        //camera.setTarget(BABYLON.Vector3.Zero());
        //camera.setTarget(new BABYLON.Vector3(-150, 20, -90));
        //camera.lowerRadiusLimit = 4;
        //camera.upperRadiusLimit = 255;
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
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));

        /*scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    //parameter: 'r'
                },
                function (evt) { console.log(evt.sourceEvent.key+' button was pressed'); }
            )
        );*/

        scene.onBeforeRenderObservable.add(() => {
            if(vehicle!==null){
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
            }/*else{
            //if(inputMap["n"]){
                if(tinyPlane!==null){
                tinyPlane.enginePower = tinyPlane.enginePower - 0.01;
                tinyPlane.speedModifier = 0;
                }
            }*/

            if (inputMap["l"]) {
                //scene.debugLayer.show();
                var a = tinyPlane.velocity;
            }
            
            if (inputMap["t"]) {
                vehicle.forward(30);
                //console.log(inputMap["t"]);
            }else if(inputMap["t"] !== null){
                vehicle.forward(0);
                //console.log(inputMap["t"]);
                inputMap["t"] = null;
            }

            if (inputMap["g"]) {
                vehicle.backward(200);
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
                vehicle.brake(100);
            }else if( inputMap["b"] !== null){
                vehicle.unbrake();
                inputMap["b"] = null;
            }
          }
          if (inputMap["p"]) {
            //scene.debugLayer.show();
            //camera.parent = tinyPlane.meshAll[5];
            showImpostors(scene);
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

        //assetsManager.onFinish = function (tasks) {
            engine.runRenderLoop(function () {
                scene.render();
            });
        //};
        /*engine.runRenderLoop(function(){
            scene.render();
        });*/

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
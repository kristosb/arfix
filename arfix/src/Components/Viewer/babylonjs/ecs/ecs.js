import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import 'babylonjs-loaders';
//import { SkyMaterial } from "babylonjs-materials";
import SkySim from './../scenery/SkySimulator.js';
import OceanSim from './../scenery/OceanSimulator.js';
import ShadowManager from './../scenery/sahdowManager';
import Battleship from './../props/BattleShip';
import Airship from './../props/Airship';
import BirdFlock from './../props/Birds';
import { AirplaneWW2} from './../props/VehiclesData.js';
import HudPanel from './../hud/Hud';
import Airplane from './../props/Airplane';
import Suspension from './../props/Vehicle';
import vehicleParts from './../props/VehicleComponents';
import Instrumentation from './../utils/instrumentation.js'
import SettingsGui from './../utils/SettingsGui'
//// base ////
class ComponentBase {

    constructor(scene) {
        this.scene = scene;
        console.log(this.constructor.name)
        this.componentes = [];
    }
}
/// game objects ///
export class Scene extends ComponentBase {
    constructor(engine) {
        super(null);
        this.object = new BABYLON.Scene(engine);
    }

    init() { }
    update() { this.object.render(); }
    dispose() {
        console.log("dispose");
     }
}
export class Camera extends ComponentBase {
    constructor(scene, canvas) {
        super(scene);
        
        var followCamera = new BABYLON.FollowCamera("followcamera", new BABYLON.Vector3(0,0,-100), scene.object);
        followCamera.heightOffset = 1;
        //followCamera.rotationOffset = 180;
        followCamera.cameraAcceleration = 0.05   ;//0.06 
        followCamera.maxCameraSpeed = 1800;//1800
        followCamera.inertia = 20.0;//20
        followCamera.radius = -5;
        //followCamera.lockedTarget = mesh.object;
        followCamera.attachControl(canvas, false);
        
        scene.object.activeCamera = followCamera;
        this.object = followCamera;
    }

    init() {
    }
    update() { }
    dispose() { }
}
export class Light extends ComponentBase {
    constructor(scene, type) {
        super(scene);

        this.type = type;

        switch (type) {
            case "Hemispheric":
                this.object = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-0.7, 0.3, -0.7), scene.object);
                break;
            case "Point":
                this.object = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 1, 0), scene.object);
                break;
            case "Directional":
                this.object = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.7, -0.3, 0.7), scene.object);
                break;
            default:
                this.object = null;
                break;
        }
    }
    init() {
        switch (this.type) {
            case "Hemispheric":
                this.object.position = new BABYLON.Vector3(0, 55, 5);
                this.object.intensity =0.8;
                this.object.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
                this.object.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                this.object.setEnabled(true);
                break;
            case "Point":
                this.object.intensity = 0.7;
                this.object.diffuse = BABYLON.Color3.FromHexString('#ff0000');
                this.object.position.z = 10;
                this.object.position.y = 10;
                break;
            case "Directional":
                this.object.position = new BABYLON.Vector3(50,100,100);//new BABYLON.Vector3(0, 50, 0);
                this.object.intensity = 2.3;
                this.object.setEnabled(true);  
                break;
            default:
                break;
        }
    }

    update() { }
    dispose() { }
}
export class Physics extends ComponentBase {
    constructor(scene) {
        super(scene);
        var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
        this.object = new BABYLON.CannonJSPlugin(false,undefined,CANNON);
        scene.object.enablePhysics(gravityVector, this.object);
        scene.object.physicsEnabled = false;
    }

    init() {
        this.object.setTimeStep(1/30);
     }
    update() { }
    dispose() { }
}
export class Box extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = BABYLON.MeshBuilder.CreateBox("", { size: 1 }, scene.object);
        this.object.position.y = 80;
        this.mesh = this.object;
    }

    init() { }
    update() { }
    dispose() { }
}
export class Sky extends ComponentBase {
    constructor(scene, camera) {
        super(scene);
        this.object = new SkySim(scene.object, null, null, camera.object, 800);
    }

    init() { }
    update() { }
    dispose() { }
}
export class Ocean extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = new OceanSim(scene.object, 800);
    }

    init() { }
    update() { }
    dispose() { }
}
export class Clouds extends ComponentBase {
    constructor(scene,area) {
        super(scene);
        var spriteManagerClouds = new BABYLON.SpriteManager("cloudsManager", "http://www.babylonjs.com/Scenes/Clouds/cloud.png", 1000, 256, scene.object);
        for (var i = 0; i < 100; i++) {
              var clouds = new BABYLON.Sprite("clouds", spriteManagerClouds);
              //clouds.color = new BABYLON.Color3(0.87, 0.93, 0.91);
              clouds.position.x = Math.random() * area - area/2;
              clouds.position.y = Math.random() * 150 + 150;
              clouds.position.z = Math.random() * area - area/2; 
              clouds.size = Math.random() * 60 +50;
              if (Math.round(Math.random() * 5) === 0) {
                  clouds.angle = Math.PI * 90 / 180;            
              }
          if (Math.round(Math.random() * 2) === 0) {
            clouds.invertU = -1;
          }
          if (Math.round(Math.random() * 4) === 0) {
            clouds.invertV = -1;
          }
        }
        this.object = spriteManagerClouds;
    }

    init() { }
    update() { }
    dispose() { }
}
export class Keyboard extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.inputMap = {};
        const keys = ["w", "s", "a", "d", "q", "e", "p", "o", "m", "n", "1", "2", "k", "b", "9","0", "l"];
        keys.forEach(key=>this.inputMap[key] = {type:false,keyState:"up"});
        //this.object = null;
    }
    keyAction(key, onKeyFunc ){//= () => {}
        if(this.inputMap[key].type) {
            onKeyFunc();
        }
    }
    keyActionTrig(key, onKeyDownFunc = () => {},onKeyUpFunc = () => {}, onKeyHoldFunc = () => {} ){
        if(this.inputMap[key].type) {
            if(this.inputMap[key].keyState == "up") {
                this.inputMap[key].keyState = "down"; 
                onKeyDownFunc();
            }
            else {
                this.inputMap[key].keyState = "hold";
                onKeyHoldFunc();
            }
        }else{
            if(this.inputMap[key].keyState != "up") {
                this.inputMap[key].keyState = "up";
                onKeyUpFunc();
            }
            
        }
    }
    init() {
        // Keyboard events
        var that = this;
        this.scene.object.actionManager = new BABYLON.ActionManager(this.scene.object);
        this.scene.object.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            if(that.inputMap[evt.sourceEvent.key]) that.inputMap[evt.sourceEvent.key].type=evt.sourceEvent.type === "keydown";// evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};// +(evt.sourceEvent.type == "keydown")+(inputMap[evt.sourceEvent.key]==1);//
        }));
        this.scene.object.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            if(that.inputMap[evt.sourceEvent.key]) that.inputMap[evt.sourceEvent.key].type= false;//if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key] = {type:false,keyState:"up"};//+(evt.sourceEvent.type == "keydown");//-(inputMap[evt.sourceEvent.key]==1);//evt.sourceEvent.type == "keydown";//{key: evt.sourceEvent.type == "keydown", trigger:true};
        }));
     }
    update() { 
        //this.keyActionTrig("o", ()=> this.scene.object.debugLayer.show());
    }
    dispose() { }
}
export class GameSettingsGui extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = new SettingsGui(scene.object);
    }

    init() { }
    update() { }
    dispose() { }
}
/*export class Assets extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = new BABYLON.AssetsManager(scene.object);
    }
    init() {
        this.object.load();
     }
    update() { }
    dispose() { }
}*/

var loadPromise = async(root, file, scene)=>{
    return new Promise((res,rej)=>{
        BABYLON.SceneLoader.LoadAssetContainer(root, file, scene, function (container) {
            res(container)
        });
    })
}
export class Terrain extends ComponentBase {
    constructor(scene) {
        super(scene);
        return (async () => {
            this.assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "achil_2.glb", scene.object);
            this.assets.meshes[1].scaling = this.assets.meshes[1].scaling.multiplyByFloats(8,8,8); 
            this.assets.meshes[1].position.y = -1.2;
            //optimization
            /*this.assets.meshes[1].material.freeze();
            this.assets.meshes[1].freezeWorldMatrix();
            this.assets.meshes[1].doNotSyncBoundingInfo = true;*/
            this.assets.meshes[1].receiveShadows = true;
            this.shadowMesh = this.mesh = this.assets.meshes[1];
            //console.log("terrainAsync constructor", this.assets.meshes[1].scaling);
            return this;
          })();
    }
    init() {
        this.assets.addAllToScene();
     }
    update() { }
    dispose() { }
}
export class Shadows extends ComponentBase {
    constructor(scene, sun) {
        super(scene);
        this.object = new ShadowManager(sun.object);
    }
    init() {
        //this.object.load();
     }
    update() { }
    dispose() { }
}

/*async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
export class Test extends ComponentBase {
    constructor(scene) {
        super(scene);
        return (async () => {

            // Call async functions here
            await sleep(500);
            
            this.value = 4;
            console.log("testAsync constructor");
            // Constructors return `this` implicitly, but this is an IIFE, so
            // return `this` explicitly (else we'd return an empty object).
            return this;
          })();
    }
    testAsync(){
        return new Promise((resolve,reject)=>{
            setTimeout(function(){
                console.log("testAsync");
                resolve();
            }, 2000);
            
        });
    }
    async loadAsync(){
        await this.testAsync();
        console.log("testFinished");
    }
    init() {
        //this.loadAsync();
        
     }
    update() { }
    dispose() { }
}*/
export class Airships extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = null;
        return (async () => {
            this.assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "titan_parts_joined_uvmapped.glb", scene.object);
            return this;
          })();
    }
    init() {
        this.object = new Airship(this.scene.object, this.assets.meshes[0],{debug:false}); 
        this.assets.addAllToScene();

     }
    update() { 
        this.object.update();
    }
    dispose() { }
}
export class Ship extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = null;
        return (async () => {
            this.assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "nimitz_single_mesh.glb", scene.object);
            return this;
          })();
    }
    init() {
        this.object = new Battleship(this.scene.object, this.assets.meshes[0]);
        this.assets.addAllToScene();

     }
    update() { 
        this.object.update();
    }
    dispose() { }
}

export class Birds extends ComponentBase {
    constructor(scene) {
        super(scene);
        this.object = null;
        this.mesh = null;
        return (async () => {
            this.assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "flying-gull.glb", scene.object);
            return this;
          })();
    }
    init() {
        const gullModel = this.assets.meshes[1];
        //console.log(gullModel);
        gullModel.scaling = new BABYLON.Vector3(0.02,0.02,0.02);
        //gullModel.scaling = new BABYLON.Vector3(0.012,0.012,0.012);
        gullModel.rotationQuaternion = new BABYLON.Vector3(0,-Math.PI/4,0).toQuaternion();
        gullModel.bakeCurrentTransformIntoVertices();
        this.assets.addAllToScene();
        //console.log("gull",gullModel);
        var birds = [];
        //const vehicleMeshPrefab = createVehicle(scene, { size: 1 });
        for (let i = 0; i < 19; i++){
            //const gull = gullModel.clone('gull_'+i.toString());
            const gull = gullModel.createInstance('gull_'+i.toString());
            //gull.setEnabled(true);
            birds.push(gull);
        }
        birds.push(gullModel);
        //camera.lockedTarget =  birds[0]; 
        this.object = new BirdFlock(this.scene.object, birds);
        this.mesh = birds[0];
     }
    update() { 
        this.object.update();
    }
    dispose() { }
}
export class Aircraft extends ComponentBase {
    constructor(scene,canvas) {
        super(scene);
        this.canvas = canvas;
        this.object = null;
        this.mesh = null;
        return (async () => {
            this.assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "airplane-ww2-collision-scaled.glb", scene.object);
            return this;
          })();
    }
    init() {
        this.object = new vehicleParts();
        //console.log("1");
        this.object.bluePrint = new AirplaneWW2(this.scene.object, this.assets.meshes, new BABYLON.Vector3(275, 6.5, 364),new BABYLON.Vector3(0,-Math.PI/2,0));
        //console.log("2");
        this.object.suspension = new Suspension(this.scene.object, this.object.bluePrint);
        //console.log("3");
        this.object.avionics = new Airplane(this.scene.object, this.object.bluePrint.chassisBody, this.object.bluePrint.controls);
        //console.log("4");
        this.object.hud = new HudPanel(this.scene.object, this.canvas);
        //console.log("5");
        this.object.hud.linkWithMesh(this.object.bluePrint.chassisMesh); 
        //cameraEnt.object.lockedTarget =  this.object.bluePrint.chassisMesh; 
        this.object.position = new BABYLON.Vector3(-10,5.7,-5);
        //groundShadow.addMesh(this.object.bluePrint.visualMeshes[0]);
        this.mesh = this.object.bluePrint.chassisMesh;//visualMeshes[0]
        this.shadowMesh = this.object.bluePrint.visualMeshes[0];

        //this.object = new Battleship(this.scene.object, this.assets.meshes[0]);
        this.assets.addAllToScene();

     }
    update() { 
        this.object.update();
    }
    dispose() { }
}
export class DebugUi extends ComponentBase {
    constructor(scene, engine) {
        super(scene);
        this.object = new Instrumentation(engine);
    }
    init() {}
    update() { 
        this.object.update();
    }
    dispose() { }
}
///// INTERACTIONS ////
export class ShadowCasters extends ComponentBase {
    constructor(scene, shadows, casters) {
        super(scene);
        this.shadows = shadows.object;
        this.casters = casters;
        //this.object = new ShadowManager(sun.object);
    }
    init() {
        //console.log(this.casters[0]);
        this.casters.forEach(c=>{this.shadows.addMesh(c.shadowMesh);
        //console.log(c.mesh);
        });
     }
    update() { }
    dispose() { }
}
export class KeyboardGameStateInteraction extends ComponentBase {
    constructor(scene, keyboard, actors) {
        super(scene);
        this.keyboard = keyboard;
        this.actors = actors;
    }
    init() { }
    update() { 
        this.keyboard.keyActionTrig("o", ()=> this.scene.object.debugLayer.show());
        this.keyboard.keyActionTrig("p", ()=> {
            this.scene.object.physicsEnabled = !this.scene.object.physicsEnabled;
            this.actors.forEach( (a) =>{ a.object.pause = this.scene.object.physicsEnabled; });
        });  
    }
    dispose() { }
}
export class KeyboardCameraInteraction extends ComponentBase {
    constructor(scene, keyboard, camera, actors) {
        super(scene);
        this.keyboard = keyboard;
        this.camera = camera.object;
        this.actors = actors;
        this.index = 0;
    }
    init() { 
        this.camera.lockedTarget = this.actors[this.index++].mesh;
    }
    update() { 
        this.keyboard.keyActionTrig("l", ()=> {
            this.camera.lockedTarget = this.actors[this.index++].mesh;
            if(this.index >= this.actors.length) this.index = 0;
        });  
    }
    dispose() { }
}
export class KeyboardSkyInteraction extends ComponentBase {
    constructor(scene, keyboard, sky, sun, ambient) {
        super(scene);
        this.ref = sky;
        this.keyboard = keyboard;
        this.sun = sun;
        this.ambient = ambient;
    }
    setLightDirection(){
        var direction =  this.ref.object.getLightDirection();
        //var sunIntensity = this.ref.object.convertRange(Math.abs(this.ref.object.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
        this.ambient.object.direction.copyFromFloats(direction.x, direction.y, direction.z);
        this.sun.object.direction.copyFromFloats(-direction.x, -direction.y, -direction.z);
        this.ambient.object.intensity = this.ref.object.convertRange(Math.abs(this.ref.object.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
        this.sun.object.intensity = this.ref.object.convertRange(Math.abs(this.ref.object.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
    }
    init() {
        this.ref.object.transitionSunInclination(15*0.025);
        this.setLightDirection();
     }
    update() { 
        this.keyboard.keyActionTrig("1", ()=> {
            this.ref.object.transitionSunInclination(0.025);
            this.setLightDirection();
        });
        this.keyboard.keyActionTrig("2", ()=> {
            this.ref.object.transitionSunInclination(-0.025);
            this.setLightDirection();
        });
        
    }
    dispose() { }
}
export class KeyboardAirplaneInteraction extends ComponentBase {
    constructor(scene, keyboard, airplane) {
        super(scene);
        this.ref = airplane;
        this.keyboard = keyboard;
    }
    init() { }
    update() { 
        this.keyboard.keyAction("q", ()=>this.ref.object.steer(vehicleParts.DIR.TILT_LEFT));
        this.keyboard.keyAction("e", ()=>this.ref.object.steer(vehicleParts.DIR.TILT_RIGHT));
        this.keyboard.keyAction("w", ()=>this.ref.object.steer(vehicleParts.DIR.DOWN));
        this.keyboard.keyAction("s", ()=>this.ref.object.steer(vehicleParts.DIR.UP));
        this.keyboard.keyActionTrig("d", ()=>this.ref.object.steer(vehicleParts.DIR.LEFT),
                                         ()=>this.ref.object.steer(vehicleParts.DIR.LEFT_RESET),
                                         ()=>this.ref.object.steer(vehicleParts.DIR.LEFT_HOLD));
        this.keyboard.keyActionTrig("a", ()=>this.ref.object.steer(vehicleParts.DIR.RIGHT),
                                         ()=>this.ref.object.steer(vehicleParts.DIR.RIGHT_RESET),
                                         ()=>this.ref.object.steer(vehicleParts.DIR.RIGHT_HOLD));   
        this.keyboard.keyAction("m", ()=>this.ref.object.power(vehicleParts.DIR.POWER_UP));    
        this.keyboard.keyAction("n", ()=>this.ref.object.power(vehicleParts.DIR.POWER_DOWN));     
        this.keyboard.keyActionTrig("b", ()=> this.ref.object.brake(vehicleParts.DIR.BRAKE),
                                         ()=> this.ref.object.brake(vehicleParts.DIR.UNBRAKE),
                                         ()=> this.ref.object.brake(vehicleParts.DIR.BRAKE));     
    }
    dispose() { }
}
export class AirplaneBirdsInteraction extends ComponentBase {
    constructor(scene, airplane,  birds) {
        super(scene);
        this.airplane = airplane;
        this.birds = birds;
    }
    init() { }
    update() { 
        this.birds.object.enemyPosition  = this.airplane.object.position;
    }
    dispose() { }
}

/*    const FRAMERATE = 1/40;
    const fpcClock = new Clock();
    let components = [];
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";
    //engine.stopRenderLoop();
    //const debugUI = new Inspector(engine);
    (async () => {
        console.log("start");
        //ecs
        let sceneEnt = new Scene(engine);
        let physicsEnt = new Physics(sceneEnt);
        let light_sun = new Light(sceneEnt, "Directional");
        let light_ambient = new Light(sceneEnt, "Hemispheric");
        let cameraEnt = new Camera(sceneEnt, canvas);
        let sky = new Sky(sceneEnt, cameraEnt);
        let shadows = new Shadows(sceneEnt, light_sun);
        let box = new Box(sceneEnt);
        let clouds = new Clouds(sceneEnt, 800);
        let ocean = new Ocean(sceneEnt);
        let keyboard = new Keyboard(sceneEnt);
        let gameSettingsGui = new GameSettingsGui(sceneEnt);
        let terrain = await new Terrain(sceneEnt);
        let nimitz = await new Ship(sceneEnt);
        let zeppelin = await new Airships(sceneEnt);
        let birdflock = await new Birds(sceneEnt);
        let airplane = await new Aircraft(sceneEnt,canvas);  
        let debugUI = new DebugUi(sceneEnt, engine);
        //console.log("airplane",airplane.object.bluePrint.chassisMesh);
        let keyboardCameraActions = new KeyboardCameraInteraction(sceneEnt, keyboard, cameraEnt, [airplane, birdflock,box]);
        let shadowCasters = new ShadowCasters(sceneEnt, shadows, [terrain, airplane]);
        let keyboardSkyActions = new KeyboardSkyInteraction(sceneEnt, keyboard, sky, light_sun, light_ambient);
        let keyboardStateActions = new KeyboardGameStateInteraction(sceneEnt, keyboard, [nimitz, zeppelin, birdflock]);
        let keyboardAirplaneActions = new KeyboardAirplaneInteraction(sceneEnt, keyboard, airplane);
        let airplaneBirdsInteractions = new AirplaneBirdsInteraction(sceneEnt, airplane, birdflock);
        // create array of all game components
        components.push(sceneEnt);
        components.push(physicsEnt);
        components.push(cameraEnt);
        components.push(light_sun);
        components.push(light_ambient);
        components.push(shadows);
        components.push(box);
        components.push(ocean);
        components.push(sky);
        components.push(clouds);
        components.push(keyboard);
        components.push(gameSettingsGui);
        components.push(terrain);
        components.push(nimitz);
        components.push(zeppelin);
        components.push(birdflock);
        components.push(airplane);
        
        components.push(debugUI);

        components.push(shadowCasters);
        components.push(keyboardSkyActions);
        components.push(keyboardStateActions);
        components.push(keyboardCameraActions);
        components.push(keyboardAirplaneActions);
        components.push(airplaneBirdsInteractions);

        components.forEach((component) => { component.init(); });
        console.log("finished");

        sceneEnt.object.onDispose = function () {
            components.forEach((component) => { component.dispose(); })
        }
    })();

    function onWindowResize() {
        engine.resize();
    }
    function animate(){
        engine.runRenderLoop(function () {    
            if(fpcClock.timeIntervalCheck(FRAMERATE)){
                components.forEach((component) => { component.update(); })
            }
        });
    }*/

/*
    import {Scene, Camera, Light, Physics, Box, Sky, Clouds, Keyboard, 
        KeyboardSkyInteraction, Ocean, Terrain, Shadows, 
        ShadowCasters, Ship, KeyboardGameStateInteraction, Airships,
        Birds, Aircraft, KeyboardCameraInteraction, KeyboardAirplaneInteraction,
        AirplaneBirdsInteraction, DebugUi, GameSettingsGui
} from './ecs/ecs';
*/
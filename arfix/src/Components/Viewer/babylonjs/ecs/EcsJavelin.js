import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import 'babylonjs-loaders';
import {Clock} from './../utils/Clock';
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


import {
    ComponentOf,
    createQuery,
    createWorld,
    number,
    string,
    toComponent,
    useInit,
    useMonitor, component, createEffect,
  }  from '@javelin/ecs'

const Vec3 = { x: number, y: number, z: number }
const Quaternion = { x: number, y: number, z: number, w: number }
const Body = { position: Vec3, quaternion: Quaternion }
const Mesh = { position: Vec3, quaternion: Quaternion }
const MeshAssets = { position: Vec3, quaternion: Quaternion }
const Id = {name: string};
const Tag = {name: string};
const Key = {name: string};
const CampPos = { x: number, y: number, z: number }

const UseNth = createEffect(world => {
    let i = 0
    return () => i++ //% 2 === 0
});
export default function Canvas(engine, canvas)  {

    //const FRAMERATE = 1/40;
    const fpcClock = new Clock();
    const world = createWorld();
    //const dummy = world.create(...[toComponent({x:2}, number)]); 
    //world.step(fpcClock.getElapsedTime()); 
    // effects
    //var a= UseNth();
    //console.log(en);
    // components
    (async () => {
    const sceneComp = SceneCreate(engine, Id);
    const cameraComp = CamCreate(canvas, sceneComp, CampPos);
    const physicsComp = PhysicsCreate(sceneComp, Id);
    const ambientLightComp = HemLightCreate(sceneComp, Vec3);
    const sunLightComp = DirLightCreate(sceneComp, Vec3);
    const keyboardComp = KeyboardCreate(sceneComp, Key);
    
    const skyComp = SkyCreate(sceneComp, cameraComp, Id);
    const debugComp = DebugUiCreate(engine, Id);
    const boxComp = BoxCreate(sceneComp, Mesh);
    const terrainComp = await TerrainCreate(sceneComp, Mesh);
    
    
    
    // entities
    const sceneEnt = world.create(...sceneComp);   
    const camEnt = world.create(...cameraComp); 
    const physicsEnt = world.create(...physicsComp); 
    const ambientLightEnt = world.create(...ambientLightComp); 
    const sunLightEnt = world.create(...sunLightComp); 
    const keyboardEnt = world.create(...keyboardComp);
    //const boxEnt = world.create(...boxComp); 
    const skyEnt = world.create(...skyComp); 
    const debugEnt = world.create(...debugComp); 
    //const terrainEnt = world.create(...terrainComp); 
    const terrainEnt = world.create(terrainComp[0], cameraComp[0],keyboardComp[0]);
    const boxEnt = world.create(boxComp[0], cameraComp[0],keyboardComp[0]);
    
    // Queries

    const sceneQuery = createQuery(Id); 
    //const meshes = createQuery(Mesh); 
    const meshesCam = createQuery(Mesh, Id ); 
    const followCamMeshes = createQuery(Mesh, CampPos, Key); 
    console.log("q",followCamMeshes);

      //console.log(followCamMeshes[0]);

    // Systems
    world.addSystem(Render(sceneEnt, Id));
    world.addSystem(MeshCameraFollowInteraction(followCamMeshes));
    //world.addSystem(KeyboardCameraInteraction(camEnt, CampPos, null, keyboardEnt, Key,meshesCam));
    world.addSystem(KeyboardGameStateInteraction(sceneEnt, Id, keyboardEnt, Key));
    world.addSystem(debugUiUpdate(debugEnt, Id));
    })();
    // step the ECS
    function step(elapsedTime) {
        world.step(elapsedTime)
      }
    //function step(){
        //const en =UseEngine();
        /*en.runRenderLoop(function () {  
            if(fpcClock.timeIntervalCheck(FRAMERATE)){
                world.step(fpcClock.getElapsedTime());  
            }
        });*/
    //}

    return{
        step
    }
}
function SceneCreate(engine, schema){
    const scene = new BABYLON.Scene(engine);
    return [toComponent(scene, schema)];
}
function CamCreate(canv, sceneEntity,  schema){
    const  cam = new BABYLON.FreeCamera("followCam", new BABYLON.Vector3(0, 3, -10), sceneEntity[0]); 
    cam.heightOffset = 1;
    cam.cameraAcceleration = 0.05   ;
    cam.maxCameraSpeed = 1800;
    cam.inertia = 20.0;
    cam.radius = -5;
    cam.attachControl(canv, false);
    cam.followMeshId = 0;   //adding property
    sceneEntity[0].activeCamera = cam;

    return [toComponent(cam, schema)];
}
function PhysicsCreate(sceneEntity, schema){
    let gravityVector = new BABYLON.Vector3(0,-9.81, 0);
    const physics = new BABYLON.CannonJSPlugin(false,undefined,CANNON);
    sceneEntity[0].enablePhysics(gravityVector, physics);
    sceneEntity[0].physicsEnabled = false;
    physics.setTimeStep(1/30);
    return [toComponent(physics, schema)];
}
function HemLightCreate(sceneEntity,  schema){
    const light = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-0.7, 0.3, -0.7), sceneEntity[0]); 
    light.position = new BABYLON.Vector3(0, 55, 5);
    light.intensity =0.8;
    light.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
    light.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    light.setEnabled(true); 
    return [toComponent(light, schema)];
}
function DirLightCreate(sceneEntity,  schema){
    const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.7, -0.3, 0.7), sceneEntity[0]); 
    light.position = new BABYLON.Vector3(50,100,100);//new BABYLON.Vector3(0, 50, 0);
    light.intensity = 2.3;
    light.setEnabled(true); 
    return [toComponent(light, schema)];
}
function DebugUiCreate(engine, schema){
    const object = new Instrumentation(engine); 
    return [toComponent(object, schema)];
}
function BoxCreate(sceneEntity,  schema){
    const mybox = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, sceneEntity[0]); 
    return [toComponent(mybox, schema)];
}
function SkyCreate(sceneEntity, cameraEntity, schema){
    const object = new SkySim(sceneEntity[0], null, null, cameraEntity[0], 800);
    return [toComponent(object, schema)];
}
function KeyboardCreate(sceneEntity, schema){
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
    const sc = sceneEntity[0];
    sc.actionManager = new BABYLON.ActionManager(sc);
    sc.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type=evt.sourceEvent.type === "keydown";
    }));
    sc.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type= false;
    }));
    return [toComponent(actions, schema)];
}
var loadPromise = async(root, file, scene)=>{
    return new Promise((res,rej)=>{
        BABYLON.SceneLoader.LoadAssetContainer(root, file, scene, function (container) {
            res(container)
        });
    })
}
async function TerrainCreate(sceneEntity, schema){
    const object = await loadPromise(process.env.PUBLIC_URL+"/assets//", "achil_2.glb", sceneEntity[0]);
    object.meshes[1].scaling = object.meshes[1].scaling.multiplyByFloats(8,8,8); 
    object.meshes[1].position.y = -1.2;
    //optimization
    /*this.assets.meshes[1].material.freeze();
    this.assets.meshes[1].freezeWorldMatrix();
    this.assets.meshes[1].doNotSyncBoundingInfo = true;*/
    object.meshes[1].receiveShadows = true;
    //const objectMesh =  object.meshes[1];
    object.addAllToScene();
    return [toComponent(object.meshes[1], schema)];
}
/// EFFECTS

const UseCanvas = createEffect(world => {   
    const canvas = document.getElementsByTagName("canvas").item(0);
    console.log(canvas);
    return () => canvas //% 2 === 0
});
/*const UseEngine = createEffect(world => {   
    const engine = new BABYLON.Engine(UseCanvas(), true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";
    return () => engine //% 2 === 0
});
const UseScene = createEffect(world => {   
    const scene = new BABYLON.Scene(UseEngine());
    return () => scene //% 2 === 0
});*/

/// REFRESH
function Render(sE, sC){
    function RenderRun(localWorld){
        if(useInit()) console.log("init");
        const sc = localWorld.get(sE, sC);
        sc.render();
    }
    return RenderRun;
}
function debugUiUpdate(sE, sC){
    function DebugUiRefresh(localWorld){
        //if(useInit()) console.log("debugUi Init");
        const dUi = localWorld.get(sE, sC);
        dUi.update();
    }
    return DebugUiRefresh;
}
/// INTERACTIONS 
function KeyboardCameraInteraction(camE, camS, meshQuery, keybEnt, keybC, meshCamQuery ){
    var index = 0;
    var iterator = 0;
    function Interaction(localWorld){
        /*useMonitor(
            meshQuery,(e, [mesh]) => {//console.log(//mesh.meshes[0])
                if(mesh.id=="TerrainNode"){
                    let camera  = localWorld.get(camE, camS);
                    camera.lockedTarget = mesh;         
                }
            }
        );*/
        let keyboard  = localWorld.get(keybEnt, keybC);
        /*keyboard.keyActionTrig("l", ()=> {
            meshQuery((e, [mesh]) => {console.log(iterator+" "+index);
                if(iterator===index){
                    let camera  = localWorld.get(camE, camS);
                    camera.lockedTarget = mesh; 
                    console.log("index= "+index)
                    
                }
                iterator = iterator+1;
            });
            index = index +1;
            if(index >= iterator) index = 0;
            iterator = 0;
        });*/
        //keyboard.keyActionTrig("l", ()=> {
            //console.log("meshCamQuery")
            //meshCamQuery((e, [mesh,sc]) => {console.log(" m",mesh);});
            /*for (const [entities, [mesh, cams]] of meshCamQuery) {
                console.log("mesh")
                for (let i = 0; i < entities.length; i++) {
                    // console.log("ent"+entities[i])
                    // console.log("mesh"+mesh[i])
                    // console.log("mesh"+cam[0])
                    console.log("mesh")
                }
                
              }*/
        //});

    }
return Interaction;
}
function KeyboardGameStateInteraction(sE, sC, keybEnt, keybC ){
    function Interaction(localWorld){
        let keyboard  = localWorld.get(keybEnt, keybC);
        keyboard.keyActionTrig("o", ()=>{ 
            // debug layer throws error when moving world out of bounds
            const sc = localWorld.get(sE, sC);
            sc.debugLayer.show();
        });
        // keybord.keyActionTrig("l", ()=> {
        //     console.log("L")
        // }); 
    }
return Interaction;
}

function MeshCameraFollowInteraction(localQuery ){
    function Interaction(localWorld){
        useMonitor(
            localQuery,
            (e, [meshes, cam, keyboard]) =>{ if(cam.lockedTarget===null) {cam.lockedTarget = meshes; console.log(`cam attached to ${meshes.id}`)} }
          )
        for (const [entities, [meshes, cam, keyboard]] of localQuery ) {
            // for..of loop iterates through each matching archetype (only once)
            keyboard[0].keyActionTrig("l", ()=> {
                cam[0].lockedTarget  = meshes[cam[0].followMeshId];
                cam[0].followMeshId = cam[0].followMeshId +1;
                if(cam[0].followMeshId>=meshes.length) cam[0].followMeshId = 0;
                console.log(cam[0].followMeshId);
                console.log(UseNth());
            }); 
        }
        if(useInit()){
           //console.log( UseScene());
        for (const [entities, [meshes, cam, keyboard]] of localQuery ) {
            console.log("querystart");
            for (let i = 0; i < entities.length; i++) {
                console.log("ent ="+i + "len="+entities.length);
            }
        }}
    }
return Interaction;
}

/*function CamConfig(ent, comp, sE, sC, canv){
    function CamInit(localWorld){
        if(useInit()){
            let cam  = localWorld.get(ent, comp);
            cam = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 3, -10), localWorld.get(sE, sC)); 
            cam.setTarget(BABYLON.Vector3.Zero());
            cam.attachControl(canv, true);
            
        }
    }
return CamInit;
}
function LightConfig(ent, comp, sE, sC){
    function LightInit(localWorld){
        if(useInit()){
            let light  = localWorld.get(ent, comp);
            light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), localWorld.get(sE, sC)); 
        }
    }
return LightInit;
}
function BoxConfig(bE, mC, sE, sC){
    function BoxInit(localWorld){
        if(useInit()){
            let mybox  = localWorld.get(bE, mC);
            mybox = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, localWorld.get(sE, sC)); 
        }
    }
return BoxInit;
}*/





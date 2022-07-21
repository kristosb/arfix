import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import 'babylonjs-loaders';
import * as YUKA from 'yuka';
import SkySim from './../scenery/SkySimulator.js';
//import OceanSim from './../scenery/OceanSimulator.js';
import ShadowManager from './../scenery/sahdowManager';

import { createImmutableRef } from "@javelin/ecs"


export const UseScene = createImmutableRef(
  () => {
    const canvas = document.getElementsByTagName("canvas").item(0);
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    engine.loadingUIText = "Loading world and airplane...";
    engine.loadingUIBackgroundColor = "Purple";
    const scene = new BABYLON.Scene(engine);

    let gravityVector = new BABYLON.Vector3(0,-9.81, 0);
    // const physics = new BABYLON.CannonJSPlugin(false,undefined,CANNON);
    // scene.enablePhysics(gravityVector, physics);
    // scene.physicsEnabled = true;
    // physics.setTimeStep(1/30);
    const physics = null;
    const physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0,-9.81, 0);
    physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    physicsWorld.solver.iterations = 10;

    const followCamera = new BABYLON.FollowCamera("followcamera", new BABYLON.Vector3(0,0,-100), scene);
    followCamera.heightOffset = 1;
    //followCamera.rotationOffset = 180;
    followCamera.cameraAcceleration = 0.05   ;//0.06 
    followCamera.maxCameraSpeed = 1800;//1800
    followCamera.inertia = 20.0;//20
    followCamera.radius = -5;
    //followCamera.lockedTarget = mesh.object;
    followCamera.attachControl(canvas, false);
    followCamera.followMeshId = 0;
    
    scene.activeCamera = followCamera;

    const ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-0.7, 0.3, -0.7), scene); 
    ambientLight.position = new BABYLON.Vector3(0, 55, 5);
    ambientLight.intensity =0.8;
    ambientLight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
    ambientLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ambientLight.setEnabled(true); 

    const sunLight = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.7, -0.3, 0.7), scene); 
    sunLight.position = new BABYLON.Vector3(50,100,100);//new BABYLON.Vector3(0, 50, 0);
    sunLight.intensity = 2.3;
    sunLight.setEnabled(true); 

    const shadows = new ShadowManager(sunLight);

    //const ocean = new OceanSim(scene, 800);

    console.log("scene effect created...")
    return { scene, engine, canvas, followCamera, ambientLight ,sunLight, physics, shadows, physicsWorld }
  },
  { shared: true },
)

export const UseKeyboard = createImmutableRef(
  () => {
    const {scene} = UseScene();
    //const actions = {a:1};
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
    //const sc = sceneBjs;
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type=evt.sourceEvent.type === "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        if(inputMap[evt.sourceEvent.key]) inputMap[evt.sourceEvent.key].type= false;
    }));
    return {actions};
  },
  { shared: true }
);
export const UseSky = createImmutableRef(() => {
  const { scene, followCamera } = UseScene()
  const sky = new SkySim(scene, null, null, followCamera, 800);
  sky.transitionSunInclination(15*0.025);
  return sky;
},
{ shared: true }
);

export const UseClouds = createImmutableRef(() => {
  const { scene } = UseScene();
  let area = 800;
  var spriteManagerClouds = new BABYLON.SpriteManager("cloudsManager", "http://www.babylonjs.com/Scenes/Clouds/cloud.png", 1000, 256, scene);
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
  return spriteManagerClouds;
},
{ shared: true }
);

export const UseYuka = createImmutableRef(() => {
  //const { scene, followCamera } = UseScene()

  const yukaManager = new YUKA.EntityManager();
  const time = new YUKA.Time();

  //entityManager.add(vehicle);
  
 

  // if(options.debug){

  // }
  
  //onPathBehavior.radius = 10;
  yukaManager.update(time.update().getDelta())

  return {yukaManager, time};
},
{ shared: true }
);

export function createAi(){
  const vehicle = new YUKA.Vehicle();
  vehicle.name = "nimitz"
  vehicle.maxSpeed = 1;
  vehicle.mass = 0.1;
  //vehicle.maxSpeed = 2;
  //vehicle.setRenderComponent(vehicleMesh, sync);
  const path = new YUKA.Path();
  path.loop = true;
  path.add(new YUKA.Vector3(290, 0, 340));
  path.add(new YUKA.Vector3(100, 0, 350));
  path.add(new YUKA.Vector3(0, 0, 300));
  path.add(new YUKA.Vector3(20, 0, 180));
  path.add(new YUKA.Vector3(140, 0, 140));
  path.add(new YUKA.Vector3(300, 0, 200));
  
  //path.add(new YUKA.Vector3(250, 0, 340));

  vehicle.position.copy(path.current());
  vehicle.active = true;
  const followPathBehavior = new YUKA.FollowPathBehavior(path, 20);
  vehicle.steering.add(followPathBehavior);
  const onPathBehavior = new YUKA.OnPathBehavior(path);
  vehicle.steering.add(onPathBehavior);

  path._waypoints.push(path._waypoints[0]);

  var lines = BABYLON.MeshBuilder.CreateLines('lines', {
    points: path._waypoints,
    updatable: true,
  })
  lines.color = BABYLON.Color3.Teal()

  onPathBehavior.active = false;
  return vehicle;
}

export function createAiAirship(){
  const offsetPosition = new BABYLON.Vector3(-100, 100, -100);
  const initPosition = new BABYLON.Vector3(140, 50, 190).addInPlace(offsetPosition);
  const vehicle = new YUKA.Vehicle();
  vehicle.name = "zeppelin";
  vehicle.maxSpeed = 2;
  vehicle.mass = 0.1;
  const path = new YUKA.Path();
  path.loop = true;
  const yukaOffset = new YUKA.Vector3(offsetPosition.x,offsetPosition.y,offsetPosition.z);
  path.add(new YUKA.Vector3(140, 80, 190).add(yukaOffset));
  path.add(new YUKA.Vector3(-50, 130, 200).add(yukaOffset));
  path.add(new YUKA.Vector3(-50, 180, 150).add(yukaOffset));
  path.add(new YUKA.Vector3(-30, 130, 30).add(yukaOffset));
  path.add(new YUKA.Vector3(-10, 130, -10).add(yukaOffset));
  path.add(new YUKA.Vector3(150, 100, 50).add(yukaOffset));
  
  //path.add(new YUKA.Vector3(250, 0, 340));

  vehicle.position.copy(path.current());
  vehicle.active = true;
  const followPathBehavior = new YUKA.FollowPathBehavior(path, 20);
  vehicle.steering.add(followPathBehavior);
  const onPathBehavior = new YUKA.OnPathBehavior(path);
  vehicle.steering.add(onPathBehavior);

  path._waypoints.push(path._waypoints[0]);

  var lines = BABYLON.MeshBuilder.CreateLines('lines', {
    points: path._waypoints,
    updatable: true,
  })
  lines.color = BABYLON.Color3.Teal()

  onPathBehavior.active = false;
  return vehicle;
}
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as CANNON from 'cannon';
import * as YUKA from 'yuka';
import { GridMaterial} from 'babylonjs-materials';
import SkySim from './../scenery/SkySimulator.js';
import OceanSim from './../scenery/OceanSimulator.js';
import Battleship from './../props/BattleShip';
import {
    toComponent,
    createEffect,
    createImmutableRef,
    createQuery,
    useMonitor, useInit,
    number,
    component,registerSchema, createTopic
  }  from '@javelin/ecs'
import {UseScene, UseKeyboard, UseSky, UseClouds, UseYuka, createAi, createAiAirship} from "./UseScene"
import { Position, Rotation, Mesh, Camera, ToggleKey, Sun, Id, Shadow, Ai, Body} from "./Schema"


/// EFFECTS ///
const UseMeshes = createImmutableRef(() => new Map(), {
  shared: true,
});
const UseAi = createImmutableRef(() => new Map(), {
  shared: true,
});
const UseBodies = createImmutableRef(() => new Map(), {
  shared: true,
});
/// QUERIES ///
const qryBodies = createQuery(Id, Mesh, Body);
const qryFollowMeshes = createQuery(Id, Mesh, Camera);
const qryShadowCasters= createQuery(Id, Mesh, Shadow);
const qrySky = createQuery(Sun, ToggleKey)
const qryClouds = createQuery(Position)
const qryAiMove = createQuery( Mesh, Body, Ai);
//const qryTerrain = createQuery(Mesh);
//const qrySun = createQuery(SunPosition, ToggleKey);
var loadPromise = async(root, file, scene)=>{
  return new Promise((res,rej)=>{
      BABYLON.SceneLoader.LoadAssetContainer(root, file, scene, function (container) {
          res(container)
      });
  })
}
/// COMPONENTS ///
function createBox(
    sceneBjs, meshComp, id
  ) { 
    const mesh = BABYLON.MeshBuilder.CreateBox(id.name, { size: 1 }, sceneBjs);
    mesh.position.x = meshComp.position.x;
    mesh.position.y = meshComp.position.y;
    mesh.position.z = meshComp.position.z;
    console.log("pos",  meshComp.position)
    return mesh;
}
async function createTerrain(sceneBjs, meshComp){
  //return (async () => {
    const assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "achil_2.glb", sceneBjs);
    assets.meshes[1].scaling = assets.meshes[1].scaling.multiplyByFloats(8,8,8); 
    assets.meshes[1].position.y = -1.2;
    //optimization
    /*this.assets.meshes[1].material.freeze();
    this.assets.meshes[1].freezeWorldMatrix();
    this.assets.meshes[1].doNotSyncBoundingInfo = true;*/
    assets.meshes[1].receiveShadows = true;
    const mesh  = assets.meshes[1];
    assets.addAllToScene();
    //console.log("terrainAsync constructor", this.assets.meshes[1].scaling);
    return mesh;
  //})();
}
async function createShip(sceneBjs){
  const assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "nimitz_single_mesh.glb", sceneBjs);
  var initPosition = new BABYLON.Vector3(260, 4, 350);
  const vehicleMesh = BABYLON.MeshBuilder.CreateBox("yukaMeshShip",{width:12, height:3, depth:54},sceneBjs);
  vehicleMesh.material = new GridMaterial("groundMaterial", sceneBjs);//groundMat;
  vehicleMesh.position.copyFrom(initPosition);
  vehicleMesh.position.z +=14;
  vehicleMesh.position.x -=4.3;
  //vehicleMesh.physicsImpostor = new BABYLON.PhysicsImpostor(vehicleMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100000, friction: 1, restitution: 0.9 }, sceneBjs);
  vehicleMesh.isVisible = true;

  assets.meshes[0].position.copyFrom(initPosition);
  assets.meshes[0].position.y +=3.37;
  vehicleMesh.addChild(assets.meshes[0]);
  vehicleMesh.rotate(new BABYLON.Vector3.Up(), -Math.PI/2);

  //const ship = new Battleship(sceneBjs, assets.meshes[0]);
  assets.meshes[1].receiveShadows = true;
  assets.addAllToScene();
  return vehicleMesh;//assets.meshes[1];
}
async function createAirShip(sceneBjs){
  const assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "titan_parts_joined_uvmapped.glb", sceneBjs);
  const offsetPosition = new BABYLON.Vector3(-100, 100, -100);
  const initPosition = new BABYLON.Vector3(140, 50, 190).addInPlace(offsetPosition);
  const vehicleMesh = BABYLON.MeshBuilder.CreateBox("yukaMeshAirship",{width:12, height:10, depth:64},sceneBjs);
  vehicleMesh.material = new GridMaterial("groundMaterialAirship", sceneBjs);//groundMat;
  vehicleMesh.position.copyFrom(initPosition);
  vehicleMesh.position.z +=-1;
  //vehicleMesh.physicsImpostor = new BABYLON.PhysicsImpostor(vehicleMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100000, friction: 1, restitution: 0.9 }, sceneBjs);
  vehicleMesh.isVisible = true;

  assets.meshes[0].scaling = new BABYLON.Vector3(7,7,7);
  assets.meshes[0].position.copyFrom(initPosition);
  assets.meshes[0].position.y +=-20.6;
  assets.meshes[0].rotate(new BABYLON.Vector3.Up(), -Math.PI);
  vehicleMesh.addChild(assets.meshes[0]);
  vehicleMesh.rotate(new BABYLON.Vector3.Up(), -Math.PI/2);

  //const ship = new Battleship(sceneBjs, assets.meshes[0]);
  assets.meshes[1].receiveShadows = true;
  assets.addAllToScene();
  return vehicleMesh;//assets.meshes[1];
}

function createOcean(
  sceneBjs, meshComp, id
) { 
  const mesh = new OceanSim(sceneBjs, 800);
  console.log("ocean", mesh.getMesh());
  return mesh;
}

async function createAirplaneMesh(sceneBjs){
  const assets = await loadPromise(process.env.PUBLIC_URL+"/assets//", "airplane-ww2-collision-scaled.glb", sceneBjs);
  
  assets.meshes[0].removeChild(assets.meshes[11]);
  const visualMeshes = [assets.meshes[11]];
  const bodySize = new BABYLON.Vector3(2, 2, 0.6);
  const massOffset = new BABYLON.Vector3(0, 0.2, 0.65)
  var chassis = makebox(sceneBjs, bodySize, new BABYLON.Vector3(0, 1, 0).subtractInPlace(massOffset), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.1, .1, .1), "chassis");
  chassis.isVisible = false; 
  visualMeshes.forEach(vm=>{chassis.addChild(vm)});
  assets.meshes[0].dispose(); 
  assets.addAllToScene();
  chassis.position = new BABYLON.Vector3(275, 60.5, 364);
  return chassis;
}
function createBody(sceneBjs, mass = 50, size, position, rotation,   offset, friction = 0.8, angularDamping = 0.01 ){
  var chassisShape;
  var mat = new CANNON.Material('Mat');
  mat.friction = friction;
  chassisShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
  var chassisBody = new CANNON.Body({ mass: mass });
  chassisBody.material = mat;
  chassisBody.addShape(chassisShape, new CANNON.Vec3(offset.x, offset.y, offset.z));
  chassisBody.angularDamping = angularDamping; //0.8
  chassisBody.position = new CANNON.Vec3(position.x, position.y, position.z)
  chassisBody.quaternion = new CANNON.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
  //const { world }= UseScene();//sceneBjs.getPhysicsEngine().getPhysicsPlugin().world;
  //world.addBody(chassisBody);
  return chassisBody;
}

/////// TOPICS  ////////
const InputSample = [
{name: "sunAlt", value: 0 },
{name: "debug", state: false }
]
export const inputTopic = createTopic(InputSample)
/////// SYSTEMS ////////
export function SpawnMeshes(world) {
    const { scene, physicsWorld } = UseScene();
    const meshes = UseMeshes();
    const bodies = UseBodies()
    const {yukaManager, time} = UseYuka();
    const ais = UseAi();
    if (useInit()) {
      (async () => {
        let boxComp = [      
        component(Id, {name:"box"}),
        component(Mesh, {
            position:{x:0, y:50, z: -90},
            rotation:{w: 1}
        }),
        component(Camera, {followCamera:true,position:{x:0,y:1,z:-5}}),
      ];
        const meshBox = createBox(scene, boxComp[1], boxComp[0]);
        //meshes.set(1, meshBox);
        

        let terrainComp = [      
          component(Id, {name:"terrain"}),
          component(Mesh, {
              position:{x:0, y:0, z: 0},
              rotation:{w: 1}
          }),
          //component(Camera, {followCamera:false, position:{x:0,y:100,z:-100}}),
          component(Shadow, {cast:true})
        ];
        const meshterrain = await createTerrain(scene, terrainComp[1]);

        let oceanComp = [      
          component(Id, {name:"ocean"}),
          component(Mesh, {
              position:{x:0, y:0, z: 0},
              rotation:{w: 1}
          })];
        const meshOcean = createOcean(scene, oceanComp[1], oceanComp[0]);

        let nimitzComp = [      
          component(Id, {name:"nimitz"}),
          component(Mesh, {
              position:{x:0, y:-2.3, z: 0},
              rotation:{w: 1}
          }),
          component(Body, {
            position:{x:0, y:0, z: 0},
            rotation:{w: 1}
          }),
          component(Camera, {followCamera:false,position:{x:0,y:5,z:-20}}),
          component(Ai, {velocity:{x:0,y:0,z:0}})
        ];
        const meshNimitz = await createShip(scene);
        const bodyNimitz = createBody(scene, 100000, new BABYLON.Vector3(12,3,54), meshNimitz.position, meshNimitz.rotation, new BABYLON.Vector3(0,0,0), 1, 0.01);
        physicsWorld.addBody(bodyNimitz);
        const aiNimitz = createAi();
        yukaManager.add(aiNimitz);
        //yukaManager.update(time.update().getDelta())
        aiNimitz.rotation = new YUKA.Quaternion(meshNimitz.rotationQuaternion.x,meshNimitz.rotationQuaternion.y,meshNimitz.rotationQuaternion.z,meshNimitz.rotationQuaternion.w);

        let zeppelinComp = [      
          component(Id, {name:"zeppelin"}),
          component(Mesh, {
              position:{x:0, y:0, z: 0},
              rotation:{w: 1}
          }),
          component(Body, {
            position:{x:0, y:0, z: 0},
            rotation:{w: 1}
          }),
          component(Camera, {followCamera:false,position:{x:0,y:8,z:-25}}),
          component(Ai, {velocity:{x:0,y:0,z:0}})
        ];
        const meshZeppelin = await createAirShip(scene);
        const bodyZeppelin = createBody(scene, 100000, new BABYLON.Vector3(12,10,64), meshZeppelin.position, meshZeppelin.rotation, new BABYLON.Vector3(0,0,0), 1, 0.01);
        physicsWorld.addBody(bodyZeppelin);
        const aiZeppelin= createAiAirship();
        yukaManager.add(aiZeppelin);
        //yukaManager.update(time.update().getDelta())
        aiZeppelin.rotation = new YUKA.Quaternion(meshZeppelin.rotationQuaternion.x,meshZeppelin.rotationQuaternion.y,meshZeppelin.rotationQuaternion.z,meshZeppelin.rotationQuaternion.w);

        let airplaneComp = [      
          component(Id, {name:"airplane"}),
          component(Mesh, {
              position:{x:0, y:0, z: 0},
              rotation:{w: 1}
          }),
          component(Body, {
            position:{x:0, y:0, z: 0},
            rotation:{w: 1}
          }),
          component(Camera, {followCamera:false,position:{x:0,y:1,z:-5}}),
        ];
        const meshAirplane = await createAirplaneMesh(scene);
        const bodyAirplane = createBody(scene, 50, new BABYLON.Vector3(1,0.3,1), meshAirplane.position, meshAirplane.rotation, new BABYLON.Vector3(0,0.1,-0.2), 0.8, 0.8);
        physicsWorld.addBody(bodyAirplane);

        const eBox = world.create(...boxComp);
        const eterrain = world.create(...terrainComp);
        const eOcean = world.create(...oceanComp);
        const eNimitz = world.create(...nimitzComp);
        const eZeppelin = world.create(...zeppelinComp);
        const eAirplane = world.create(...airplaneComp);

        meshes.set(eBox, meshBox);
        meshes.set(eterrain, meshterrain);
        meshes.set(eOcean, meshOcean);
        meshes.set(eNimitz, meshNimitz);
        meshes.set(eZeppelin, meshZeppelin);
        meshes.set(eAirplane, meshAirplane);

        bodies.set(eNimitz, bodyNimitz);
        bodies.set(eZeppelin, bodyZeppelin);
        bodies.set(eAirplane, bodyAirplane);

        ais.set(eNimitz, aiNimitz);
        ais.set(eZeppelin, aiZeppelin);
        console.log("meshes = ",meshes,"ais = ",ais);
    })();
    }

}

export function SpawnScene(world) {
  const { scene, engine, canvas, camera } = UseScene();
  if (useInit()) {
      //world.create(...HemLightCreate(scene, SunPosition));
      //world.create(...DirLightCreate(scene, SunPosition));
      //world.create(...KeyboardCreate(scene, Key));
      //world.create(...SkyCreate(scene, camera, Id));
      console.log("creating scene elements...");
  }
}

export function SysKeyboard(world) {
  const { scene, followCamera } = UseScene();
  const {actions} = UseKeyboard();
  const meshes = UseMeshes();
  actions.keyActionTrig("1", ()=>{
    qrySky(function updateSunPosition(_, [sun, tkey]) {
      sun.inclination+=0.025;
      tkey.trigger = true;
      }); },
      ()=>{ qrySky(function updateSunPosition(_, [sun, tkey]) { tkey.trigger = false; }); },
      ()=>{ qrySky(function updateSunPosition(_, [sun, tkey]) { tkey.trigger = false; }); } 
    );
  actions.keyActionTrig("2", ()=>{
    qrySky(function updateSunPosition(_, [sun, tkey]) {
        sun.inclination-=0.025;
        tkey.trigger = true;
      }) },
      ()=>{ qrySky(function updateSunPosition(_, [sun, tkey]) { tkey.trigger = false; }) },
      ()=>{ qrySky(function updateSunPosition(_, [sun, tkey]) { tkey.trigger = false; }) }
    );
  actions.keyActionTrig("o", ()=> { scene.debugLayer.show(); });
  actions.keyActionTrig("l", ()=> { 
    let idx = 0;
    for (const [e, [i,m,c]] of qryFollowMeshes ) {
      for (let ei = 0; ei < e.length; ei++) {
        if(idx === followCamera.followMeshId) {
          followCamera.lockedTarget = meshes.get(e[ei]);
          followCamera.heightOffset = c[ei].position.y;
          followCamera.radius = c[ei].position.z;
        }
        idx++;
      }
    }
    followCamera.followMeshId++;
    if(followCamera.followMeshId>= idx) followCamera.followMeshId =0;
    console.log(idx, followCamera.followMeshId,followCamera.lockedTarget.id,followCamera.radius, followCamera.rotation );
  });
}


export function SysRenderSky(world) {
    const { scene, engine, canvas, followCamera, ambientLight ,sunLight } = UseScene();
    useMonitor(qrySky, function addSkyToScene(_, [sun, tkey]) {
      const sky = UseSky();
      sky.setSunInclination(sun.inclination);
      sun.inclination = sky.getSkyMesh().material.inclination;
      //console.log("sun inclination = ",sun.inclination);
      let direction =  sky.getLightDirection();
      //console.log("dir", direction);
      ambientLight.direction.copyFromFloats(direction.x, direction.y, direction.z);
      sunLight.direction.copyFromFloats(-direction.x, -direction.y, -direction.z);
      ambientLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
      sunLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
    })
    qrySky(function updateSunPosition(_, [sun, tkey]) {
      const sky = UseSky();
      if(tkey.trigger){
        sky.setSunInclination(sun.inclination);
        sun.inclination = sky.getSkyMesh().material.inclination;
        //console.log("sun inclination = ",sun.inclination);
        let direction =  sky.getLightDirection();
        //console.log("dir", direction);
        ambientLight.direction.copyFromFloats(direction.x, direction.y, direction.z);
        sunLight.direction.copyFromFloats(-direction.x, -direction.y, -direction.z);
        ambientLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
        sunLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
      }
    })
}


export function SysConfigure(world){
  const { followCamera, shadows } = UseScene();
  const meshes = UseMeshes();
  useMonitor(qryFollowMeshes, function attachCameraToMesh(e, [i, m, c]) {
    const mesh = meshes.get(e);
    if(i.name==="box") {
      console.log("selected",mesh);
      followCamera.lockedTarget = mesh; 
      followCamera.heightOffset = 10;
      followCamera.radius = -5;
    }
  });
  useMonitor(qryClouds, function addSkyToScene(_, [pos]) {
    const clouds = UseClouds();
  });
  useMonitor(qryShadowCasters, function addSkyToScene(e, [i,m,c,s]) {
    const mesh = meshes.get(e);
    shadows.addMesh(mesh);
    console.log("shadow",mesh.id);
  });
  //(e, [meshes, cam, keyboard]) =>{ if(cam.lockedTarget===null) {cam.lockedTarget = meshes; console.log(`cam attached to ${meshes.id}`)} }
}

export function AiMove(world) 
{
  const {yukaManager, time} = UseYuka();
  const meshes = UseMeshes();
  const ais = UseAi();
  const bodies = UseBodies();
  qryAiMove(function updatePosition(e, [mesh, b,  a]) {
    const vehicleMesh = meshes.get(e);
    const vehicleBody = bodies.get(e);
    const vehicle = ais.get(e); 
    const altOffset = new BABYLON.Vector3(mesh.position.x,mesh.position.y,mesh.position.z);

    var vy = -(vehicleBody.position.y-vehicle.position.y+altOffset.y);
    //var meshVelocity = new BABYLON.Vector3(vehicle.velocity.x,vy,vehicle.velocity.z);
    //vehicleMesh.physicsImpostor.setLinearVelocity(meshVelocity);
    var meshVelocity = new CANNON.Vec3(vehicle.velocity.x,vy,vehicle.velocity.z);
    vehicleBody.velocity = meshVelocity; //vehicleMesh.physicsImpostor.physicsBody
    vehicleBody.angularVelocity = new CANNON.Vec3(0,0,0);

    var rotC = new CANNON.Quaternion(vehicle.rotation.x, vehicle.rotation.y, vehicle.rotation.z,vehicle.rotation.w);
    var rotE = new CANNON.Vec3();
    var con = rotC.conjugate(); //find angle between quaternions
    var rotated = con.mult(vehicleBody.quaternion);    
    var res = new CANNON.Vec3();
    rotated.toEuler(res);
    vehicleBody.angularVelocity = new CANNON.Vec3(0,-res.y/10,0);
  });
  const delta = time.update().getDelta();
  yukaManager.update(delta);
}
export function BodiesSync(world) 
{
  const meshes = UseMeshes();
  const bodies = UseBodies();
  qryBodies( function updatePosition(e, [i,m, b]) 
  {
    const mesh = meshes.get(e);
    const body = bodies.get(e);
    mesh.position.copyFrom( new BABYLON.Vector3( body.position.x,
      body.position.y,
      body.position.z,
    ));
    mesh.rotationQuaternion = new BABYLON.Quaternion(
      body.quaternion.x,
      body.quaternion.y,
      body.quaternion.z,
      body.quaternion.w
    );
  }

  )
}



//// utils ///

function makebox(scene, size, position, rotation, color = new BABYLON.Color3(0.5, 0.6, 0.87), name= "box"){
  var box =  BABYLON.MeshBuilder.CreateBox(name, {width:size.x,depth:size.y,height:size.z}, scene);
  box.rotationQuaternion = rotation;
  box.position = position;
  var myMaterial = new BABYLON.StandardMaterial("vehicleMassBox", scene);
  myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
  myMaterial.specularColor = color;
  myMaterial.emissiveColor = color;
  box.material = myMaterial;
  return box;
} 
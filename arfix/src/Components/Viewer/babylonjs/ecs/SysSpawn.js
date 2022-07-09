import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import SkySim from './../scenery/SkySimulator.js';
import {
    toComponent,
    createEffect,
    createImmutableRef,
    createQuery,
    useMonitor, useInit,
    number,
    component,registerSchema, createTopic
  }  from '@javelin/ecs'
import {UseScene, UseKeyboard, UseSky} from "./UseScene"
import { Position, Rotation, Mesh, SunPosition, ToggleKey, Sun} from "./Schema"

/// EFFECTS ///
const UseMeshes = createImmutableRef(() => new Map(), {
  shared: true,
});
/// QUERIES ///
const qryBoxes = createQuery(Mesh);
//const qrySun = createQuery(SunPosition, ToggleKey);
/// COMPONENTS ///
function createBox(
    sceneBjs, meshComp
  ) {
    const mesh = BABYLON.MeshBuilder.CreateBox("", { size: 1 }, sceneBjs);
    mesh.position.z = meshComp.position.z;
    console.log("pos",  meshComp.position.z)
    return mesh;
}
/////// TOPICS  ////////
const InputSample = [
{name: "sunAlt", value: 0 },
{name: "debug", state: false }
]
export const inputTopic = createTopic(InputSample)
/////// SYSTEMS ////////
export function SpawnMeshes(world) {
    const { scene, engine, canvas, camera } = UseScene();
    useMonitor(
      qryBoxes,
      function initBoxes(e, [m]) {
        const meshes = UseMeshes();
        const mesh = createBox(scene, m);
        meshes.set(e, mesh);
      }
    )
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
  const { scene } = UseScene();
  const {actions} = UseKeyboard();
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
}

const qrySky = createQuery(Sun, ToggleKey)

/*export function SysInput(world) {
  const { ambientLight, sunLight} = UseScene();
  //const sky = UseSky();
  for (const key of inputTopic) {
    //if (key[0].value !== 0) {
      qrySky(function updateSunPosition(_, [sun, tkey]) {
        //let { inclination } = sun;
        if (key[0].value !== 0) 
        {
          sun.inclination += 0.025*key[0].value;
          tkey.down = true;
        }
        else tkey.down = false;
        //if (key[0].value !== 0) key.down = true; else key.down = false;
        // let { direction, sunIntensity, ambientIntensity } = sun;
        // sky.transitionSunInclination(0.025*key[0].value);
        // let lightDirection =  sky.getLightDirection();
        // direction = {x:lightDirection.x, y:lightDirection.y, z:lightDirection.z};
        // sunIntensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);;
        // ambientIntensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
        // console.log(direction, sunIntensity, ambientIntensity);
      });
      //console.log("key0", key);
      // sky.transitionSunInclination(0.025*key[0].value);
      // var direction =  sky.getLightDirection();
      // ambientLight.direction.copyFromFloats(direction.x, direction.y, direction.z);
      // sunLight.direction.copyFromFloats(-direction.x, -direction.y, -direction.z);
      // ambientLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
      // sunLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
    //} 

  }
}*/

// const UseSky = createImmutableRef(() => {
//     const { scene, engine, canvas, camera, } = UseScene()
//     const sky = new SkySim(scene, null, null, camera, 800);
//     return sky
//   })
export function SysRenderSky(world) {
    const { scene, engine, canvas, followCamera, ambientLight ,sunLight } = UseScene();
    //const sky = UseSky()
    // if(useInit()){
    //     world.create( component(Sun, {inclination:0.3}),
    //                   component(ToggleKey, {name: "sunInc", down: false}) );//{ position: {x:0, y:0, z:0}, direction: {x:-5.23, y:0.5, z:0.86}, sunIntensity: 0.43, ambientIntensity: 1.75 }));
    // }
    useMonitor(qrySky, function addSkyToScene(_, [sun, tkey]) {
      const sky = UseSky();
      sky.setSunInclination(sun.inclination);
      sun.inclination = sky.getSkyMesh().material.inclination;
      console.log("sun inclination = ",sun.inclination);
      let direction =  sky.getLightDirection();
      console.log("dir", direction);
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
        console.log("sun inclination = ",sun.inclination);
        let direction =  sky.getLightDirection();
        console.log("dir", direction);
        ambientLight.direction.copyFromFloats(direction.x, direction.y, direction.z);
        sunLight.direction.copyFromFloats(-direction.x, -direction.y, -direction.z);
        ambientLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[0.8,0.2]);
        sunLight.intensity = sky.convertRange(Math.abs(sky.getSkyMesh().material.inclination),[0,0.5],[2.3,1.4]);
      }
    })
}
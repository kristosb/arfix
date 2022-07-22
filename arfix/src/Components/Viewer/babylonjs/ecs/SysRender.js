import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
// import SkySim from './../scenery/SkySimulator.js';
import {
    toComponent,
    createEffect,
    createImmutableRef,
    createQuery,
    useMonitor, useInit,
    number,
    component,registerSchema
  }  from '@javelin/ecs'
import {UseScene, UseSky} from "./UseScene"


/*registerSchema(Position, 4)
registerSchema(Rotation, 5)
const position = component(Position);
const rotation = component(Rotation);
const boxEnt = world.create(position, rotation);
*/



// function createBox(
//     sceneBjs
//   ) {
//     const mesh = BABYLON.MeshBuilder.CreateBox("", { size: 1 }, sceneBjs);
//     return mesh
// }



export const UseRenderLoop = createEffect(() => {
    let _engine;
    let _scene;
    let _physics;
    let running;
    let physicsPause;
    //console.log("scne",_engine)
    const api = {
      start(pause) {
        //if (!running) {
          running = true
          physicsPause = pause
          console.log("q",physicsPause)
          //_engine?.runRenderLoop(loop);
          //console.log(_engine)
        //}
      },
      stop() {
        //if (running) {
            running = false
            physicsPause = false
        //}
      },
      isPhysicsPaused(){
          return physicsPause;
      },
      render(){
        if (running) {
            _scene?.render();
            if(physicsPause) _physics?.step(1/30);
        }
      }
    }
    // function loop() {
    //   if (!running) return
    //   _scene?.render();
    //   //console.log(_scene)
    //   //requestAnimationFrame(loop)
    // }
    //api.start()

    return function useRenderLoop(
    //   engine,
    //   scene,
    //   physics
    ) {
        const { scene, engine, physicsWorld } = UseScene();
      _engine = engine
      _scene = scene
      _physics = physicsWorld
      //console.log("scne",_engine)
      return api
    }
  },{ shared: true })


export function SysRender(world) {
    //const { scene, engine, physicsWorld } = UseScene();
    const rednerloop = UseRenderLoop();//engine, scene, physicsWorld)
    //console.log(world.latestTickData)
    
    if(useInit()) {
        console.log("start rendering...");
        rednerloop.start(false)
    }
    rednerloop.render()
}




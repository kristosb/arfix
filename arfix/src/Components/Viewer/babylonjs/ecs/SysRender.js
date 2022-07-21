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



const useRenderLoop = createEffect(() => {
    let _engine;
    let _scene;
    let _physics;
    let running;
    //console.log("scne",_engine)
    const api = {
      start() {
        if (!running) {
          running = true
          //_engine?.runRenderLoop(loop);
          //console.log(_engine)
        }
      },
      stop() {
        if (running) running = false
      },
      render(){
        if (running) {
            _scene?.render();
            _physics?.step(1/30);
        }
      }
    }
    function loop() {
      if (!running) return
      _scene?.render();
      //console.log(_scene)
      //requestAnimationFrame(loop)
    }
    //api.start()

    return function useRenderLoop(
      engine,
      scene,
      physics
    ) {
      _engine = engine
      _scene = scene
      _physics = physics
      //console.log("scne",_engine)
      return api
    }
  })


export function SysRender(world) {
    const { scene, engine, physicsWorld } = UseScene();
    //console.log(world.latestTickData)
    const rednerloop = useRenderLoop(engine, scene, physicsWorld)
    if(useInit()) {
        console.log("start rendering...");
        rednerloop.start()
    }
    rednerloop.render()
}




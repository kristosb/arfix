import { createWorld, component, useWorld,
         number } from "@javelin/ecs"
import { Position, Rotation, Mesh, Sun, ToggleKey} from "./Schema"
//import { createHrtimeLoop } from "@javelin/hrtime-loop"
import {SysRender} from "./SysRender"
import {SpawnMeshes, SpawnScene, SysInput, inputTopic, SysKeyboard, SysRenderSky } from "./SysSpawn"
import {Clock} from './../utils/Clock';
export default function Game()  {
    const fpcClock = new Clock();
    const world = createWorld();

    world.addSystem(SysRender);
    //world.addSystem(SpawnScene);
    world.addSystem(SysRenderSky);
    world.addSystem(SpawnMeshes);
    //world.addSystem(SysInput);
    world.addSystem(SysKeyboard);
    
    world.addTopic(inputTopic);
    //inputTopic.push([1,1]);
    
    SysSpawnSky();
    SysSpawnBox();
    
    //inputTopic.pushImmediate([0,0]);
    //world.addSystem(world => console.log(world.latestTickData))
    function SysSpawnBox() {
        world.create(
            component(Mesh, {
                position:{z: -90},
                rotation:{w: 1}
            }) )
    }
    function SysSpawnSky(){
        world.create( component(Sun, {inclination:-0.325}),
                      component(ToggleKey, {name: "sunInc", trigger: false, hold: false}) );
    }

    function step(){
    setInterval(function stepLoop() {
        world.step(fpcClock.getElapsedTime())
      }, (1 / 60) * 1000)
    //createHrtimeLoop(world.step, (1 / 60) * 1000).start()
    }
    return{
        step
    }
}
// player -> mesh, keyboard
// bird -> mesh, ai
// ship -> mesh, ai
// weather -> sky, clouds, sun, keyboard (or ai )
// terrain -> mesh
// ocean -> mesh 
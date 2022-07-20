import { createWorld, component, useWorld,
         number } from "@javelin/ecs"
import { Position, Rotation, Mesh, Sun, ToggleKey, Id} from "./Schema"
//import { createHrtimeLoop } from "@javelin/hrtime-loop"
import {SysRender} from "./SysRender"
import {SpawnMeshes, SpawnScene, SysInput, inputTopic, SysKeyboard, SysRenderSky, SysConfigure, AiMove, BodiesSync } from "./SysSpawn"
import {Clock} from './../utils/Clock';
export default function Game()  {
    const fpcClock = new Clock();
    const world = createWorld();
    world.addSystem(SysRender);
    //world.addSystem(SpawnScene);
    world.addSystem(SysRenderSky);
    world.addSystem(SpawnMeshes);
    world.addSystem(SysKeyboard);
    world.addSystem(SysConfigure);
    world.addSystem(AiMove);
    world.addSystem(BodiesSync);
    
    //world.addTopic(inputTopic);
    //inputTopic.push([1,1]);
    
    SysSpawnSky();
    SysSpawnClouds();
    
    //inputTopic.pushImmediate([0,0]);
    //world.addSystem(world => console.log(world.latestTickData))
    /*function SysSpawnMeshes() {
        world.create(
            component(Id, {name:"box"}),
            component(Mesh, {
                position:{y:100, z: -90},
                rotation:{w: 1}
            }) )
        world.create(
            component(Id, {name:"terrain"}),
            component(Mesh, {
                position:{z: 0},
                rotation:{w: 1}
            }) )
        world.create(
            component(Id, {name:"ocean"}),
            component(Mesh, {
                position:{z: 0},
                rotation:{w: 1}
            }) )
    }*/
    function SysSpawnSky(){
        world.create( component(Sun, {inclination:-0.325}),
                      component(ToggleKey, {name: "sunInc", trigger: false, hold: false}) );
    }
    function SysSpawnClouds(){
        world.create( component(Position, {x:0, y:0, z:0}));
    }

    function step(){
    setInterval(function stepLoop() {
        world.step(fpcClock.getElapsedTime())
    }, (1 / 30) * 1000)
    //createHrtimeLoop(world.step, (1 / 60) * 1000).start()
    }
    return{
        step
    }
}
// player -> mesh, body, camera, shadow, keyboard, id
// bird -> mesh, ai, id
// ship -> mesh, ai, id, camera
// weather -> sky, clouds, sun, keyboard (or ai )
// terrain -> mesh, id, shadow, camera
// ocean -> mesh, id

//ai_move mesh, ai
// 
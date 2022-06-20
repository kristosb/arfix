//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import {Clock} from './utils/Clock';
import {Scene, Camera, Light, Physics, Box, Sky, Clouds, Keyboard, 
        KeyboardSkyInteraction, Ocean, Terrain, Shadows, 
        ShadowCasters, Ship, KeyboardGameStateInteraction, Airships,
        Birds, Aircraft, KeyboardCameraInteraction, KeyboardAirplaneInteraction,
        AirplaneBirdsInteraction, DebugUi
} from './ecs/ecs';

export default function canvas(canvas)  {
    const FRAMERATE = 1/40;
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
    let box = new Box(sceneEnt);
    let clouds = new Clouds(sceneEnt, 800);
    let cameraEnt = new Camera(sceneEnt, canvas);
    let sky = new Sky(sceneEnt, cameraEnt);
    let ocean = new Ocean(sceneEnt);
    let keyboard = new Keyboard(sceneEnt);
    let terrain = await new Terrain(sceneEnt);
    let nimitz = await new Ship(sceneEnt);
    let zeppelin = await new Airships(sceneEnt);
    let birdflock = await new Birds(sceneEnt);
    let airplane = await new Aircraft(sceneEnt,canvas);
    let shadows = new Shadows(sceneEnt, light_sun);
    let debugUI = new DebugUi(sceneEnt, engine);
    //console.log("airplane",airplane.object.bluePrint.chassisMesh);
    let keyboardSkyActions = new KeyboardSkyInteraction(sceneEnt, keyboard, sky, light_sun, light_ambient);
    let shadowCasters = new ShadowCasters(sceneEnt, shadows, [terrain, airplane]);
    let keyboardStateActions = new KeyboardGameStateInteraction(sceneEnt, keyboard, [nimitz, zeppelin, birdflock]);
    let keyboardCameraActions = new KeyboardCameraInteraction(sceneEnt, keyboard, cameraEnt, [airplane, birdflock,box]);
    let keyboardAirplaneActions = new KeyboardAirplaneInteraction(sceneEnt, keyboard, airplane);
    let airplaneBirdsInteractions = new AirplaneBirdsInteraction(sceneEnt, airplane, birdflock);
    // create array of all game components
    components.push(sceneEnt);
    components.push(physicsEnt);
    components.push(cameraEnt);
    components.push(light_sun);
    components.push(light_ambient);
    components.push(box);
    components.push(sky);
    components.push(ocean);
    components.push(clouds);
    components.push(keyboard);
    components.push(terrain);
    components.push(nimitz);
    components.push(zeppelin);
    components.push(birdflock);
    components.push(airplane);
    components.push(shadows);
    components.push(debugUI);

    components.push(keyboardSkyActions);
    components.push(shadowCasters);
    components.push(keyboardStateActions);
    components.push(keyboardCameraActions);
    components.push(keyboardAirplaneActions);
    components.push(airplaneBirdsInteractions);

    components.forEach((component) => { component.init(); });
    console.log("finished");
    })();

/*
    scene.onDispose = function () {
        components.forEach((component) => { component.dispose(); })
    }

*/

    function onWindowResize() {
        engine.resize();
    }
    function animate(){
        engine.runRenderLoop(function () {    
            if(fpcClock.timeIntervalCheck(FRAMERATE)){
                components.forEach((component) => { component.update(); })
            }
        });
    }
    return {
        onWindowResize,
        //onMouseMove,
        animate
    }
}

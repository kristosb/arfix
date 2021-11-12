//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import  GRID   from 'babylonjs-materials';//'babylonjs-materials';
//import Airplane from './Airplane';
function createPhysicsImpostor(scene, entity, impostor, options, reparent) {
  if (entity == null) return;
  entity.checkCollisions = false;
  const parent = entity.parent;
  if (reparent === true) entity.parent = null;
  entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
  if (reparent === true) entity.parent = parent;
}
export default function scene(scene) {    


    function makeInstance(geometry, color, x,y,z) {
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 2;
        
        return sphere;
      }
      function makeGround(){
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        const ground = BABYLON.Mesh.CreateGround('ground1', 500, 500, 2, scene, false);
        //const ground = BABYLON.MeshBuilder.CreateBox("box", {height: 2, width: 100, depth: 100},scene);
        //ground.scaling =new BABYLON.Vector3(10,1,10);
        //var mat = GRID.GridMaterial("groundMaterial", scene);
        //var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "textures/heightMap.png", 100, 100, 100, 0, 10, scene, false);
        //ground.material =  mat;//new BABYLON.GridMaterial("groundMaterial", scene);
        ground.setAbsolutePosition(new BABYLON.Vector3(0,-1,0) );
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0.7}, scene);
        //https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/textures/ground.jpg
        var groundMat = new BABYLON.StandardMaterial("groundMat", scene);

        //groundMat.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/textures/ground.jpg", scene);
        //groundMat.diffuseTexture.uScale = 6;
        //groundMat.diffuseTexture.vScale = 6;
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);

        //groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        //groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
        groundMat.diffuseColor = new BABYLON.Color3(0.29, 0.26, 0.26);
        groundMat.backFaceCulling = false;
        ground.material = groundMat;
        ground.receiveShadows = true;
/*
        //var texture = new BABYLON.CubeTexture(process.env.PUBLIC_URL+"/skybox", scene);
        //scene.createDefaultSkybox(texture, true, 100);
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:500.0}, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(process.env.PUBLIC_URL+"/assets/textures/skybox", scene);
        //skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
*/
        return ground;
    }
    function makeTerrain(size, physics){
      // Ground
      var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
      groundMaterial.diffuseTexture = new BABYLON.Texture(process.env.PUBLIC_URL+"/assets/textures/diffuse.png", scene);
      //groundMaterial.wireframe = true;
      groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);//new BABYLON.Color3(0.32, 0.33, 0.22); //black makes no reflection
      groundMaterial.diffuseColor = new BABYLON.Color3(0.29, 0.26, 0.26);
      groundMaterial.backFaceCulling = false;
      var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", process.env.PUBLIC_URL+"/assets/textures/hight.png", size, size, 80, 0, 12, scene, false,function() {
          
          ground.material = groundMaterial;
          //ground.material.diffuseColor =  new BABYLON.Color3(.5, .5, .5);
          ground.receiveShadows = true;
          ground.setAbsolutePosition(new BABYLON.Vector3(0,-1,0) );
          ground.physicsImpostor = new BABYLON.PhysicsImpostor(
              ground, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0.3 }, scene
          );
          ground.physicsImpostor.physicsBody.forceActivationState(0);//setActivationState(0); 
          
          //console.log(ground.physicsImpostor);
          //physics.sleepBody(ground._physicsImpostor);
      });
      
      return ground ;
    }
    function makeClouds(){
      var spriteManagerClouds = new BABYLON.SpriteManager("cloudsManager", "http://www.babylonjs.com/Scenes/Clouds/cloud.png", 1000, 256, scene);
      for (var i = 0; i < 200; i++) {
            var clouds = new BABYLON.Sprite("clouds", spriteManagerClouds);
            clouds.position.x = Math.random() * 500 - 100;
        clouds.position.y = Math.random() * 10 + 60;
            clouds.position.z = Math.random() * 500 - 200; 
        clouds.size = Math.random() * 50;
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
    }
    function makeStats(engine){
    // Instrumentation
    var instrumentation = new BABYLON.EngineInstrumentation(engine);
    instrumentation.captureGPUFrameTime = true;
    instrumentation.captureShaderCompilationTime = true;
    
    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    var stackPanel = new BABYLON.GUI.StackPanel();
    stackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;   
    stackPanel.isVertical = true;
    advancedTexture.addControl(stackPanel);     

    var text1 = new BABYLON.GUI.TextBlock();
    text1.text = "";
    text1.color = "white";
    text1.fontSize = 16;
    text1.height = "30px";
    stackPanel.addControl(text1);       

    var text2 = new BABYLON.GUI.TextBlock();
    text2.text = "";
    text2.color = "white";
    text2.fontSize = 16;
    text2.height = "30px";
    stackPanel.addControl(text2);       

    var text3 = new BABYLON.GUI.TextBlock();
    text3.text = "";
    text3.color = "white";
    text3.fontSize = 16;
    text3.height = "30px";
    stackPanel.addControl(text3);       

    var text4 = new BABYLON.GUI.TextBlock();
    text4.text = "";
    text4.color = "white";
    text4.fontSize = 16;
    text4.height = "30px";
    stackPanel.addControl(text4);        

    var text5 = new BABYLON.GUI.TextBlock();
    text5.text = "";
    text5.color = "white";
    text5.fontSize = 16;
    text5.height = "30px";
    stackPanel.addControl(text5);       

    var i = 0;
    scene.registerBeforeRender(function () {
        text1.text = "current frame time (GPU): " + (instrumentation.gpuFrameTimeCounter.current * 0.000001).toFixed(2) + "ms";
        text2.text = "average frame time (GPU): " + (instrumentation.gpuFrameTimeCounter.average * 0.000001).toFixed(2) + "ms";
        text3.text = "total shader compilation time: " + (instrumentation.shaderCompilationTimeCounter.total).toFixed(2) + "ms";
        text4.text = "average shader compilation time: " + (instrumentation.shaderCompilationTimeCounter.average).toFixed(2) + "ms";
        text5.text = "compiler shaders count: " + instrumentation.shaderCompilationTimeCounter.count;
    });

    }
    function makeBox(){
      // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
      //const ground = BABYLON.Mesh.CreateGround('ground1', 10, 10, 2, scene, false);
      const ground = BABYLON.MeshBuilder.CreateBox("box", {height: 2, width: 6, depth: 4},scene);
      //var mat = GRID.GridMaterial("groundMaterial", scene);
      //var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "textures/heightMap.png", 100, 100, 100, 0, 10, scene, false);
      //ground.material =  mat;//new BABYLON.GridMaterial("groundMaterial", scene);
      ground.setAbsolutePosition(new BABYLON.Vector3(-10,1,10) );
      ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 10, friction: 0.3, restitution: 0}, scene);

      var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
      groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      groundMat.backFaceCulling = false;
      ground.material = groundMat;
      //ground.receiveShadows = true;


      return ground;
  }
    function makeWorld(){
      var world = loadMeshes("world.glb").then( x=>{
        debug(x.meshes); 
        //x[0].physicsImpostor = new BABYLON.PhysicsImpostor(x[0], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.0, restitution: 0.1}, scene);
      });

    }
    async function loadMeshes(filename = "airplane.glb"){
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", process.env.PUBLIC_URL+"/", filename, scene, function (newMeshes) {
      });
      return result;
    }
    function debug(meshAll){
      var worldFriction = 0;
      meshAll.map(mesh => {
        if(mesh.hasOwnProperty('metadata'))
          if(mesh.metadata!==null)
            if(mesh.metadata.hasOwnProperty('gltf'))
              if(mesh.metadata.gltf.hasOwnProperty('extras')){
                //console.log(mesh.metadata.gltf.extras.type);
                mesh.isVisible = false;
                //console.log(mesh.metadata.gltf.extras.type);
                if (mesh.metadata.gltf.extras.type ==='box'){
                  createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: worldFriction, restitution: 0  }, true);
                  //mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.0, restitution: 0.1}, scene);
                  //console.log("p")
                }
                if (mesh.metadata.gltf.extras.type ==='trimesh'){
                  createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: worldFriction, restitution: 0  }, true);
                }
              }
      });
    }
    function hideElements(meshAll){
      meshAll.map(mesh => {
          if (mesh.name.includes("Cube")) {
              mesh.isVisible = false;
          }
          if (mesh.name.includes("Sphere")) {
            mesh.isVisible = false;
          }
      });
  }
    /*const cubes = [
      //makeInstance(1, 0x44aa88,  0, 0, -0.5),
        //makeGround(),
        makeTerrain(),
        //makeBox(),
        //makeClouds()

        //makeWorld()
        //new Airplane(scene)
      ];*/



    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

        //group.rotation.y = angle;
        //cubes[0].rotation.x = angle;
        //cubes[0].rotation.y = angle;
    }

    return {
        update,
        makeTerrain,
        makeStats
    }
}
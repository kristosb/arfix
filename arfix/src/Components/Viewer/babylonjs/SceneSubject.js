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
        //const ground = BABYLON.Mesh.CreateGround('ground1', 10, 10, 2, scene, false);
        const ground = BABYLON.MeshBuilder.CreateBox("box", {height: 2, width: 100, depth: 100},scene);
        //var mat = GRID.GridMaterial("groundMaterial", scene);
        //var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "textures/heightMap.png", 100, 100, 100, 0, 10, scene, false);
        //ground.material =  mat;//new BABYLON.GridMaterial("groundMaterial", scene);
        ground.setAbsolutePosition(new BABYLON.Vector3(0,-3,0) );
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0}, scene);

        var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMat.backFaceCulling = false;
        ground.material = groundMat;
        ground.receiveShadows = true;


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
    const cubes = [
      //makeInstance(1, 0x44aa88,  0, 0, -0.5),
        makeGround(),
        //makeWorld()
        //new Airplane(scene)
      ];



    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

        //group.rotation.y = angle;
        //cubes[0].rotation.x = angle;
        //cubes[0].rotation.y = angle;
    }

    return {
        update
    }
}
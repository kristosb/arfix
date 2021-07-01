//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
//import * as CANNON from 'cannon';
//import * as CANNON from './cannon.js';
//import * as Ammo from './ammo.js';
//import { default as Ammo } from 'ammo.js/builds/ammo';
//Ammo();
export default function scene(scene) {    

    var airplaneMesh = null;

    var createPhysicsImpostor = function(scene, entity, impostor, options, reparent) {
      if (entity == null) return;
      entity.checkCollisions = false;
      const parent = entity.parent;
      if (reparent === true) entity.parent = null;
      entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
      if (reparent === true) entity.parent = parent;
  };

    function makeInstance(geometry, color, x,y,z) {
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 2;
        
        return sphere;
      }
    function makeGround(){
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        const ground = BABYLON.Mesh.CreateGround('ground1', 10, 10, 2, scene, false);
        //var ground = BABYLON.Mesh.CreateBox("ground", 2, scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0, friction: 0.5, restitution: 0.5}, scene);
        return ground;
    }
    function airplanePhysics(newMeshes){

      /*const collisionAirplaneWheels  = [
        newMeshes[8], newMeshes[9],newMeshes[10]
      ];  */        
      const collisionAirplaneBox  = [
        newMeshes[11], newMeshes[12],newMeshes[13],
        newMeshes[14], newMeshes[15],newMeshes[16],
        newMeshes[17]
      ];
      const collisionAirplaneSphere  = [
        newMeshes[18],newMeshes[19],
        //newMeshes[20], newMeshes[21],newMeshes[22],
      ];
      // Create a physics root and add all children
      var physicsRoot = new BABYLON.Mesh("", scene);
      physicsRoot.addChild(newMeshes[0]);//7
      //collisionAirplaneWheels.forEach((mesh)=>{physicsRoot.addChild(mesh);});
      //collisionAirplaneBox.forEach((mesh)=>{physicsRoot.addChild(mesh);});
      collisionAirplaneSphere.forEach((mesh)=>{physicsRoot.addChild(mesh);});
      physicsRoot.position.y+=8;

      collisionAirplaneBox.forEach((mesh)=>{
        //mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
      });
      collisionAirplaneSphere.forEach((mesh)=>{
        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0 }, scene);
      });
      physicsRoot.physicsImpostor = new BABYLON.PhysicsImpostor(physicsRoot, BABYLON.PhysicsImpostor.NoImpostor, { mass: 0.1 }, scene);
      //physicsRoot.position.y+=1;
      //newMeshes[0].position.y+=3;
    }
    function rotorSpeen(rotor){
      rotor.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
      const animWheel = new BABYLON.Animation("wheelAnimation", "rotation.x", 15, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
      var animationGroup = new BABYLON.AnimationGroup("airplane");
      const wheelKeys = []; 
      var enginePower = 1;
      //At the animation key 0, the value of rotation.y is 0
      wheelKeys.push({
          frame: 0,
          value: 0
      });

      //At the animation key 30, (after 1 sec since animation fps = 30) the value of rotation.y is 2PI for a complete rotation
      wheelKeys.push({
          frame: 15,
          value: enginePower*(-2 * Math.PI)
      });

      //set the keys
      animWheel.setKeys(wheelKeys);
      
      //Link this animation to a wheel
      rotor.animations = [];
      rotor.animations.push(animWheel);

      animationGroup.addTargetedAnimation(animWheel,rotor );

      //scene.beginAnimation(wheelRB, 0, 30, true);
      animationGroup.play(true);
      animationGroup.speedRatio = 1;
    }
    async function loadMeshes(){
        // The first parameter can be used to specify which mesh to import. Here we import all meshes
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "arfix/", "airplane.glb", scene, function (newMeshes) {
        //const loader = BABYLON.SceneLoader.ImportMesh("", "arfix/", "airplane.glb", scene, function (newMeshes) {
          //newMeshes[0].position.set(0,1,0);
          //Object.values(newMeshes).forEach(val => {console.log(val.name)});
          //console.log(newMeshes);
          /*for (let index = 11; index < newMeshes.length-7; index++) {
            newMeshes[index].isVisible = false;   
          }*/
          //Animate the rotor
          //rotorSpeen(newMeshes[5]);
          //airplaneMesh = newMeshes;
          //airplanePhysics(newMeshes);


        });
        return result;
    }
    function applyPh(newMeshes){
      newMeshes[0].position.y=5;
      newMeshes.map(mesh => {
          if (mesh.name.includes("Cube")) {
              console.log("add Box Collider/Impostor --> ",mesh.id);
              //mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
              createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0.5, friction: 2.5, restitution: 0 }, true);
          }
          if (mesh.name.includes("Sphere")) {
            console.log("add Sphere Collider/Impostor --> ",mesh.id);
            //mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
            createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.3, friction: 0.5, restitution: 0  }, true);
          }
          if (mesh.name.includes("wheel")) {
            console.log("add wheel Collider/Impostor --> ",mesh.id);
            createPhysicsImpostor(scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.1, friction: 0.1, restitution: 0.5  }, true);
          }
      });
      createPhysicsImpostor(scene, newMeshes[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 0.1, friction: 0.5, restitution: 0  }, true);

    }

    const cubes = [
      //makeInstance(1, 0x44aa88,  0, 0, -0.5),
      makeGround(),
      //loadMeshes(),
      ];
      console.log(cubes);
    loadMeshes()
          .then(res=>{
            rotorSpeen(res.meshes[5]);
            //airplanePhysics(res.meshes);
            applyPh(res.meshes);
          });
          //.then(res=>console.log(res.meshes) );

    //console.log(airplaneMesh);

    //rotorSpeen(airplane[5]);  
    //loadMeshes();
    //console.log(airplaneMesh);
    //airplanePhysics(airplaneMesh);
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
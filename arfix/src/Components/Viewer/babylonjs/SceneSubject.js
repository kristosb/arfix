import * as BABYLON from "@babylonjs/core";

export default function scene(scene) {    

    function makeInstance(geometry, color, x,y,z) {
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 1;
        
        return sphere;
      }
    function makeGround(){
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
        return ground;
    }
    const cubes = [
      makeInstance(1, 0x44aa88,  0, 0, -0.5),
      makeGround(),
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
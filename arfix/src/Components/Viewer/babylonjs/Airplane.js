//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';

class Airplane {
    constructor(scene){
        this.meshAll = null;
        this.scene = scene;
        this.animationGroup = null;
        this.loadMeshes().then(res=>{
            this.meshAll=res.meshes;
            this.hideElements();
            this.addAnimations();
            this.meshRootPosition(0,5,0);
            this.addPhysics();
        });
    }
    async loadMeshes(){
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", process.env.PUBLIC_URL+"/", "airplane.glb", this.scene, function (newMeshes) {
        });
        return result;
    }
    hideElements(){
        this.meshAll.map(mesh => {
            if (mesh.name.includes("Cube")) {
                mesh.isVisible = false;
            }
            if (mesh.name.includes("Sphere")) {
              mesh.isVisible = false;
            }
        });
    }
    rotorSpin(rotor){
        rotor.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
        const animWheel = new BABYLON.Animation("wheelAnimation", "rotation.x", 15, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        this.animationGroup = new BABYLON.AnimationGroup("airplane");
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
        this.animationGroup.addTargetedAnimation(animWheel,rotor );
      }
    addAnimations(){
        this.rotorSpin(this.meshAll[5]);
    }
    applyPhysicsCollider(newMeshes){
        newMeshes.map(mesh => {
            if (mesh.name.includes("Cube")) {
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0.1, friction: 0.5, restitution: 0 }, true);
            }
            if (mesh.name.includes("Sphere")) {
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.3, friction: 0.5, restitution: 0  }, true);
            }
            if (mesh.name.includes("wheel")) {
              this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.1, friction: 0.1, restitution: 0.5  }, true);
            }
        });
        this.createPhysicsImpostor(this.scene, newMeshes[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 0.1, friction: 0.5, restitution: 0  }, true);
  
      }
    createPhysicsImpostor(scene, entity, impostor, options, reparent) {
        if (entity == null) return;
        entity.checkCollisions = false;
        const parent = entity.parent;
        if (reparent === true) entity.parent = null;
        entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
        if (reparent === true) entity.parent = parent;
    };
    addPhysics(){
        this.applyPhysicsCollider(this.meshAll);
    }
    meshRootPosition(x,y,z){
        this.meshAll[0].position.y=y;
    }
    moveForward(speed){
        this.meshAll[0].moveWithCollisions(this.meshAll[0].forward.scaleInPlace(speed));
        this.animationGroup.play(true);
        this.animationGroup.speedRatio = 1;
    }
}


export default function scene(scene) {        
    function makeGround(){
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        //const ground = BABYLON.Mesh.CreateGround('ground1', 10, 10, 2, scene, false);
        const ground = BABYLON.MeshBuilder.CreateBox("box", {height: 0.2, width: 20, depth: 20},scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.5}, scene);
        return ground;
    }

    // Keyboard events
    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    makeGround();
    var tinyPlane = new Airplane(scene);

    scene.onBeforeRenderObservable.add(() => {
        if (inputMap["w"]) {
            tinyPlane.moveForward(0.13);
        }
      }
    );
    console.log(process.env.PUBLIC_URL);
    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

    }

    return {
        update
    }
}
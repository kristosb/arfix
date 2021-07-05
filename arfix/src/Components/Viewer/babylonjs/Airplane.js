//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';


var vmult = function(v,q){
    var target =  new BABYLON.Vector3();
 
    var x = v.x,
        y = v.y,
        z = v.z;
 
    var qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w;
 
    // q*v
    var ix =  qw * x + qy * z - qz * y,
    iy =  qw * y + qz * x - qx * z,
    iz =  qw * z + qx * y - qy * x,
    iw = -qx * x - qy * y - qz * z;
 
    target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
 
    return target;
};
var vectorToWorldFrame = function(localVector, quaternion){
    var result = new BABYLON.Vector3();
    result = vmult(localVector, quaternion);
    return result;
};
var pointToWorldFrame = function(localPoint,quaternion, position){
    var result = new BABYLON.Vector3();
    result = vmult(localPoint,quaternion);
    result.add(position,result);
    return result;
};

var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    //console.log(localForce,localPoint);
    //console.log(worldForce,worldPoint);
    mesh.physicsImpostor.applyForce(worldForce, worldPoint);
};

class Airplane {
    constructor(scene){
        this.meshAll = null;
        this.scene = scene;
        this.animationGroup = null;
        this._lift = 50;
        this._roll = 0;
        this._rollLimit = 2;
        this._yaw = 0;
        this._yawLimit = 2;
        this._pitch = 0;
        this._pitchLimit = 2;
        this.loadMeshes().then(res=>{
            this.meshAll=res.meshes;
            this.hideElements();
            this.addAnimations();
            this.meshRootPosition(0,2,0);
            this.addPhysics();
            this.meshAll.map(m=>{console.log(m.name)});
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
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
            }
            if (mesh.name.includes("Sphere")) {
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.3, restitution: 0  }, true);
            }
            if (mesh.name.includes("wheel")) {
              this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.3, restitution: 0.5  }, true);
            }
        });
        this.createPhysicsImpostor(this.scene, newMeshes[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 50, friction: 0.3, restitution: 0  }, true);
  
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
    moveBackward(speed){
        this.meshAll[0].moveWithCollisions(this.meshAll[0].forward.scaleInPlace(-speed));
        //this.animationGroup.play(true);
        //this.animationGroup.speedRatio = 1;
    }
    rudderControl(rot){
        //console.log(this.meshAll[6]);
        
        this.meshAll[6].rotate(BABYLON.Vector3.Left(),rot);
        //console.log(this.meshAll[6].rotation);
    }
    set lift(val){
        this._lift = val;
    }
    get lift(){
        return this._lift;
    }
    set roll(val){
        if (val > this._rollLimit) val = this._rollLimit;
        if (val < -this._rollLimit ) val = -this._rollLimit;
        this._roll = val;
    }
    get roll(){
        return this._roll;
    }
    set yaw(val){
        if (val > this._yawLimit) val = this._yawLimit;
        if (val < -this._yawLimit ) val = -this._yawLimit;
        this._yaw = val;
    }
    get yaw(){
        return this._yaw;
    }
    set pitch(val){
        if (val > this._pitchLimit) val = this._pitchLimit;
        if (val < -this._pitchLimit ) val = -this._pitchLimit;
        this._pitch = val;
    }
    get pitch(){
        return this._pitch;
    }
    applyForceToBody(){
        if(this.meshAll!==null){
            this.meshAll[0].physicsImpostor.applyForce(BABYLON.Vector3.Up().scale(9.81*this._lift), this.meshAll[0].getAbsolutePosition().add(BABYLON.Vector3.Zero()));        
            //applyLocalForce(new BABYLON.Vector3(0, 9.81*this._lift, 0), new BABYLON.Vector3(0, 0, 0), this.meshAll[0]);
        }
    }
    applyRollForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3(0, 5 * -this._roll, 0), new BABYLON.Vector3(1, 0, 0), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3(0, 5 * this._roll, 0), new BABYLON.Vector3(-1, 0, 0), this.meshAll[0]);
        }
    }
    applyYawForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( 5 * this._yaw, 0 , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3( 5 * -this._yaw, 0 , 0), new BABYLON.Vector3(0, 0, 1), this.meshAll[0]);
        }
    }
    applyPitchForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( 0, 5 * this._pitch , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3( 0, 5 * -this._pitch , 0), new BABYLON.Vector3(0, 0, 1), this.meshAll[0]);
        }
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
            tinyPlane.lift += 0.1;
        }
        if (inputMap["s"]) {
            tinyPlane.lift -= 0.1;
        }
        if (inputMap["q"]) {
            tinyPlane.roll = 1;
            tinyPlane.applyRollForce();
            console.log(tinyPlane.roll);
            //tinyPlane.rudderControl(Math.PI/40);
        }
        if (inputMap["e"]) {
            tinyPlane.roll = -1;
            console.log(tinyPlane.roll);
            tinyPlane.applyRollForce();
            //tinyPlane.rudderControl(-Math.PI/40);
        }
        if (inputMap["a"]) {
            tinyPlane.yaw = -1;
            tinyPlane.applyYawForce();
        }
        if (inputMap["d"]) {
            tinyPlane.yaw = 1;
            tinyPlane.applyYawForce();
        }
        if (inputMap["z"]) {
            tinyPlane.pitch = 1;
            tinyPlane.applyPitchForce();
        }
        if (inputMap["x"]) {
            tinyPlane.pitch = -1;
            tinyPlane.applyPitchForce();
        }
      }
    );

    scene.registerBeforeRender(function () {
		//box.physicsImpostor.applyForce(BABYLON.Vector3.Up().scale(forceMagnitude), box.getAbsolutePosition().add(contactLocalRefPoint));
        tinyPlane.applyForceToBody();
	});

    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

    }

    return {
        update
    }
}
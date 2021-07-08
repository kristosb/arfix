//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';

// Use physics viewer to display impostors


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
    //var rot = new BABYLON.Vector3();
    result = vmult(localPoint,quaternion);
    result = result.add(position);
    return result;
};

var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    //console.log(mesh.position);
    //console.log(mesh.getAbsolutePosition());
    //console.log(worldForce,worldPoint);
    mesh.physicsImpostor.applyForce(worldForce, worldPoint);
};

export default class Airplane {
    constructor(scene){
        this.meshAll = null;
        this.scene = scene;
        //this.animationGroup = null;
        this._lift = 50;
        this._roll = 0;
        this._rollLimit = 2;
        this._yaw = 0;
        this._yawLimit = 2;
        this._pitch = 0;
        this._pitchLimit = 2;
        this._velocity = 0;     // 3 axis
        this._currentSpeed = 0; // 1 axis
        this._enginePower = 0;
        this._enginePowerLimit = 1;
        this.speedModifier = 0.03;
        /*this.loadMeshes().then(res=>{
            this.meshAll=res.meshes;
            this.hideElements();
            this.addAnimations();
            this.meshRootPosition(0,2,0);
            this.addPhysics();
            this.meshAll.map(m=>{console.log(m.name)});
        });*/
        this.loadBox();
        //this.loadSphere();
        this.registerForces();
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
    set enginePower(val){
        if (val > this._enginePowerLimit) val = this._enginePowerLimit;
        if (val < 0 ) val = 0;
        this._enginePower = val;
    }
    get enginePower(){
        return this._enginePower;
    }
    get velocity(){
        var velocity = vmult(
            this.meshAll[0].physicsImpostor.getLinearVelocity(),
            BABYLON.Quaternion.Inverse(this.meshAll[0].rotationQuaternion));
        return velocity;
    }
    get currentSpeed(){
		//const velocity = body.quaternion.inverse().vmult(body.velocity);
		//const currentSpeed = velocity.z;
        return 0;
    }
    loadBox(){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:2,height:1,depth:3}, this.scene);
        box.position = new BABYLON.Vector3(-150, 25, -90);
        /*var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);

        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;*/

        this.createPhysicsImpostor(this.scene, box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, friction: 0.0,  }, true);
        this.meshAll = [box];
    }
    loadSphere(){
        var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 1, this.scene);
        sphere.position = new BABYLON.Vector3(0, 2, -90);
        this.createPhysicsImpostor(this.scene, sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 50, friction: 0.0, restitution: 0 }, true);
        this.meshAll = [sphere];
    }
    async loadMeshes(filename = "airplane.glb"){
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", process.env.PUBLIC_URL+"/", filename, this.scene, function (newMeshes) {
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
              this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.0, restitution: 0.5  }, true);
            }
        });
        this.createPhysicsImpostor(this.scene, newMeshes[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 50, friction: 0.0, restitution: 0  }, true);
  
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
    }
    rudderControl(rot){
        this.meshAll[6].rotate(BABYLON.Vector3.Left(),rot);
    }
    applyLiftForce(){
        if(this.meshAll!==null){
            let lift = this.velocity.z * Math.abs(this.velocity.z) * 1.5;
            applyLocalForce(new BABYLON.Vector3(0,lift, 0), new BABYLON.Vector3(0, 0, 0), this.meshAll[0]);
        }
    }
    applyDragForce(){
        if(this.meshAll!==null){
            var velocity = this.velocity;
            applyLocalForce(new BABYLON.Vector3(
                velocity.x * Math.abs(velocity.x) * -20,
                velocity.y * Math.abs(velocity.y) * -100,
                velocity.z * Math.abs(velocity.z) * -1
                ), new BABYLON.Vector3(0, 0, -0.02), this.meshAll[0]);
        }
    }
    applyThrustForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( 0, 0, 3000 * this.speedModifier * this.enginePower), new BABYLON.Vector3(0, 0, 2), this.meshAll[0]);
        }
    }
    applyRollForce(dir){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * -this.velocity.z, 0), new BABYLON.Vector3(1, 0, 0), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * this.velocity.z, 0), new BABYLON.Vector3(-1, 0, 0), this.meshAll[0]);
        }
    }
    applyYawForce(dir){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( dir*5 * this.velocity.z, 0 , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);
        }
    }
    applyPitchForce(dir){
        if(this.meshAll!==null){
            //console.log(this.velocity.z);
            applyLocalForce(new BABYLON.Vector3( 0, 5*dir*this.velocity.z , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);        }
    }

    registerForces(){
        var that = this;
        this.scene.registerBeforeRender(function () {
            that.applyLiftForce();
            that.applyDragForce();
            that.applyThrustForce();
        });
    }

    test(){
        /*

        position=124.07406843669018,31.9871455178571,73.82584757218932 
        quaternion=-0.14794905750250617,-0.16383186469857383,0.17826252386624242,0.9589018036683139
        localForce=0,340.83483378342527,0 
        localPoint=0,0,0
        worldForce=-99.79170156277756,304.11573733766255,-117.14781588866697 
        worldPoint=124.21259797727114,31.955304238750955,73.59890844699505

        */

        /*
worldForce =  e {_isDirty: true, _x: -99.99922630372245, _y: 304.25204194960185, _z: -116.61575205918689} 
worldPoint =  e {_isDirty: true, _x: 124.07406843669018, _y: 31.9871455178571, _z: 73.82584757218932}
        */
       var pos = new BABYLON.Vector3(124.07406843669018,31.9871455178571,73.82584757218932 );
       var quat = new BABYLON.Quaternion(-0.14794905750250617,-0.16383186469857383,0.17826252386624242,0.9589018036683139);
       var localForce = new BABYLON.Vector3(0,340.83483378342527,0 );
       var localPoint = new BABYLON.Vector3(0,0,0);

       var worldForce = vectorToWorldFrame(localForce, quat);
       var worldPoint = pointToWorldFrame(localPoint,quat,pos);

       console.log("worldForce = ", worldForce, "worldPoint = ", worldPoint);

    }
}


/*export default function scene(scene) {        


    const tinyPlane = new Airplane(scene);

    scene.registerBeforeRender(function () {
		//box.physicsImpostor.applyForce(BABYLON.Vector3.Up().scale(forceMagnitude), box.getAbsolutePosition().add(contactLocalRefPoint));
        tinyPlane.applyLiftForce();
        tinyPlane.applyDragForce();
        tinyPlane.applyThrustForce();
	});
    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

    }
    function getAirplaneMesh(){
        return tinyPlane.meshAll[0];
    }
    function getAirplane(){
        return tinyPlane;
    }
    return {
        update,
        getAirplane,
        getAirplaneMesh
    }
}*/


//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';

// Use physics viewer to display impostors
let getChildRotation = function(child){ //return the rotation of a child of a parent object by using a temporary World Matrix
    var scale = new BABYLON.Vector3(0, 0, 0);
    var rotation = new BABYLON.Quaternion();
    var translation = new BABYLON.Vector3(0,0,0);

    var tempWorldMatrix = child.getWorldMatrix();
    tempWorldMatrix.decompose(scale, rotation, translation);
    return rotation;
}

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
    result = result.add(position); //temp fix for v5 update
    return result;
};

/*var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    mesh.physicsImpostor.applyForce(worldForce, worldPoint);
};*/
var applyLocalForce = function(localForce, localPoint, body){

    body.applyLocalForce(new CANNON.Vec3(localForce.x, localForce.y, localForce.z),
                         new CANNON.Vec3(localPoint.x, localPoint.y, localPoint.z));

};
/*var applyLocalForce = function(localForce, localPoint, body){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, new BABYLON.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z,body.quaternion.w ));
    worldPoint = pointToWorldFrame(localPoint, new BABYLON.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z,body.quaternion.w ),
         new CANNON.Vec3(body.position.x,body.position.y,body.position.z));
    body.applyForce(
        new CANNON.Vec3( worldForce.x,worldForce.y,worldForce.z), 
        new CANNON.Vec3( worldPoint.x, worldPoint.y, worldPoint.z));
};*/
class Airplane {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {BABYLON.Mesh} chassis
     *  @param {{ rotor: BABYLON.Mesh,rudder: BABYLON.Mesh,leftAileron: BABYLON.Mesh,rightAileron: BABYLON.Mesh,leftElevator: BABYLON.Mesh,rightElevator: BABYLON.Mesh} }controls
     *  
     */
    constructor(scene, chassis, controls){
        this.scene = scene;
        if(!chassis) console.error("chassis mesh error");
        if(!controls) console.error("controls data error");
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
        this._enginePowerLimit = 1;//1
        this.enginePowerPrev = 0
        this.speedModifier = 0.03;
        this.collision = chassis;
        this.rudder = controls.rudder;
        this.rotor = controls.rotor;
        this.leftAileron = controls.leftAileron;
        this.rightAileron = controls.rightAileron;
        this.leftElevator = controls.leftElevator;
        this.rightElevator = controls.rightElevator;
        this._relativeBody = null;
        this._isTouchingGround = false;
        this.addAnimations();
        this.animationGroup.play(false);
        this.animationGroup.speedRatio = 1;
        this.controlsInitialize();
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
            this.collision.physicsImpostor.getLinearVelocity(),
            BABYLON.Quaternion.Inverse(this.collision.rotationQuaternion));
        return velocity;
    }
    get currentSpeed(){
		//const velocity = body.quaternion.inverse().vmult(body.velocity);
		//const currentSpeed = velocity.z;
        return 0;
    }
    get rotation(){
        return this.collision.rotationQuaternion.toEulerAngles();
    }
    set relativeBody(mesh){
        this._relativeBody = mesh;
    }
    get relativeBody(){
        return this._relativeBody;
    }
    set isTouchingGround(touching){
        this._isTouchingGround= touching;
    }
    get isTouchingGround(){
        return this._isTouchingGround;
    }

    rotorSpin(rotor){
        rotor.rotation = new BABYLON.Vector3(0,  0, Math.PI/2,);
        //rotor.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
        const animWheel = new BABYLON.Animation("wheelAnimation", "rotation.z", 15, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
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
        this.rotorSpin(this.rotor);
    }
    controlsInitialize(){
        this.rudderZeroRotation = new BABYLON.Quaternion();
        this.leftAileronZeroRotation = new BABYLON.Quaternion();
        this.rightAileronZeroRotation = new BABYLON.Quaternion();
        this.leftElevatorZeroRotation = new BABYLON.Quaternion();
        this.rightElevatorZeroRotation = new BABYLON.Quaternion();

        this.rudderZeroRotation.copyFrom(this.rudder.rotationQuaternion);
        this.leftAileronZeroRotation.copyFrom(this.leftAileron.rotationQuaternion);
        this.rightAileronZeroRotation.copyFrom(this.rightAileron.rotationQuaternion);
        this.leftElevatorZeroRotation.copyFrom(this.leftElevator.rotationQuaternion);
        this.rightElevatorZeroRotation.copyFrom(this.rightElevator.rotationQuaternion);
        
    }
    meshRootPosition(x,y,z){       
        this.collision.setAbsolutePosition(x,y,z); 
    }
    rudderControl(rot){
        this.rudder.rotationQuaternion.copyFrom(this.rudderZeroRotation);
        this.rudder.rotate(BABYLON.Vector3.Up(), rot);
    }

    aileronControl(rot){
        this.leftAileron.rotationQuaternion.copyFrom(this.leftAileronZeroRotation);
        this.leftAileron.rotate(BABYLON.Vector3.Left(), rot);
        this.rightAileron.rotationQuaternion.copyFrom(this.rightAileronZeroRotation);
        this.rightAileron.rotate(BABYLON.Vector3.Left(), -rot);
    }
    elevatorControl(rot){
        this.leftElevator.rotationQuaternion.copyFrom(this.leftElevatorZeroRotation);
        this.leftElevator.rotate(BABYLON.Vector3.Left(), rot);
        this.rightElevator.rotationQuaternion.copyFrom(this.rightElevatorZeroRotation);
        this.rightElevator.rotate(BABYLON.Vector3.Left(), rot);
    }
    applyLiftForce(){
        let lift = this.velocity.z * Math.abs(this.velocity.z) * 1.5;
        applyLocalForce(new BABYLON.Vector3(0,lift, 0), new BABYLON.Vector3(0, 0, 0), this.collision);
    }
    applyDragForce(){
        var velocity = this.velocity;
        applyLocalForce(new BABYLON.Vector3(
            velocity.x * Math.abs(velocity.x) * -20,    //20
            velocity.y * Math.abs(velocity.y) * -100,   //-100
            velocity.z * Math.abs(velocity.z) * -1      //-1
            ), new BABYLON.Vector3(0, 0, -0.02), this.collision); //-0.02
    }
    applyThrustForce(){
        applyLocalForce(new BABYLON.Vector3( 0, 0, 3000 * this.speedModifier * this.enginePower), new BABYLON.Vector3(0, 0, 1), this.collision);
    }
    applyRollForce(dir){
        if (dir) {
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * -this.velocity.z, 0), new BABYLON.Vector3(1, 0, 0), this.collision);
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * this.velocity.z, 0), new BABYLON.Vector3(-1, 0, 0), this.collision);
        }
    }
    applyYawForce(dir){
        if (dir) applyLocalForce(new BABYLON.Vector3( dir*5 * this.velocity.z, 0 , 0), new BABYLON.Vector3(0, 0, -1), this.collision);
    }
    applyPitchForce(dir){
        if (dir) applyLocalForce(new BABYLON.Vector3( 0, 5*dir*this.velocity.z , 0), new BABYLON.Vector3(0, 0, -1), this.collision);       
    }
    applyPitchYawForce(pitchForce, YawForce){
        if (pitchForce || YawForce) applyLocalForce(new BABYLON.Vector3( YawForce*5 * this.velocity.z, 5*pitchForce*this.velocity.z , 0), new BABYLON.Vector3(0, 0, -1), this.collision); 
    }
    propellerSpeedUpdate(){
        if (this.enginePowerPrev !== this.enginePower){
            if(this.enginePower) this.animationGroup.play(true); else this.animationGroup.play(false);
            this.animationGroup.speedRatio = this.enginePower*4;
        }
        this.enginePowerPrev = this.enginePower;
    }
    resetControls(){
        this.aileronControl(this.roll*Math.PI/8);
        this.rudderControl(-this.yaw*Math.PI/8);
        this.elevatorControl(-this.pitch*Math.PI/8);
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
    }
    applyRelativeBodyForce(){
        var frameTime = Date.now();
        var prevFrameTime = frameTime;
        var delta = frameTime - prevFrameTime;
        var force = new BABYLON.Vector3(0,0,0);
        if(this.relativeBody && this.isTouchingGround){
            //console.log("relative force");
            /*frameTime = Date.now();
            delta = frameTime - prevFrameTime;
    
            var relativeVelocity = this.relativeBody.getPhysicsImpostor().getLinearVelocity();
            //var ms = this.relativeBody.getPhysicsImpostor().mass;
            const coeff = 1*this.relativeBody.getPhysicsImpostor().mass/delta;
            force = force.copyFrom(relativeVelocity);
            force = force.multiplyByFloats(coeff,coeff,coeff);

            var worldPoint = new BABYLON.Vector3();
            worldPoint = pointToWorldFrame(new BABYLON.Vector3(0,0,0), this.collision.rotationQuaternion, this.collision.getAbsolutePosition());
            this.collision.physicsImpostor.applyForce(force, worldPoint);*/
        }
    }
    registerForces(){
        var that = this;
        //this.scene.registerBeforeRender(function () {
        this.scene.onBeforeRenderObservable.add(() => {
            that.applyRollForce(that.roll);
            //that.applyYawForce(that.yaw);
            //that.applyPitchForce(that.pitch);
            that.applyPitchYawForce(that.pitch, that.yaw);
            that.applyDragForce();
            that.applyLiftForce(); 
            that.applyThrustForce();
            that.propellerSpeedUpdate();
            //that.applyRelativeBodyForce();
            that.resetControls();
        });
    }

    
}
/////////// CANON ///////////
export default class AirplaneCannon {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {BABYLON.Mesh} chassis
     *  @param {{ rotor: BABYLON.Mesh,rudder: BABYLON.Mesh,leftAileron: BABYLON.Mesh,rightAileron: BABYLON.Mesh,leftElevator: BABYLON.Mesh,rightElevator: BABYLON.Mesh} }controls
     *  
     */
    constructor(scene, chassis, controls){
        this.scene = scene;
        if(!chassis) console.error("chassis mesh error");
        if(!controls) console.error("controls data error");
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
        this._enginePowerLimit = 1;//1
        this.enginePowerPrev = 0
        this.speedModifier = 0.03;
        this.collision = chassis;
        this.rudder = controls.rudder;
        this.rotor = controls.rotor;
        this.leftAileron = controls.leftAileron;
        this.rightAileron = controls.rightAileron;
        this.leftElevator = controls.leftElevator;
        this.rightElevator = controls.rightElevator;
        this._relativeBody = null;
        this._isTouchingGround = false;
        this.addAnimations();
        this.animationGroup.play(false);
        this.animationGroup.speedRatio = 1;
        this.controlsInitialize();
        this.registerForces();
        //console.log("cb=", this.collision);
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
            //this.collision.physicsImpostor.getLinearVelocity(),
            new BABYLON.Vector3(this.collision.velocity.x,
                                this.collision.velocity.y,
                                this.collision.velocity.z),
            BABYLON.Quaternion.Inverse(new BABYLON.Quaternion(  this.collision.quaternion.x,
                this.collision.quaternion.y,
                this.collision.quaternion.z,
                this.collision.quaternion.w,
                )));
        return velocity;
    }
    get currentSpeed(){
		//const velocity = body.quaternion.inverse().vmult(body.velocity);
		//const currentSpeed = velocity.z;
        return 0;
    }
    get rotation(){
        return new BABYLON.Quaternion(  this.collision.quaternion.x,
                                        this.collision.quaternion.y,
                                        this.collision.quaternion.z,
                                        this.collision.quaternion.w,
                                        ).toEulerAngles();
    }
    set relativeBody(mesh){
        this._relativeBody = mesh;
    }
    get relativeBody(){
        return this._relativeBody;
    }
    set isTouchingGround(touching){
        this._isTouchingGround= touching;
    }
    get isTouchingGround(){
        return this._isTouchingGround;
    }

    rotorSpin(rotor){
        rotor.rotation = new BABYLON.Vector3(0,  0, Math.PI/2,);
        //rotor.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
        const animWheel = new BABYLON.Animation("wheelAnimation", "rotation.z", 15, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
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
        this.rotorSpin(this.rotor);
    }
    controlsInitialize(){
        this.rudderZeroRotation = new BABYLON.Quaternion();
        this.leftAileronZeroRotation = new BABYLON.Quaternion();
        this.rightAileronZeroRotation = new BABYLON.Quaternion();
        this.leftElevatorZeroRotation = new BABYLON.Quaternion();
        this.rightElevatorZeroRotation = new BABYLON.Quaternion();

        this.rudderZeroRotation.copyFrom(this.rudder.rotationQuaternion);
        this.leftAileronZeroRotation.copyFrom(this.leftAileron.rotationQuaternion);
        this.rightAileronZeroRotation.copyFrom(this.rightAileron.rotationQuaternion);
        this.leftElevatorZeroRotation.copyFrom(this.leftElevator.rotationQuaternion);
        this.rightElevatorZeroRotation.copyFrom(this.rightElevator.rotationQuaternion);
        
    }
    meshRootPosition(x,y,z){       
        this.collision.position.set(x,y,z); 
    }
    rudderControl(rot){
        this.rudder.rotationQuaternion.copyFrom(this.rudderZeroRotation);
        this.rudder.rotate(BABYLON.Vector3.Up(), rot);
    }

    aileronControl(rot){
        this.leftAileron.rotationQuaternion.copyFrom(this.leftAileronZeroRotation);
        this.leftAileron.rotate(BABYLON.Vector3.Left(), rot);
        this.rightAileron.rotationQuaternion.copyFrom(this.rightAileronZeroRotation);
        this.rightAileron.rotate(BABYLON.Vector3.Left(), -rot);
    }
    elevatorControl(rot){
        this.leftElevator.rotationQuaternion.copyFrom(this.leftElevatorZeroRotation);
        this.leftElevator.rotate(BABYLON.Vector3.Left(), rot);
        this.rightElevator.rotationQuaternion.copyFrom(this.rightElevatorZeroRotation);
        this.rightElevator.rotate(BABYLON.Vector3.Left(), rot);
    }
    applyLiftForce(){
        let lift = this.velocity.z * Math.abs(this.velocity.z) * 1.5;
        applyLocalForce(new BABYLON.Vector3(0,lift, 0), new BABYLON.Vector3(0, 0, 0), this.collision);
    }
    applyDragForce(){
        var velocity = this.velocity;
        applyLocalForce(new BABYLON.Vector3(
            velocity.x * Math.abs(velocity.x) * -20,    //20
            velocity.y * Math.abs(velocity.y) * -100,   //-100
            velocity.z * Math.abs(velocity.z) * -1      //-1
            ), new BABYLON.Vector3(0, 0, -0.02), this.collision); //-0.02
    }
    applyThrustForce(){
        applyLocalForce(new BABYLON.Vector3( 0, 0, 3000 * this.speedModifier * this.enginePower), new BABYLON.Vector3(0, 0, 1), this.collision);
    }
    applyRollForce(dir){
        if (dir) {
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * -this.velocity.z, 0), new BABYLON.Vector3(1, 0, 0), this.collision);
            applyLocalForce(new BABYLON.Vector3(0, dir*5 * this.velocity.z, 0), new BABYLON.Vector3(-1, 0, 0), this.collision);
        }
    }
    applyYawForce(dir){
        if (dir) applyLocalForce(new BABYLON.Vector3( dir*5 * this.velocity.z, 0 , 0), new BABYLON.Vector3(0, 0, -1), this.collision);
    }
    applyPitchForce(dir){
        if (dir) applyLocalForce(new BABYLON.Vector3( 0, 5*dir*this.velocity.z , 0), new BABYLON.Vector3(0, 0, -1), this.collision);       
    }
    applyPitchYawForce(pitchForce, YawForce){
        if (pitchForce || YawForce) applyLocalForce(new BABYLON.Vector3( YawForce*5 * this.velocity.z, 5*pitchForce*this.velocity.z , 0), new BABYLON.Vector3(0, 0, -1), this.collision); 
    }
    propellerSpeedUpdate(){
        if (this.enginePowerPrev !== this.enginePower){
            if(this.enginePower) this.animationGroup.play(true); else this.animationGroup.play(false);
            this.animationGroup.speedRatio = this.enginePower*4;
        }
        this.enginePowerPrev = this.enginePower;
    }
    resetControls(){
        this.aileronControl(this.roll*Math.PI/8);
        this.rudderControl(-this.yaw*Math.PI/8);
        this.elevatorControl(-this.pitch*Math.PI/8);
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
    }
    registerForces(){
        var that = this;
        //this.scene.registerBeforeRender(function () {
        this.scene.onBeforeRenderObservable.add(() => {
            that.applyRollForce(that.roll);
            that.applyPitchYawForce(that.pitch, that.yaw);
            that.applyDragForce();
            that.applyLiftForce(); 
            that.applyThrustForce();
            that.propellerSpeedUpdate();
            that.resetControls();
        });
    }

    
}

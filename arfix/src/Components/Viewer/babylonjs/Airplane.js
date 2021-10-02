//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';

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
    result = result.add(position);
    return result;
};

var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    mesh.physicsImpostor.applyForce(worldForce, worldPoint);
};

export default class Airplane {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {BABYLON.Mesh} chassis
     *  @param {BABYLON.Mesh} rudder
     *  @param {BABYLON.Mesh} rotor
     */
    constructor(scene, chassis, controls){
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
        this._enginePowerLimit = 1;//1
        this.speedModifier = 0.03;
        this.collision = chassis;
        this.rudder = controls.rudder;
        this.rotor = controls.rotor;
        this.leftAileron = controls.leftAileron;
        this.rightAileron = controls.rightAileron;
        this.leftElevator = controls.leftElevator;
        this.rightElevator = controls.rightElevator;
        this.addAnimations();
        this.animationGroup.play(true);
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
    /*init () {
            this.registerForces();
    }*/

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
        this.rotorSpin(this.rotor);
    }
    controlsInitialize(){
        this.rudderZeroRotation = this.rudder.rotationQuaternion.toEulerAngles();
        this.leftAileronZeroRotation = this.leftAileron.rotationQuaternion.toEulerAngles();
        this.rightAileronZeroRotation = this.rightAileron.rotationQuaternion.toEulerAngles();
        this.leftElevatorZeroRotation = this.leftElevator.rotationQuaternion.toEulerAngles();
        this.rightElevatorZeroRotation = this.rightElevator.rotationQuaternion.toEulerAngles();
    }
    meshRootPosition(x,y,z){       
        this.collision.setAbsolutePosition(x,y,z);
        
    }
    rudderControl(rot){
        var rudderRotation = new BABYLON.Vector3().copyFrom(this.rudderZeroRotation);      
        rudderRotation.addInPlace(new BABYLON.Vector3(rot,0,0));
        this.rudder.rotationQuaternion = rudderRotation.toQuaternion();
    }
    aileronControl(rot){
        var leftAileronRotation = new BABYLON.Vector3().copyFrom(this.leftAileronZeroRotation);      
        leftAileronRotation.addInPlace(new BABYLON.Vector3(rot,0,0));
        this.leftAileron.rotationQuaternion = leftAileronRotation.toQuaternion();
        var rightAileronRotation = new BABYLON.Vector3().copyFrom(this.rightAileronZeroRotation);      
        rightAileronRotation.addInPlace(new BABYLON.Vector3(-rot,0,0));
        this.rightAileron.rotationQuaternion = rightAileronRotation.toQuaternion();
    }
    elevatorControl(rot){
        var leftElevatorRotation = new BABYLON.Vector3().copyFrom(this.leftElevatorZeroRotation);      
        leftElevatorRotation.addInPlace(new BABYLON.Vector3(rot,0,0));
        this.leftElevator.rotationQuaternion = leftElevatorRotation.toQuaternion();
        var rightElevatorRotation = new BABYLON.Vector3().copyFrom(this.rightElevatorZeroRotation);      
        rightElevatorRotation.addInPlace(new BABYLON.Vector3(rot,0,0));
        this.rightElevator.rotationQuaternion = rightElevatorRotation.toQuaternion();
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
        applyLocalForce(new BABYLON.Vector3( 0, 0, 3000 * this.speedModifier * this.enginePower), new BABYLON.Vector3(0, 0, 2), this.collision);
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
    resetControls(){
        this.aileronControl(this.roll*Math.PI/8);
        this.rudderControl(this.yaw*Math.PI/8);
        this.elevatorControl(this.pitch*-Math.PI/8);
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
    }
    registerForces(){
        var that = this;
        //this.scene.registerBeforeRender(function () {
        this.scene.onBeforeRenderObservable.add(() => {
            that.applyRollForce(that.roll);
            that.applyYawForce(that.yaw);
            that.applyPitchForce(that.pitch);
            that.applyDragForce();
            that.applyLiftForce(); 
            that.applyThrustForce();
            that.resetControls();
        });
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


import * as BABYLON from 'babylonjs';
import * as Ammo from 'ammojs';
//import { CompressedTextureLoader } from 'three';
//import {Clock} from './Clock';

BABYLON.Mesh.prototype.getAbsoluteSize = function() {
    if(!this.__size){
        this.__size = BABYLON.Vector3.Zero();
    }
    let scaling = this.scaling;
    //console.log(scaling);
    let bounds = this.getBoundingInfo();
    this.__size.x = Math.abs(bounds.minimum.x - bounds.maximum.x)*scaling.x;
    this.__size.z = Math.abs(bounds.minimum.y - bounds.maximum.y)*scaling.y;
    this.__size.y = Math.abs(bounds.minimum.z - bounds.maximum.z)*scaling.z;

    return this.__size;
};

function hasContactResponse(rb) { return (rb.getCollisionFlags() & 4)===0;}

class VehicleAmmo{
    constructor(scene, carData){
        if(!carData) console.error("vehicle data error");
        this.scene = scene;
        this.vehicle = null;
        this.carData = carData;
        this.acceleration = 0;
        this.direction = 0;
        this.breakingForce = 0;
        this.raycaster = null;
        this.body = null;
        this.time = { //new Clock();//
            frameTime : Date.now(),
            prevFrameTime : Date.now(),
            delta: function(){return (this.frameTime - this.prevFrameTime)/1000}
        }//const clock = new Clock();
        //this.raycastIfno = [];
        this.createVehicle( new BABYLON.Vector3(0,1,0),new BABYLON.Vector3(0,0,0).toQuaternion());
        //this.rearFrontSteeringReverse();
        //this.registerForces();
    }
    createVehicle( pos,quat){
        var physicsWorld = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //console.log(this.chassisMesh.getBoundingInfo());
        this.body  = this.carData.chassisMesh.physicsImpostor.physicsBody;
        this.body.setActivationState(4); 
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        this.raycaster = rayCaster;
        console.log("raycaster",rayCaster);
        this.vehicle = new Ammo.btRaycastVehicle(tuning, this.body , rayCaster);
        this.vehicle.setCoordinateSystem(0, 1, 2);

        physicsWorld.addAction(this.vehicle);
        
        var trans = this.vehicle.getChassisWorldTransform();
                
        var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
        var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);               
        var that = this;
        this.carData.wheels.forEach((wheel, index)=>{
            var wheelInfo = that.vehicle.addWheel(
                new Ammo.btVector3(wheel.pos.x, wheel.pos.y, wheel.pos.z),
                wheelDirectionCS0,
                wheelAxleCS,
                wheel.params.suspensionRestLength,
                wheel.radius,
                tuning,
                wheel.isfront);
            //var wi  = Ammo.wrapPointer(wheelInfo, Ammo.btwheelInfo);
            //console.log("wheel info:",wi);
            wheelInfo.set_m_suspensionStiffness(wheel.params.suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(wheel.params.suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(wheel.params.suspensionCompression);
            wheelInfo.set_m_maxSuspensionForce(600000);
            wheelInfo.set_m_frictionSlip(40);//40
            wheelInfo.set_m_rollInfluence(wheel.params.rollInfluence);
        });
        this.rearFrontSteeringReverse();
        console.log("vehicle",this.vehicle.getRigidBody());//.getWheelInfo(0));
        //console.log("quat", new Ammo.btVector3(1,2,3).op_add(new Ammo.btVector3(5,6,7)).x() );
        //console.log("rbdy", new Ammo.btRigidBody().getWorldTransform().getOrigin());
        //console.log("wheel",this.body.getCenterOfMassTransform().getOrigin().x());//this.vehicle.getWheelInfo(0));
        // if updated in the main animation loop artifacts of wheels not catching up at high speed visible 
        //this.scene.onBeforeAnimationsObservable.add( () => {
        this.scene.registerBeforeRender(function () {
            that.update();
        });
    }
    wheelsTransform(){
        var tm, p, q, i;
        var n = this.vehicle.getNumWheels();
        for (i = 0; i < n; i++) {
            this.vehicle.updateWheelTransform(i, true);
            tm = this.vehicle.getWheelTransformWS(i);
            p = tm.getOrigin();
            q = tm.getRotation();
            this.carData.wheelsMesh[i].position.set(p.x(), p.y(), p.z());
            this.carData.wheelsMesh[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
    update(){ 
        this.wheelsTransform();
        if(this.numOfWheelsOnGround()>0) {
            this.registerForces(); 
            //this.relativeToGroundMove();
        }
    }
    rearFrontSteeringReverse(){
        this.reverseSteeringSign = -1;
        this.carData.steeringWheelsIndex.forEach( (sw,i)=>{
            if(!this.carData.wheels[sw].isFront) this.reverseSteeringSign = 1;
        });
        console.log(this.reverseSteeringSign);
    }
    numOfWheelsOnGround(){
        var nWheels = 0;
        this.carData.wheels.forEach( (sw,i)=>{
            //this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS();
            //if(!this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_isInContact()) nWheels = nWheels +1;
            if(this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_groundObject()) nWheels = nWheels +1;
        });
        return nWheels;
    }
    
    getGroundBody(){
        var rayInfoHardPoint = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_hardPointWS();//.m_hardPointWS();//.get_m_groundObject();//.name;
        var rayInfocontactPoint = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS();

        var res = new Ammo.ClosestRayResultCallback(rayInfoHardPoint,rayInfocontactPoint);
        this.scene.getPhysicsEngine().getPhysicsPlugin().world.rayTest(rayInfoHardPoint,rayInfocontactPoint, res);
        if(res.hasHit()){
            var colBody = res.get_m_collisionObject();
            var amBody = new Ammo.btRigidBody();
            var rigBody = amBody.upcast(colBody);
            var body = null;//rigBody.getLinearVelocity();
            
            if(hasContactResponse(rigBody)){
                //console.log("ammo", bodyVelocity.x(), bodyVelocity.y(), bodyVelocity.z());
                body =  rigBody;//.getLinearVelocity();;
            }
            Ammo.destroy(amBody);
        }
        Ammo.destroy(res);
        return body;
    }
    relativeToGroundMove(){
        var gBody = this.getGroundBody();
        this.time.frameTime = Date.now();
        //const elapsedTime = this.time.getElapsedTime();
        //console.log( this.time.delta() );
        if (gBody) {
            //console.log("wheel",this.body.getCenterOfMassTransform().getOrigin().x());
            const coeff = 50/(1/this.time.delta());
            var groundVelocityAmmo = gBody.getLinearVelocity();
            var forceAmmo = new Ammo.btVector3( groundVelocityAmmo.x()*coeff, groundVelocityAmmo.y()*coeff, groundVelocityAmmo.z()*coeff);
            /*var forceRot = new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z());
            forceRot.rotateByQuaternionAroundPointToRef(
                new BABYLON.Vector3(0,Math.PI/2,0).toQuaternion(),
                forceAmmo,
                forceRot );*/
            //var rot = new BABYLON.Vector3(0,Math.PI/2,0).toQuaternion();
            //var rotAmmo = new  Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w); 
            //forceAmmo = vectorToWorldFrameAmmo(forceAmmo, rotAmmo);
            //var relpos = wheel.m_raycastInfo.m_contactPointWS - getRigidBody()->getCenterOfMassPosition();
            var relpos0 = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            var relpos1 = this.vehicle.getWheelInfo(1).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            var relpos2 = this.vehicle.getWheelInfo(2).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            //var newpos = this.carData.chassisMesh.getAbsolutePosition();
            /*this.carData.chassisMesh.setAbsolutePosition(new BABYLON.Vector3(
                newpos.x +groundVelocityAmmo.x()*this.time.delta(),
                newpos.y+groundVelocityAmmo.y()*this.time.delta(),
                newpos.z+groundVelocityAmmo.z()*this.time.delta()
                ));*/
            /*console.log("ammoPrev", this.vehicle.getRigidBody().getWorldTransform().getOrigin().x());
            var orgin = this.vehicle.getRigidBody().getWorldTransform().getOrigin().op_add(forceAmmo);
            var transform = this.vehicle.getRigidBody().getWorldTransform();
            var motionState = this.vehicle.getRigidBody().getMotionState();
            var tr = new Ammo.btTransform();
            tr.setIdentity();
            tr.setOrigin(new Ammo.btVector3());
            motionState.setWorldTransform(tr);
            console.log("motion",tr.getOrigin().x());
            orgin.setX(250);
            //transform.setOrigin(orgin);
            //mesh.computeWorldMatrix();
            console.log("origin", orgin.x());
            this.vehicle.getRigidBody().setWorldTransform(tr);//.setOrigin(orgin);
            console.log("ammo", this.vehicle.getRigidBody().getWorldTransform().getOrigin().x());
            //motionState.setWorldTransform(this.vehicle.getRigidBody().getWorldTransform());
            this.vehicle.getRigidBody().setMotionState(motionState);*/
            //console.log("ammo",orgin.x(),orgin.y(),orgin.z());
            /*applyLocalForceAmmo(forceAmmo,relpos0, this.body );
            applyLocalForceAmmo(forceAmmo,relpos1, this.body );
            applyLocalForceAmmo(forceAmmo,relpos2, this.body );*/
            //this.vehicle.getRigidBody().applyForce(forceAmmo, new Ammo.btVector3(0,0,0));
            /*this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos0);
            this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos1);
            this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos2);*/
            /*applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos0.x(),relpos0.y(),relpos0.z()),
                this.carData.chassisMesh );
            applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos1.x(),relpos1.y(),relpos1.z()),
                this.carData.chassisMesh );
            applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos2.x(),relpos2.y(),relpos2.z()),
                this.carData.chassisMesh );*/
            //console.log("ammo",rotAmmo.x(),rotAmmo.y(),rotAmmo.z(), rotAmmo.w());
            //console.log("ammo",forceAmmo.x(),forceAmmo.y(),forceAmmo.z());
            //this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos);
            //applyLocalForceAmmo(forceAmmo,new Ammo.btVector3(0,0,0), this.body );
            /*applyLocalForce(
                            new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                            new BABYLON.Vector3(0,0,0),
                            this.carData.chassisMesh );*/
            //console.log("ammo", gBody ,groundVelocityAmmo.x(), groundVelocityAmmo.y(), groundVelocityAmmo.z());
            //this.carData.chassisMesh.physicsImpostor.physicsBody.setLinearVelocity(groundVelocityAmmo);
        }
        this.time.prevFrameTime = this.time.frameTime;
    }

    accelerate(force){
        if(!this.accelerationIdle) this.carData.powerWheelsIndex.forEach(x=> this.vehicle.applyEngineForce(force, x));// console.log("active",force);}
    }
    directionChange(force){
        if(this.directionIdle) this.carData.steeringWheelsIndex.forEach(x => this.vehicle.setSteeringValue(this.reverseSteeringSign*force, x));
    }
    brakeApply(force){
        if(this.breakIdle) this.carData.brakeWheelsIndex.forEach(x => this.vehicle.setBrake(force, x));
    }
    /**    
     * if the previous acceleration, direction or braekForce was zero then go to idle for that force
     */
    resetControls(){
        this.accelerationIdle = this.acceleration ? false : true;
        this.directionIdle = this.direction ? false : true;
        this.breakIdle = this.breakingForce ? false : true;
        this.acceleration = 0;
        this.direction = 0;
        this.breakingForce = 0;
    }
    registerForces(){
        this.accelerate(this.acceleration);
        this.directionChange(this.direction);
        this.brakeApply(this.breakingForce);
        this.resetControls();
    }

}
var vmultAmmo = function(v,q){
    var target =  new Ammo.btVector3();
 
    var x = v.x(),
        y = v.y(),
        z = v.z();
 
    var qx = q.x(),
        qy = q.y(),
        qz = q.z(),
        qw = q.w();
 
    // q*v
    var ix =  qw * x + qy * z - qz * y,
    iy =  qw * y + qz * x - qx * z,
    iz =  qw * z + qx * y - qy * x,
    iw = -qx * x - qy * y - qz * z;
 
    target.setX( ix * qw + iw * -qx + iy * -qz - iz * -qy);
    target.setY( iy * qw + iw * -qy + iz * -qx - ix * -qz);
    target.setZ( iz * qw + iw * -qz + ix * -qy - iy * -qx);
 
    return target;
};
var pointToWorldFrameAmmo = function(localPoint,quaternion, position){
    var result = new Ammo.btVector3();
    result = vmultAmmo(localPoint,quaternion);
    result = result.op_add(position); //temp fix for v5 update
    return result;
};
var vectorToWorldFrameAmmo = function(localVector, quaternion){
    var result = new Ammo.btVector3();
    result = vmultAmmo(localVector, quaternion);
    return result;
};
var applyLocalForceAmmo = function(localForce, localPoint, body){
    var worldForce = new Ammo.btVector3();
    var worldPoint = new Ammo.btVector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrameAmmo(localForce, body.getWorldTransform().getRotation());
    worldPoint = pointToWorldFrameAmmo(localPoint, body.getWorldTransform().getRotation(), body.getWorldTransform().getOrigin());
    //worldPoint = pointToWorldFrameAmmo(localPoint, body.getWorldTransform().getRotation(), body.getCenterOfMassTransform().getOrigin());
    console.log("wp",worldPoint.x(),worldPoint.y(),worldPoint.z());
    console.log("wf",localForce.x(),localForce.y(),localForce.z());
    //arr.position.copyFrom(worldPoint);
    //var norForce = BABYLON.Vector3.Zero().copyFrom(localForce);
    //arr.alignWithNormal(norForce);
    //console.log("fn",body.applyForce);
    body.applyForce(localForce, worldPoint);
};



////////
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
    //result = vmult(localPoint,quaternion);
    result = result.add(position); //temp fix for v5 update
    return result;
};

var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    
    //arr.position.copyFrom(worldPoint);
    //var norForce = BABYLON.Vector3.Zero().copyFrom(localForce);
    //arr.alignWithNormal(norForce);
    mesh.physicsImpostor.applyForce(localForce, worldPoint);
};

/////////////////////////////
export default class VehicleAmmoBasic{
    constructor(scene, carData){
        if(!carData) console.error("vehicle data error");
        this.scene = scene;
        this.vehicle = null;
        this.carData = carData;
        this.acceleration = 0;
        this.direction = 0;
        this.breakingForce = 0;
        this.raycaster = null;
        this.body = null;
        this.time = { //new Clock();//
            frameTime : Date.now(),
            prevFrameTime : Date.now(),
            delta: function(){return (this.frameTime - this.prevFrameTime)/1000}
        }//const clock = new Clock();
        //this.raycastIfno = [];
        //this.createVehicle( new BABYLON.Vector3(0,1,0),new BABYLON.Vector3(0,0,0).toQuaternion());
        //this.rearFrontSteeringReverse();
        //this.registerForces();
    }
    createVehicle( pos,quat){
        var physicsWorld = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //console.log(this.chassisMesh.getBoundingInfo());
        this.body  = this.carData.chassisMesh.physicsImpostor.physicsBody;
        this.body.setActivationState(4); 
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        this.raycaster = rayCaster;
        console.log("raycaster",rayCaster);
        this.vehicle = new Ammo.btRaycastVehicle(tuning, this.body , rayCaster);
        this.vehicle.setCoordinateSystem(0, 1, 2);

        physicsWorld.addAction(this.vehicle);
        
        var trans = this.vehicle.getChassisWorldTransform();
                
        var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
        var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);               
        var that = this;
        this.carData.wheels.forEach((wheel, index)=>{
            var wheelInfo = that.vehicle.addWheel(
                new Ammo.btVector3(wheel.pos.x, wheel.pos.y, wheel.pos.z),
                wheelDirectionCS0,
                wheelAxleCS,
                wheel.params.suspensionRestLength,
                wheel.radius,
                tuning,
                wheel.isfront);
            //var wi  = Ammo.wrapPointer(wheelInfo, Ammo.btwheelInfo);
            //console.log("wheel info:",wi);
            wheelInfo.set_m_suspensionStiffness(wheel.params.suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(wheel.params.suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(wheel.params.suspensionCompression);
            wheelInfo.set_m_maxSuspensionForce(600000);
            wheelInfo.set_m_frictionSlip(40);
            wheelInfo.set_m_rollInfluence(wheel.params.rollInfluence);
        });
        this.rearFrontSteeringReverse();
        console.log("vehicle",this.vehicle.getRigidBody());//.getWheelInfo(0));
        //console.log("quat", new Ammo.btVector3(1,2,3).op_add(new Ammo.btVector3(5,6,7)).x() );
        //console.log("rbdy", new Ammo.btRigidBody().getWorldTransform().getOrigin());
        //console.log("wheel",this.body.getCenterOfMassTransform().getOrigin().x());//this.vehicle.getWheelInfo(0));
        // if updated in the main animation loop artifacts of wheels not catching up at high speed visible 
        //this.scene.onBeforeAnimationsObservable.add( () => {
        this.scene.registerBeforeRender(function () {
            that.update();
        });
    }
    wheelsTransform(){
        var tm, p, q, i;
        var n = this.vehicle.getNumWheels();
        for (i = 0; i < n; i++) {
            this.vehicle.updateWheelTransform(i, true);
            tm = this.vehicle.getWheelTransformWS(i);
            p = tm.getOrigin();
            q = tm.getRotation();
            this.carData.wheelsMesh[i].position.set(p.x(), p.y(), p.z());
            this.carData.wheelsMesh[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
    update(){ 
        this.wheelsTransform();
        if(this.numOfWheelsOnGround()>0) {
            this.registerForces(); 
            //this.relativeToGroundMove();
        }
    }
    rearFrontSteeringReverse(){
        this.reverseSteeringSign = -1;
        this.carData.steeringWheelsIndex.forEach( (sw,i)=>{
            if(!this.carData.wheels[sw].isFront) this.reverseSteeringSign = 1;
        });
        console.log(this.reverseSteeringSign);
    }
    numOfWheelsOnGround(){
        var nWheels = 0;
        this.carData.wheels.forEach( (sw,i)=>{
            //this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS();
            //if(!this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_isInContact()) nWheels = nWheels +1;
            if(this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_groundObject()) nWheels = nWheels +1;
        });
        return nWheels;
    }
    
    getGroundBody(){
        var rayInfoHardPoint = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_hardPointWS();//.m_hardPointWS();//.get_m_groundObject();//.name;
        var rayInfocontactPoint = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS();

        var res = new Ammo.ClosestRayResultCallback(rayInfoHardPoint,rayInfocontactPoint);
        this.scene.getPhysicsEngine().getPhysicsPlugin().world.rayTest(rayInfoHardPoint,rayInfocontactPoint, res);
        if(res.hasHit()){
            var colBody = res.get_m_collisionObject();
            var amBody = new Ammo.btRigidBody();
            var rigBody = amBody.upcast(colBody);
            var body = null;//rigBody.getLinearVelocity();
            
            if(hasContactResponse(rigBody)){
                //console.log("ammo", bodyVelocity.x(), bodyVelocity.y(), bodyVelocity.z());
                body =  rigBody;//.getLinearVelocity();;
            }
            Ammo.destroy(amBody);
        }
        Ammo.destroy(res);
        return body;
    }
    relativeToGroundMove(){
        var gBody = this.getGroundBody();
        this.time.frameTime = Date.now();
        //const elapsedTime = this.time.getElapsedTime();
        //console.log( this.time.delta() );
        if (gBody) {
            //console.log("wheel",this.body.getCenterOfMassTransform().getOrigin().x());
            const coeff = 50/(1/this.time.delta());
            var groundVelocityAmmo = gBody.getLinearVelocity();
            var forceAmmo = new Ammo.btVector3( groundVelocityAmmo.x()*coeff, groundVelocityAmmo.y()*coeff, groundVelocityAmmo.z()*coeff);
            /*var forceRot = new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z());
            forceRot.rotateByQuaternionAroundPointToRef(
                new BABYLON.Vector3(0,Math.PI/2,0).toQuaternion(),
                forceAmmo,
                forceRot );*/
            //var rot = new BABYLON.Vector3(0,Math.PI/2,0).toQuaternion();
            //var rotAmmo = new  Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w); 
            //forceAmmo = vectorToWorldFrameAmmo(forceAmmo, rotAmmo);
            //var relpos = wheel.m_raycastInfo.m_contactPointWS - getRigidBody()->getCenterOfMassPosition();
            var relpos0 = this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            var relpos1 = this.vehicle.getWheelInfo(1).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            var relpos2 = this.vehicle.getWheelInfo(2).get_m_raycastInfo().get_m_contactPointWS().op_sub( this.body.getCenterOfMassTransform().getOrigin());//getCenterOfMassPosition();
            //var newpos = this.carData.chassisMesh.getAbsolutePosition();
            /*this.carData.chassisMesh.setAbsolutePosition(new BABYLON.Vector3(
                newpos.x +groundVelocityAmmo.x()*this.time.delta(),
                newpos.y+groundVelocityAmmo.y()*this.time.delta(),
                newpos.z+groundVelocityAmmo.z()*this.time.delta()
                ));*/
            /*console.log("ammoPrev", this.vehicle.getRigidBody().getWorldTransform().getOrigin().x());
            var orgin = this.vehicle.getRigidBody().getWorldTransform().getOrigin().op_add(forceAmmo);
            var transform = this.vehicle.getRigidBody().getWorldTransform();
            var motionState = this.vehicle.getRigidBody().getMotionState();
            var tr = new Ammo.btTransform();
            tr.setIdentity();
            tr.setOrigin(new Ammo.btVector3());
            motionState.setWorldTransform(tr);
            console.log("motion",tr.getOrigin().x());
            orgin.setX(250);
            //transform.setOrigin(orgin);
            console.log("origin", orgin.x());
            this.vehicle.getRigidBody().setWorldTransform(tr);//.setOrigin(orgin);
            console.log("ammo", this.vehicle.getRigidBody().getWorldTransform().getOrigin().x());
            //motionState.setWorldTransform(this.vehicle.getRigidBody().getWorldTransform());
            this.vehicle.getRigidBody().setMotionState(motionState);*/
            //console.log("ammo",orgin.x(),orgin.y(),orgin.z());
            /*applyLocalForceAmmo(forceAmmo,relpos0, this.body );
            applyLocalForceAmmo(forceAmmo,relpos1, this.body );
            applyLocalForceAmmo(forceAmmo,relpos2, this.body );*/
            //this.vehicle.getRigidBody().applyForce(forceAmmo, new Ammo.btVector3(0,0,0));
            /*this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos0);
            this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos1);
            this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos2);*/
            /*applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos0.x(),relpos0.y(),relpos0.z()),
                this.carData.chassisMesh );
            applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos1.x(),relpos1.y(),relpos1.z()),
                this.carData.chassisMesh );
            applyLocalForce(
                new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                new BABYLON.Vector3(relpos2.x(),relpos2.y(),relpos2.z()),
                this.carData.chassisMesh );*/
            //console.log("ammo",rotAmmo.x(),rotAmmo.y(),rotAmmo.z(), rotAmmo.w());
            //console.log("ammo",forceAmmo.x(),forceAmmo.y(),forceAmmo.z());
            //this.vehicle.getRigidBody().applyImpulse(forceAmmo, relpos);
            //applyLocalForceAmmo(forceAmmo,new Ammo.btVector3(0,0,0), this.body );
            /*applyLocalForce(
                            new BABYLON.Vector3(forceAmmo.x(), forceAmmo.y(), forceAmmo.z()),
                            new BABYLON.Vector3(0,0,0),
                            this.carData.chassisMesh );*/
            //console.log("ammo", gBody ,groundVelocityAmmo.x(), groundVelocityAmmo.y(), groundVelocityAmmo.z());
            //this.carData.chassisMesh.physicsImpostor.physicsBody.setLinearVelocity(groundVelocityAmmo);
        }
        this.time.prevFrameTime = this.time.frameTime;
    }

    accelerate(force){
        if(!this.accelerationIdle) this.carData.powerWheelsIndex.forEach(x=> this.vehicle.applyEngineForce(force, x));// console.log("active",force);}
    }
    directionChange(force){
        if(this.directionIdle) this.carData.steeringWheelsIndex.forEach(x => this.vehicle.setSteeringValue(this.reverseSteeringSign*force, x));
    }
    brakeApply(force){
        if(this.breakIdle) this.carData.brakeWheelsIndex.forEach(x => this.vehicle.setBrake(force, x));
    }
    /**    
     * if the previous acceleration, direction or braekForce was zero then go to idle for that force
     */
    resetControls(){
        this.accelerationIdle = this.acceleration ? false : true;
        this.directionIdle = this.direction ? false : true;
        this.breakIdle = this.breakingForce ? false : true;
        this.acceleration = 0;
        this.direction = 0;
        this.breakingForce = 0;
    }
    registerForces(){
        this.accelerate(this.acceleration);
        this.directionChange(this.direction);
        this.brakeApply(this.breakingForce);
        this.resetControls();
    }

}
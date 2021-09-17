import * as BABYLON from 'babylonjs';
import * as Ammo from 'ammojs';
//import {CannonUtils} from './CannonUtils.js';

import {CarFromBoxesData, ThreeWheelCar} from './VehiclesData.js';
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

export default class VehicleAmmo{
    constructor(scene, carData){
        this.scene = scene;
        //this.physics = physics;
        this.vehicle = null;
        this.chassisBody = null;
        //const carData = new ThreeWheelCar(scene);
        this.chassisMesh = carData.chassisMesh;//this.createChassisMesh(1.8,0.6,4);//carData.chassisMesh;
        this.wheelMeshes = carData.wheelsMesh;
        this.powerWheels = carData.powerWheelsIndex;
        this.steeringwheels = carData.steeringWheelsIndex;
        this.breakWheels = carData.brakeWheelsIndex;
        //this.carDataBody = carData.chassisBody;
        this.carData = carData;
        //this.carDataWheelBodies = carData.wheelBodies;
        this.createVehicle( new BABYLON.Vector3(0,1,0),new BABYLON.Vector3(0,0,0).toQuaternion());
        //this.createPhysicsImpostor(this.scene, carData.wings, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.1}, true);

    }
    createVehicle( pos,quat){
        var massVehicle = 5
        var physicsWorld = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //console.log(this.chassisMesh.getBoundingInfo());
        var body = this.chassisMesh.physicsImpostor.physicsBody;
        //var body = this.createAmmoBody(physicsWorld,massVehicle,quat);
        //this.chassisMesh.physicsImpostor.physicsBody = body;
        body.setActivationState(4); 
        var engineForce = 0;
        var vehicleSteering = 0;
        var breakingForce = 0;
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        this.vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
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
            //that.wheelMeshes[index] = that.createWheelMesh(radius, 0.25);
        });

        this.scene.registerBeforeRender(function () {
            var tm, p, q, i;
			var n = that.vehicle.getNumWheels();
			for (i = 0; i < n; i++) {
				that.vehicle.updateWheelTransform(i, true);
				tm = that.vehicle.getWheelTransformWS(i);
				p = tm.getOrigin();
				q = tm.getRotation();
				that.wheelMeshes[i].position.set(p.x(), p.y(), p.z());
				that.wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                //that.wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI/2);
                //that.wheelMeshes[i].rotate(BABYLON.Axis.X, Math.PI/2);
			}

			/*tm = that.vehicle.getChassisWorldTransform();
			p = tm.getOrigin();
			q = tm.getRotation();
			that.chassisMesh.position.set(p.x(), p.y(), p.z());
			that.chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());*/
            //that.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
        });
        	      
    }
    createAmmoBody(world,massVehicle,quat){
        var physicsWorld = world;//this.scene.getPhysicsEngine().getPhysicsPlugin().world;
		var chassisMeshDim = this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5));	
        console.log("chass dim", chassisMeshDim);
        var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisMeshDim.x,chassisMeshDim.z,chassisMeshDim.y));//w,h,l 
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0,2,0));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        var motionState = new Ammo.btDefaultMotionState(transform);
        var localInertia = new Ammo.btVector3(0, 5, 0);
        geometry.calculateLocalInertia(massVehicle, localInertia);
        console.log("geom",geometry);
                      
        var massOffset = new Ammo.btVector3( 0, 0,1 ); //( 0, 0.4, 0);
        var transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        var quat2 = new BABYLON.Vector3(0,0,0).toQuaternion()
        transform.setRotation(new Ammo.btQuaternion(quat2.x, quat2.y, quat2.z, quat2.w));
        transform2.setOrigin(massOffset);

        var compound = new Ammo.btCompoundShape();
        compound.addChildShape( transform2, geometry );
        //var body = this.chassisMesh.physicsImpostor.physicsBody;
        //body.setActivationState(4); 
        //console.log(this.chassisMesh.physicsImpostor.);
        /*this.chassisMesh.physicsImpostor.executeNativeFunction(function (world, body) {
            var massOffset = new Ammo.btVector3( 0, 10, 10); //( 0, 0.4, 0);
            var transform2 = new Ammo.btTransform();
            transform2.setIdentity();
            transform2.setOrigin(massOffset);
            body.setCenterOfMassTransform(transform2);
            //body.updateInertiaTensor();
            //body.updateMassProperties();
            console.log("native",body);
        });*/
        var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, compound, localInertia));
        //transform2.setOrigin(new Ammo.btVector3( 3, 2, 0));
        //body.setCenterOfMassTransform(transform2);
        //body.updateMassProperties();
        //transform2.setOrigin(new Ammo.btVector3( 0, 0, 0));
        //body.setCenterOfMassTransform(transform2);
        //body.setActivationState(4); 
        console.log("body",body);                
        physicsWorld.addRigidBody(body);
        return body;                
    }
    createChassisMesh(w, l, h) {
		var greenMaterial = new BABYLON.StandardMaterial("RedMaterial", this.scene);
        greenMaterial.diffuseColor = new BABYLON.Color3(0.5,0.8,0.5);
        greenMaterial.emissiveColor = new BABYLON.Color3(0.5,0.8,0.5);

        var mesh = new BABYLON.MeshBuilder.CreateBox("box", {width:w, depth:h, height:l}, this.scene);
        mesh.rotationQuaternion = new BABYLON.Quaternion();
        mesh.material = greenMaterial;
    
        /*var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), this.scene);
        camera.radius = 10;
        camera.heightOffset = 4;
        camera.rotationOffset = 0;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 400;
        camera.attachControl(canvas, true);
        camera.lockedTarget = mesh; //version 2.5 onwards
        scene.activeCamera = camera;*/
    
        return mesh;
    }
            
    
    createWheelMesh(radius, width) {
        var blackMaterial = new BABYLON.StandardMaterial("RedMaterial", this.scene);
        blackMaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.1);
        blackMaterial.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1);
        //var mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
        var mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", {diameter:1, height:0.5, tessellation: 6}, this.scene);
        mesh.rotationQuaternion = new BABYLON.Quaternion();
        mesh.material = blackMaterial;
    
        return mesh;
    }
    createPhysicsImpostor(scene, entity, impostor, options, reparent) {
        if (entity == null) return;
        entity.checkCollisions = false;
        const parent = entity.parent;
        if (reparent === true) entity.parent = null;
        entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
        //console.log(entity.physicsImpostor.physicsBody);
        if (reparent === true) entity.parent = parent;
    };
    forward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(force, x));
    }
    backward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(-force, x));
    }
    right(force){
        this.steeringwheels.forEach(x => this.vehicle.setSteeringValue(-force, x));
    }
    left(force){
        this.steeringwheels.forEach(x => this.vehicle.setSteeringValue(force, x));
    }
    brake(force){
        this.breakWheels.forEach(x => this.vehicle.setBrake(force, x));
    }
    unbrake(){
        this.breakWheels.forEach(x => this.vehicle.setBrake(0, x));
    }
}
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import {CannonUtils} from '../utils/CannonUtils.js';
import {CarFromBoxesData, ThreeWheelCar} from './VehiclesData.js';

export default class Vehicle{
    constructor(scene, carData){
        this.scene = scene;
        //this.physics = physics;
        this.vehicle = null;
        this.chassisBody = null;
        //const carData = new ThreeWheelCar(scene);
        this.carData = carData;
        this.chassisMesh = carData.chassisMesh;
        this.wheelMeshes = carData.wheelsMesh;
        this.powerWheels = carData.powerWheelsIndex;
        this.steeringwheels = carData.steeringWheelsIndex;
        this.breakWheels = carData.brakeWheelsIndex;
        this.carDataBody = carData.chassisBody;
        this.carDataWheelBodies = carData.wheelBodies;
        this.createVehicle();
        
    }
    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        console.log("rotations");
        this.chassisBody = this.carDataBody;

        var options = {
            radius: 0.3,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 150,
            suspensionRestLength: 0.25,//04
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.5,
            maxSuspensionForce: 200000,
            rollInfluence:  0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 0.25,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
            };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
			indexUpAxis: 1,
			indexRightAxis: 0,
			indexForwardAxis: 2,
        });

        var that = this;
    
        /*this.wheelMeshes.forEach((wheelMesh, index)=>{
        //this.carData.wheels.forEach((wheel, index)=>{
            options.radius = 0.25;//0.5*wheelMesh.getAbsoluteSize().y;//y
            var pos= new BABYLON.Vector3(
                wheelMesh.getPositionExpressedInLocalSpace().x,
                wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
                wheelMesh.getPositionExpressedInLocalSpace().z
                );
            console.log(pos);
            options.chassisConnectionPointLocal.copy(CannonUtils.babylon2cannonVec3( pos )); 

            that.vehicle.addWheel(options); 
        });*/
        this.carData.wheels.forEach((wheel, index)=>{
            options.radius = wheel.radius;
            options.chassisConnectionPointLocal.copy(CannonUtils.babylon2cannonVec3( new BABYLON.Vector3(wheel.pos.x, wheel.pos.y, wheel.pos.z) )); 
            that.vehicle.addWheel(options); 
        });
        this.vehicle.addToWorld(world);

        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform; 
                
                that.wheelMeshes[i].position.copyFrom( CannonUtils.cannon2babylonVec3(t.position) );
                that.wheelMeshes[i].rotationQuaternion.copyFrom( CannonUtils.cannon2babylonQuat(t.quaternion) );
            }
        });

    }


    forward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(-force, x));
    }
    backward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(force, x));
    }
    right(force){
        this.steeringwheels.forEach(x => this.vehicle.setSteeringValue(force, x));
    }
    left(force){
        this.steeringwheels.forEach(x => this.vehicle.setSteeringValue(-force, x));
    }
    brake(force){
        this.breakWheels.forEach(x => this.vehicle.setBrake(force, x));
    }
    unbrake(){
        this.breakWheels.forEach(x => this.vehicle.setBrake(0, x));
    }

}
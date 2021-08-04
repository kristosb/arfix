import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import {CannonUtils} from './CannonUtils.js';
import {CarFromBoxesData, ThreeWheelCar} from './VehiclesData.js';

export default class Vehicle{
    constructor(scene, physics){
        this.scene = scene;
        this.physics = physics;
        this.vehicle = null;
        this.chassisBody = null;
        const carData = new ThreeWheelCar(scene);
        this.chassisMesh = carData.chassisMesh;
        this.wheelMeshes = carData.wheelsMesh;
        this.powerWheels = carData.powerWheelsIndex;
        this.steeringwheels = carData.steeringWheelsIndex;
        this.breakWheels = carData.brakeWheelsIndex;
        this.createVehicle();

    }

    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //width, height, length
        this.chassisMesh.computeWorldMatrix(true); 

        var chassisShape = new CANNON.Box(CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        this.chassisBody = new CANNON.Body({ mass: 150 });
        this.chassisBody.material = mat;
        this.chassisBody.position = CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
        this.chassisBody.addShape(chassisShape);
        this.chassisMesh.computeWorldMatrix(true); 

        var options = {
            radius: 0.25,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.1,//0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence:  0,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1,0,1),
            maxSuspensionTravel: 0.3,
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

        this.vehicle.chassisBody.shapeOrientations[0] = CannonUtils.babylon2cannonQuat(this.chassisMesh.absoluteRotationQuaternion);
        

        var that = this;
        this.wheelMeshes.forEach((wheelMesh, index)=>{
            options.radius = 0.5*wheelMesh.getAbsoluteSize().y;
            var pos= new BABYLON.Vector3(
                wheelMesh.getPositionExpressedInLocalSpace().x,
                wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
                wheelMesh.getPositionExpressedInLocalSpace().z);
            options.chassisConnectionPointLocal.copy(CannonUtils.babylon2cannonVec3( pos )); 
            that.vehicle.addWheel(options); 
        });
        this.vehicle.addToWorld(world);
        
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform; 
                that.wheelMeshes[i].position.copyFrom( CannonUtils.cannon2babylonVec3(t.position) );
                that.wheelMeshes[i].rotationQuaternion.copyFrom( CannonUtils.cannon2babylonQuat(t.quaternion) );
            }
            that.chassisMesh.position.copyFrom( CannonUtils.cannon2babylonVec3( that.vehicle.chassisBody.position));
            const rot = new CANNON.Quaternion();
            that.vehicle.chassisBody.quaternion.mult(that.vehicle.chassisBody.shapeOrientations[0],rot);
            that.chassisMesh.rotationQuaternion.copyFrom( CannonUtils.cannon2babylonQuat( rot ) );
        });

    }


    forward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(-force, x));
    }
    backward(force){
        this.powerWheels.forEach(x=> this.vehicle.applyEngineForce(force, x));
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
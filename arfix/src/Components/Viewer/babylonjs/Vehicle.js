import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
import {CannonUtils} from './CannonUtils.js';
import {CarFromBoxesData, ThreeWheelCar} from './VehiclesData.js';

export default class Vehicle{
    constructor(scene, carData){
        this.scene = scene;
        //this.physics = physics;
        this.vehicle = null;
        this.chassisBody = null;
        //const carData = new ThreeWheelCar(scene);
        this.chassisMesh = carData.chassisMesh;
        this.wheelMeshes = carData.wheelsMesh;
        this.powerWheels = carData.powerWheelsIndex;
        this.steeringwheels = carData.steeringWheelsIndex;
        this.breakWheels = carData.brakeWheelsIndex;
        this.carDataBody = carData.chassisBody;
        this.carDataWheelBodies = carData.wheelBodies;
        this.createVehicle();
        
    }

    createVehicle1(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //width, height, length
        this.chassisMesh.computeWorldMatrix(true); 
        //console.log(this.chassisMesh.getAbsoluteSize());
        var chassisShape = new CANNON.Box(CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        this.chassisBody = new CANNON.Body({ mass: 50 });
        this.chassisBody.material = mat;
        this.chassisBody.position = CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
        this.chassisBody.addShape(chassisShape);
        this.chassisMesh.computeWorldMatrix(true); 
        //console.log(this.chassisBody);
        /*var options = {
            radius: 0.25,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.05,//0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence:  0,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1,0,1),
            maxSuspensionTravel: 0.3,//0.3
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
        };*/
        var options = {
            directionLocal: new CANNON.Vec3(0, -1, 0),
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1,0,1),
            suspensionStiffness: 150,
			suspensionRestLength: 0.25,
			dampingRelaxation: 5,
			dampingCompression: 5,
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
			indexUpAxis: 1,
			indexRightAxis: 0,
			indexForwardAxis: 2,
        });

        this.vehicle.chassisBody.shapeOrientations[0] = CannonUtils.babylon2cannonQuat(this.chassisMesh.absoluteRotationQuaternion);
        console.log("chassis body");
        console.log(this.vehicle.chassisBody);

        var that = this;
        this.wheelMeshes.forEach((wheelMesh, index)=>{
            options.radius = 0.5*wheelMesh.getAbsoluteSize().y;
            var pos= new BABYLON.Vector3(
                wheelMesh.getPositionExpressedInLocalSpace().x,
                wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
                wheelMesh.getPositionExpressedInLocalSpace().z);
            console.log(pos);
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
    ////////////////////////
    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //width, height, length
        //this.chassisMesh.computeWorldMatrix(true); 
        //console.log(this.chassisMesh.getAbsoluteSize());
        /*var chassisShape = new CANNON.Box(CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        this.chassisBody = new CANNON.Body({ mass: 50 });
        this.chassisBody.material = mat;
        this.chassisBody.position = CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
        this.chassisBody.addShape(chassisShape);*/
        //this.chassisMesh.rotate(BABYLON.Axis.Y, Math.PI);
        //this.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
        //this.chassisMesh.computeWorldMatrix(true); 
        console.log("rotations");
        //console.log(this.chassisMesh);
        //console.log(this.carDataBody);
        //const rot = new CANNON.Quaternion(0,1,0,0);
        //this.carDataBody.quaternion.mult(new CANNON.Quaternion().setFromEuler(0,0,Math.PI),rot);
        //this.carDataBody.shapeOrientations[0].copy(rot);
        //console.log(this.carDataBody.quaternion);
        //this.carDataBody.quaternion.copy(new CANNON.Quaternion(0,0,0,1));
        //this.carDataBody.quaternion.setFromEuler(0,0,Math.PI);
        //this.chassisMesh.computeWorldMatrix(true); 
        //console.log(this.carDataBody.quaternion);
        //console.log(this.carDataBody);
        this.chassisBody = this.carDataBody;
        //this.chassisBody.position = CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());

        //this.chassisBody.position = new CANNON.Vec3(1.5213002416950377e-7, -1.2124067097162259, -0.272466152932152);//CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
        //this.chassisBody.position.set(1.5213002416950377e-7, -1.2124067097162259, -0.272466152932152);
        //this.chassisBody.initPosition = new CANNON.Vec3(0, 0.2952008843421936, -0.27246615290641785);
        console.log(this.chassisBody);

        

        var options = {
            //directionLocal: new CANNON.Vec3(0, 0, -1),
            //axleLocal: new CANNON.Vec3(0, 1, 0),
            directionLocal: new CANNON.Vec3(0, -1, 0),
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1,0,1),
            suspensionStiffness: 150,
			suspensionRestLength: 0.25,
			dampingRelaxation: 5,
			dampingCompression: 5,
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
			indexUpAxis: 1,
			indexRightAxis: 0,
			indexForwardAxis: 2,
        });

        //this.vehicle.chassisBody.shapeOrientations[0] = CannonUtils.babylon2cannonQuat(this.chassisMesh.absoluteRotationQuaternion);
        //this.vehicle.chassisBody.quaternion.set(0,0,0,1);// = new CANNON.Quaternion(0,0,0,1);
        //this.vehicle.chassisBody.shapeOrientations[0] = new CANNON.Quaternion(0,0,1,0);
        console.log(this.vehicle.chassisBody);
        //this.vehicle.addToWorld(world);
        var that = this;
        //var x =  new CANNON.Body({ mass: 3 });
    
        this.wheelMeshes.forEach((wheelMesh, index)=>{
            options.radius = 0.5*wheelMesh.getAbsoluteSize().y;//y
            var pos= new BABYLON.Vector3(
                wheelMesh.getPositionExpressedInLocalSpace().x,
                wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
                wheelMesh.getPositionExpressedInLocalSpace().z
                );
            console.log(pos);
            options.chassisConnectionPointLocal.copy(CannonUtils.babylon2cannonVec3( pos )); 
            /*var pos= new CANNON.Vec3(
                wheelMesh.position.x,
                wheelMesh.position.y-0.5,
                wheelMesh.position.z
                );
                console.log(index);    
            console.log(pos);
            options.chassisConnectionPointLocal.copy( pos );*/
            that.vehicle.addWheel(options); 
        });
        this.vehicle.addToWorld(world);
        //console.log("wheel body");
        //console.log(this.vehicle.wheelInfos[0]);
        //this.chassisMesh.rotate(BABYLON.Axis.Y, Math.PI);
        //console.log(that.vehicle.chassisBody.position);
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform; 
                //that.carDataWheelBodies[i].position = t.position;
                //var result = new CANNON.Vec3();
                //var quat = new CANNON.Quaternion().setFromEuler(0,0,0);
                //var x = t.quaternion.vmult(result);
                //console.log(x);
                //that.carDataWheelBodies[i].quaternion = t.quaternion;
                
                that.wheelMeshes[i].position.copyFrom( CannonUtils.cannon2babylonVec3(t.position) );
                that.wheelMeshes[i].rotationQuaternion.copyFrom( CannonUtils.cannon2babylonQuat(t.quaternion) );
            }
            //that.chassisMesh.position.copyFrom( CannonUtils.cannon2babylonVec3( that.vehicle.chassisBody.position));
            //const rot = new CANNON.Quaternion();
            //that.vehicle.chassisBody.quaternion.mult(new CANNON.Quaternion().setFromEuler(0,0,90),rot);
            //that.vehicle.chassisBody.quaternion.copy(rot);
            //that.chassisMesh.rotationQuaternion.copyFrom( CannonUtils.cannon2babylonQuat( rot ) );
        });

    }
////////////////////////
createVehicle2(){
    var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
    //width, height, length
    //this.chassisMesh.computeWorldMatrix(true); 
    //console.log(this.chassisMesh.getAbsoluteSize());
    /*var chassisShape = new CANNON.Box(CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
    let mat = new CANNON.Material('Mat');
    mat.friction = 0.01;
    this.chassisBody = new CANNON.Body({ mass: 50 });
    this.chassisBody.material = mat;
    this.chassisBody.position = CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
    this.chassisBody.addShape(chassisShape);*/
    //this.chassisMesh.rotate(BABYLON.Axis.Y, Math.PI);
    //this.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
    //this.chassisMesh.computeWorldMatrix(true); 
    console.log("rotations");
    //console.log(this.chassisMesh);
    //console.log(this.carDataBody);
    //const rot = new CANNON.Quaternion(0,1,0,0);
    //this.carDataBody.quaternion.mult(new CANNON.Quaternion().setFromEuler(0,0,Math.PI),rot);
    //this.carDataBody.shapeOrientations[0].copy(rot);
    //console.log(this.carDataBody.quaternion);
    //this.carDataBody.quaternion.copy(new CANNON.Quaternion(0,0,0,1));
    //this.carDataBody.quaternion.setFromEuler(0,0,Math.PI);
    //this.chassisMesh.computeWorldMatrix(true); 
    //console.log(this.carDataBody.quaternion);
    //console.log(this.carDataBody);
    this.chassisBody = this.carDataBody;
    //this.chassisBody.position = new CANNON.Vec3(1.5213002416950377e-7, -1.2124067097162259, -0.272466152932152);//CannonUtils.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());
    //this.chassisBody.position.set(1.5213002416950377e-7, -1.2124067097162259, -0.272466152932152);
    //this.chassisBody.initPosition = new CANNON.Vec3(0, 0.2952008843421936, -0.27246615290641785);
    //this.vehicle.chassisBody.shapeOrientations[0] = new CANNON.Quaternion().setFromEuler(0,Math.PI,0);
    console.log(this.chassisBody);

    

    var options = {
        directionLocal: new CANNON.Vec3(0, -1, 0),
        axleLocal: new CANNON.Vec3(-1, 0, 0),
        //directionLocal: new CANNON.Vec3(0, -1, 0),
        //axleLocal: new CANNON.Vec3(-1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(1,0,1),
        suspensionStiffness: 150,
        suspensionRestLength: 0.25,
        dampingRelaxation: 5,
        dampingCompression: 5,
    };

    // Create the vehicle
    this.vehicle = new CANNON.RaycastVehicle({
        chassisBody: this.chassisBody,
        indexUpAxis: 1,
        indexRightAxis: 0,
        indexForwardAxis: 2,
    });

    //this.vehicle.chassisBody.shapeOrientations[0] = CannonUtils.babylon2cannonQuat(this.chassisMesh.absoluteRotationQuaternion);
    //this.vehicle.chassisBody.quaternion=new CANNON.Quaternion().setFromEuler(0,0,Math.PI);//.set(0,0,0,1);// = new CANNON.Quaternion(0,0,0,1);
    //this.vehicle.chassisBody.shapeOrientations[0] = new CANNON.Quaternion().setFromEuler(Math.PI/4,0,0);
    //console.log(this.vehicle.chassisBody);
    //this.vehicle.addToWorld(world);
    var that = this;
    //var x =  new CANNON.Body({ mass: 3 });
    
    
    /*this.wheelMeshes.forEach((wheelMesh, index)=>{
        options.radius = 0.5*wheelMesh.getAbsoluteSize().y;
        var pos= new BABYLON.Vector3(
            wheelMesh.position.x,
            wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
            wheelMesh.getPositionExpressedInLocalSpace().z
            );
        options.chassisConnectionPointLocal.copy(CannonUtils.babylon2cannonVec3( pos )); 
        console.log(options.radius);
        console.log(pos);
        that.vehicle.addWheel(options); 
    });*/
    var r = new CANNON.Quaternion().setFromEuler(0,0,Math.PI);
    this.carDataWheelBodies.forEach((wheelMesh, index)=>{
        var res = new CANNON.Quaternion(0,1,0,0);
        //wheelMesh.quaternion.mult(r,res);
        //wheelMesh.shapeOrientations[0].copy(res);
    });
    console.log(this.wheelMeshes);
    console.log(this.carDataWheelBodies);
    this.carDataWheelBodies.forEach((wheelMesh, index)=>{
        options.radius = 0.112;
        var pos= new CANNON.Vec3(
            wheelMesh.position.x,
            wheelMesh.position.y-0.27,
            wheelMesh.position.z
            );
        options.chassisConnectionPointLocal.copy( pos );
        console.log(options.radius);
        console.log(pos);
        that.vehicle.addWheel(options); 
    });

    this.vehicle.addToWorld(world);
    //console.log("wheel body");
    //console.log(this.vehicle.wheelInfos[0]);

    //console.log(that.vehicle.chassisBody.position);
    //world.addEventListener('postStep', function(){
    this.scene.registerBeforeRender(function () {
        for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
            that.vehicle.updateWheelTransform(i);
            var t = that.vehicle.wheelInfos[i].worldTransform; 
            that.carDataWheelBodies[i].position = t.position;
            /*var result = new CANNON.Vec3();
            var quat = new CANNON.Quaternion().setFromEuler(0,0,-Math.PI);
            t.quaternion.vmult(quat,result);
            t.quaternion.copy(result);*/
            /*var result = new CANNON.Quaternion();
            var quat = new CANNON.Quaternion().setFromEuler(Math.PI/2,0,0);
            t.quaternion.mult(quat,result);
            t.quaternion.copy(result);*/
            //console.log(x);
            that.carDataWheelBodies[i].quaternion = t.quaternion;
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
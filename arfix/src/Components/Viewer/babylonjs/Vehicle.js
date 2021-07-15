import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
BABYLON.Mesh.prototype.getAbsoluteSize = function() {
    if(!this.__size){
        this.__size = BABYLON.Vector3.Zero();
    }

    let bounds = this.getBoundingInfo();
    this.__size.x = Math.abs(bounds.minimum.x - bounds.maximum.x);
    this.__size.y = Math.abs(bounds.minimum.y - bounds.maximum.y);
    this.__size.z = Math.abs(bounds.minimum.z - bounds.maximum.z);

    return this.__size;
};

export default class Vehicle{
    constructor(scene, physics){
        this.scene = scene;
        this.physics = physics;
        this.vehicle = null;
        const wheelDiameter = 0.5;
        const bodySize = new BABYLON.Vector3(1, 2, 0.5);
        this.chassisMesh = this.makebox(bodySize, new BABYLON.Vector3(0, 1, 0));   
        var wp =this.calculateWheelPosition(this.chassisMesh.position, bodySize,wheelDiameter);
        this.wheelMeshes = [
            this.createWheelMesh(wheelDiameter,0.25,wp[0], new BABYLON.Vector3(0, 0, 0).toQuaternion()),
            this.createWheelMesh(wheelDiameter,0.25,wp[1], new BABYLON.Vector3(0, 0, 0).toQuaternion()),
            this.createWheelMesh(wheelDiameter,0.25,wp[2], new BABYLON.Vector3(0, 0, 0).toQuaternion()),
            this.createWheelMesh(wheelDiameter,0.25,wp[3], new BABYLON.Vector3(0, 0, 0).toQuaternion())
        ];
        
        //console.log(wp);
        this.createVehicle();

    }
    calculateWheelPosition(chassisPosition, chassisSize, wheelDiameter){
        var wheelPosition  = [];
        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[0].copyFrom(chassisPosition);
        wheelPosition[0].addInPlace(new BABYLON.Vector3(chassisSize.x/2 -wheelDiameter/2, -chassisSize.z+wheelDiameter/2, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[1].copyFrom(chassisPosition);
        wheelPosition[1].addInPlace(new BABYLON.Vector3(chassisSize.x/2 -wheelDiameter/2, -chassisSize.z+wheelDiameter/2, -chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[2].copyFrom(chassisPosition);
        wheelPosition[2].addInPlace(new BABYLON.Vector3(-chassisSize.x/2 +wheelDiameter/2, -chassisSize.z+wheelDiameter/2, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[3].copyFrom(chassisPosition);
        wheelPosition[3].addInPlace(new BABYLON.Vector3(-chassisSize.x/2 +wheelDiameter/2, -chassisSize.z+wheelDiameter/2, -chassisSize.y/2));

        
        return wheelPosition;
    }
    makebox(size, position){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:size.x,depth:size.y,height:size.z}, this.scene);
        //box.position = new BABYLON.Vector3(-150, 20, -90);
        box.position = position;
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);
        //console.log(box.getAbsoluteSize());
        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;
        box.rotationQuaternion = new BABYLON.Quaternion();
        //this.createPhysicsImpostor(this.scene, box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, friction: 0.01,  }, true);
        return box;
    }
    createWheelMesh(diameter, width, position, rotation){
        //Wheel Material 
        var wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", this.scene);
        var wheelTexture = new BABYLON.Texture("http://i.imgur.com/ZUWbT6L.png", this.scene);
        wheelMaterial.diffuseTexture = wheelTexture;
    
        //Set color for wheel tread as black
        var faceColors = [];
        faceColors[1] = new BABYLON.Color3(0, 0, 0);
    
        //set texture for flat face of wheel 
        var faceUV = [];
        faceUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1);
    
        //create wheel front inside and apply material
        var wheelMesh = BABYLON.MeshBuilder.CreateCylinder("wheelMesh", {
            diameter: diameter,
            height: width,
            tessellation: 24,
            faceColors: faceColors,
            faceUV: faceUV
        }, this.scene);
        wheelMesh.material = wheelMaterial;
        wheelMesh.position = position;
        wheelMesh.rotationQuaternion = rotation;
        //console.log(wheelMesh.rotationQuaternion );
        return wheelMesh;
    }

    createPhysicsImpostor(scene, entity, impostor, options, reparent) {
        if (entity == null) return;
        entity.checkCollisions = false;
        const parent = entity.parent;
        if (reparent === true) entity.parent = null;
        entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
        if (reparent === true) entity.parent = parent;
    };
    runPhysics(){

    }
    /*createVehicle1(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;



        var chassisShape;
        chassisShape = new CANNON.Box(new CANNON.Vec3(1, 1,0.5));
        //console.log(this.chassisMesh.getAbsoluteSize().reorderInPlace("XZY"));
        //chassisShape = new CANNON.Box(this.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize()));
        //chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5,1));
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        var chassisBody = new CANNON.Body({ mass: 150 });
        //chassisBody.material = mat;
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(0, 1, 0);
        //console.log(this.chassisMesh.position);
        //chassisBody.position = this.babylon2cannonVec3(this.chassisMesh.position);
        chassisBody.quaternion.setFromEuler(-90,0,0);
        //chassisBody.angularVelocity.set(-1, 0, 0);


        var options = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, 0, -1),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence:  0.01,
            axleLocal: new CANNON.Vec3(0, 1, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
            //rotation: Math.PI/2
            //directionWorld: new CANNON.Vec3(-1, 0, 0),
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
            //indexUpAxis: 1,
			//indexRightAxis: 1,
			//indexForwardAxis: 0
        });

        options.chassisConnectionPointLocal.set(1, 1, 0);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(1, -1, 0);
        this.vehicle.addWheel(options);


        options.chassisConnectionPointLocal.set(-1, 1, 0);
        this.vehicle.addWheel(options);


        options.chassisConnectionPointLocal.set(-1, -1, 0);
        this.vehicle.addWheel(options);




        this.vehicle.addToWorld(world);


        
        var that = this;
        
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform;

    
                that.wheelMeshes[i].position.copyFrom( that.cannon2babylonVec3(t.position) );//wheelBody.position);//
                that.wheelMeshes[i].rotationQuaternion.copyFrom( that.cannon2babylonQuat(t.quaternion) );//wheelBody.quaternion);//
                //that.wheelMeshes[i].rotate(BABYLON.Axis.X, Math.PI/2);
                //that.wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI/2);
                //let upAxisWorld = new CANNON.Vec3();
                //that.vehicle.getVehicleAxisWorld(that.vehicle.indexUpAxis, upAxisWorld);
            }
            that.chassisMesh.position.copyFrom( that.cannon2babylonVec3(that.vehicle.chassisBody.position) );
            that.chassisMesh.rotationQuaternion.copyFrom( that.cannon2babylonQuat(that.vehicle.chassisBody.quaternion) );
            //that.chassisMesh.rotate(BABYLON.Axis.X, Math.PI/2);
        });

    }*/
    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;

        var chassisShape;
        console.log(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)));
        console.log(this.chassisMesh.scaling);

        //chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5,4)); //width, height, length
        chassisShape = new CANNON.Box(this.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
        //chassisShape.quaternion = new BABYLON.Quaternion(0,0,0,1);
        //chassisBody.quaternion.setFromEuler(0,0,0);
        //console.log(chassisShape.volume());
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        var chassisBody = new CANNON.Body({ mass: 150 });
        chassisBody.material = mat;
        chassisBody.addShape(chassisShape);
        //console.log(this.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition()));
        chassisBody.position = this.babylon2cannonVec3(this.chassisMesh.getAbsolutePosition());

        //chassisBody.quaternion.setFromEuler(0,0,Math.PI/2);
        //console.log(chassisBody.shapeOffsets);
        //console.log(chassisBody.shapeOrientations);
        //console.log(chassisBody.quaternion);

        var options = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
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
            //rotation: Math.PI/2
            //directionWorld: new CANNON.Vec3(-1, 0, 0),
            //axleWorld: new CANNON.Vec3(0, 0, -1),
        };
        /*var options = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(),
        };*/

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
			indexUpAxis: 1,//1
			indexRightAxis: 0,//0
			indexForwardAxis: 2,//2
            //rotation: new BABYLON.Vector3(Math.PI/2,0,Math.PI/2)
        });
        //console.log(options);
        //console.log(this.vehicle);
        var wheight = 0.0;

        var wheelspan = 0.5;
        options.chassisConnectionPointLocal.set(wheelspan, wheight, wheelspan);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-wheelspan, wheight, wheelspan);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(-wheelspan, wheight, -wheelspan);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(wheelspan, wheight, -wheelspan);
        this.vehicle.addWheel(options);

        /*options.chassisConnectionPointLocal.set(1, wheight, -1);
        this.vehicle.addWheel(options);
        options.chassisConnectionPointLocal.set(-1, wheight, -1);
        this.vehicle.addWheel(options);

        options.chassisConnectionPointLocal.set(1, wheight, 1);
        this.vehicle.addWheel(options);
        options.chassisConnectionPointLocal.set(-1, wheight, 1);
        this.vehicle.addWheel(options);*/



        this.vehicle.addToWorld(world);

        
        var that = this;
        
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform; 
                that.wheelMeshes[i].position.copyFrom( that.cannon2babylonVec3(t.position) );
                that.wheelMeshes[i].rotationQuaternion.copyFrom( that.cannon2babylonQuat(t.quaternion) );

                that.wheelMeshes[i].rotate(BABYLON.Axis.X, Math.PI/2);
                that.wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI/2);
                /*let upAxisWorld = new CANNON.Vec3();
                that.vehicle.getVehicleAxisWorld(that.vehicle.indexUpAxis, upAxisWorld);
                console.log(upAxisWorld);*/
            }
            that.chassisMesh.position.copyFrom( that.cannon2babylonVec3(that.vehicle.chassisBody.position) );
            that.chassisMesh.rotationQuaternion.copyFrom( that.cannon2babylonQuat(that.vehicle.chassisBody.quaternion) );
            //that.chassisMesh.rotate(BABYLON.Axis.X, Math.PI/2);
        });

    }

    cannon2babylonVec3(cannonVector){
        var babylonVector = new BABYLON.Vector3();
        babylonVector.copyFromFloats(cannonVector.x, cannonVector.y, cannonVector.z);
        return babylonVector;
    }
    cannon2babylonQuat(cannonQuat){
        const babylonQuat = new BABYLON.Quaternion(cannonQuat.x, cannonQuat.y, cannonQuat.z, cannonQuat.w );
        //babylonQuat.copyFromFloats( cannonQuat.x, cannonQuat.y, cannonQuat.z, cannonQuat.w );
        return babylonQuat;
    }
    babylon2cannonVec3(babylonVector){
        var cannonVector = new CANNON.Vec3(babylonVector.x, babylonVector.y, babylonVector.z);
        return cannonVector; 
    }
    babylon2cannonQuat(babylonQuat){
        var cannonQuat = new CANNON.Quaternion(babylonQuat.x, babylonQuat.y, babylonQuat.z, babylonQuat.w);
        return cannonQuat;
    }

    forward(force){
        this.vehicle.applyEngineForce(-force, 2);
        this.vehicle.applyEngineForce(-force, 3);
    }
    backward(force){
        this.vehicle.applyEngineForce(force, 2);//2
        this.vehicle.applyEngineForce(force, 3);//3
    }
    right(force){
        this.vehicle.setSteeringValue(-force, 0);
        this.vehicle.setSteeringValue(-force, 1);
    }
    left(force){
        this.vehicle.setSteeringValue(force, 0);//0
        this.vehicle.setSteeringValue(force, 1);//1
    }
    brake(force){
        this.vehicle.setBrake(force, 0);
        this.vehicle.setBrake(force, 1);
        this.vehicle.setBrake(force, 2);
        this.vehicle.setBrake(force, 3);
    }
    unbrake(){
        this.vehicle.setBrake(0, 0);
        this.vehicle.setBrake(0, 1);
        this.vehicle.setBrake(0, 2);
        this.vehicle.setBrake(0, 3);
    }

}
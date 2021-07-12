import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';
export default class Vehicle{
    constructor(scene, physics){
        this.scene = scene;
        this.physics = physics;
        this.vehicle = null;
        this.chassisMesh = this.makebox();
        this.createVehicle();
        this.wheelMeshes = [
            this.createWheelMesh(0.5,0.25),
            this.createWheelMesh(0.5,0.25),
            this.createWheelMesh(0.5,0.25),
            this.createWheelMesh(0.5,0.25)
        ];
    }

    makebox(){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:2,height:0.5,depth:1}, this.scene);
        //box.position = new BABYLON.Vector3(-150, 20, -90);
        box.position = new BABYLON.Vector3(0, 2, 4);
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);

        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;
        //this.createPhysicsImpostor(this.scene, box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, friction: 0.01,  }, true);
        return box;
    }
    createWheelMesh(diameter, width){
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
        wheelMesh.rotationQuaternion = new BABYLON.Quaternion();
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
    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;

        var groundMaterial = new CANNON.Material("groundMaterial");
        /*var wheelMaterial = new CANNON.Material("wheelMaterial");
        var wheelGroundContactMaterial = window.wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
            friction: 0.3,
            restitution: 0,
            contactEquationStiffness: 1000
        });

         We must add the contact materials to the world
        world.addContactMaterial(wheelGroundContactMaterial);*/

        var chassisShape;
        chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1,0.5));
        var chassisBody = new CANNON.Body({ mass: 150 });
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(0, 3, 4);
        //chassisBody.rota
        chassisBody.angularVelocity.set(-1, 0, 0);
        //demo.addVisual(chassisBody);

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
            useCustomSlidingRotationalSpeed: true
        };

        // Create the vehicle
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
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

        var wheelBodies = [];
        for(var i=0; i<this.vehicle.wheelInfos.length; i++){
            var wheel = this.vehicle.wheelInfos[i];
            var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
            var wheelBody = new CANNON.Body({
                mass: 0
            });
            wheelBody.type = CANNON.Body.KINEMATIC;
            wheelBody.collisionFilterGroup = 0; // turn off collisions
            var q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
            wheelBodies.push(wheelBody);
            //demo.addVisual(wheelBody);
            world.addBody(wheelBody);
        }
        
        var that = this;
        
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform;
                var wheelBody = wheelBodies[i];
                wheelBody.position.copy(t.position);
                wheelBody.quaternion.copy(t.quaternion);
                

                var wp = new BABYLON.Vector3();
                wp.copyFromFloats( wheelBody.position.x, wheelBody.position.y,wheelBody.position.z);
                var wq = new BABYLON.Quaternion();
                wq.copyFromFloats( wheelBody.quaternion.x,
                    wheelBody.quaternion.y,
                    wheelBody.quaternion.z,
                    wheelBody.quaternion.w );
    
                that.wheelMeshes[i].position= wp;//.set(p.x, p.y, p.z);
                that.wheelMeshes[i].rotationQuaternion = wq;//.set(q.x, q.y, q.z, q.w);
                //that.wheelMeshes[i].rotate(BABYLON.Axis.Y, Math.PI / 2);
                //console.log(wp);
                //console.log(wp);
                //console.log(p);
                /*var tm = vehicle.getChassisWorldTransform();
                var p = tm.getOrigin();
                var q = tm.getRotation();
                chassisMesh.position.set(p.x(), p.y(), p.z());
                chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                chassisMesh.rotate(BABYLON.Axis.X, Math.PI);*/
                //that.vehicle.applyEngineForce(-1000, 2);
                //that.vehicle.applyEngineForce(-1000, 3);
            }
            var p = new BABYLON.Vector3();
            p.copyFromFloats( that.vehicle.chassisBody.position.x, that.vehicle.chassisBody.position.y,that.vehicle.chassisBody.position.z);
            var q = new BABYLON.Quaternion();
            q.copyFromFloats( that.vehicle.chassisBody.quaternion.x,
                that.vehicle.chassisBody.quaternion.y,
                that.vehicle.chassisBody.quaternion.z,
                that.vehicle.chassisBody.quaternion.w );

            that.chassisMesh.position= p;//.set(p.x, p.y, p.z);
            that.chassisMesh.rotationQuaternion = q;//.set(q.x, q.y, q.z, q.w);
            that.chassisMesh.rotate(BABYLON.Axis.X, Math.PI/2);
        });

    }
    forward(force){
        this.vehicle.applyEngineForce(-force, 2);
        this.vehicle.applyEngineForce(-force, 3);
    }
    backward(force){
        this.vehicle.applyEngineForce(force, 2);
        this.vehicle.applyEngineForce(force, 3);
    }
    right(force){
        this.vehicle.setSteeringValue(-force, 0);
        this.vehicle.setSteeringValue(-force, 1);
    }
    left(force){
        this.vehicle.setSteeringValue(force, 0);
        this.vehicle.setSteeringValue(force, 1);
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
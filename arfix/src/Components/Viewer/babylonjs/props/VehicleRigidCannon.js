import * as BABYLON from 'babylonjs';
import * as Ammo from 'ammojs';
import * as CANNON from 'cannon';

function hasContactResponse(rb) { return (rb.getCollisionFlags() & 4)===0;}

export default class VehicleRigidCannon{
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
        //this.deleteme();
        //this.rearFrontSteeringReverse();
        this.registerForces();
    }
    deleteme(){

        
        //CAR!
        var div = 5;
        var width = 8/div;
        var depth = 8/div;
        var height = 1.3/div;

        var wheelDiameter = 5/div;
        var wheelDepthPosition = (depth + wheelDiameter) / 2

        var axisWidth = width + wheelDiameter;

        var centerOfMassAdjust = new CANNON.Vec3(0, -wheelDiameter, 0);

        var chassis = BABYLON.MeshBuilder.CreateBox("chassis", {
            width: width,
            height: height,
            depth: depth
        }, this.scene);
        chassis.position.y = 3+wheelDiameter + height / 2;
        chassis.physicsImpostor = new BABYLON.PhysicsImpostor(chassis, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, restitution: 0.9 }, this.scene);
        // chassis.physicsImpostor = new BABYLON.PhysicsImpostor(chassis, BABYLON.PhysicsEngine.BoxImpostor, {
        //     mass: 10
        // }, scene)
        //camera.target = (chassis);
        var wheels = [];
        for(var num= 0; num<4;num++){
        //wheels.map(function(num) {
            /*var wheel1 = BABYLON.MeshBuilder.CreateSphere("wheel" + num, {
                segments: 4,
                diameter: wheelDiameter
            }, scene);
            console.log(wheel1.rotation);*/
            let wheel = BABYLON.MeshBuilder.CreateCylinder(`wheelRigid${num}`, {
                height: 1/div,
                diameter: wheelDiameter,
                tessellation: 16
            }, this.scene);

            wheel.rotation.z = Math.PI / 2;
            var a = (num % 2) ? -1 : 1;
            var b = num < 2 ? 1 : -1;
            wheel.position.copyFromFloats(a * axisWidth / 2, wheelDiameter / 2, b * wheelDepthPosition)
            //wheel.scaling.x = 0.2;
            //wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 3, friction:1, restitution: 0.2  }, scene);
            wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 3, friction: 1,restitution: 0.2 }, this.scene);  
            //return wheel;
            wheels.push(wheel);
        }

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: chassis.physicsImpostor.physicsBody
        });


        var down = new CANNON.Vec3(0, 0, 0);
    var conHght = 0;
        this.vehicle.addWheelC({
            body: wheels[0].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(axisWidth / 2, conHght, wheelDepthPosition).vadd(centerOfMassAdjust),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        this.vehicle.addWheelC({
            body: wheels[1].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(-axisWidth / 2, conHght, wheelDepthPosition).vadd(centerOfMassAdjust),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        this.vehicle.addWheelC({
            body: wheels[2].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(axisWidth / 2, conHght, -wheelDepthPosition).vadd(centerOfMassAdjust),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        this.vehicle.addWheelC({
            body: wheels[3].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(-axisWidth / 2, conHght, -wheelDepthPosition).vadd(centerOfMassAdjust),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        // Some damping to not spin wheels too fast
        for (var i = 0; i < this.vehicle.wheelBodies.length; i++) {
            this.vehicle.wheelBodies[i].angularDamping = 0.2;
        }

        //add the constraints to the world
        var world = wheels[3].physicsImpostor.physicsBody.world

        for (var i = 0; i < this.vehicle.constraints.length; i++) {
            world.addConstraint(this.vehicle.constraints[i]);
        }

        var setSteeringValue = function(value, wheelIndex) {
            // Set angle of the hinge axis
            var axis = this.wheelAxes[wheelIndex];
            value = value;//-Math.PI/2
            var c = Math.cos(value),
                s = Math.sin(value),
                x = axis.y,
                z = axis.z;
            this.constraints[wheelIndex].axisA.set(
                //0,
                c * x - s * z,
                0,
                s * x + c * z
            );
        };
        this.vehicle.setSteeringValue = setSteeringValue.bind(this.vehicle);
    }

    createVehicle( pos,quat){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //console.log(this.chassisMesh.getBoundingInfo());
        //this.body  = this.carData.chassisMesh.physicsImpostor.physicsBody;
        

        var chs = BABYLON.MeshBuilder.CreateBox("chassis", {
            width: 1,
            height: 0.3,
            depth: 1
        }, this.scene);
        chs.position.y +=3;
        chs.physicsImpostor = new BABYLON.PhysicsImpostor(chs, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, restitution: 0.2 }, this.scene);
        this.body  = chs.physicsImpostor.physicsBody;
        /*var wheels = [0, 1, 2, 3].map(function(num) {
        var wheels = [];
        //this.carData.wheels.forEach((wData, num)=>{
            var wheel = new BABYLON.MeshBuilder.CreateSphere("wheel" + num, {
                segments: 4,
                diameter: 1 //this.carData.wheels[num].radius
            }, this.scene);
            var a = (num % 2) ? -1 : 1;
            var b = num < 2 ? 1 : -1;

            //wheel.position.copyFromFloats(a * axisWidth / 2, wheelDiameter / 2, b * wheelDepthPosition)
            //wheel.position.copyFromFloats(this.carData.wheels[num].pos.x, this.carData.wheels[num].pos.y, this.carData.wheels[num].pos.z)  
            //wheel.scaling.x = 0.2;
            //wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 3, friction:1, restitution: 0.2  }, this.scene);
            //wheels.push(wheel);
        });*/
        var wheels = [];
        this.carData.wheels.forEach((wData, num)=>{
            /*var wheel =  BABYLON.MeshBuilder.CreateSphere("wheelRigid_" + num, {
                segments: 2,
                diameter: 0.25//this.carData.wheels[0].radius
            }, this.scene);*/
            let wheel = BABYLON.MeshBuilder.CreateCylinder(`wheelRigid${num}`, {
                height: 0.07,
                diameter: this.carData.wheels[0].radius*2*3,
                tessellation: 64
            }, this.scene);
            wheel.rotation.z = Math.PI / 2;
            //wheel.rotate(BABYLON.Vector3.Left(),Math.PI/2);
            //wheel.rotate(BABYLON.Vector3.Right(),Math.PI/2);
            //wheel.rotation = new BABYLON.Vector3(Math.PI/2,0,Math.PI/2);
            //wheel.bakeCurrentTransformIntoVertices();
            wheel.position.copyFromFloats(wData.pos.x, 3+this.carData.wheels[0].radius, wData.pos.z);
            //wheel.position.copyFromFloats(wData.pos.x, wData.pos.y, wData.pos.z);
            wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 3, friction: 1,restitution: 0.2 }, this.scene);  
            //wheel.scaling.x = 0.2;
            //wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 3, friction:1, restitution: 0.2  }, this.scene);
            wheels.push(wheel);
        });

///
/*var chassis = BABYLON.MeshBuilder.CreateBox("chassis", {
    width: 1,
    height: 0.2,
    depth: 2
}, this.scene);
chassis.physicsImpostor = new BABYLON.PhysicsImpostor(chassis, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, restitution: 0.9 }, this.scene);
*/



///

        console.log("power",this.carData.powerWheelsIndex);
        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.body //chassis.physicsImpostor.physicsBody//
        });
        var offset = -this.carData.wheels[0].radius*4;
        var down = new CANNON.Vec3(0, 0, 0);
        this.vehicle.addWheelC({
            body: wheels[0].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(this.carData.wheels[0].pos.x,offset,this.carData.wheels[0].pos.z),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        this.vehicle.addWheelC({
            body: wheels[1].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(this.carData.wheels[1].pos.x, offset,this.carData.wheels[1].pos.z),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        this.vehicle.addWheelC({
            body: wheels[2].physicsImpostor.physicsBody,
            position: new CANNON.Vec3(this.carData.wheels[2].pos.x, offset,this.carData.wheels[2].pos.z),
            axis: new CANNON.Vec3(0, -1, 0),
            direction: down
        });

        for (var i = 0; i < this.vehicle.wheelBodies.length; i++) {
            this.vehicle.wheelBodies[i].angularDamping = 0.2;
        }

        //add the constraints to the world
        //var world = wheels[2].physicsImpostor.physicsBody.world;

        for (var i = 0; i < this.vehicle.constraints.length; i++) {
            world.addConstraint(this.vehicle.constraints[i]);
        }
        var setSteeringValue = function(value, wheelIndex) {
            // Set angle of the hinge axis
            var axis = this.wheelAxes[wheelIndex];
            //value = value-Math.PI/2;
            var c = Math.cos(value),
                s = Math.sin(value),
                x = axis.y,
                z = axis.z;
            this.constraints[wheelIndex].axisA.set(
                //0,
                c * x - s * z,
                0,
                s * x + c * z
            );
        };
        this.vehicle.setSteeringValue = setSteeringValue.bind(this.vehicle);
        //this.rearFrontSteeringReverse();
        //console.log("vehicle",this.vehicle.getRigidBody());//.getWheelInfo(0));

        /*this.scene.registerBeforeRender(function () {
            that.update();
        });*/
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
        this.registerForces();
        /*this.wheelsTransform();
        if(this.numOfWheelsOnGround()>0) {
            this.registerForces(); 
            //this.relativeToGroundMove();
        }*/
    }
    rearFrontSteeringReverse(){
        this.reverseSteeringSign = -1;
        this.carData.steeringWheelsIndex.forEach( (sw,i)=>{
            if(!this.carData.wheels[sw].isFront) this.reverseSteeringSign = 1;
        });
        console.log(this.reverseSteeringSign);
    }



    accelerate(force){
        if(!this.accelerationIdle){
        this.vehicle.setWheelForce(force, 0);
        this.vehicle.setWheelForce(force, 1);
        this.vehicle.applyWheelForce(force, 0);
        this.vehicle.applyWheelForce(force, 1);
        console.log("pwr");
         }   
        //if(!this.accelerationIdle) this.carData.powerWheelsIndex.forEach(x=> this.vehicle.applyEngineForce(force, x));// console.log("active",force);}
        //if(!this.accelerationIdle) this.carData.powerWheelsIndex.forEach(x=> this.vehicle.setWheelForce(force, x));// console.log("active",force);}
    }
    directionChange(force){
        //if(this.directionIdle) this.carData.steeringWheelsIndex.forEach(x => this.vehicle.setSteeringValue(this.reverseSteeringSign*force, x));
        if(this.directionIdle){
        this.vehicle.setSteeringValue(force, 2);
        //this.vehicle.setSteeringValue(force, 1);
        }
        //if(this.directionIdle) this.carData.steeringWheelsIndex.forEach(x => this.vehicle.setSteeringValue(this.reverseSteeringSign*force, x));
    }
    brakeApply(force){
        //if(this.breakIdle) this.carData.brakeWheelsIndex.forEach(x => this.vehicle.setBrake(force, x));
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
        //this.brakeApply(this.breakingForce);
        this.resetControls();
    }

}

CANNON.RigidVehicle.prototype.addWheelC = function(options){
    options = options || {};
    var wheelBody = options.body;
    if(!wheelBody){
        wheelBody =  new CANNON.Body(1, new CANNON.Sphere(1.2));
    }
    this.wheelBodies.push(wheelBody);
    this.wheelForces.push(0);
 
    // Position constrain wheels
    var zero = new CANNON.Vec3();
    var position = typeof(options.position) !== 'undefined' ? options.position.clone() : new CANNON.Vec3();
 
    // Set position locally to the chassis
    var worldPosition = new CANNON.Vec3();
    this.chassisBody.pointToWorldFrame(position, worldPosition);
    wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
 
    // Constrain wheel
    var axis = typeof(options.axis) !== 'undefined' ? options.axis.clone() : new CANNON.Vec3(0, 1, 0);
    this.wheelAxes.push(axis);
    var axisA = new CANNON.Vec3(1,0,0);
    var hingeConstraint = new CANNON.HingeConstraint(this.chassisBody, wheelBody, {
        pivotA: position,
        axisA: axisA,
        pivotB: CANNON.Vec3.ZERO,
        axisB: axis,
        collideConnected: false
    });
    this.constraints.push(hingeConstraint);
 
    return this.wheelBodies.length - 1;
};
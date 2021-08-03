import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';

class VehicleData {
    constructor(scene){
        this._scene = scene;
        this._chassisMesh = null;
        this._wheelsMesh = [];
        this._powerWheelsIndex = [];
        this.steeringWheelsIndex = [];
        this._brakeWheelsIndex = [];    
    }
    get scene(){
        return this._scene;
    }
    set scene(s){
        this._scene = s;
    }
    get chassisMesh(){
        return this._chassisMesh;
    }
    set chassisMesh(mesh){
        this._chassisMesh = mesh;
    }
    get wheelsMesh(){
        return this._wheelsMesh;
    }
    set wheelsMesh(mesh){
        this._wheelsMesh = mesh;
    }
    get powerWheelsIndex(){
        return this._powerWheelsIndex;
    }
    set powerWheelsIndex(indices){
        this._powerWheelsIndex = indices;
    }
}
class carFromBoxesData extends VehicleData{
    constructor(scene){
        super(scene);
        const bodySize = new BABYLON.Vector3(1, 2, 0.2);
        this.chassisMesh = this.makebox(bodySize, new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0,0,0).toQuaternion())
        var wp =this.calculateWheelPosition(this.chassisMesh.position, bodySize);
        this.wheelsMesh = [
            this.createWheelMesh(0.5,0.25,wp[0]),
            this.createWheelMesh(0.5,0.25,wp[1]),
            this.createWheelMesh(0.5,0.25,wp[2]),
            this.createWheelMesh(0.5,0.25,wp[3])
        ];    

    }
    makebox(size, position, rotation){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:size.x,depth:size.y,height:size.z}, this.scene);
        box.rotationQuaternion = rotation;
        box.position = position;
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);
        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;
        return box;
    }
    calculateWheelPosition(chassisPosition, chassisSize){
        var wheelPosition  = [];
        const suspLength =-chassisSize.z/2-0.2;//-chassisSize.z/2-0.30; //half of chassis height is point zero for wheel connection
        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[0].copyFrom(chassisPosition);
        wheelPosition[0].addInPlace(new BABYLON.Vector3(chassisSize.x/2, suspLength, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[1].copyFrom(chassisPosition);
        wheelPosition[1].addInPlace(new BABYLON.Vector3(-chassisSize.x/2, suspLength, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[2].copyFrom(chassisPosition);
        wheelPosition[2].addInPlace(new BABYLON.Vector3(-chassisSize.x/2, suspLength, -chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[3].copyFrom(chassisPosition);
        wheelPosition[3].addInPlace(new BABYLON.Vector3(chassisSize.x/2, suspLength, -chassisSize.y/2));
        
        return wheelPosition;
    }
    createWheelMesh(diameter, width, position){
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

        wheelMesh.rotateAround(
            new BABYLON.Vector3(0,0,0),
            new BABYLON.Vector3(0,0,1),
            -Math.PI/2
            );
        wheelMesh.bakeCurrentTransformIntoVertices();
        wheelMesh.position.addInPlace(position);

        return wheelMesh;
    }
}

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

/**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Vector3} point      
     * @param {BABYLON.Plane} plane
     * @return {BABYLON.Vector3} The projection of the point p on the plane
     */
function projectOnPlane(point, plane) {        
    let n = plane.normal;        
    let d = plane.d;

    let p0 = new BABYLON.Vector3().copyFrom(point);//camera.position;
    
    // ray direction
    let V = new BABYLON.Vector3.Up();//point.subtract(p0).normalize();
    let denom = BABYLON.Vector3.Dot(V, n);
    
    let t = -(BABYLON.Vector3.Dot(p0, n) + d)/denom;

    // P = P0 + t*V
    return p0.add(V.scale(t));
}
/**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Mesh} chassis      
     * @param {BABYLON.Vector3[]} wheelPosition
     * @return {BABYLON.Vector3[]} The projection of the point p on the plane
     */
function getWheelConnectionPoint(chassis, wheelPosition){
    chassis.computeWorldMatrix(true); 
    //var norm = new BABYLON.Vector3(0,1,0);
    //norm.rotateByQuaternionToRef(chassis.absoluteRotationQuaternion, norm);
    //norm.normalize();
    //var abstractPlane = BABYLON.Plane.FromPositionAndNormal(chassis.getAbsolutePosition(), norm);

    var wheelsConnection = wheelPosition.map((pos,index)=>{
        var con = new BABYLON.Vector3();
        con.copyFrom(pos); //projectOnPlane(pos,abstractPlane);
        con.subtractInPlace(chassis.getAbsolutePosition());
        con.y = pos.y- chassis.getAbsolutePosition().y
        return con;
    });
    return wheelsConnection;   
}


export default class Vehicle{
    constructor(scene, physics){
        this.scene = scene;
        this.physics = physics;
        this.vehicle = null;
        this.chassisBody = null;
        const simpelCar = new carFromBoxesData(scene);
        this.chassisMesh = simpelCar.chassisMesh;
        this.wheelMeshes = simpelCar.wheelsMesh;
        /*const bodySize = new BABYLON.Vector3(1, 2, 0.2); //width,length,height
        this.chassisMesh = this.makebox(bodySize, new BABYLON.Vector3(0, 1, 0),new BABYLON.Vector3(0,0,0).toQuaternion());   
        //this.chassisMesh.computeWorldMatrix(true);

        const wheelDiameter = 0.5;
        var wp =this.calculateWheelPosition(this.chassisMesh.position, bodySize, wheelDiameter);
        var rot = new BABYLON.Vector3(Math.PI/2, Math.PI/2, 0).toQuaternion();
        this.wheelMeshes = [
            this.createWheelMesh(wheelDiameter,0.25,wp[0], rot),
            this.createWheelMesh(wheelDiameter,0.25,wp[1], rot),
            this.createWheelMesh(wheelDiameter,0.25,wp[2], rot),
            this.createWheelMesh(wheelDiameter,0.25,wp[3], rot)
        ];*/
        //this.connectionPoint = getWheelConnectionPoint(this.chassisMesh, this.wheelMeshes.map(m=>m.position) );
        //this.chassisMesh.computeWorldMatrix(true); 
        this.createVehicle();

    }

    /*calculateWheelPosition(chassisPosition, chassisSize, wheelDiameter){
        var wheelPosition  = [];
        const suspLength =-chassisSize.z/2-0.2;//-chassisSize.z/2-0.30; //half of chassis height is point zero for wheel connection
        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[0].copyFrom(chassisPosition);
        wheelPosition[0].addInPlace(new BABYLON.Vector3(chassisSize.x/2, suspLength, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[1].copyFrom(chassisPosition);
        wheelPosition[1].addInPlace(new BABYLON.Vector3(-chassisSize.x/2, suspLength, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[2].copyFrom(chassisPosition);
        wheelPosition[2].addInPlace(new BABYLON.Vector3(-chassisSize.x/2, suspLength, -chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[3].copyFrom(chassisPosition);
        wheelPosition[3].addInPlace(new BABYLON.Vector3(chassisSize.x/2, suspLength, -chassisSize.y/2));
        
        return wheelPosition;
    }
    makebox(size, position, rotation){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:size.x,depth:size.y,height:size.z}, this.scene);
        box.rotationQuaternion = rotation;
        box.position = position;
        var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);
        //console.log(box.getAbsoluteSize());
        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;
        //box.bakeCurrentTransformIntoVertices();
        //box.rotationQuaternion = new BABYLON.Vector3(0,0,0).toQuaternion();
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

        wheelMesh.rotateAround(
            new BABYLON.Vector3(0,0,0),
            new BABYLON.Vector3(0,0,1),
            -Math.PI/2
            );
        wheelMesh.bakeCurrentTransformIntoVertices();
        wheelMesh.position.addInPlace(position);

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

    }*/

    createVehicle(){
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //width, height, length
        this.chassisMesh.computeWorldMatrix(true); 

        var chassisShape = new CANNON.Box(this.babylon2cannonVec3(this.chassisMesh.getAbsoluteSize().multiplyInPlace(new BABYLON.Vector3(0.5,0.5,0.5)))); //cannon makes box twice the size
        let mat = new CANNON.Material('Mat');
		mat.friction = 0.01;
        this.chassisBody = new CANNON.Body({ mass: 150 });
        this.chassisBody.material = mat;
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
			indexUpAxis: 1,//1
			indexRightAxis: 0,//0
			indexForwardAxis: 2,//2
        });

        this.vehicle.chassisBody.shapeOrientations[0] = this.babylon2cannonQuat(this.chassisMesh.absoluteRotationQuaternion);


        var that = this;
        this.wheelMeshes.forEach((wheelMesh, index)=>{
            options.radius = 0.5*wheelMesh.getAbsoluteSize().y;
            var pos= new BABYLON.Vector3(
                wheelMesh.getPositionExpressedInLocalSpace().x,
                wheelMesh.getPositionExpressedInLocalSpace().y-that.chassisMesh.getAbsolutePosition().y,
                wheelMesh.getPositionExpressedInLocalSpace().z)
            options.chassisConnectionPointLocal.copy(that.babylon2cannonVec3( pos )); 
            that.vehicle.addWheel(options);
        });
        this.vehicle.addToWorld(world);
        
        var that = this;
        
        //world.addEventListener('postStep', function(){
        this.scene.registerBeforeRender(function () {
            for (var i = 0; i < that.vehicle.wheelInfos.length; i++) {
                that.vehicle.updateWheelTransform(i);
                var t = that.vehicle.wheelInfos[i].worldTransform; 
                that.wheelMeshes[i].position.copyFrom( that.cannon2babylonVec3(t.position) );
                that.wheelMeshes[i].rotationQuaternion.copyFrom( that.cannon2babylonQuat(t.quaternion) );

            }

            that.chassisMesh.position.copyFrom( that.cannon2babylonVec3( that.vehicle.chassisBody.position));
            const rot = new CANNON.Quaternion();
            that.vehicle.chassisBody.quaternion.mult(that.vehicle.chassisBody.shapeOrientations[0],rot);
            that.chassisMesh.rotationQuaternion.copyFrom( that.cannon2babylonQuat( rot ) );
            //that.chassisMesh.rotationQuaternion.copyFrom( that.cannon2babylonQuat(that.vehicle.chassisBody.quaternion) );
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
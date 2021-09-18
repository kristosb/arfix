import * as BABYLON from 'babylonjs';
import * as Ammo from 'ammojs';
//import * as CANNON from 'cannon';
class VehicleData {
    constructor(scene){
        this._scene = scene;
        this._chassisMesh = null;
        this._wheelsMesh = [];
        this._powerWheelsIndex = [];
        this._steeringWheelsIndex = [];
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
    get steeringWheelsIndex(){
        return this._steeringWheelsIndex;
    }
    set steeringWheelsIndex(indices){
        this._steeringWheelsIndex = indices;
    }
    get brakeWheelsIndex(){
        return this._brakeWheelsIndex;
    }
    set brakeWheelsIndex(indices){
        this._brakeWheelsIndex = indices;
    }
}

function makebox(scene, size, position, rotation, color = new BABYLON.Color3(0.5, 0.6, 0.87), name= "box"){
    var box =  BABYLON.MeshBuilder.CreateBox(name, {width:size.x,depth:size.y,height:size.z}, scene);
    box.rotationQuaternion = rotation;
    box.position = position;
    var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
    myMaterial.specularColor = color;
    myMaterial.emissiveColor = color;
    box.material = myMaterial;
    return box;
} 

function createWheelMesh(scene, diameter, width, position){
    //Wheel Material 
    var wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", scene);
    var wheelTexture = new BABYLON.Texture("http://i.imgur.com/ZUWbT6L.png", scene);
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
    }, scene);
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

export class CarFromBoxesData extends VehicleData{
    constructor(scene){
        super(scene);
        const bodySize = new BABYLON.Vector3(1, 4, 0.2);
        var chassis = makebox(scene, bodySize, new BABYLON.Vector3(0, 2, 0), new BABYLON.Vector3(0,0,0).toQuaternion())
        var wp = this.calculateWheelPosition(chassis.position, bodySize);
        var off = 1;
        this.wheels ={
            radius: 0.25,
            pos:[
                new BABYLON.Vector3(0.5, -0.25, 1+off),
                new BABYLON.Vector3(-0.5, -0.25, 1+off),
                new BABYLON.Vector3(-0.5, -0.25, -1+off),
                new BABYLON.Vector3(0.5, -0.25, -1+off),
            ]
        };
        this.wheelsMesh = [
            createWheelMesh(scene, 0.5,0.25,wp[0]),
            createWheelMesh(scene, 0.5,0.25,wp[1]),
            createWheelMesh(scene, 0.5,0.25,wp[2]),
            createWheelMesh(scene, 0.5,0.25,wp[3])
        ];    
        this.powerWheelsIndex = [2,3];
        this.steeringWheelsIndex = [0,1];
        this.brakeWheelsIndex = [0,1,2,3];
        this.chassisMesh = chassis;
        //this.root = makebox(scene, new BABYLON.Vector3(0.5, 3, 0.2), new BABYLON.Vector3(0, 5, 2), new BABYLON.Vector3(0,0,0).toQuaternion())

        //this.wings = makebox(scene, new BABYLON.Vector3(4, 0.5, 0.2), new BABYLON.Vector3(0, 5, 5), new BABYLON.Vector3(0,0,0).toQuaternion())

        //this.createPhysicsImpostor(this.scene, this.wings, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, friction: 0.1}, true);
        //this.createPhysicsImpostor(this.scene, this.root, BABYLON.PhysicsImpostor.NoImpostor, { mass: 0, friction: 0.1}, true);

        //this.chassisMesh.addChild(this.wings);
        //wings.physicsImpostor.parent = this.chassisMesh.physicsImpostor;
        /*var compoundBody = new BABYLON.Mesh("", scene);
        compoundBody.position.z = 1;
        compoundBody.addChild(chassis);
        compoundBody.position.y =2;*/
        //compoundBody.position = new BABYLON.Vector3(0, 2, 0)
        //this.createPhysicsImpostor(this.scene, chassis, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 5, friction: 0.5}, true);
        //this.createPhysicsImpostor(this.scene, compoundBody, BABYLON.PhysicsImpostor.NoImpostor, { mass: 5, friction: 0.5}, true);
        
        //chassis.physicsImpostor = new BABYLON.PhysicsImpostor(chassis, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 5, friction: 0.5 }, this.scene);
        //compoundBody.physicsImpostor = new BABYLON.PhysicsImpostor(compoundBody, BABYLON.PhysicsImpostor.NoImpostor, { mass: 5, friction: 0.5 }, this.scene);

        
        //this.root.addChild(this.wings);
        //this.root.addChild(this.chassisMesh);
        //this.wings.physicsImpostor.parent = this.chassisMesh.physicsImpostor;
        //this.wings.physicsImpostor.addJoint(this.chassisBody,new BABYLON.PhysicsJoint(0,new BABYLON.phys))
        //this.chassisBody =  this.chassisMesh.physicsImpostor.physicsBody; 
        //.physicsImpostor.physicsBody.getCollisionShape().setMargin(5);
    }
    calculateWheelPosition(chassisPosition, chassisSize){
        var wheelPosition  = [];
        const suspLength =-chassisSize.z/2-0.1;//-chassisSize.z/2-0.30; //half of chassis height is point zero for wheel connection
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
    createPhysicsImpostor(scene, entity, impostor, options, reparent) {
        if (entity == null) return;
        entity.checkCollisions = false;
        const parent = entity.parent;
        if (reparent === true) entity.parent = null;
        entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
        //console.log(entity.physicsImpostor.physicsBody);
        if (reparent === true) entity.parent = parent;
    };
}
export class ThreeWheelCar extends VehicleData{
    constructor(scene){
        super(scene);
        const bodySize = new BABYLON.Vector3(1, 2, 0.2);
        this.chassisMesh = makebox(scene, bodySize, new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0,0,0).toQuaternion())
        var wp = this.calculateWheelPosition(this.chassisMesh.position, bodySize);
        this.wheelsMesh = [
            createWheelMesh(scene, 0.5,0.25,wp[0]),
            createWheelMesh(scene, 0.5,0.25,wp[1]),
            createWheelMesh(scene, 0.5,0.25,wp[2]),
        ];    
        this.powerWheelsIndex = [1,2];
        this.steeringWheelsIndex = [0];
        this.brakeWheelsIndex = [1,2];

        console.log("wheelchassis",this.wheelsMesh[0]);

        //this.createPhysicsImpostor(this.scene, this.chassisMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 20, friction: 0.01}, true);
        //this.chassisBody =  this.chassisMesh.physicsImpostor.physicsBody;    
        /*this.createPhysicsImpostor(this.scene, this.wheelsMesh[0], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.createPhysicsImpostor(this.scene, this.wheelsMesh[1], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.createPhysicsImpostor(this.scene, this.wheelsMesh[2], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.wheelBodies = [
            this.wheelsMesh[0].physicsImpostor.physicsBody,
            this.wheelsMesh[1].physicsImpostor.physicsBody,
            this.wheelsMesh[2].physicsImpostor.physicsBody
        ];*/

    }
    calculateWheelPosition(chassisPosition, chassisSize){
        var wheelPosition  = [];
        const suspLength =-chassisSize.z/2-0.2;//-chassisSize.z/2-0.30; //half of chassis height is point zero for wheel connection
        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[0].copyFrom(chassisPosition);
        wheelPosition[0].addInPlace(new BABYLON.Vector3(0, suspLength, chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[1].copyFrom(chassisPosition);
        wheelPosition[1].addInPlace(new BABYLON.Vector3(-chassisSize.x/2, suspLength, -chassisSize.y/2));

        wheelPosition.push( new BABYLON.Vector3());
        wheelPosition[2].copyFrom(chassisPosition);
        wheelPosition[2].addInPlace(new BABYLON.Vector3(chassisSize.x/2, suspLength, -chassisSize.y/2));
        
        return wheelPosition;
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
}
export class ThreeWheelAirplane extends VehicleData{
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {[BABYLON.Mesh]} meshAll
     */
    constructor(scene, meshAll){
        super(scene);
        console.log(meshAll[0].name);
        console.log(meshAll);
        
        var coliderRoot = meshAll[11];
        var colidersBox =  [meshAll[12], meshAll[13], meshAll[14],
                            meshAll[15], meshAll[16], meshAll[17]];
        console.log("colidersBox");
        colidersBox.forEach(m=>console.log(m.name));
        var colidersSphere =  [ meshAll[18], meshAll[19], meshAll[20], meshAll[21], meshAll[22]];
        //var frontMesh = meshAll[20];
        console.log("colidersSphere");
        colidersSphere.forEach(m=>console.log(m.name));
        var wheels =  [meshAll[8], meshAll[9], meshAll[10]];
        console.log("wheels");
        wheels.forEach(m=>console.log(m.name));

        /*var children =  meshAll.slice(1,8);
        console.log("children");
        children.forEach(m=>console.log(m.name));*/

        console.log("mesh");
        meshAll.forEach(m=>console.log(m.name));
        //var sub = meshAll[0].getChildMeshes().splice(7,15);
        //console.log(sub.forEach(x=>console.log(x.name)));
        //remove physics bodies from root
        meshAll[0].removeChild(coliderRoot);
        colidersBox.forEach(m=>meshAll[0].removeChild(m));
        colidersSphere.forEach(m=>meshAll[0].removeChild(m));
        //meshAll[0].removeChild(frontMesh);
        wheels.forEach(m=>meshAll[0].removeChild(m));

        //meshAll[0].rotate(BABYLON.Axis.Y, Math.PI);
        //meshAll[0].setPositionWithLocalVector = new BABYLON.Vector3(0,1,0);
        //meshAll[0].bakeCurrentTransformIntoVertices();
        //meshAll[0].rotate(BABYLON.Axis.Z, Math.PI/2);
        //meshAll[0].translate(BABYLON.Axis.Z,-0.26);
        /*meshAll[11].rotate(BABYLON.Axis.Z, -Math.PI);
        meshAll[8].rotate(BABYLON.Axis.Z, -Math.PI);
        meshAll[9].rotate(BABYLON.Axis.Z, -Math.PI);
        meshAll[10].rotate(BABYLON.Axis.Z, -Math.PI);*/
        
        coliderRoot.rotate(BABYLON.Axis.Z, -Math.PI);
        colidersBox.forEach(m=>m.rotate(BABYLON.Axis.Z, -Math.PI));
        colidersSphere.forEach(m=>m.rotate(BABYLON.Axis.Z, -Math.PI));
        //frontMesh.rotate(BABYLON.Axis.Z, -Math.PI)
        wheels.forEach(m=>m.rotate(BABYLON.Axis.Z, -Math.PI));
        //wheels.forEach(m=>m.translate(BABYLON.Axis.Z,0.26));
        
        /*console.log(meshAll[0]);

        console.log("rotations");
        meshAll.forEach(x=>{
            console.log(x.name,x.rotationQuaternion,x.absoluteRotationQuaternion);
        });*/

        this.meshAll = meshAll;
        /*meshAll.map(mesh=>{
            console.log(mesh.id);
        });*/
        this.chassisMesh = meshAll[11];
        //console.log(meshAll[11]);
        //console.log(this.chassisMesh.id);
        this.wheelsMesh = [
            meshAll[8],
            meshAll[9],
            meshAll[10]
        ]; 
        /*this.wheelsMesh.map(mesh=>{
            console.log(mesh.id);
        });  */ 
        this.powerWheelsIndex = [1,2];
        this.steeringWheelsIndex = [0];
        this.brakeWheelsIndex = [0,1,2];

        //this.chassisMesh.addChild(meshAll[17]);
        colidersBox.forEach(m=>this.chassisMesh.addChild(m));
        colidersSphere.forEach(m=>this.chassisMesh.addChild(m));
        //this.chassisMesh.addChild(frontMesh);
        console.log("root pos", meshAll[0].position);
        
        meshAll[11].addChild(meshAll[0]);
        
        console.log("root pos", meshAll[0].position);
        //this.createPhysicsImpostor(this.scene, meshAll[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 0, friction: 0.3}, true);
        //meshAll[0].physicsImpostor.parent = meshAll[11].physicsImpostor;

        //this.createPhysicsImpostor(this.scene, meshAll[17], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3}, true);  
        colidersBox.forEach(m=>this.createPhysicsImpostor(this.scene, m, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.1, restitution:0}, true));
        colidersSphere.forEach(m=>this.createPhysicsImpostor(this.scene, m, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 0, friction: 0,restitution:0}, true));
        //this.createPhysicsImpostor(this.scene, frontMesh, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 100, friction: 0.1,restitution:0}, true);
        this.createPhysicsImpostor(this.scene, meshAll[11], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 30, friction: 1,restitution:0.1}, true);
        
        this.chassisBody =  meshAll[11].physicsImpostor.physicsBody;
        
        //meshAll[0].physicsImpostor.executeNativeFunction
        //meshAll[0].physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,0,0));
        console.log("body",meshAll[11].physicsImpostor.physicsBody);
        /*const pos = new BABYLON.Vector3(0, 0, 0);
        meshAll[11].physicsImpostor.$$centerOfMass.add(pos);
        meshAll[0].physicsImpostor.
        console.log("mass",meshAll[11].physicsImpostor.$$centerOfMass);*/
        
        //console.log("body quaternions");
        //console.log(this.chassisBody.quaternion);
        //meshAll[11].physicsImpostor.physicsBody.addShape(meshAll[17].physicsImpostor.physicsBody.shapes[0]);
        //meshAll[17].physicsImpostor.parent = meshAll[11].physicsImpostor;
        //meshAll[11].physicsImpostor.physicsBody.shapeOffsets[0] =new CANNON.Vec3(1.5,0.5,0.5);
        //meshAll[17].physicsImpostor.physicsBody.shapeOffsets[0] = new CANNON.Vec3(0.5,0.5,0.5);
        //console.log("bodyPos",meshAll[17].physicsImpostor.physicsBody.shapes[0]);
        /*colidersBox.forEach(cb=>{
            this.createPhysicsImpostor(this.scene, cb, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3}, true);
            cb.physicsImpostor.parent = meshAll[11].physicsImpostor;    
        });*/
        /*colidersSphere.forEach(cb=>{
            this.createPhysicsImpostor(this.scene, cb, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.3}, true);
            cb.physicsImpostor.parent = meshAll[11].physicsImpostor;    
        });*/
        
        //console.log(meshAll[11].physicsImpostor.physicsBody);
        //console.log(meshAll[11].physicsImpostor.physicsBody.shapes);
        //this.createPhysicsImpostor(this.scene, meshAll[12], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3}, true);
        //meshAll[12].setParent( meshAll[11]);
        //meshAll[12].parent.setParent(meshAll[11]);
        //meshAll[12].setParent(meshAll[11]);
        //meshAll[11].physicsImpostor.physicsBody.addShape(meshAll[12].physicsImpostor.physicsBody);
        //this.createPhysicsImpostor(this.scene, meshAll[0], BABYLON.PhysicsImpostor.BABYLON.PhysicsImpostor.NoImpostor, { mass: 1, friction: 0.3}, true);

        /*this.createPhysicsImpostor(this.scene, meshAll[8], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.createPhysicsImpostor(this.scene, meshAll[9], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.createPhysicsImpostor(this.scene, meshAll[10], BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, friction: 0.3}, true);
        this.wheelBodies = [
            meshAll[8].physicsImpostor.physicsBody,
            meshAll[9].physicsImpostor.physicsBody,
            meshAll[10].physicsImpostor.physicsBody
        ];*/
        //console.log(meshAll[12].physicsImpostor.physicsBody);
    }
    addParent(){
        /*newMeshes.map(mesh => {
            if (mesh.name.includes("Cube")) {
                mesh.parent.setParent(this.chassisMesh);
            }
            if (mesh.name.includes("Sphere")) {
                mesh.parent.setParent(this.chassisMesh);
            }
            if (mesh.name.includes("wheel")) {
                //mesh.parent.setParent(this.collision);
            }
        });*/
        this.newMeshes[12].parent.setParent(this.chassisMesh);
        this.newMeshes[13].parent.setParent(this.chassisMesh);
        this.newMeshes[14].parent.setParent(this.chassisMesh);
        this.newMeshes[15].parent.setParent(this.chassisMesh);
        this.newMeshes[16].parent.setParent(this.chassisMesh);
        this.newMeshes[17].parent.setParent(this.chassisMesh);
        this.createPhysicsImpostor(this.scene, this.newMeshes[12], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        
        this.createPhysicsImpostor(this.scene, this.newMeshes[13], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        this.createPhysicsImpostor(this.scene, this.newMeshes[14], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        this.createPhysicsImpostor(this.scene, this.newMeshes[15], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        this.createPhysicsImpostor(this.scene, this.newMeshes[16], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        this.createPhysicsImpostor(this.scene, this.newMeshes[17], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
        
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

}

export class AirplaneChassis extends VehicleData{
    constructor(scene){
        super(scene);
        const massOffset = new BABYLON.Vector3(0, 0, -0.3);
        const mass = 20;
        var settings = {
            suspensionStiffness: 17,
            suspensionDamping: 0.3,
            suspensionCompression: 4.4,
            suspensionRestLength: 0.6,
            rollInfluence: 0.2,
        }
        // (widht, heigth, length) of a car
        this.wheels =
            [
                {pos: new BABYLON.Vector3(0.5, 0, 1), radius: 0.25, isFront: true, params: settings},
                {pos: new BABYLON.Vector3(-0.5, 0, 1), radius: 0.25, isFront: true, params: settings},
                {pos: new BABYLON.Vector3(-0.5, 0, -1), radius: 0.25, isFront: false, params: settings},
                {pos: new BABYLON.Vector3(0.5, 0, -1), radius: 0.25, isFront: false, params: settings},
            ];
        this.wheels.forEach(x=>x.pos.addInPlace(massOffset));

        this.wheelsMesh = [
            createWheelMesh(scene, 2*this.wheels[0].radius, 0.25, this.wheels[0].pos),
            createWheelMesh(scene, 2*this.wheels[1].radius, 0.25, this.wheels[1].pos),
            createWheelMesh(scene, 2*this.wheels[2].radius, 0.25, this.wheels[2].pos),
            createWheelMesh(scene, 2*this.wheels[3].radius, 0.25, this.wheels[3].pos)
        ];  

        const bodySize = new BABYLON.Vector3(1, 1, 0.4);

        //chassis offset only visual because of the root mass offset
        //chassis is the volume that represents weight, its used for vehicle physisc but not collisions
        var chassis = makebox(scene, bodySize, new BABYLON.Vector3(0, 1, 0).subtractInPlace(massOffset), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.1, .1, .1), "chassis");
               
        var rootVisualMesh = new BABYLON.Mesh("root", scene);
        var collisionMesh = makebox(scene, new BABYLON.Vector3(2, 2, 0.2), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.2, .3, .6), "col");
        var collisionMesh1 = makebox(scene, new BABYLON.Vector3(1, 2.5, 0.2) , new BABYLON.Vector3(0, 1, -1), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.2, .3, .6), "col1");
        var collisionMesh2 = makebox(scene, new BABYLON.Vector3(0.5, 0.5, 0.5) , new BABYLON.Vector3(0, 1.2, 1), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.2, .3, .6), "col2");

        var cabinMesh = makebox(scene, new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.4, .3, .1), "cabin");
        rootVisualMesh.addChild(cabinMesh);

        var visualMeshes = [rootVisualMesh];
        var coliderMeshes = [collisionMesh, collisionMesh1, collisionMesh2];
  
        var isColiderVisible = true;
        chassis.isVisible = true;
        coliderMeshes.forEach(cm=>{
            chassis.addChild(cm);
            cm.isVisible = isColiderVisible;
        });
        //add all meshes to chassis
        visualMeshes.forEach(vm=>{chassis.addChild(vm)});

        coliderMeshes.forEach(cm=>{createPhysicsImpostor(this.scene, cm, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1,restitution:0.1}, true)});           
        createPhysicsImpostor(this.scene, chassis, BABYLON.PhysicsImpostor.NoImpostor, { mass: mass, friction: 1,restitution:0.1}, true);

        this.powerWheelsIndex = [2,3];
        this.steeringWheelsIndex = [0,1];
        this.brakeWheelsIndex = [0,1,2,3];
        this.chassisMesh = chassis;
    }

}

////

export class AirplaneFromMesh extends VehicleData{
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {[BABYLON.Mesh]} meshAll
     */
     constructor(scene, meshAll){
        super(scene);
        meshAll[0].translate(new BABYLON.Vector3.Up(),0.15,BABYLON.Space.WORLD);
        const massOffset = new BABYLON.Vector3(0, 0.1, 0.05);
        const mass = 20;
        const isColiderVisible = false;
        var settings = {
            suspensionStiffness: 27,
            suspensionDamping: 0.3,
            suspensionCompression: 4.4,
            suspensionRestLength: 0.3,
            rollInfluence: 0.01,
        }
        this.wheelsMesh = [
            meshAll[8], meshAll[9], meshAll[10]
        ];  
        this.wheelsMesh .forEach(m=>meshAll[0].removeChild(m));
        meshAll[0].translate(new BABYLON.Vector3.Up(),0.8,BABYLON.Space.WORLD);

        const radius = 0.225/2;
        // (widht, heigth, length) of a car
        this.wheels =
            [
                {pos: this.wheelsMesh[0].position, radius: radius, isFront: true, params: settings},
                {pos: this.wheelsMesh[1].position, radius: radius, isFront: false, params: settings},
                {pos: this.wheelsMesh[2].position, radius: radius, isFront: false, params: settings},
            ];
        this.wheels.forEach(x=>x.pos.addInPlace(massOffset));

        const bodySize = new BABYLON.Vector3(0.3, 0.3, 0.3);

        //chassis offset only visual because of the root mass offset
        //chassis is the volume that represents weight, its used for vehicle physisc but not collisions
        var chassis = makebox(scene, bodySize, new BABYLON.Vector3(0, 1, 0).subtractInPlace(massOffset), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.1, .1, .1), "chassis");
        chassis.isVisible = true;       
        
        meshAll[0].removeChild(meshAll[7])
        var visualMeshes = [meshAll[7]];//[rootVisualMesh];
        //add all meshes to chassis
        visualMeshes.forEach(vm=>{chassis.addChild(vm)});

        this.collidersCreate(meshAll[0],chassis,
                            [meshAll[11],meshAll[12], meshAll[13], meshAll[14], meshAll[15], meshAll[16], meshAll[17]],
                            BABYLON.PhysicsImpostor.BoxImpostor,
                            isColiderVisible);
        this.collidersCreate(meshAll[0],chassis,
                            [meshAll[18], meshAll[19], meshAll[20], meshAll[21], meshAll[22]],
                            BABYLON.PhysicsImpostor.CapsuleImpostor,
                            isColiderVisible);
        createPhysicsImpostor(this.scene, chassis, BABYLON.PhysicsImpostor.NoImpostor, { mass: mass, friction: 1,restitution:0.1}, true);

        this.powerWheelsIndex = [1,2];
        this.steeringWheelsIndex = [0];
        this.brakeWheelsIndex = [1,2];
        this.chassisMesh = chassis;

        meshAll[0].dispose();       //not needed anymore since we had do assign a new mesh root for raycast vehicle
    }
    collidersCreate(oldRoot, newRoot, meshes, impostorType, isVisible){
        var coliderMeshesBox = meshes;
        coliderMeshesBox.forEach(m=>oldRoot.removeChild(m));
        coliderMeshesBox.forEach(cm=>{
            newRoot.addChild(cm);
            cm.isVisible = isVisible;
        });
        coliderMeshesBox.forEach(cm=>{createPhysicsImpostor(this.scene, cm, impostorType, { mass: 0, friction: 1,restitution:0.1}, true)});           
    }

}

function createPhysicsImpostor(scene, entity, impostor, options, reparent) {
    if (entity == null) return;
    entity.checkCollisions = false;
    const parent = entity.parent;
    if (reparent === true) entity.parent = null;
    entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
    //console.log(entity.physicsImpostor.physicsBody);
    if (reparent === true) entity.parent = parent;
};

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
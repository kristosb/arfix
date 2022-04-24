import * as BABYLON from 'babylonjs';
//import * as Ammo from 'ammojs';
import * as CANNON from 'cannon';
import { Vector3 } from 'yuka';
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
    var myMaterial = new BABYLON.StandardMaterial("vehicleMassBox", scene);
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


export class AirplaneWW2 extends VehicleData{
    /**    
     * Airplane mesh data and physics body
     * @param {BABYLON.Scene} scene      
     * @param {[BABYLON.Mesh]} meshAll
     * @param {[BABYLON.Vector3]} position
     * @param {[BABYLON.Vector3]} eulerRotation
     */
     constructor(scene, meshAll, position, eulerRotation){
        super(scene);
        if(!meshAll) console.error("airplane modlel mesh error");
        var scale = 1;
        meshAll[0].translate(new BABYLON.Vector3.Up(),0.15,BABYLON.Space.WORLD);
        meshAll[0].scaling= meshAll[0].scaling.multiplyByFloats(scale,scale,scale);// = new Vector3(1,1,1);
        const massOffset = new BABYLON.Vector3(0, 0.2, 0.65).multiplyByFloats(scale,scale,scale);
        const mass = 50;
        const isColiderVisible = false;
        var settings = {
            suspensionStiffness: 47,//27
            suspensionDamping: 0.3,//03
            suspensionCompression: 4.4,//4.4
            suspensionRestLength: 0.3,//0.3
            rollInfluence: 0.01, //0.01
        }
        var rearWheelSettings = { ...settings };
        rearWheelSettings.suspensionRestLength = 0.27;
        this.wheelsMesh = [
            meshAll[18], meshAll[19], meshAll[20]
        ];  
        this.wheelsMesh.forEach(m=>meshAll[0].removeChild(m));
        meshAll[0].translate(new BABYLON.Vector3.Up(),0.75,BABYLON.Space.WORLD);

        const radius = 0.225/2;//0.225/2;
        // (widht, heigth, length) of a car
        this.wheels =
            [
                {pos: this.wheelsMesh[0].position, radius: radius, isFront: true, params: settings},
                {pos: this.wheelsMesh[1].position, radius: radius, isFront: true, params: settings},
                {pos: this.wheelsMesh[2].position, radius: radius/2, isFront: false, params: rearWheelSettings},
            ];
        this.wheels.forEach(x=>x.pos.addInPlace(massOffset));

        const bodySize = new BABYLON.Vector3(2, 2, 0.6).multiplyByFloats(scale,scale,scale);//0.3

        //chassis offset only visual because of the root mass offset
        //chassis is the volume that represents weight, its used for vehicle physisc but not collisions
        var chassis = makebox(scene, bodySize, new BABYLON.Vector3(0, 1, 0).subtractInPlace(massOffset), new BABYLON.Vector3(0,0,0).toQuaternion(),new BABYLON.Color3(.1, .1, .1), "chassis");
        chassis.isVisible = false;       
        // body visuals
        meshAll[0].removeChild(meshAll[11]);
        this.visualMeshes = [meshAll[11]];//[rootVisualMesh];
        //add all meshes to chassis
        this.visualMeshes.forEach(vm=>{chassis.addChild(vm)});

        this.controls = {   rotor: meshAll[17],
                            rudder: meshAll[16],
                            leftAileron: meshAll[12],
                            rightAileron: meshAll[13],
                            leftElevator: meshAll[15],
                            rightElevator: meshAll[14]
                        };   
        Object.values( this.controls).forEach(m=>{
            meshAll[0].removeChild(m);
            chassis.addChild(m);
        } );  
        
        /*this.collidersCreate(meshAll[0],chassis,
                            [meshAll[1],meshAll[2], meshAll[3], meshAll[4], meshAll[5]],
                            BABYLON.PhysicsImpostor.BoxImpostor,
                            isColiderVisible);*/
        /*this.collidersCreate(meshAll[0],chassis,
                            [meshAll[6], meshAll[7], meshAll[8], meshAll[9], meshAll[10]],
                            BABYLON.PhysicsImpostor.CapsuleImpostor,
                            isColiderVisible);*/
       // createPhysicsImpostor(this.scene, chassis, BABYLON.PhysicsImpostor.NoImpostor, { mass: mass, friction: 1,restitution:0.1}, true);
        //console.log("body", chassis.physicsImpostor.physicsBody);
        //chassis.physicsImpostor.physicsBody.angularDamping = 0.6;//cannon
        //chassis.physicsImpostor.physicsBody.setDamping(0.01, 0.6);
        this.chassisBody = this.createBody(mass, new BABYLON.Vector3(1,0.3,1),new BABYLON.Vector3(0,0.1,-0.2));
        this.powerWheelsIndex = [0,1];
        this.steeringWheelsIndex = [2];
        this.brakeWheelsIndex = [0,1,2];
        this.chassisMesh = chassis;
        meshAll[0].dispose();       //not needed anymore since we had do assign a new mesh root for raycast vehicle
        var world = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        this.chassisBody.position = new CANNON.Vec3(position.x, position.y, position.z);
        var initRotation = eulerRotation.toQuaternion();
        this.chassisBody.quaternion = new CANNON.Quaternion(initRotation.x,initRotation.y,initRotation.z,initRotation.w);
        world.addBody(this.chassisBody);
        
        //console.log(world);
        var that = this;
        this.scene.registerBeforeRender(function () {
            that.chassisMesh.position.copyFrom( new BABYLON.Vector3( that.chassisBody.position.x,
                                                                     that.chassisBody.position.y,
                                                                     that.chassisBody.position.z,
                                                ));
            //that.chassisMesh.rotation = new BABYLON.Quaternion(
            that.chassisMesh.rotationQuaternion = new BABYLON.Quaternion(
                that.chassisBody.quaternion.x,
                that.chassisBody.quaternion.y,
                that.chassisBody.quaternion.z,
                that.chassisBody.quaternion.w
            );
        });
    }
    collidersCreate(oldRoot, newRoot, meshes, impostorType, isVisible){
        var coliderMeshesBox = meshes;
        coliderMeshesBox.forEach(m=>oldRoot.removeChild(m));
        coliderMeshesBox.forEach(cm=>{
            newRoot.addChild(cm);
            cm.isVisible = isVisible;
        });
        coliderMeshesBox.forEach(cm=>{createPhysicsImpostor(this.scene, cm, impostorType, { mass: 0, friction: 1,restitution: 0.1}, true)});    //    restitution:0.1   
    }
    createBody(mass = 50, size, offset){
        var chassisShape;
        chassisShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
        var chassisBody = new CANNON.Body({ mass: mass });
        chassisBody.addShape(chassisShape, new CANNON.Vec3(offset.x, offset.y, offset.z));
        chassisBody.angularDamping = 0.8;
        return chassisBody;
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
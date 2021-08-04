import * as BABYLON from 'babylonjs';

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

function makebox(scene, size, position, rotation){
    var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:size.x,depth:size.y,height:size.z}, scene);
    box.rotationQuaternion = rotation;
    box.position = position;
    var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
    myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
    myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
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

export class carFromBoxesData extends VehicleData{
    constructor(scene){
        super(scene);
        const bodySize = new BABYLON.Vector3(1, 2, 0.2);
        this.chassisMesh = makebox(scene, bodySize, new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0,0,0).toQuaternion())
        var wp = this.calculateWheelPosition(this.chassisMesh.position, bodySize);
        this.wheelsMesh = [
            createWheelMesh(scene, 0.5,0.25,wp[0]),
            createWheelMesh(scene, 0.5,0.25,wp[1]),
            createWheelMesh(scene, 0.5,0.25,wp[2]),
            createWheelMesh(scene, 0.5,0.25,wp[3])
        ];    
        this.powerWheelsIndex = [2,3];
        this.steeringWheelsIndex = [0,1];
        this.brakeWheelsIndex = [0,1,2,3];
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
}
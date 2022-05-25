import * as BABYLON from 'babylonjs';
import * as YUKA from 'yuka';
import * as CANNON from 'cannon';
import { GridMaterial} from 'babylonjs-materials';

export default class Airship {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     * @param {BABYLON.Mesh} visualMesh 
     *    
     */
    constructor(scene, visualMesh,options){
        options = options || {};
        
        const offsetPosition = new BABYLON.Vector3(-100, 100, -100);
        const initPosition = new BABYLON.Vector3(140, 50, 190).addInPlace(offsetPosition);
        this.vehicleMesh = BABYLON.MeshBuilder.CreateBox("yukaMeshAirship",{width:12, height:10, depth:64},scene);
        /*var groundMat = new BABYLON.StandardMaterial("groundMatAirship", scene);
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
        groundMat.diffuseColor = new BABYLON.Color3(0.29, 0.26, 0.26);
        groundMat.backFaceCulling = false;*/
        this.vehicleMesh.material = new GridMaterial("groundMaterialAirship", scene);//groundMat;
        this.vehicleMesh.position.copyFrom(initPosition);
        this.vehicleMesh.position.z +=-1;
        //this.vehicleMesh.position.x -=2.3;
        this.vehicleMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.vehicleMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100000, friction: 1, restitution: 0.9 }, scene);
        this.vehicleMesh.isVisible = options.debug;
        //console.log(this.vehicleMesh.physicsImpostor.physicsBody.angularVelocity);
        this.entityManager = new YUKA.EntityManager();
        this.time = new YUKA.Time();
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = 2;
        this.vehicle.mass = 0.1;
        //vehicle.maxSpeed = 2;
        //vehicle.setRenderComponent(vehicleMesh, sync);
        const path = new YUKA.Path();
        path.loop = true;
        const yukaOffset = new YUKA.Vector3(offsetPosition.x,offsetPosition.y,offsetPosition.z);
        path.add(new YUKA.Vector3(140, 80, 190).add(yukaOffset));
        path.add(new YUKA.Vector3(-50, 130, 200).add(yukaOffset));
        path.add(new YUKA.Vector3(-50, 180, 150).add(yukaOffset));
        path.add(new YUKA.Vector3(-30, 130, 30).add(yukaOffset));
        path.add(new YUKA.Vector3(-10, 130, -10).add(yukaOffset));
        path.add(new YUKA.Vector3(150, 100, 50).add(yukaOffset));
        
        //path.add(new YUKA.Vector3(250, 0, 340));
    
        this.vehicle.position.copy(path.current());
        this.vehicle.active = false;
        const followPathBehavior = new YUKA.FollowPathBehavior(path, 20);
        this.vehicle.steering.add(followPathBehavior);
        this.onPathBehavior = new YUKA.OnPathBehavior(path);
        this.vehicle.steering.add(this.onPathBehavior);
        this.entityManager.add(this.vehicle);
        
        path._waypoints.push(path._waypoints[0]);

        if(options.debug){
        var lines = BABYLON.MeshBuilder.CreateLines('lines', {
            points: path._waypoints,
            updatable: true,
        })
        lines.color = BABYLON.Color3.Teal()
        }
        this.onPathBehavior.active = false;
        //onPathBehavior.radius = 10;
        this.entityManager.update(this.time.update().getDelta())

       // var visualMesh = BABYLON.MeshBuilder.CreateBox("battleshipMesh",{width:10, height:20, depth:10},scene);
        visualMesh.scaling = new BABYLON.Vector3(7,7,7);
        visualMesh.position.copyFrom(initPosition);
        visualMesh.position.y +=-20.6;
        visualMesh.rotate(new BABYLON.Vector3.Up(), -Math.PI);
        this.vehicleMesh.addChild(visualMesh);
        this.vehicleMesh.rotate(new BABYLON.Vector3.Up(), -Math.PI/2);
        this.altOffset = new BABYLON.Vector3(0,0,0);//-2.3-100
        //console.log("q",this.vehicleMesh.physicsImpostor.physicsBody.quaternion);
        this.vehicle.rotation = new YUKA.Quaternion(this.vehicleMesh.rotationQuaternion.x,this.vehicleMesh.rotationQuaternion.y,this.vehicleMesh.rotationQuaternion.z,this.vehicleMesh.rotationQuaternion.w);
    }
    update(){
        
        const delta = this.time.update().getDelta();
        //console.log("entity", this.vehicle.position.y);
        this.entityManager.update(delta);
        //var vy = vehicleMesh.physicsImpostor.physicsBody.velocity.y
        var vy = -(this.vehicleMesh.position.y-this.vehicle.position.y+this.altOffset.y);
        var meshVelocity = new BABYLON.Vector3(this.vehicle.velocity.x,vy,this.vehicle.velocity.z);
        //var meshVelocity = new BABYLON.Vector3(-1,vy,0);//this.vehicle.velocity.x,vy,this.vehicle.velocity.z)
        this.vehicleMesh.physicsImpostor.setLinearVelocity(meshVelocity);
        this.vehicleMesh.physicsImpostor.physicsBody.angularVelocity = new CANNON.Vec3(0,0,0);
        
        //var yukaRotation = this.vehicle.rotation;//.toEuler(new YUKA.Quaternion());
        var rotC = new CANNON.Quaternion(this.vehicle.rotation.x, this.vehicle.rotation.y, this.vehicle.rotation.z,this.vehicle.rotation.w);
        var rotE = new CANNON.Vec3();
        var con = rotC.conjugate(); //find angle between quaternions
        var rotated = con.mult(this.vehicleMesh.physicsImpostor.physicsBody.quaternion);    
        var res = new CANNON.Vec3();
        rotated.toEuler(res);
        //console.log("rot",res );
        this.vehicleMesh.physicsImpostor.physicsBody.angularVelocity = new CANNON.Vec3(0,-res.y/10,0);
        
    }
    set pause(val){
        this.vehicle.active = val;
    }
    get pause(){
        return this.vehicle.active;
    }
}

import * as BABYLON from 'babylonjs';
import * as YUKA from 'yuka';
import * as CANNON from 'cannon';
import { GridMaterial} from 'babylonjs-materials';

export default class BattleShip {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     *    
     */
    constructor(scene, visualMesh){
        var initPosition = new BABYLON.Vector3(260, 4, 350);
        this.vehicleMesh = BABYLON.MeshBuilder.CreateBox("yukaMesh",{width:12, height:3, depth:54},scene);
        var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
        groundMat.diffuseColor = new BABYLON.Color3(0.29, 0.26, 0.26);
        groundMat.backFaceCulling = false;
        this.vehicleMesh.material = new GridMaterial("groundMaterial", scene);//groundMat;
        this.vehicleMesh.position.copyFrom(initPosition);
        this.vehicleMesh.position.z +=14;
        this.vehicleMesh.position.x -=4.3;
        this.vehicleMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.vehicleMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100000, friction: 1, restitution: 0.9 }, scene);
        this.vehicleMesh.isVisible = false;
        console.log(this.vehicleMesh.physicsImpostor.physicsBody.angularVelocity);
        this.entityManager = new YUKA.EntityManager();
        this.time = new YUKA.Time();
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = 3;
        this.vehicle.mass = 0.1;
        //vehicle.maxSpeed = 2;
        //vehicle.setRenderComponent(vehicleMesh, sync);
        const path = new YUKA.Path();
        path.loop = true;
        path.add(new YUKA.Vector3(290, 0, 340));
        path.add(new YUKA.Vector3(100, 0, 350));
        path.add(new YUKA.Vector3(-80, 0, 260));
        path.add(new YUKA.Vector3(200, 0, 150));
        
        //path.add(new YUKA.Vector3(250, 0, 340));
    
        this.vehicle.position.copy(path.current());
    
        const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
        this.vehicle.steering.add(followPathBehavior);
        this.onPathBehavior = new YUKA.OnPathBehavior(path);
        this.vehicle.steering.add(this.onPathBehavior);
        this.entityManager.add(this.vehicle);
        
        path._waypoints.push(path._waypoints[0]);
        var lines = BABYLON.MeshBuilder.CreateLines('lines', {
            points: path._waypoints,
            updatable: true,
          })
        
        lines.color = BABYLON.Color3.Teal()
        //onPathBehavior.active = false;
        //onPathBehavior.radius = 10;
        this.entityManager.update(this.time.update().getDelta())
        console.log(this.vehicle.velocity);

       // var visualMesh = BABYLON.MeshBuilder.CreateBox("battleshipMesh",{width:10, height:20, depth:10},scene);
        visualMesh.position.copyFrom(initPosition);
        visualMesh.position.y +=3.37;
        this.vehicleMesh.addChild(visualMesh);
        this.vehicleMesh.rotate(new BABYLON.Vector3.Up(), Math.PI/2);
        this.altOffset = new BABYLON.Vector3(0,-2.3,0);
    }
    update(){
        const delta = this.time.update().getDelta();
        //console.log("entity", entityManager.entities[0].velocity);
        this.entityManager.update(delta);
        //var vy = vehicleMesh.physicsImpostor.physicsBody.velocity.y
        var vy = -(this.vehicleMesh.position.y+this.altOffset.y);
        var meshVelocity = new BABYLON.Vector3(this.vehicle.velocity.x,vy,this.vehicle.velocity.z);
        //var meshVelocity = new BABYLON.Vector3(-1,vy,0);//this.vehicle.velocity.x,vy,this.vehicle.velocity.z)
        this.vehicleMesh.physicsImpostor.setLinearVelocity(meshVelocity);
        this.vehicleMesh.physicsImpostor.physicsBody.angularVelocity = new CANNON.Vec3(0,0,0);
    }
}

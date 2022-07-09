import * as BABYLON from 'babylonjs';
import * as YUKA from 'yuka';
import { GridMaterial} from 'babylonjs-materials';
import { createVehicle } from '../utils/ActorsShapes.js'
const inverse = new YUKA.Matrix4();
const localPositionOfLimitBox= new YUKA.Vector3();
class LimitBoxBehavior extends YUKA.SteeringBehavior {

    constructor( limitBox ) {
      super();
      console.log("Limit Box");
      this.limitBox = limitBox;
              /**
          * This factor determines how much the vehicle decelerates if an intersection occurs.
          * @type {Number}
          * @default 0.2
          */
          this.brakingWeight = 0.2;
  
          /**
          * Minimum length of the detection box used for intersection tests.
          * @type {Number}
          * @default 4
          */
          this.dBoxMinLength = 4; //
    }
      /**
    * Calculates the steering force for a single simulation step.
    *
    * @param {YUKA.Vehicle} vehicle - The game entity the force is produced for.
    * @param {YUKA.Vector3} force - The force/result vector.
    * @param {Number} delta - The time delta.
    * @return {YUKA.Vector3} The force/result vector.
    */
    calculate( vehicle, force /*, delta */ ) {
        const limitBox = this.limitBox;
        vehicle.worldMatrix.getInverse( inverse );
        const dBoxLength = this.dBoxMinLength + ( vehicle.getSpeed() / vehicle.maxSpeed ) * this.dBoxMinLength;
        // calculate this obstacle's position in local space of the vehicle
        localPositionOfLimitBox.copy( limitBox.position ).applyMatrix4( inverse );
        //console.log(localPositionOfLimitBox.length());
        if ( localPositionOfLimitBox.z < 0 ){
          const expandedRadius = limitBox.boundingRadius;// + vehicle.boundingRadius;
            var vehicleSphereDitsance = expandedRadius -localPositionOfLimitBox.length();
            if ( vehicleSphereDitsance < 0) {
              //console.log(intersectionPoint);
              var multiplier = -vehicleSphereDitsance*20;
              force.x = localPositionOfLimitBox.x * multiplier;
              force.y = localPositionOfLimitBox.y * multiplier/10;
              // apply a braking force proportional to the obstacles distance from the vehicle
              force.z = -10*multiplier;//( limitBox.boundingRadius + localPositionOfLimitBox.z ) * this.brakingWeight;
        
              // finally, convert the steering vector from local to world space (just apply the rotation)
              //console.log(force );
              force.applyRotation( vehicle.rotation );
              
            }
          }
        //const vehicleOrientation = new YUKA.Vector3();
        const speed = 6*(1.5+(vehicle.rotation.toEuler(new YUKA.Vector3()).x/ (Math.PI/4)));
        //console.log(vehicle.rotation.toEuler(new YUKA.Vector3()).x,speed);
        vehicle.maxSpeed = speed;
        //if ( vehicle.rotation.toEuler(new YUKA.Vector3()).x > 0 ) vehicle.maxSpeed = 12; else vehicle.maxSpeed = 5;
        return force;
      }
  
    /**
      * Transforms this instance into a JSON object.
      *
      * @return {Object} The JSON object.
      */
      toJSON() {
  
          const json = super.toJSON();
  
          json.brakingWeight = this.brakingWeight;
          json.dBoxMinLength = this.dBoxMinLength;
  
  
          return json;
  
      }
  
      /**
      * Restores this instance from the given JSON object.
      *
      * @param {Object} json - The JSON object.
      * @return {ObstacleAvoidanceBehavior} A reference to this behavior.
      */
      fromJSON( json ) {
  
          super.fromJSON( json );
  
          this.brakingWeight = json.brakingWeight;
          this.dBoxMinLength = json.dBoxMinLength;
  
          return this;
  
      }
  
  }
  
/*const entityMatrix = new BABYLON.Matrix();
function sync(entity, renderComponent) {
    entity.worldMatrix.toArray(entityMatrix.m);
    entityMatrix.markAsUpdated();
    //console.log("sync");
    const matrix = renderComponent.getWorldMatrix();
    matrix.copyFrom(entityMatrix);
  }
*/
//var target = new YUKA.Vector3(0,0,0);
export default class Birds {
    /**    
     * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
     * @param {BABYLON.Scene} scene      
     *    
     */
    constructor(scene, meshes,options){
        options = options || {};
        this.entityMatrix = new BABYLON.Matrix();
        this.entityManager = new YUKA.EntityManager();
        this.time = new YUKA.Time();
        var initPosition = new BABYLON.Vector3(150, 35, 240);
        var limitBox = null;
        limitBox = setupLimitBox(scene, 100, new BABYLON.Vector3(initPosition.x, initPosition.y+50, initPosition.z), options.debug);
        this.entityManager.add(limitBox);
        //console.log("bird",mesh);
        //const vehicleMeshPrefab = //createVehicle(scene, { size: 5 });
        //vehicleMeshPrefab.setEnabled(false);
        const alignmentBehavior = new YUKA.AlignmentBehavior();
        const cohesionBehavior = new YUKA.CohesionBehavior();
        const separationBehavior = new YUKA.SeparationBehavior();
        
        alignmentBehavior.weight = 1.9;
        cohesionBehavior.weight = 2.5;
        separationBehavior.weight = 0.15;
        

        this.enemy = new YUKA.Vector3();

        //for (let i = 0; i < 1; i++) {
        meshes.forEach( mesh =>{
            const vehicleMesh =  mesh;//vehicleMeshPrefab.clone('bird_'+i.toString());
            //vehicleMesh.setEnabled(true);
            vehicleMesh.position.copyFrom(initPosition);

            const vehicle = new YUKA.Vehicle();
            vehicle.maxSpeed = 10;//13
            vehicle.updateNeighborhood = true;
            vehicle.neighborhoodRadius = 30;

            
            vehicle.setRenderComponent(vehicleMesh, sync);
        
            vehicle.boundingRadius = vehicleMesh.getBoundingInfo().boundingSphere.radius;
            vehicle.smoother = new YUKA.Smoother(20);
            vehicle.position = new YUKA.Vector3(initPosition.x, initPosition.y, initPosition.z);
            vehicle.position.x = vehicle.position.x - Math.random() * 5;
            vehicle.position.z = vehicle.position.z - Math.random() * 5;
            vehicle.active = false;
            
            vehicle.steering.add(alignmentBehavior);
            vehicle.steering.add(cohesionBehavior);
            vehicle.steering.add(separationBehavior);

            const wanderBehavior = new YUKA.WanderBehavior(1,5,5);
            wanderBehavior.weight = 1.2;
            vehicle.steering.add(wanderBehavior);

            const LimitBehavior = new LimitBoxBehavior(limitBox);
            vehicle.steering.add(LimitBehavior);

            const fleeBehavior = new YUKA.FleeBehavior(this.enemy , 5);
            fleeBehavior.weight = 5;
            vehicle.steering.add(fleeBehavior);
            this.entityManager.add(vehicle);
        });
        //vehicleMeshPrefab.setEnabled(false);
    }

    update(){
        const delta = this.time.update().getDelta();
        this.entityManager.update(delta);

        //this.vehicleMesh.position = new BABYLON.Vector3(this.vehicle.position.x,this.vehicle.position.y,this.vehicle.position.z);
        //this.vehicleMesh.rotationQuaternion = new BABYLON.Quaternion(this.vehicle.rotation.x, this.vehicle.rotation.y, this.vehicle.rotation.z,this.vehicle.rotation.w);
    }
    set pause(val){
        this.entityManager.entities.forEach(x=>x.active = val);
        //this.vehicle.active = val;
    }
    get pause(){
        return false;//this.vehicle.active;
    }
    set enemyPosition(pos){
        this.enemy.copy( new YUKA.Vector3(pos.x, pos.y, pos.z));
    }
}

function setupLimitBox(scene, size, pos, debug) {
    const mesh1 = BABYLON.MeshBuilder.CreateBox('limitBox', { size: size }, scene)
    
    const meshMat = new BABYLON.StandardMaterial('meshMat', scene)
    meshMat.disableLighting = true
    meshMat.emissiveColor = BABYLON.Color3.Red()
    meshMat.wireframe = true;
  
    mesh1.material = meshMat;
    mesh1.position.copyFrom(pos);
    mesh1.visibility = debug;
    var limitBox = new YUKA.GameEntity();
    limitBox.position.copy(mesh1.position);
    limitBox.boundingRadius = mesh1.getBoundingInfo().boundingSphere.radius * 1;
    return limitBox;
  }


YUKA.WanderBehavior.prototype.calculate = function(vehicle, force, delta ) {

    // this behavior is dependent on the update rate, so this line must be
    // included when using time independent frame rate
    const targetWorld = new YUKA.Vector3();
    const jitterThisTimeSlice = this.jitter * delta;
  
    // prepare random vector
    const randomDisplacement = new YUKA.Vector3();
    randomDisplacement.x = YUKA.MathUtils.randFloat( - 1, 1 ) * jitterThisTimeSlice;
    randomDisplacement.y = YUKA.MathUtils.randFloat( - 1, 1 ) * jitterThisTimeSlice/10;
    randomDisplacement.z = YUKA.MathUtils.randFloat( - 1, 1 ) * jitterThisTimeSlice;
    // add random vector to the target's position
  
    this._targetLocal.add( randomDisplacement );
  
    // re-project this new vector back onto a unit sphere
  
    this._targetLocal.normalize();
  
    // increase the length of the vector to the same as the radius of the wander sphere
  
    this._targetLocal.multiplyScalar( this.radius );
  
    // move the target into a position wanderDist in front of the agent
  
    targetWorld.copy( this._targetLocal );
    targetWorld.z += this.distance;
  
    // project the target into world space
  
    targetWorld.applyMatrix4( vehicle.worldMatrix );
  
    // and steer towards it
  
    force.subVectors( targetWorld, vehicle.position );
  
    return force;
  
  }
  function sync(entity, renderComponent) {
    renderComponent.position = new BABYLON.Vector3(entity.position.x,entity.position.y,entity.position.z);
    renderComponent.rotationQuaternion = new BABYLON.Quaternion(entity.rotation.x, entity.rotation.y, entity.rotation.z,entity.rotation.w);
  }
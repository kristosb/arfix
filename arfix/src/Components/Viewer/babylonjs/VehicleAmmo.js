import * as BABYLON from 'babylonjs';
import * as Ammo from 'ammojs';

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

export default class VehicleAmmo{
    constructor(scene, carData){
        if(!carData) console.error("vehicle data error");
        this.scene = scene;
        this.vehicle = null;
        this.carData = carData;
        this.acceleration = 0;
        this.direction = 0;
        this.breakingForce = 0;
        //this.raycastIfno = [];
        this.createVehicle( new BABYLON.Vector3(0,1,0),new BABYLON.Vector3(0,0,0).toQuaternion());
        //this.rearFrontSteeringReverse();
        //this.registerForces();
    }
    createVehicle( pos,quat){
        var physicsWorld = this.scene.getPhysicsEngine().getPhysicsPlugin().world;
        //console.log(this.chassisMesh.getBoundingInfo());
        var body = this.carData.chassisMesh.physicsImpostor.physicsBody;
        body.setActivationState(4); 
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        this.vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
        this.vehicle.setCoordinateSystem(0, 1, 2);

        physicsWorld.addAction(this.vehicle);
        
        var trans = this.vehicle.getChassisWorldTransform();
                
        var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
        var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);               
        var that = this;
        this.carData.wheels.forEach((wheel, index)=>{
            var wheelInfo = that.vehicle.addWheel(
                new Ammo.btVector3(wheel.pos.x, wheel.pos.y, wheel.pos.z),
                wheelDirectionCS0,
                wheelAxleCS,
                wheel.params.suspensionRestLength,
                wheel.radius,
                tuning,
                wheel.isfront);
            //var wi  = Ammo.wrapPointer(wheelInfo, Ammo.btwheelInfo);
            //console.log("wheel info:",wi);
            wheelInfo.set_m_suspensionStiffness(wheel.params.suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(wheel.params.suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(wheel.params.suspensionCompression);
            wheelInfo.set_m_maxSuspensionForce(600000);
            wheelInfo.set_m_frictionSlip(40);
            wheelInfo.set_m_rollInfluence(wheel.params.rollInfluence);
        });
        this.rearFrontSteeringReverse();
        // if updated in the main animation loop artifacts of wheels not catching up at high speed visible 
        //this.scene.onBeforeAnimationsObservable.add( () => {
        this.scene.registerBeforeRender(function () {
            that.update();
        });
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
        this.wheelsTransform();
        if(this.numOfWheelsOnGround()>0) this.registerForces(); 
    }
    rearFrontSteeringReverse(){
        this.reverseSteeringSign = -1;
        this.carData.steeringWheelsIndex.forEach( (sw,i)=>{
            if(!this.carData.wheels[sw].isFront) this.reverseSteeringSign = 1;
        });
        console.log(this.reverseSteeringSign);
    }
    numOfWheelsOnGround(){
        var nWheels = 0;
        this.carData.wheels.forEach( (sw,i)=>{
            //this.vehicle.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS();
            //if(!this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_isInContact()) nWheels = nWheels +1;
            if(this.vehicle.getWheelInfo(i).get_m_raycastInfo().get_m_groundObject()) nWheels = nWheels +1;
        });
        return nWheels;
    }
    accelerate(force){
        if(!this.accelerationIdle) this.carData.powerWheelsIndex.forEach(x=> this.vehicle.applyEngineForce(force, x));// console.log("active",force);}
    }
    directionChange(force){
        if(this.directionIdle) this.carData.steeringWheelsIndex.forEach(x => this.vehicle.setSteeringValue(this.reverseSteeringSign*force, x));
    }
    brakeApply(force){
        if(this.breakIdle) this.carData.brakeWheelsIndex.forEach(x => this.vehicle.setBrake(force, x));
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
        this.brakeApply(this.breakingForce);
        this.resetControls();
    }

}
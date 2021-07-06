//import * as BABYLON from "@babylonjs/core";
import * as BABYLON from 'babylonjs';

// Use physics viewer to display impostors
const showImpostors = function(scene) {

        const physicsViewer = new BABYLON.PhysicsViewer(scene);
        scene.meshes.forEach(mesh => {
            if (mesh.physicsImpostor == null) {
                // no physics impostor, skip
                return;
            }
            physicsViewer.showImpostor(mesh.physicsImpostor, mesh);
        });
    };

var vmult = function(v,q){
    var target =  new BABYLON.Vector3();
 
    var x = v.x,
        y = v.y,
        z = v.z;
 
    var qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w;
 
    // q*v
    var ix =  qw * x + qy * z - qz * y,
    iy =  qw * y + qz * x - qx * z,
    iz =  qw * z + qx * y - qy * x,
    iw = -qx * x - qy * y - qz * z;
 
    target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
 
    return target;
};
var vectorToWorldFrame = function(localVector, quaternion){
    var result = new BABYLON.Vector3();
    result = vmult(localVector, quaternion);
    return result;
};
var pointToWorldFrame = function(localPoint,quaternion, position){
    var result = new BABYLON.Vector3();
    //var rot = new BABYLON.Vector3();
    result = vmult(localPoint,quaternion);
    result.add(position);
    return result;
};

var applyLocalForce = function(localForce, localPoint, mesh){
    var worldForce = new BABYLON.Vector3();
    var worldPoint = new BABYLON.Vector3();
 
    // Transform the force vector to world space
    worldForce = vectorToWorldFrame(localForce, mesh.rotationQuaternion);
    worldPoint = pointToWorldFrame(localPoint, mesh.rotationQuaternion, mesh.getAbsolutePosition());
    //console.log(mesh.position);
    //console.log(mesh.getAbsolutePosition());
    //console.log(worldForce,worldPoint);
    mesh.physicsImpostor.applyForce(worldForce, worldPoint);
};

class Airplane {
    constructor(scene){
        this.meshAll = null;
        this.scene = scene;
        this.animationGroup = null;
        this._lift = 50;
        this._roll = 0;
        this._rollLimit = 2;
        this._yaw = 0;
        this._yawLimit = 2;
        this._pitch = 0;
        this._pitchLimit = 2;
        this._velocity = 0;     // 3 axis
        this._currentSpeed = 0; // 1 axis
        this._enginePower = 0;
        this._enginePowerLimit = 1;
        this.speedModifier = 0.03;
        /*this.loadMeshes().then(res=>{
            this.meshAll=res.meshes;
            this.hideElements();
            this.addAnimations();
            this.meshRootPosition(0,2,0);
            this.addPhysics();
            this.meshAll.map(m=>{console.log(m.name)});
        });*/
        this.loadBox();
        //this.loadSphere();
    }
    loadBox(){
        var box =  BABYLON.MeshBuilder.CreateBox("Box", {width:2,height:1,depth:3}, this.scene);
        box.position = new BABYLON.Vector3(0, 2, -90);
        /*var myMaterial = new BABYLON.StandardMaterial("myMaterial", this.scene);

        myMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
        myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        box.material = myMaterial;*/

        this.createPhysicsImpostor(this.scene, box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 50, friction: 0.0,  }, true);
        this.meshAll = [box];
    }
    loadSphere(){
        var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 1, this.scene);
        sphere.position = new BABYLON.Vector3(0, 2, -90);
        this.createPhysicsImpostor(this.scene, sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 50, friction: 0.0, restitution: 0 }, true);
        this.meshAll = [sphere];
    }
    async loadMeshes(){
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", process.env.PUBLIC_URL+"/", "airplane.glb", this.scene, function (newMeshes) {
        });
        return result;
    }
    hideElements(){
        this.meshAll.map(mesh => {
            if (mesh.name.includes("Cube")) {
                mesh.isVisible = false;
            }
            if (mesh.name.includes("Sphere")) {
              mesh.isVisible = false;
            }
        });
    }
    rotorSpin(rotor){
        rotor.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
        const animWheel = new BABYLON.Animation("wheelAnimation", "rotation.x", 15, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        this.animationGroup = new BABYLON.AnimationGroup("airplane");
        const wheelKeys = []; 
        var enginePower = 1;
        //At the animation key 0, the value of rotation.y is 0
        wheelKeys.push({
            frame: 0,
            value: 0
        });
        //At the animation key 30, (after 1 sec since animation fps = 30) the value of rotation.y is 2PI for a complete rotation
        wheelKeys.push({
            frame: 15,
            value: enginePower*(-2 * Math.PI)
        });
        //set the keys
        animWheel.setKeys(wheelKeys);    
        //Link this animation to a wheel
        rotor.animations = [];
        rotor.animations.push(animWheel);
        this.animationGroup.addTargetedAnimation(animWheel,rotor );
      }
    addAnimations(){
        this.rotorSpin(this.meshAll[5]);
    }
    applyPhysicsCollider(newMeshes){
        newMeshes.map(mesh => {
            if (mesh.name.includes("Cube")) {
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.3, restitution: 0 }, true);
            }
            if (mesh.name.includes("Sphere")) {
                this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.3, restitution: 0  }, true);
            }
            if (mesh.name.includes("wheel")) {
              this.createPhysicsImpostor(this.scene, mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, friction: 0.0, restitution: 0.5  }, true);
            }
        });
        this.createPhysicsImpostor(this.scene, newMeshes[0], BABYLON.PhysicsImpostor.NoImpostor, { mass: 50, friction: 0.0, restitution: 0  }, true);
  
      }
    createPhysicsImpostor(scene, entity, impostor, options, reparent) {
        if (entity == null) return;
        entity.checkCollisions = false;
        const parent = entity.parent;
        if (reparent === true) entity.parent = null;
        entity.physicsImpostor = new BABYLON.PhysicsImpostor(entity, impostor, options, scene);
        if (reparent === true) entity.parent = parent;
    };
    addPhysics(){
        this.applyPhysicsCollider(this.meshAll);
    }
    meshRootPosition(x,y,z){
        this.meshAll[0].position.y=y;
    }
    moveForward(speed){
        this.meshAll[0].moveWithCollisions(this.meshAll[0].forward.scaleInPlace(speed));
        this.animationGroup.play(true);
        this.animationGroup.speedRatio = 1;
    }
    moveBackward(speed){
        this.meshAll[0].moveWithCollisions(this.meshAll[0].forward.scaleInPlace(-speed));
        //this.animationGroup.play(true);
        //this.animationGroup.speedRatio = 1;
    }
    rudderControl(rot){
        //console.log(this.meshAll[6]);
        
        this.meshAll[6].rotate(BABYLON.Vector3.Left(),rot);
        //console.log(this.meshAll[6].rotation);
    }
    set lift(val){
        this._lift = val;
    }
    get lift(){
        return this._lift;
    }
    set roll(val){
        if (val > this._rollLimit) val = this._rollLimit;
        if (val < -this._rollLimit ) val = -this._rollLimit;
        this._roll = val;
    }
    get roll(){
        return this._roll;
    }
    set yaw(val){
        if (val > this._yawLimit) val = this._yawLimit;
        if (val < -this._yawLimit ) val = -this._yawLimit;
        this._yaw = val;
    }
    get yaw(){
        return this._yaw;
    }
    set pitch(val){
        if (val > this._pitchLimit) val = this._pitchLimit;
        if (val < -this._pitchLimit ) val = -this._pitchLimit;
        this._pitch = val;
    }
    get pitch(){
        return this._pitch;
    }
    set enginePower(val){
        if (val > this._enginePowerLimit) val = this._enginePowerLimit;
        if (val < 0 ) val = 0;
        this._enginePower = val;
    }
    get enginePower(){
        return this._enginePower;
    }
    get velocity(){
        var velocity = vmult(
            this.meshAll[0].physicsImpostor.getLinearVelocity(),
            BABYLON.Quaternion.Inverse(this.meshAll[0].rotationQuaternion));
        return velocity;
    }
    get currentSpeed(){
		//const velocity = body.quaternion.inverse().vmult(body.velocity);
		//const currentSpeed = velocity.z;
        return 0;
    }
    applyLiftForce(){
        if(this.meshAll!==null){
            let lift = this.velocity.z * Math.abs(this.velocity.z) * 1.5;
            this.meshAll[0].physicsImpostor.applyForce(new BABYLON.Vector3(0,1,0).scale(lift), this.meshAll[0].getAbsolutePosition().add(BABYLON.Vector3.Zero()));        
            //applyLocalForce(new BABYLON.Vector3(0, 9.81*this._lift, 0), new BABYLON.Vector3(0, 0, 0), this.meshAll[0]);
            //this.meshAll[0].physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,0.2,0));
            //console.log(lift);
        }
    }
    applyDragForce(){
        if(this.meshAll!==null){
            var velocity = this.velocity;
            //this.meshAll[0].physicsImpostor.applyForce(new BABYLON.Vector3(0,1,0).scale(9.81*this._lift), this.meshAll[0].getAbsolutePosition().add(BABYLON.Vector3.Zero()));        
            this.meshAll[0].physicsImpostor.applyForce(
                vectorToWorldFrame(new BABYLON.Vector3( 
                    velocity.x * Math.abs(velocity.x) * -20,
					velocity.y * Math.abs(velocity.y) * -100,
					velocity.z * Math.abs(velocity.z) * -1
                ),this.meshAll[0].rotationQuaternion),
                this.meshAll[0].getAbsolutePosition().add(new BABYLON.Vector3(0, 0, 0))
                ); 
        }
    }
    applyRollForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3(0, 5 * -this._roll, 0), new BABYLON.Vector3(1, 0, 0), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3(0, 5 * this._roll, 0), new BABYLON.Vector3(-1, 0, 0), this.meshAll[0]);
        }
    }
    applyYawForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( 5 * this._yaw, 0 , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3( 5 * -this._yaw, 0 , 0), new BABYLON.Vector3(0, 0, 1), this.meshAll[0]);
        }
    }
    applyPitchForce(){
        if(this.meshAll!==null){
            applyLocalForce(new BABYLON.Vector3( 0, 5 * this._pitch , 0), new BABYLON.Vector3(0, 0, -1), this.meshAll[0]);
            applyLocalForce(new BABYLON.Vector3( 0, 5 * -this._pitch , 0), new BABYLON.Vector3(0, 0, 1), this.meshAll[0]);
            /*this.meshAll[0].physicsImpostor.applyForce(
                vectorToWorldFrame(new BABYLON.Vector3(  0, 0, 5 * this._pitch),this.meshAll[0].rotationQuaternion),
                this.meshAll[0].getAbsolutePosition().add(new BABYLON.Vector3(0, 1, 0))
                ); */
            /*this.meshAll[0].physicsImpostor.applyForce(
                    vectorToWorldFrame(new BABYLON.Vector3(  0, 5 * -this._pitch , 0),this.meshAll[0].rotationQuaternion),
                    this.meshAll[0].getAbsolutePosition().add(new BABYLON.Vector3(0, 0, 1))
                    ); */
        
        }
    }
    applyThrustForce(){
        if(this.meshAll!==null){
            //applyLocalForce(new BABYLON.Vector3(  0, 0, 5* this._enginePower), new BABYLON.Vector3(0, 0, 0), this.meshAll[0]);
            //applyLocalForce(new BABYLON.Vector3( 0, 0, 5* -this._enginePower), new BABYLON.Vector3(0, 0, 2), this.meshAll[0]);
            //body.applyLocalForce(new CANNON.Vec3(0, 0, 3000 * speedModifier * this.enginePower), new CANNON.Vec3(0, 0, 2));
            //var localForce = vectorToWorldFrame(new BABYLON.Vector3( 0, 0, 5* this._enginePower),this.meshAll[0].rotationQuaternion);
            this.meshAll[0].physicsImpostor.applyForce(
                vectorToWorldFrame(new BABYLON.Vector3( 0, 0, 3000 * this.speedModifier *this._enginePower),this.meshAll[0].rotationQuaternion),
                this.meshAll[0].getAbsolutePosition().add(new BABYLON.Vector3(0, 0, 0))
                ); 
        }
    }
}


export default function scene(scene) {        
    function makeGround(){
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        //const ground = BABYLON.Mesh.CreateGround('ground1', 10, 10, 2, scene, false);
        const ground = BABYLON.MeshBuilder.CreateBox("box", {height: 2, width: 100, depth: 200},scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.5}, scene);

        var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMat.backFaceCulling = false;
        ground.material = groundMat;
        ground.receiveShadows = true;

        return ground;
    }

    // Keyboard events
    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    makeGround();
    var tinyPlane = new Airplane(scene);

    scene.onBeforeRenderObservable.add(() => {
        if (inputMap["z"]) {
            tinyPlane.lift += 0.1;
        }
        if (inputMap["x"]) {
            tinyPlane.lift -= 0.1;
        }
        if (inputMap["q"]) {
            tinyPlane.roll = -1;
            tinyPlane.applyRollForce();
            //console.log(tinyPlane.roll);
            //tinyPlane.rudderControl(Math.PI/40);
        }
        if (inputMap["e"]) {
            tinyPlane.roll = 1;
            //console.log(tinyPlane.roll);
            tinyPlane.applyRollForce();
            //tinyPlane.rudderControl(-Math.PI/40);
        }
        if (inputMap["a"]) {
            tinyPlane.yaw = 1;
            tinyPlane.applyYawForce();
        }
        if (inputMap["d"]) {
            tinyPlane.yaw = -1;
            tinyPlane.applyYawForce();
        }
        if (inputMap["w"]) {
            tinyPlane.pitch = 1;
            tinyPlane.applyPitchForce();
        }
        if (inputMap["s"]) {
            tinyPlane.pitch = -1;
            tinyPlane.applyPitchForce();
        }
        if (inputMap["m"]) {
            tinyPlane.enginePower = tinyPlane.enginePower + 0.05;
            tinyPlane.speedModifier = 0.12;
                    
            console.log(tinyPlane.enginePower);
        }else{
            tinyPlane.enginePower = tinyPlane.enginePower - 0.01;
            tinyPlane.speedModifier = 0;
        }
        if (inputMap["p"]) {
            //scene.debugLayer.show();
            showImpostors(scene);
        }
        if (inputMap["l"]) {
            //scene.debugLayer.show();
            var a = tinyPlane.velocity;
        }
      }
    );

    scene.registerBeforeRender(function () {
		//box.physicsImpostor.applyForce(BABYLON.Vector3.Up().scale(forceMagnitude), box.getAbsolutePosition().add(contactLocalRefPoint));
        tinyPlane.applyLiftForce();
        tinyPlane.applyDragForce();
        tinyPlane.applyThrustForce();
	});

    const speed = 0.5;
    const textureOffsetSpeed = 0.02;

    function update(time) {
        const angle = time*speed;

    }
    function getAirplane(){
        return tinyPlane.meshAll[0];
    }
    return {
        update,
        getAirplane
    }
}
import * as BABYLON from 'babylonjs';
import * as CANNON from 'cannon';

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

export class CannonUtils {

    static cannon2babylonVec3(cannonVector){
        var babylonVector = new BABYLON.Vector3();
        babylonVector.copyFromFloats(cannonVector.x, cannonVector.y, cannonVector.z);
        return babylonVector;
    }
    static cannon2babylonQuat(cannonQuat){
        const babylonQuat = new BABYLON.Quaternion(cannonQuat.x, cannonQuat.y, cannonQuat.z, cannonQuat.w );
        //babylonQuat.copyFromFloats( cannonQuat.x, cannonQuat.y, cannonQuat.z, cannonQuat.w );
        return babylonQuat;
    }
    static babylon2cannonVec3(babylonVector){
        var cannonVector = new CANNON.Vec3(babylonVector.x, babylonVector.y, babylonVector.z);
        return cannonVector; 
    }
    static babylon2cannonQuat(babylonQuat){
        var cannonQuat = new CANNON.Quaternion(babylonQuat.x, babylonQuat.y, babylonQuat.z, babylonQuat.w);
        return cannonQuat;
    }

}
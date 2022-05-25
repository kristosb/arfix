import * as BABYLON from 'babylonjs';
import {Clock} from '../utils/Clock';
//const DIR = {UP:1, DOWN:2,LEFT:3, RIGHT:4,  TILT_LEFT:5, TILT_RIGHT:6, BRAKE:7, LEFT_RESET:8, RIGHT_RESET:9, POWER_UP:10, POWER_DOWN:11, LEFT_HOLD:12, RIGHT_HOLD:13, UNBRAKE:14};
export default  class vehicleParts{
    constructor(){
        this.bluePrint = null;
        this.suspension = null;
        this.avionics = null;
        this.hud = null;
        this.clock = new Clock();
    }
    static DIR = {UP:1, DOWN:2,LEFT:3, RIGHT:4,  TILT_LEFT:5, TILT_RIGHT:6, BRAKE:7, LEFT_RESET:8, RIGHT_RESET:9, POWER_UP:10, POWER_DOWN:11, LEFT_HOLD:12, RIGHT_HOLD:13, UNBRAKE:14};

    set position(pos){
        this.bluePrint.chassisMesh.setAbsolutePosition(pos);
    }
    get position(){
        return this.bluePrint.chassisMesh.position;
    }
    get ready(){
        return this.suspension!==null
    }
    
    steer(dir){
        switch(dir){
            case vehicleParts.DIR.UP:
                //console.log("up");
                this.avionics.pitch = -1;
                break;
            case vehicleParts.DIR.DOWN:
                //console.log("up");
                this.avionics.pitch = 1;
                break;
            case vehicleParts.DIR.LEFT:
                //console.log("left");
                this.avionics.yaw = -1;
                this.suspension.left(0.5);
                break;
            case vehicleParts.DIR.RIGHT:
                //console.log("right");
                this.avionics.yaw = 1;
                this.suspension.right(0.5);
                break;
            case vehicleParts.DIR.LEFT_RESET:
                //console.log("left reset");
                this.suspension.left(0);
                break;
            case vehicleParts.DIR.RIGHT_RESET:
                //console.log("right reset");
                this.suspension.right(0);
                break;
            case vehicleParts.DIR.LEFT_HOLD:
                //console.log("left hold");
                this.avionics.yaw = -1;
                break;
            case vehicleParts.DIR.RIGHT_HOLD:
                //console.log("right hold");
                this.avionics.yaw = 1;
                break;
            case vehicleParts.DIR.TILT_LEFT:
                //console.log("tilt left");
                this.avionics.roll = -1;
                break;
            case vehicleParts.DIR.TILT_RIGHT:
                //console.log("tilt right");
                this.avionics.roll = 1;
                break;
            default:
                console.log("vehicle invalid direction");
        }
    }
    power(val){
        switch(val){
            case vehicleParts.DIR.POWER_UP:
                //console.log("power up");
                this.avionics.enginePower = this.avionics.enginePower + 0.005;
                this.avionics.speedModifier = 0.12;
                break;
            case vehicleParts.DIR.POWER_DOWN:
                //console.log("power down");
                this.avionics.enginePower = this.avionics.enginePower - 0.005;
                break;
            default:
                console.log("vehicle invalid power");
        }
    }
    brake(val){
        switch(val){
            case vehicleParts.DIR.BRAKE:
                this.suspension.brake(5);
                break;
            case vehicleParts.DIR.UNBRAKE:
                this.suspension.unbrake();
                break;
            default:
                console.log("vehicle invalid power");
        }
    }

    update(){
        if(this.avionics!=null && this.hud!=null){ //console.error("airplane modlel mesh error");
            const elapsedTime = this.clock.getElapsedTime();
            //console.log(elapsedTime);
            this.hud.setRotation(new BABYLON.Vector3( 180 +BABYLON.Tools.ToDegrees(this.avionics.rotation.y),
                                                -BABYLON.Tools.ToDegrees(this.avionics.rotation.x),
                                                BABYLON.Tools.ToDegrees(this.avionics.rotation.z)));
            this.hud.setSpeed(this.avionics.velocity.z);
            this.hud.setPower(this.avionics.enginePower);
            this.hud.setAltitude(this.avionics.collision.position.y);
            this.hud.update(elapsedTime);
        }//else {console.log("nohud")}

    }
}
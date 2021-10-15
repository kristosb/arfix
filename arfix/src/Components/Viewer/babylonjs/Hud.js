//import * as THREE from 'three';
import * as BABYLON from 'babylonjs';
import { compass } from './GuiHudControls';
import * as HUD2D from './HudControls';
//import IMU from './Imu.js';
function isMobileCheck() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
/*class orientationData {
    //sinulate on desktop or real IMU on mobile
    constructor(forceMobile =false){
        this.isMobile = isMobileCheck() || forceMobile;
        this.flightData = null
        if(this.isMobile) this.flightData = new IMU.imu();
        else this.flightData = new HUD2D.airplaneTelemetry();
    }
    get yaw(){
        return this.flightData.yaw;
    }
    get pitch(){
        return this.flightData.pitch;
    }
    get roll(){
        return this.flightData.roll;
    }
    next(){
        if(!this.isMobile) this.flightData.next();
    }
}*/
export default function hudPanel(scene,canvas,planeSize = 0.5){

    //var size = 600;
    //if (window.innerHeight < size) 
    //size = window.innerHeight;
    const screenDimensions = {
        width: canvas.width,
        height: canvas.height
    }
    //console.log(screenDimensions);
    var elapsed, now;
    var then = 0;
    var interval=0.05;
    var angles = new BABYLON.Vector3(0,0,0);
    var speed = 0;
    var altitude = 0;
    var power = 0;
    //console.log('win inner height'+window.innerHeight);
    var style = `rgba(
        ${0xa3},
        ${0xff},
        ${0x00},
        ${0xFF}`;
    window.drawCanvas = document.createElement("canvas");
    window.drawCanvas.width = 768;
    window.drawCanvas.height = 768;
    var ctx = window.drawCanvas.getContext("2d");
    ctx.fillStyle = style;
    ctx.strokeStyle = style;
    //ctx.globalAlpha = 0.75;
    //ctx.imageSmoothingEnabled = true; //maybe use when zooming
    ctx.lineWidth = 5;
    var hudElements = {
        //info: new HUD2D.hudSimpleText(ctx, window.drawCanvas.width/2 -30, window.drawCanvas.height - 150,128),
        //border: new HUD2D.hudBorder(ctx,window.drawCanvas.width,window.drawCanvas.height),
        //crosshair: new HUD2D.crosshair(ctx,window.drawCanvas.width,window.drawCanvas.height),
        //horizon: new HUD2D.horizon(ctx,window.drawCanvas.width,window.drawCanvas.height),
        compass: new HUD2D.compass(ctx,window.drawCanvas.width,window.drawCanvas.height,200,2),
        pitchLader: new HUD2D.pitchLader(ctx,window.drawCanvas.width,window.drawCanvas.height),
        speed: new HUD2D.hudSimpleText(ctx, 0, window.drawCanvas.height-20,90),
        power: new HUD2D.hudSimpleText(ctx, 0, window.drawCanvas.height-90,75),
        altitude: new HUD2D.hudSimpleText(ctx, window.drawCanvas.width-230, window.drawCanvas.height-20,90)
        //msgs: new HUD2D.hudWrappedText(hudBitmap,10,60,12)
    };
    //hudElements.compass.tickSpace = 100;
    hudElements.compass.tickHeight = 60;
    hudElements.compass.lineWidth = 14;
    hudElements.compass.fontSize = 90;
    hudElements.compass.angle = 30;

    hudElements.pitchLader.tickHeight = 300;
    hudElements.pitchLader.tickSpace = 120;
    hudElements.pitchLader.lineWidth = 14;
    hudElements.pitchLader.fontSize = 90;
    hudElements.pitchLader.range = 2;

   

    Object.values(hudElements).forEach(val => {
        //val.fontSize = 128;
        //val.draw(); 
    });
    var texture = new BABYLON.HtmlElementTexture("", window.drawCanvas, {
        scene
    });
    var material = new BABYLON.StandardMaterial("groundMat", scene);
    material.emissiveTexture = texture;
    material.disableLighting = true;
    material.diffuseTexture = texture;
    material.diffuseTexture.hasAlpha = true;
    material.backFaceCulling = false;
    //material.disableLighting = true;
    var hudMesh = BABYLON.MeshBuilder.CreatePlane("hudPlane", {size:1.6});
    hudMesh.material = material;
    //hudMesh.scaling.x = 0.1;
    //hudMesh.scaling.y = 0.1;
    //hudMesh.position = new BABYLON.Vector3(0,0,-0.5);
    
    
    //var hudCanvas = document.createElement('canvas');
    //hudCanvas.width = screenDimensions.width/2; //keep it square assuming default 300x150
    //hudCanvas.height = screenDimensions.height;
    /*var hudBitmap = window.drawCanvas.getContext("2d");//hudCanvas.getContext('2d');
    hudBitmap.lineWidth = 2;
    //flipHoriz(hudBitmap);   
    hudBitmap.fillStyle = style;
    hudBitmap.strokeStyle = style;
    hudBitmap.globalAlpha = 0.75;
    var hudElements = {
        info: new HUD2D.hudSimpleText(hudBitmap, window.drawCanvas.width/2 -30, window.drawCanvas.height - 5,16),
        border: new HUD2D.hudBorder(hudBitmap,window.drawCanvas.width,window.drawCanvas.height),
        crosshair: new HUD2D.crosshair(hudBitmap,window.drawCanvas.width,window.drawCanvas.height),
        horizon: new HUD2D.horizon(hudBitmap,window.drawCanvas.width,window.drawCanvas.height),
        compass: new HUD2D.compass(hudBitmap,window.drawCanvas.width,window.drawCanvas.height),
        pitchLader: new HUD2D.pitchLader(hudBitmap,window.drawCanvas.width,window.drawCanvas.height),
        //msgs: new HUD2D.hudWrappedText(hudBitmap,10,60,12)
    };*/
    //hudElements.msgs.txt = 'Smash 11, you have traffic 12 o\'clock, less than five miles. 727 descending to one four thousand.\n Copy. Smash is radar contact tally-ho.';
    //hudElements.border.lineWidth = 5;
    /*hudElements.crosshair.lineWidth = 2;
    hudElements.compass.lineWidth = 2;
    hudElements.pitchLader.lineWidth = 2;*/
    //Object.values(hudElements).forEach(val => {val.draw()});
 

    

    //hudMesh.translate(new BABYLON.Vector3.Up(),1);
    //var hudTexture = new THREE.Texture(hudCanvas);
    //hudTexture.name = "hudCanvas";
    //hudTexture.needsUpdate = true;
    //var material = new THREE.MeshBasicMaterial({map: hudTexture} );//{color: 0xffff00, side: THREE.DoubleSide} );
    //material.transparent = true;
    //var planeGeometry = new THREE.PlaneGeometry( planeSize, planeSize );
    //var plane = new THREE.Mesh( planeGeometry, material );
    //plane.name = "hudPlane";
    //plane.position.set(0,0,-0.15);
    //scene.add( plane );


    //var movePoint = new HUD2D.bouncer(screenDimensions.width,screenDimensions.height);
    //var flightData = new orientationData(false);
    texture.update();
    function draw() {
        ctx.clearRect(0,0,window.drawCanvas.width,window.drawCanvas.height );
        
        // display time
        //hudElements.info.text = "hello";//HUD2D.getTimeString();

        // simulate crosshair movement and display
        //movePoint.nextPoint();
        //hudElements.crosshair.x = movePoint.x;
        //hudElements.crosshair.y = movePoint.y;

        // simulate incomming data
        //flightData.next();

        // simulate compass rotation
        //hudElements.compass.angle = flightData.yaw;
        //hudElements.pitchLader.rot = flightData.roll;
        //hudElements.pitchLader.angle = flightData.pitch;
        hudElements.speed.text = speed;
        hudElements.altitude.text = altitude;
        hudElements.power.text = power;
        hudElements.compass.angle = angles.x;
        hudElements.pitchLader.angle = angles.y;
        hudElements.pitchLader.rot = angles.z;
        //console.log(hudElements.compass.angle );
        // redraw
        Object.values(hudElements).forEach(val => {val.draw()});
        texture.update();
        //texture.needsUpdate = true;
        //if (imuData.updated) console.log(`compass = ${imuData.compass}, yaw = ${imuData.yaw},pitch = ${imuData.pitch},roll = ${imuData.roll}`);
      }
    /**    
     * attach the hud to a vehicle     
     * @param {BABYLON.Mesh} mesh
     */
    function linkWithMesh(mesh){
        mesh.addChild(hudMesh);
        hudMesh.position = new BABYLON.Vector3(0,0.8,0);//(0,1.2,0);
    }
    /**    
     * attach the hud to a vehicle     
     * @param {BABYLON.Camera} cam
     */
    function linkWithCamera(cam){
        //hudMesh.translate(BABYLON.Vector3.Up(),20, BABYLON.Space.WORLD);// = new BABYLON.Vector3(0,0.1,2);
        hudMesh.parent = cam;
        //hudMesh.position = new BABYLON.Vector3(0,0.1,2);
    }
    /**    
     * attach the hud to a vehicle     
     * @param {BABYLON.Camera} cam
     */
    function lockToCamera(cam){
        cam.lockedTarget = hudMesh;
    }
    function flipHoriz(drawing){
        //drawing.translate(screenDimensions.width/2,0);
        //drawing.scale(-1, 1);
    }
    function setRotation(eulerAngles){
        angles.copyFrom(eulerAngles);
    }
    function setSpeed(s){
        speed = (s*10).toFixed(1);
    }
    function setAltitude(a){
        altitude = a.toFixed(1);
    }
    function setPower(p){
        if(p>0.99) p=0.99;
        power = (p*100).toFixed(0);
    }
	function update(time) {
        //then = now;
        now = time;
        elapsed = now - then;
        if (elapsed > interval){
            draw();
            //console.log(time);
            then = now;
        }
    }
    return {
        update,
        draw,
        linkWithMesh,
        linkWithCamera,
        lockToCamera,
        setRotation,
        setSpeed,
        setAltitude,
        setPower
    }
}
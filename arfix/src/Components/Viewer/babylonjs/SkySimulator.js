import * as BABYLON from "babylonjs";
import { SkyMaterial } from "babylonjs-materials";
 /**    
 * Projects a point to a plane along a ray starting from the camera origin and directed towards the point. 
 * @param {BABYLON.Scene} scene      
 * @param {BABYLON.Light} sunLight
 * @param {BABYLON.Light} ambientLight  
 * @param {BABYLON.Camera} followCam 
 * @param num moonCam      
 */
export default function skySim(scene, sunLight, ambientLight, followCam, size = 10000){
    var elapsed, now;
    var then = 0;
    var interval= 0.05;

    ambientLight.intensity =2;
    ambientLight.diffuse = new BABYLON.Color3(0.96, 0.97, 0.93);
	ambientLight.groundColor = new BABYLON.Color3(0, 0, 0);
    //sunLight.intensity = 2;
    
	// Sky material
	var skyboxMaterial = new SkyMaterial("skyMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.distance = size/2;
    skyboxMaterial.turbidity = 44;
    skyboxMaterial.inclination = 0;
    skyboxMaterial.alpha = 0.5;
    skyboxMaterial.alphaMode = 1; 
    skyboxMaterial.luminance = 1.1;
    const offset = 0;
	// Sky mesh (box)
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {width:size, depth:size, height:size}, scene);
    skybox.material = skyboxMaterial;
    skybox.position.y = size/3;
	sunLight.position =  skyboxMaterial.sunPosition;

    var cloudMaterial = new BABYLON.StandardMaterial("mat", scene);
    var cloudTexture = new BABYLON.Texture("https://raw.githubusercontent.com/kristosb/arfix/b958a70382ccbf86294af1540cd1608e1af1e161/arfix/public/assets/textures/Skies0362_3_masked_S.png", scene);
    cloudMaterial.diffuseTexture = cloudTexture;
    cloudMaterial.backFaceCulling = false;
    cloudMaterial.twoSidedLighting = true;
    cloudMaterial.diffuseTexture.hasAlpha = true;

    var faceUV = new Array(6);

    faceUV[0] = new BABYLON.Vector4(1, 0, 0, 1);
    faceUV[1] = new BABYLON.Vector4(1, 0, 0, 1);
    faceUV[2] = new BABYLON.Vector4(1, 0, 0, 1);
    faceUV[3] = new BABYLON.Vector4(1, 0, 0, 1);
    faceUV[4] = new BABYLON.Vector4(0, 0, 0, 0);
    faceUV[5] = new BABYLON.Vector4(0, 0, 0, 0);
    const cloudBoxSizeMult = size/1024+1;
    var cloudOptions = {
        width: 1024*cloudBoxSizeMult,
        height: 292*cloudBoxSizeMult,
        depth: 1024*cloudBoxSizeMult,
        wrap:true,
        faceUV: faceUV
    };
    var cloudBox = BABYLON.MeshBuilder.CreateBox('box', cloudOptions, scene);
    cloudBox.material = cloudMaterial;
    cloudBox.position.y = 70;

    function calcRaylight(){
        var rayligh = convertRange(followCam.position.y,[60,500],[2,0])+convertRange(Math.abs(skyboxMaterial.inclination),[0,0.5],[0,2]);
        if (rayligh>2) rayligh = 2;
        if (rayligh<0) rayligh = 0;
        skyboxMaterial.rayleigh = rayligh;
    }
    function setLightDirection(){
        var dirNorm = new BABYLON.Vector3(0,0,0);
        console.log("inc",skyboxMaterial.inclination);
        skyboxMaterial.useSunPosition = false;
        dirNorm.copyFrom(skyboxMaterial.sunPosition);
        //dirNorm.subtractInPlace(new BABYLON.Vector3(0,400,0));
        console.log("dir",dirNorm);
        dirNorm.normalize();
        console.log("dirsub",dirNorm);
        ambientLight.direction.copyFrom(dirNorm);
        if(dirNorm.y<0) ambientLight.intensity = 1; else ambientLight.intensity = 2;
        //console.log(ambientlight.direction);
    }
    // evening  luminance =0.1 and decrease turbo = 5
	function move(){
        skyboxMaterial.cameraOffset.y =  offset + followCam.position.y/10;
        skyboxMaterial.turbidity  = convertRange(Math.abs(skyboxMaterial.inclination),[0,0.5],[44,2]);
        calcRaylight();
        
    };
    function convertRange( value, r1, r2 ) { 
        return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
    }  
    function transitionSunInclination( interval = 0.025){
        skyboxMaterial.inclination += interval;
        if (skyboxMaterial.inclination > 0.5) skyboxMaterial.inclination = 0.5;
        if (skyboxMaterial.inclination < -0.5) skyboxMaterial.inclination = -0.5;
        console.log(skyboxMaterial.inclination);
        move();
        setLightDirection();
    }
    function makeClouds(){
        var spriteManagerClouds = new BABYLON.SpriteManager("cloudsManager", "http://www.babylonjs.com/Scenes/Clouds/cloud.png", 1000, 256, scene);
        //spriteManagerClouds.blendMode
        for (var i = 0; i < 200; i++) {
              var clouds = new BABYLON.Sprite("clouds", spriteManagerClouds);
              //clouds.color = new BABYLON.Color3(0.87, 0.93, 0.91);
              clouds.position.x = Math.random() * 1000 - 500;
              clouds.position.y = Math.random() * 50 + 150;
              clouds.position.z = Math.random() * 1000 - 500; 
              clouds.size = Math.random() * 50;
              if (Math.round(Math.random() * 5) === 0) {
                  clouds.angle = Math.PI * 90 / 180;            
              }
          if (Math.round(Math.random() * 2) === 0) {
            clouds.invertU = -1;
          }
          if (Math.round(Math.random() * 4) === 0) {
            clouds.invertV = -1;
          }
          }
    return spriteManagerClouds;
    }
    
    function update(time) {
        now = time;
        elapsed = now - then;
        if (elapsed > interval){
            move();
            //console.log(time);
            then = now;
        }
    }
    return {
        update,
        transitionSunInclination,
        makeClouds
    }
}
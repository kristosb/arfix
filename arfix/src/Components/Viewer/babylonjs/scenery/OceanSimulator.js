import * as BABYLON from 'babylonjs';
import { CustomMaterial } from "babylonjs-materials";

 /**    
 *  Simulates the oacean with moving waves
 * @param {BABYLON.Scene} scene      
 * @param num size      
 */

export default function scene(scene, size = 1024) {
    var camWaterMask = maskProjectionCam(scene,size);
    var gmat = createMaskMaterial(scene, camWaterMask);
    var ocean = null;
    const checkDepthMapCreated = () => {
        const ok = gmat.diffuseTexture._currentRefreshId !== -1;
        if (!ok) {
            window.setTimeout(checkDepthMapCreated, 10);
        } else {
            //var ocean = new BumpWaves(wsize, scene, gmat);
            ocean = new ProceduralHeightMap(size, scene, gmat);
        }
    };

    checkDepthMapCreated();


    //var ocean = new ProceduralHeightMap(size, scene, gmat);
    function update(){

    }
    function getMesh(){
        return ocean;
    }
    function setPosition(position){
        //waterMesh.position = position;
    }

    return {
        update,
        setPosition,
        getMesh
    }

}

class ProceduralHeightMap{

    constructor(wsize, scene, gmat){




        let detail = 64;
        let res = 512;

        var sdfRes = gmat.diffuseTexture.getSize().width;
        var sdfTexture = this.generateDistanceField(sdfRes, gmat.diffuseTexture, 24, scene);
        let flowHeight = this.distortionFlow( 0.5, sdfRes, scene);
        var water = BABYLON.MeshBuilder.CreateGround("waterMesh", {width: wsize, height: wsize, subdivisions:4}, scene);
        //water.convertToFlatShadedMesh();
        water.material = new CustomMaterial('waterMaterial', scene);
        water.material.backFaceCulling = false;
        water.position.y  = 0;//55;
        
        let bumpTexture = new BABYLON.CustomProceduralTexture("waterBump", 'height2Normal', flowHeight._texture.baseWidth, scene, false, true);
        bumpTexture.wrapU = bumpTexture.wrapV = 1;
        bumpTexture.setVector2('resolution', new BABYLON.Vector2(res,res));
        bumpTexture.setTexture('textureSampler', flowHeight);
        bumpTexture.refreshRate = 3;
        bumpTexture.level = 0.5;
        bumpTexture.vScale = 20;
        bumpTexture.uScale = 20;
        //bumpTexture.vScale = -1;
        water.material.bumpTexture = bumpTexture;
        water.material.specularPower = 60;
        var waterColorTexture = this.generateShallowWaterGradient(sdfRes,sdfTexture,0.9,scene);
        water.material.diffuseTexture = waterColorTexture;   
        water.material.diffuseTexture.uScale = -1;
        
        water.receiveShadows = true;

    }
    
    ///////////// SDF //////////
    generateDistanceField(res,occlusionTexture, iter1 =24, scene){
        var uid = Date.now();  
        var iter =iter1.toFixed(1).toString();
        //console.log("iter",iter);
        BABYLON.Effect.ShadersStore[uid+'SdfPixelShader'] = 
        `
        varying vec2 vUV;
        uniform sampler2D occlusionMap;
        uniform float res;
        
        bool isIn(vec2 uv)
        {
            //vec4 texColor = texture(occlusionMap, uv);
            float x = step(0.99,texture(occlusionMap, uv).r); //treshold the map
            x = 1. -x;  //reverse color
            //vec3 color = vec3(x,x,x);
            if (x != 1.)
                return false;
            else
                return true;
        }

        float squaredDistanceBetween(vec2 uv1, vec2 uv2)
        {
            vec2 delta = uv1 - uv2;
            float dist = (delta.x * delta.x) + (delta.y * delta.y);
            return dist;
        }
        void main(){
            vec2 iResolution = vec2(res);
            const float range = ${iter};
            const int iRange = int(range);
            float halfRange = range / 2.0;
            vec2 startPosition = vec2(gl_FragCoord.x - halfRange, gl_FragCoord.y - halfRange);
            bool fragIsIn = isIn(vUV);
            float squaredDistanceToEdge = (halfRange*halfRange)*2.0;

            if (!fragIsIn)
                for(int dx=0; dx < iRange; dx++)
                {
                    for(int dy=0; dy < iRange; dy++)
                    {
                        vec2 scanPositionUV = startPosition + vec2(dx, dy);
                        
                        bool scanIsIn = isIn(scanPositionUV / iResolution.xy);
                        if (scanIsIn != fragIsIn)
                        {
                            float scanDistance = squaredDistanceBetween(vec2(gl_FragCoord.x,gl_FragCoord.y), scanPositionUV);
                            //float scanDistance = squaredDistanceBetween(gl_FragCoord, scanPositionUV);
                            if (scanDistance < squaredDistanceToEdge)
                                squaredDistanceToEdge = scanDistance;
                        }
                    }
                }
            float normalised = squaredDistanceToEdge / ((halfRange*halfRange)*2.0);
            float distanceToEdge = sqrt(normalised);
            if (fragIsIn)
                distanceToEdge = -distanceToEdge ;
            normalised = 0.5 - distanceToEdge;

            gl_FragColor = vec4(normalised, normalised, normalised, 1.0);
            /*float x = step(0.99,texture2D(occlusionMap, vUV).r); //treshold the map
            x = 1. -x;  //reverse color
            vec3 color = vec3(x,x,x);*/

            //vec3 color = vec3(0.,1.,0.);
            //gl_FragColor = vec4(color, 1.0);

        }
        `
        let texture = new BABYLON.CustomProceduralTexture(uid+"SdfDt", uid+"Sdf", res , scene, false, false);
        //texture.wrapU = texture.wrapV = 1;  
        texture.refreshRate = 0;        
        texture.setTexture('occlusionMap', occlusionTexture, scene);//params.flowMap)
        texture.setFloat('res', res);
        //texture.uScale = 1;
        //texture.vScale = 1;

        return texture
    }

    /////////// SDF END /////

    ///////////shallow water map /////
    generateShallowWaterGradient(res, depfthField,clipDepth=0.5, scene){
        var uid = Date.now();  
        var deepColor = new BABYLON.Color3(0.13, 0.27, 0.57);// new BABYLON.Color3(0.05, 0.098, 0.168);//0.13, 0.27, 0.57); 
        var shallowColor = new BABYLON.Color3(0.02, 0.72, 0.77);//(0.1, 0.54, 0.68);;//new BABYLON.Color3(0.02, 0.72, 0.77);
        var clip =clipDepth.toFixed(1).toString();
        BABYLON.Effect.ShadersStore[uid+'ShallowWaterPixelShader'] = 
        `
        varying vec2 vUV;
        uniform sampler2D depthField;
        uniform float res;
        uniform vec3 deep;
        uniform vec3 shallow;
        void main(){
            vec2 iResolution = vec2(res);
            float depth = smoothstep(0.,${clip},texture(depthField, vUV).r);
            vec3 gradient = mix(deep,shallow, depth);
            gl_FragColor = vec4(gradient,1.0);
        }
        `
        let texture = new BABYLON.CustomProceduralTexture(uid+"ShallowWaterDt", uid+"ShallowWater", res , scene, false, false);
        //texture.wrapU = texture.wrapV = 1;  
        texture.refreshRate = 0;        
        texture.setTexture('depthField', depfthField, scene);//params.flowMap)
        texture.setFloat('res', res);
        texture.setColor3('deep', deepColor);
        texture.setColor3('shallow', shallowColor);
        //texture.uScale = 1;
        //texture.vScale = 1;
        return texture
    }
/////////////

    distortionFlow(wspeed, res, scene ){
        var uid = Date.now()
        //this.params = params
         
        var speed = wspeed.toFixed(1).toString();    
        BABYLON.Effect.ShadersStore[uid+'DistortionFlowPixelShader'] = 
        `
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        //uniform sampler2D flowMap;
        uniform float uTime;

        vec2 flowUV (vec2 uv, float time) {
            return uv + time;
        }
        //https://www.shadertoy.com/view/MtfBRN
        void main(){
            vec2 uv = vec2(vUV.x,-vUV.y);
            float intensity = ${speed};
            float timescale = uTime *.0174;
            //vec2 distortion = (texture2D(flowMap, -uv).rg -1.3) * intensity;
            float flow_t0 = fract(timescale);
            float flow_t1 = fract(timescale + .5);
            float alternate = abs((flow_t0 -.5) * 10.);

            vec4 samp0 = texture2D(textureSampler, uv + flow_t0); 
            vec4 samp1 = texture2D(textureSampler, uv - flow_t1); 
            vec4 Flow = mix(samp0, samp1, alternate);
            gl_FragColor = vec4(1.,Flow.g,1.,1.);
        }
        `
        let texture = new BABYLON.CustomProceduralTexture(uid+"DistortionFlowDt", uid+"DistortionFlow", res || 256, scene, false, false)
        texture.wrapU = texture.wrapV = 1;  
        texture.refreshRate = 3;        

        texture.onGeneratedObservable.add(()=>{           
            texture.setFloat('uTime', texture._time)
        })

        texture.setFloat('uTime', 0); //Must do this or it wont update later on Genderated. 
        //waveTexture.uAng = Math.PI/2;
        //waveTexture.wAng = Math.PI/2;
        var waveNoiseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/kristosb/assets/main/WavesDt.png");

        texture.setTexture('textureSampler', waveNoiseTexture);
        texture.uScale = 1
        texture.vScale = 1

        return texture
    }
////////////
    get scene(){
        return this.params.scene
    }

    get res(){
        return this.params.res
    }

}


BABYLON.Effect.ShadersStore['height2NormalPixelShader']  =
`varying vec2 vUV;
uniform vec2 resolution;
uniform sampler2D textureSampler;

void main(){
    vec2 unit = vec2(1.0)/resolution*2.;
    float x = ((texture2D(textureSampler, vUV+(unit*vec2(-1.,0.))).g-texture2D(textureSampler, vUV+(unit*vec2(1.,0.))).g)+1.)*0.5;
    float y = ((texture2D(textureSampler, vUV+(unit*vec2(0.,1.))).g-texture2D(textureSampler, vUV+(unit*vec2(0.,-1.))).g)+1.)*0.5;
    float a = 1.;//texture(textureSampler, vUV).r;

#if defined(invertDepth)
    	gl_FragColor = vec4(x, y, 1.0, a);
#else
	gl_FragColor = vec4(1.0-x, y, 1.0, a);
#endif

}`;

function subjectMeshes(scene,wsize){
    var cube = BABYLON.MeshBuilder.CreateBox("Cube", {size:wsize/4}, scene);
    cube.position.copyFromFloats(wsize/4, wsize/8, wsize/4);
    var sphere = BABYLON.MeshBuilder.CreateSphere("Ball", {diameter:wsize/4}, scene);
    sphere.position.copyFromFloats(wsize/4, -2+ wsize/8, -wsize/4);
    sphere.material = new BABYLON.SimpleMaterial("sp",scene);
    //sphere.material.wireframe = true;
    //sphere.material.alpha = 0.9;
    var torus = BABYLON.MeshBuilder.CreateTorus("Torus", { thickness:wsize/10, diameter: wsize/4}, scene);
    torus.position.copyFromFloats(-wsize/4, wsize/20, wsize/4);
    var cylinder = BABYLON.MeshBuilder.CreateCylinder("Cyclinder", {diameter:wsize/4}, scene);
    cylinder.position.copyFromFloats(-wsize/4, 1, -wsize/4);
}

function createGui(camWaterMask, wsize){
    var displayFValue = function(value) {
        return Math.floor(value * 10) / 10;
    }
    var frictionBox = function(value) {
        camWaterMask.position.x = value
        //console.log("value=",value);
    }
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var selectFrictionBox = new BABYLON.GUI.SelectionPanel("spi");
    selectFrictionBox.width = 0.25;
    selectFrictionBox.height = 0.25;
    selectFrictionBox.background = "#1388AF";
    selectFrictionBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    selectFrictionBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

    advancedTexture.addControl(selectFrictionBox);

    var frictionGroup = new BABYLON.GUI.SliderGroup("orth cam pos", "S");
	frictionGroup.addSlider("x", frictionBox, "units", -wsize/20, wsize/20, 0, displayFValue);
    selectFrictionBox.addGroup(frictionGroup);
}

function maskProjectionCam(scene, size){
    var zdist = -10;
    var cameraOrth = new BABYLON.FreeCamera("camWaterMask", new BABYLON.Vector3(0, zdist, 0), scene);
    cameraOrth.setTarget(BABYLON.Vector3.Zero());
    var cameraZoom  = size/2; 
    cameraOrth.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    cameraOrth.orthoTop = cameraZoom ;
    cameraOrth.orthoBottom = -cameraZoom;
    cameraOrth.orthoLeft = -cameraZoom ;
    cameraOrth.orthoRight = cameraZoom ;
    cameraOrth.minZ = -zdist-2;
    cameraOrth.maxZ = -zdist+5;
    return cameraOrth
}
function createMaskMaterial(scene, camWaterMask){
    var depthMap = scene.enableDepthRenderer(camWaterMask).getDepthMap();
    depthMap.scale(0.2);    //reduce resolution
    const size = depthMap.getSize();
    depthMap._refreshRate = 0;
    //console.log(size);
    var groundMat = new BABYLON.StandardMaterial("waterOcclMask", scene);
    groundMat.diffuseTexture = depthMap;
    groundMat.specularColor.copyFromFloats(0, 0, 0);

    camWaterMask.dispose();
    return groundMat;
}
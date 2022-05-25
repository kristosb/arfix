import * as BABYLON from 'babylonjs';
import { CustomMaterial } from "babylonjs-materials";

 /**    
 *  Simulates the oacean with moving waves
 * @param {BABYLON.Scene} scene      
 * @param num size      
 */
 /* export default function scene(scene, camera, size = 1024, ground) {

	// Water
    // Our built-in 'ground' shape.
    var waterMesh = BABYLON.MeshBuilder.CreateGround("water", { width: size, height: size, subdivisions: 64 }, scene);
    //waterMesh.scaling = new BABYLON.Vector3(size/2, 5, size/2);
    //waterMesh.rotation.y = Math.PI*2;
    //waterMesh.position.y = -10.8;
    // stylized water shader
    BABYLON.Effect.ShadersStore["customVertexShader"]= "\r\n"+   
    "precision highp float;\r\n"+

    // Attributes
    "attribute vec3 position;\r\n"+
    "attribute vec2 uv;\r\n"+

    // Uniforms
    "uniform mat4 worldViewProjection;\r\n"+
    "uniform float time;\r\n"+

    // Varying
    "varying vec3 vPosition;\r\n"+
    "varying vec4 vClipSpace;\r\n"+

    "void main(void) {\r\n"+
        "float scale = 1.0;\r\n"+
        // calc new position
        "float newY = 0.02*(sin(position.x * 1.0 / scale + time * 1.0));\r\n"+
        // new model position
        "vec3 newPositionM = vec3(position.x,newY,position.z);\r\n"+
        "gl_Position = worldViewProjection * vec4(newPositionM, 1.0);\r\n"+
        //"gl_Position = worldViewProjection * vec4(position, 1.0);\r\n"+
        // grab vertex position in world space
        "vPosition = position;\r\n"+
        // grab vertex position in view space
        "vClipSpace = gl_Position;\r\n"+
    "}\r\n";

    BABYLON.Effect.ShadersStore["customFragmentShader"]="\r\n"+
    "precision highp float;\r\n"+

    // Varyings
    "varying vec3 vPosition;\r\n"+
    // world distance, camera to water
    "varying vec4 vClipSpace;\r\n"+

    // Uniforms
    "uniform sampler2D depthTex;\r\n"+
    "uniform sampler2D refractionSampler;\r\n"+
    "uniform float camMinZ;\r\n"+
    "uniform float camMaxZ;\r\n"+
    "uniform float maxDepth;\r\n"+
    // water colors
    "uniform vec4 wDeepColor;\r\n"+
    "uniform vec4 wShallowColor;\r\n"+
    "uniform float time;\r\n"+
    "uniform float wNoiseScale;\r\n"+
    "uniform float wNoiseOffset;\r\n"+
    "uniform float fNoiseScale;\r\n"+

    "float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\r\n"+
    "vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\r\n"+
    "vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}\r\n"+

    "float noise(vec3 p){\r\n"+
        "vec3 a = floor(p);\r\n"+
        "vec3 d = p - a;\r\n"+
        "d = d * d * (3.0 - 2.0 * d);\r\n"+

        "vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);\r\n"+
        "vec4 k1 = perm(b.xyxy);\r\n"+
        "vec4 k2 = perm(k1.xyxy + b.zzww);\r\n"+

        "vec4 c = k2 + a.zzzz;\r\n"+
        "vec4 k3 = perm(c);\r\n"+
        "vec4 k4 = perm(c + 1.0);\r\n"+

        "vec4 o1 = fract(k3 * (1.0 / 41.0));\r\n"+
        "vec4 o2 = fract(k4 * (1.0 / 41.0));\r\n"+

        "vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);\r\n"+
        "vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);\r\n"+

        "return o4.y * d.y + o4.x * (1.0 - d.y);\r\n"+
    "}\r\n"+

    "void main(void) {\r\n"+
        // init baseColor
        "vec4 baseColor = vec4(0.0);\r\n"+
        // generate noise value
        "float waveNoise = noise(vec3(0., time, 0.)+vPosition*wNoiseScale)*wNoiseOffset;\r\n"+
        // remap frag screen space coords to ndc (-1 to +1)
        "vec2 ndc = (vClipSpace.xy / vClipSpace.w) / 2.0 + 0.5;\r\n"+
        // grab depth value (0 to 1) at ndc for object behind water
        "float depthOfObjectBehindWater = texture2D(depthTex, vec2(ndc.x, ndc.y)+waveNoise).r;\r\n"+
        // get depth of water plane
        "float linearWaterDepth = (vClipSpace.z + camMinZ) / (camMaxZ + camMinZ);\r\n"+
        // calculate water depth scaled to camMaxZ since camMaxZ >> camMinZ
        "float waterDepth = camMaxZ*(depthOfObjectBehindWater - linearWaterDepth);\r\n"+
        // get water depth as a ratio of maxDepth
        "float wdepth = clamp((waterDepth/maxDepth), 0.0, 1.0);\r\n"+
        // mix water colors based on depth
        "baseColor = mix(wShallowColor, wDeepColor, wdepth);\r\n"+
        // mix colors with scene render
        "vec4 refractiveColor = texture2D(refractionSampler, vec2(ndc.x, ndc.y)+waveNoise);\r\n"+
        "baseColor = mix(refractiveColor, baseColor, baseColor.a);\r\n"+
        // decide the amount of foam 
        "float foam = 1.0-smoothstep(0.1, 0.2, wdepth);\r\n"+
        // make the foam effect using noise
        "float foamEffect = smoothstep( 0.1, 0.2, noise(vec3(0., time, 0.)+vPosition*fNoiseScale*0.3)*foam);\r\n"+
        "baseColor.rgba += vec4(foamEffect);\r\n"+
        // final result
        "gl_FragColor = baseColor;\r\n"+
        
    "}\r\n";

    var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {vertex: "custom",fragment: "custom"},
    {
    attributes: ["position", "normal", "uv"],
    uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
    });
 
    // linear depth only!! I dun want to work with non-linear depth map!
    var depthRenderer = scene.enableDepthRenderer(scene.activeCamera,false);
    var depthTex = depthRenderer.getDepthMap();
    depthTex.renderList = [ ground];
    
    var _refractionRTT = new BABYLON.RenderTargetTexture("water_refraction", { width: 8, height: 8 }, scene, false, true);
    _refractionRTT.wrapU = BABYLON.Constants.TEXTURE_MIRROR_ADDRESSMODE;
    _refractionRTT.wrapV = BABYLON.Constants.TEXTURE_MIRROR_ADDRESSMODE;
    _refractionRTT.ignoreCameraViewport = true;
    _refractionRTT.renderList.push( ground);
    _refractionRTT.refreshRate = 4;

    scene.customRenderTargets.push(_refractionRTT);
    
    // set shader parameters
    shaderMaterial.setTexture("depthTex", depthTex);
    shaderMaterial.setTexture("refractionSampler", _refractionRTT);
    shaderMaterial.setFloat("camMinZ", scene.activeCamera.minZ);
    shaderMaterial.setFloat("camMaxZ", scene.activeCamera.maxZ);
    shaderMaterial.setFloat("time", 0);
    shaderMaterial.setFloat("wNoiseScale", 6.0);
    shaderMaterial.setFloat("wNoiseOffset", 0.01);
    shaderMaterial.setFloat("fNoiseScale", 10.0);
    shaderMaterial.setFloat("maxDepth", 0.5);
    shaderMaterial.setVector4("wDeepColor", new BABYLON.Vector4(0.0,0.2,0.5,0.8));
    shaderMaterial.setVector4("wShallowColor", new BABYLON.Vector4(0.3,0.4,0.8,0.5));

    var time = 0;
    scene.registerBeforeRender(function() {
        time += scene.getEngine().getDeltaTime() * 0.001;
        shaderMaterial.setFloat("time", time);
    });
    
    waterMesh.material = shaderMaterial;

    waterMesh.receiveShadows = true;

    function update(){

    }
    function setPosition(position){
        waterMesh.position = position;
    }
    function addReflected(subject){
        //water.addToRenderList(subject);
    }
    return {
        update,
        setPosition,
        addReflected
    }

}*/

/*  export default function scene(scene, camera, size = 1024) {

	// Water
    // Our built-in 'ground' shape.
    var waterMesh = BABYLON.MeshBuilder.CreateGround("water", { width: 2, height: 2, subdivisions: 64 }, scene);
    waterMesh.scaling = new BABYLON.Vector3(size/2, 5, size/2);
    waterMesh.rotation.y = Math.PI*2;
    //waterMesh.position.y = -10.8;

    BABYLON.NodeMaterial.ParseFromSnippetAsync("#3FU5FG#1", scene).then((mat) => {
        waterMesh.material = mat;
        //window.mat = mat;
    });
    let addPostEffects = ()=>{
        var pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline", // The name of the pipeline
            false, // Do you want the pipeline to use HDR texture?
            scene, // The scene instance
            [camera] // The list of cameras to be attached to
        );
        pipeline.bloomEnabled   = false;

        pipeline.grainEnabled = false;
        pipeline.grain.animated = false;

        pipeline.chromaticAberrationEnabled = false;

        pipeline.sharpenEnabled = false;

    }
    addPostEffects();

    waterMesh.receiveShadows = true;

    function update(){

    }
    function setPosition(position){
        waterMesh.position = position;
    }
    function addReflected(subject){
        //water.addToRenderList(subject);
    }
    return {
        update,
        setPosition,
        addReflected
    }

}*/

/*export default function scene(scene, size = 1024) {

	// Water
	var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", size, size, 16, scene, false);
    waterMesh.receiveShadows = true;
	var water = new WaterMaterial("water", scene, new BABYLON.Vector2(1024, 1024));
	water.backFaceCulling = false;
	water.bumpTexture = new BABYLON.Texture("textures/waterbump.png", scene);
	water.windForce = -10;
	water.waveHeight = 0.5;
	water.bumpHeight = 0.2;
	water.windDirection = new BABYLON.Vector2(1, 1);
	water.waterColor = new BABYLON.Color3(0, 0, 221 / 255);
	water.colorBlendFactor = 0.0;
    water.alpha = 0.7;
	
	waterMesh.material = water;

    function update(){

    }
    function setPosition(position){
        waterMesh.position = position;
    }
    function addReflected(subject){
        water.addToRenderList(subject);
    }
    return {
        update,
        setPosition,
        addReflected
    }

}*/

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
        var deepColor = new BABYLON.Color3(0.05, 0.098, 0.168);//0.13, 0.27, 0.57);
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
    console.log(size);
    var groundMat = new BABYLON.StandardMaterial("waterOcclMask", scene);
    groundMat.diffuseTexture = depthMap;
    groundMat.specularColor.copyFromFloats(0, 0, 0);

    camWaterMask.dispose();
    return groundMat;
}
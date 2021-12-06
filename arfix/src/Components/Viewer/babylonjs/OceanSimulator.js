import * as BABYLON from 'babylonjs';
import { WaterMaterial } from "babylonjs-materials";

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

export default function scene(scene, size = 1024) {

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

}
import * as BABYLON from 'babylonjs';

export default function scene(shadowlight ) {    
    //console.log("m1m2", mesh1, mesh2);
    var groundshadowGenerator = simpleShadowDenerator(shadowlight);
    //shadowlight.autoUpdateExtends = false;

    //engine.getCaps().maxVaryingVectors = 16;
    /*var groundshadowGenerator = new BABYLON.CascadedShadowGenerator(512, shadowlight);
    groundshadowGenerator.getShadowMap().renderList.push(groundmesh);
    groundshadowGenerator.lambda = 1;     //0 -full lin, 1 full log
    groundshadowGenerator.shadowMaxZ = camera.maxZ;
    //shadowGenerator.shadowMaxZ = 50;
    groundshadowGenerator.cascadeBlendPercentage = 0;
    groundshadowGenerator.bias = 0.1;
    groundshadowGenerator.depthClamp = false;
    //groundshadowGenerator.useExponentialShadowMap = true;
    //groundshadowGenerator.autoCalcDepthBounds = true;
    groundshadowGenerator.splitFrustum();*/

    function simpleShadowDenerator(light, m1, m2){
        var simpleShadows = new BABYLON.ShadowGenerator(1024, light);
        //simpleShadows.getShadowMap().renderList.push(m1);
        //simpleShadows.getShadowMap().renderList.push(m2);
        simpleShadows.useBlurCloseExponentialShadowMap = true;
        simpleShadows.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        //light.autoUpdateExtends = true;
        light.autoCalcShadowZBounds = true;
        return simpleShadows;
    }
    function updateOnce(){
        groundshadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        //shadowlight.autoUpdateExtends = false;
    }
    function addMesh(mesh){
        //groundshadowGenerator.getShadowMap().renderList.push(mesh);
        //groundshadowGenerator.addShadowCaster(mesh);
        //shadowGenerator.getShadowMap().renderList.push(torus);
        //console.log("exist",mesh);
        groundshadowGenerator.getShadowMap().renderList.push(mesh);
    }
    return {
        updateOnce,
        addMesh
    }
}



/*var groundshadowGenerator = new BABYLON.ShadowGenerator(1024, shadowlight);
groundshadowGenerator.getShadowMap().renderList.push(groundmesh);
groundshadowGenerator.useBlurCloseExponentialShadowMap = true;
//groundshadowGenerator.forceBackFacesOnly = true;
//groundshadowGenerator.blurKernel = 32;
//groundshadowGenerator.useKernelBlur = true;
groundshadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;*/
//shadowlight.autoUpdateExtends = false;
/*var g = new BABYLON.LightGizmo();
g.light = shadowlight;
var dlh = new DirectionalLightHelper(shadowlight, camera);
window.setTimeout(() => {
    scene.onAfterRenderObservable.add(() => dlh.buildLightHelper());
}, 500);*/
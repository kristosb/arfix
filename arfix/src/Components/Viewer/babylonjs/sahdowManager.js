import * as BABYLON from 'babylonjs';

/*export default function scene(shadowlight) {    
    //var groundshadowGenerator = simpleShadowGenerator(shadowlight);
    var groundshadowGenerator = cascadingShadowGenerator(shadowlight);

    function ShadowGenerator(light, camera){
        
        //light.position = new BABYLON.Vector3(0, 1500, 0);
        //light.diffuse = BABYLON.Color3.White();
        //light.specular = new BABYLON.Color3(0.3, 0.3, 0.3);
        //light.intensity = 1.0;

        var shadowGeneratorDynamic = new BABYLON.ShadowGenerator(1024, light);
        shadowGeneratorDynamic.usePercentageCloserFiltering = true;
        shadowGeneratorDynamic.getShadowMap().renderList.push(torus);
        return shadowGeneratorDynamic;
    }
    function updateOnce(){
        //groundshadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
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
}*/

export default function scene(shadowlight) {    
    //var groundshadowGenerator = simpleShadowGenerator(shadowlight);
    var groundshadowGenerator = cascadingShadowGenerator(shadowlight);

    function simpleShadowGenerator(light){
        var simpleShadows = new BABYLON.ShadowGenerator(1024, light);
        //simpleShadows.getShadowMap().renderList.push(m1);
        //simpleShadows.getShadowMap().renderList.push(m2);
        simpleShadows.useBlurCloseExponentialShadowMap = true;
        simpleShadows.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        //light.autoUpdateExtends = true;
        light.autoCalcShadowZBounds = true;
        return simpleShadows;
    }
    function cascadingShadowGenerator(light, camera){
        
        light.position = new BABYLON.Vector3(0, 150, 0); //1500
        //light.diffuse = BABYLON.Color3.White();
        //light.specular = new BABYLON.Color3(0.3, 0.3, 0.3);
        //light.intensity = 1.0;

        var csmShadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light);
        //csmShadowGenerator.stabilizeCascades = true;
        //csmShadowGenerator.forceBackFacesOnly = true;
        //csmShadowGenerator.shadowMaxZ = 100;
        //csmShadowGenerator.autoCalcDepthBounds = true;
        //csmShadowGenerator.lambda = 0.5;
        //csmShadowGenerator.depthClamp = true;
        //csmShadowGenerator.penumbraDarkness = 0.8;
        //csmShadowGenerator.usePercentageCloserFiltering = true;
        //csmShadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        csmShadowGenerator.forceBackFacesOnly = true;
        //csmShadowGenerator.numCascades = 2;
        csmShadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;

        csmShadowGenerator.lambda = 1;     //0 -full lin, 1 full log
        //csmShadowGenerator.shadowMaxZ = camera.maxZ;
        csmShadowGenerator.shadowMaxZ = 500;
        csmShadowGenerator.cascadeBlendPercentage = 0;
        csmShadowGenerator.depthClamp = false;
        csmShadowGenerator.splitFrustum();
        //csmShadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYTWOFRAMES;
        //console.log("refresh",csmShadowGenerator.getShadowMap().refreshRate);
        return csmShadowGenerator;
    }
    function updateOnce(){
        //groundshadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
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



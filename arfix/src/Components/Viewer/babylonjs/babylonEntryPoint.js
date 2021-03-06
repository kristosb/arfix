import SceneManager from './SceneManager';

export default container => {
    let canvasHalfWidth;
    let canvasHalfHeight;
    const canvas = createCanvas(document, container);
    canvas.style.width = '100%';
    canvas.style.height= '100%';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const sceneManager = new SceneManager(canvas);
    
    bindEventListeners();
    resizeCanvas();
    sceneManager.animate();
     
    function createCanvas(document, container) {
        const canvas = document.createElement("canvas");    
        container.appendChild(canvas);   
        return canvas;
    }

    function bindEventListeners() {
        window.onresize = resizeCanvas;
        //resizeCanvas();	
    }

    function resizeCanvas() {        
        canvas.style.width = '100%';
        canvas.style.height= '100%';
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        canvasHalfWidth = Math.round(canvas.offsetWidth/2);
        canvasHalfHeight = Math.round(canvas.offsetHeight/2);

        sceneManager.onWindowResize();
    }

}

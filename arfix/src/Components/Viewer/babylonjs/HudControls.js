import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class hudControl {
    constructor( x, y){
       this._x = x;
       this._y = y;
    }
   set x(x){
       this._x = x;
   }
   get x(){
       return this._x;
   }
   set y(y){
       this._y = y;
   }
   get y(){
       return this._y;
   }
    draw(){

    }
}

export class crosshair extends hudControl{
    constructor( width, height) {
        super(width / 2,height / 2);
        this.width = width;
        this.height = height;
        this.lines = [new GUI.Line(),new GUI.Line()];
        this.lines.forEach(line=>{
            line.lineWidth = 2;
            line.color = "green";
        });

    }

    draw(){
        // remove aliasing
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;

        this.lines[0].x1 = this.x;
        this.lines[0].y1 = this.y - 10;
        this.lines[0].x2 = this.x;
        this.lines[0].y2 = this.y + 10;

        this.lines[1].x1 = this.x - 10;
        this.lines[1].y1 = this.y;
        this.lines[1].x2 = this.x + 10;
        this.lines[1].y2 = this.y;

    }
  }

  export class hudSimpleText extends hudControl{
    constructor( x, y, fontSize =16) {
        super(x,y);
        this.txt = "hello..."
        this.fontSize = fontSize;
        this.element = new GUI.TextBlock();
        this.element.top = x;
        this.element.left = y;
        this.element.color = "green";
        this.element.fontSize = fontSize;
        this.element.height = "30px";
    }
    set text(txt){
        this.element.text = txt;
    }
    draw(){

    }
  }
//////////
function range(start, end, inc) {
    //console.log(start,end);
    return Array(end/inc - (start/inc) + 1).fill().map((_, idx) => start+ idx*inc);
  }
  function limitCompass(x){
    if(x<0) x = x+ 360;
    if(x>359) x = x -360;
    return x;
  }
  function limitPitchLadder(x){
    if(x<-90) x = -180-x;
    if(x>90) x = 180-x ;
    return x;
  }
  function rangeClip(rangeArray,limit){
    return rangeArray.map(x=>limit(x));
  }
  /*function rangeClip360(rangeArray){
    return rangeArray.map(x=>limit(x));
  }*/
  export class compass extends hudControl{
    constructor( width, height, tickSpace =40, rangeC = 4) {   
        super(width/2- 40*(4/2),height / 7);
        this.tickSpace = tickSpace;
        this._range = rangeC;
        //this.middle =  this.tickSpace*(this._range/2);
        this.middle = width/2;
        this.width = width;
        this.height = height;
        this.tilt = 0;
        this.tickHeight = 15;
        
        this.scale = 10;
        //this.scaleVals = range(10/this.scale,50/this.scale,this.scale);
        //console.log(this.scaleVals);
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;
        var fontSize = 12;
        this.elements = [];//new GUI.Line()
        this.elements.push(new GUI.TextBlock());
        this.elements[this.elements.length-1].color = "green";
        this.elements[this.elements.length-1].fontSize = fontSize;
        this.elements[this.elements.length-1].height = "10px";
        this.elements[this.elements.length-1].width = "20px";
        this.elements[this.elements.length-1].horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.elements[this.elements.length-1].verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.elements.push(new GUI.Line());
        this.elements[this.elements.length-1].lineWidth = 2;
        this.elements[this.elements.length-1].color = "green";

        this.scaleVals = range(
            Math.floor(this.tilt/this.scale)*this.scale-Math.floor(this.scale*this._range/2),
            Math.floor(this.tilt/this.scale)*this.scale+ Math.floor(this.scale*this._range/2),
            this.scale);
        this.scaleVals = rangeClip(this.scaleVals,limitCompass);
        this.scaleVals.forEach((x,i)=>{
            this.elements.push(new GUI.TextBlock());
            this.elements[this.elements.length-1].color = "green";
            this.elements[this.elements.length-1].fontSize = fontSize;
            this.elements[this.elements.length-1].height = "10px";
            this.elements[this.elements.length-1].width = "20px";
            this.elements[this.elements.length-1].horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.elements[this.elements.length-1].verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.elements.push(new GUI.Line());
            this.elements[this.elements.length-1].lineWidth = 2;
            this.elements[this.elements.length-1].color = "green";
            this.elements.push(new GUI.Line());
            this.elements[this.elements.length-1].lineWidth = 2;
            this.elements[this.elements.length-1].color = "green";
        });  
        console.log(this.elements.length);

    }
    set angle(angle){
        this.tilt = angle;
    }
    set range(range){
        this._range = range;
    }
    set rangeScale(rangeScale){
        this.scale = rangeScale;
    }
    draw(){
        var tiltFloor = Math.floor(this.tilt);
        var tiltRemd = Math.floor(this.tilt * 10/this.scale) % 10;
        var tiltRemdHalf = Math.floor((this.tilt/this.scale+0.5) * 10) % 10;
        this.scaleVals = range(
            Math.floor(this.tilt/this.scale)*this.scale-Math.floor(this.scale*this._range/2),
            Math.floor(this.tilt/this.scale)*this.scale+ Math.floor(this.scale*this._range/2),
            this.scale);
        this.scaleVals = rangeClip(this.scaleVals,limitCompass);
        this.tilt = tiltFloor + tiltRemd/10;

        //super.changeLocalLineWidth();
        //this.bm.beginPath();
        var elemIdx = 2;
        var space = this.x-tiltRemd*this.tickSpace/10;
        var spaceHalf = this.x-tiltRemdHalf*this.tickSpace/10;
        this.scaleVals.forEach((val,idx)=>{
            /*this.bm.font = `bold ${12}px Arial`;
            this.bm.textAlign = 'start';
            this.bm.fillText(val.toString(), space-5, this.y-this.tickHeight-2);
            this.bm.moveTo(space, this.y);
            this.bm.lineTo(space, this.y-this.tickHeight); 
            this.bm.moveTo(spaceHalf, this.y);
            this.bm.lineTo(spaceHalf, this.y-this.tickHeight/2); */
            this.elements[elemIdx].left = space-5;
            this.elements[elemIdx].top = this.y-this.tickHeight-10;
            this.elements[elemIdx].text = val.toString();
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = space;
            this.elements[elemIdx].y1 = this.y;
            this.elements[elemIdx].x2 = space;
            this.elements[elemIdx].y2 = this.y-this.tickHeight;
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = spaceHalf;
            this.elements[elemIdx].y1 = this.y;
            this.elements[elemIdx].x2 = spaceHalf;
            this.elements[elemIdx].y2 = this.y-this.tickHeight/2;
            elemIdx = elemIdx +1;
            space += this.tickSpace;
            spaceHalf += this.tickSpace;
        });

        /*this.bm.moveTo(this.middle, this.y+15);
        this.bm.lineTo(this.middle, this.y+15 -this.tickHeight); 
        this.bm.fillText(tiltFloor.toString(), this.middle+4, this.y+15);
        this.bm.closePath();
        this.bm.stroke();
        super.resetGlobalLineWidth(); */
        //this.elements[0].x1 = 20;this.middle + 4;
        //this.elements[0].y1 = this.y+15;

        //this.elements[1].horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        //this.elements[1].verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        //this.elements[0].left = "50px";
        //console.log("text =",this.elements[0].horizontalAlignment,GUI.Control.HORIZONTAL_ALIGNMENT_LEFT);
        this.elements[0].left = this.middle;
        this.elements[0].top = this.y+15;
        this.elements[0].text = tiltFloor.toString();
        this.elements[1].x1 = this.middle;
        this.elements[1].y1 = this.y+15;
        this.elements[1].x2 = this.middle;
        this.elements[1].y2 = this.y+15 -this.tickHeight;
        console.log("location",this.middle + 4, this.y+15);
    }
  }
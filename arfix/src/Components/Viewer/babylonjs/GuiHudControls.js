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
    constructor( x, y, fontSize =12) {
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
        const fontSize = 12;
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
        //console.log(this.elements.length);
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

        var elemIdx = 2;
        var space = this.x-tiltRemd*this.tickSpace/10;
        var spaceHalf = this.x-tiltRemdHalf*this.tickSpace/10;
        this.scaleVals.forEach((val,idx)=>{
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
        this.elements[0].left = this.middle;
        this.elements[0].top = this.y+15;
        this.elements[0].text = tiltFloor.toString();
        this.elements[1].x1 = this.middle;
        this.elements[1].y1 = this.y+15;
        this.elements[1].x2 = this.middle;
        this.elements[1].y2 = this.y+15 -this.tickHeight;
        //console.log("location",this.middle + 4, this.y+15);
    }
}

export class pitchLader extends hudControl {
    constructor(width, height){
        super(0,0);
        this.width = width;
        this.height = height;
        const containerWidth = 200;
        const containerHeight = 200;
        this.middle = containerWidth/2;//width/2;
        this.tilt = 0;
        this.rot = 0;
        this.tickHeight = 100;
        this.tickSpace = 40;
        this.scale = 10;
        this._range = 4;
        this.middleOffset = containerHeight-(containerHeight -this.tickSpace*this._range)/2;//this.tickSpace*this._range;//height -(height - this.tickSpace*this._range )/2;
        const fontSize = 12;
        this.elements = [];
        this.scaleVals = range(
            Math.floor(this.tilt/this.scale)*this.scale - Math.floor(this.scale*this._range/2),
            Math.floor(this.tilt/this.scale)*this.scale + Math.floor(this.scale*this._range/2),
            this.scale);
        this.scaleVals = rangeClip(this.scaleVals, limitPitchLadder);
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
            this.elements.push(new GUI.Line());
            this.elements[this.elements.length-1].lineWidth = 2;
            this.elements[this.elements.length-1].color = "green";
            this.elements.push(new GUI.Line());
            this.elements[this.elements.length-1].lineWidth = 2;
            this.elements[this.elements.length-1].color = "green";
        }); 
        this.root = new GUI.Rectangle();
        this.root.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.root.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.root.widthInPixels = containerWidth;
        this.root.heightInPixels = containerHeight;
        this.root.left = width/2 - containerWidth/2;
        this.root.top = (height -(height - containerHeight )/2) -containerHeight;
        this.root.thickness = 1; 
        //this.root.addControl(line);
        this.elements.forEach(el=>this.root.addControl(el));
    }
    set angle(angle){
        this.tilt = angle;
    }
    set rotation(rotation){
        this.rot = rotation;
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
        this.scaleVals = range(
            Math.floor(this.tilt/this.scale)*this.scale - Math.floor(this.scale*this._range/2),
            Math.floor(this.tilt/this.scale)*this.scale + Math.floor(this.scale*this._range/2),
            this.scale);
        this.scaleVals = rangeClip(this.scaleVals, limitPitchLadder);
        this.tilt = tiltFloor + tiltRemd/10;      
        var space = 0;
        if (tiltRemd >=0) 
            space = this.middleOffset +tiltRemd*this.tickSpace/10;
        else 
            space = this.middleOffset + (10*this.tickSpace/10 +tiltRemd*this.tickSpace/10);
        var elemIdx = 0;
        this.scaleVals.forEach((val,idx)=>{
            var sign = 1;
            if (val<0) {
                //this.bm.setLineDash([3, 2]);
                this.elements[elemIdx+1].dash = [5, 10];
                this.elements[elemIdx+2].dash = [5, 10];
                this.elements[elemIdx+3].dash = [5, 10];
                this.elements[elemIdx+4].dash = [5, 10];
                sign = -1;
            }else{
                this.elements[elemIdx+1].dash = [];
                this.elements[elemIdx+2].dash = [];
                this.elements[elemIdx+3].dash = [];
                this.elements[elemIdx+4].dash = [];
            }
            this.elements[elemIdx].left = this.middle - this.tickHeight/2 -25;
            this.elements[elemIdx].top = space+8*sign;
            this.elements[elemIdx].text = val.toString();
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = this.middle - this.tickHeight/2;
            this.elements[elemIdx].y1 = space;
            this.elements[elemIdx].x2 = this.middle - this.tickHeight*0.3;
            this.elements[elemIdx].y2 = space;
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = this.middle + this.tickHeight*0.3;
            this.elements[elemIdx].y1 = space;
            this.elements[elemIdx].x2 = this.middle + this.tickHeight/2;
            this.elements[elemIdx].y2 = space;
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = this.middle - this.tickHeight/2;
            this.elements[elemIdx].y1 = space;
            this.elements[elemIdx].x2 = this.middle - this.tickHeight/2;
            this.elements[elemIdx].y2 = space+10*sign;
            elemIdx = elemIdx +1;
            this.elements[elemIdx].x1 = this.middle + this.tickHeight/2;
            this.elements[elemIdx].y1 = space;
            this.elements[elemIdx].x2 = this.middle + this.tickHeight/2;
            this.elements[elemIdx].y2 = space+10*sign;
            elemIdx = elemIdx +1;
            space -= this.tickSpace;
        });
        this.root.rotation = (Math.PI / 180) * this.rot;
       /* this.bm.save();
        this.bm.translate(this.width/2, this.height/2);
        this.bm.rotate((Math.PI / 180) * this.rot); // rotate
        this.bm.translate(-this.width/2, -this.height/2);

        var tiltFloor = Math.floor(this.tilt);
        var tiltRemd = Math.floor(this.tilt * 10/this.scale) % 10;
        this.scaleVals = range(
            Math.floor(this.tilt/this.scale)*this.scale - Math.floor(this.scale*this._range/2),
            Math.floor(this.tilt/this.scale)*this.scale + Math.floor(this.scale*this._range/2),
            this.scale);
        this.scaleVals = rangeClip(this.scaleVals, limitPitchLadder);
        this.tilt = tiltFloor + tiltRemd/10;
        
        var space = 0;
        if (tiltRemd >=0) 
            space = this.middleOffset +tiltRemd*this.tickSpace/10;
        else 
            space = this.middleOffset + (10*this.tickSpace/10 +tiltRemd*this.tickSpace/10);

        super.changeLocalLineWidth();

        this.scaleVals.forEach((val,idx)=>{
            this.bm.beginPath();
            this.bm.font = `bold ${12}px Arial`;
            this.bm.textAlign = 'start';
            var sign = 1;
            if (val<0) {
                this.bm.setLineDash([3, 2]);
                sign = -1;
            }
            if (val != 0){
                this.bm.moveTo(this.middle - this.tickHeight/2, space);
                this.bm.lineTo(this.middle - this.tickHeight*0.3, space); 
                this.bm.moveTo(this.middle + this.tickHeight*0.3, space);
                this.bm.lineTo(this.middle + this.tickHeight/2, space); 
                this.bm.moveTo(this.middle - this.tickHeight/2, space);
                this.bm.lineTo(this.middle - this.tickHeight/2, space+10*sign); 
                this.bm.moveTo(this.middle + this.tickHeight/2, space);
                this.bm.lineTo(this.middle + this.tickHeight/2, space+10*sign); 
                this.bm.fillText(val.toString(), this.middle - this.tickHeight/2 -25, space+8*sign);
            }else{
                this.bm.moveTo(this.middle - this.tickHeight*0.8, space);
                this.bm.lineTo(this.middle - this.tickHeight*0.3, space); 
                this.bm.moveTo(this.middle + this.tickHeight*0.3, space);
                this.bm.lineTo(this.middle + this.tickHeight*0.8, space); 
            }
            space -= this.tickSpace;
            this.bm.closePath();
            this.bm.stroke();
            this.bm.setLineDash([]);
        });
        
        super.resetGlobalLineWidth(); 
        this.bm.restore();*/
    }
}
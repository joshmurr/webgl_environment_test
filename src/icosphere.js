import { vec3 } from "gl-matrix";
import { HSVtoRGB, loadTexture } from "./utils.js";

export class Icosphere {
    constructor(gl, it, texture){
        this._vertIndex = {};
        this._vertIdCounter = 0;
        this.faces = [];
        this._position = [0, 0, 0];
        this._color = vec3.fromValues(Math.random(), Math.random(), Math.random());
        this._seedValues = vec3.fromValues(
            (Math.random() * 0.05) + 0.01, // freq  
            (Math.random() * 1.5) + 0.2, // amp   
            (Math.random() * 5) + 4,    // scale 
        );
        this._rotation = vec3.fromValues(Math.random(), Math.random(), Math.random());

        this.verts = [
            0.000, 0.000, 1.000,
            0.894, 0.000, 0.447,
            0.276, 0.851, 0.447,
            -0.724, 0.526, 0.447,
            -0.724, -0.526, 0.447,
            0.276, -0.851, 0.447,
            0.724, 0.526, -0.447,
            -0.276, 0.851, -0.447,
            -0.894, 0.000, -0.447,
            -0.276, -0.851, -0.447,
            0.724, -0.526, -0.447,
            0.000, 0.000, -1.000,
        ];
        this.faces = [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 5],
            [0, 5, 1],
            [11, 7, 6],
            [11, 8, 7],
            [11, 9, 8],
            [11, 10, 9],
            [11, 6, 10],
            [1, 6, 2],
            [2, 7, 3],
            [3, 8, 4],
            [4, 9, 5],
            [5, 10, 1],
            [6, 7, 2],
            [7, 8, 3],
            [8, 9, 4],
            [9, 10, 5],
            [10, 6, 1]
        ];

        this.normalizeVerts();
        this.createIcosphere(it); // Generates new verts and faces

        // this.colors = [];
        // for(let i=0; i<this.verts.length; i++){
            // const c = i/this.verts.length;
            // const [R,G,B] = HSVtoRGB(c, 1.0, 1.0);
            // this.colors.push(R, G, B, 1.0);
        // }

        this.indices = [];
        for(let f of this.faces){
            this.indices.push(...f);
        }
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);

        // const colorBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        this._texture = loadTexture(gl, texture);

        this._buffers = {
            position: positionBuffer,
            // color: colorBuffer,
            normal: normalBuffer,
            indices: indexBuffer,
        }
    }
    get numFaces(){
        return this.indices.length;
    }

    get buffers(){
        return this._buffers;
    }

    get texture(){
        return this._texture;
    }

    get position(){
        return this._position;
    }
    set position(pos){
        this._position[0] = pos[0];
        this._position[1] = pos[1];
        this._position[2] = pos[2];
    }

    get rotation(){
        return this._rotation;
    }

    get color(){
        return this._color;
    }

    get seedValues(){
        return this._seedValues;
    }

    normalizeVerts(){
        for(let i=0; i<this.verts.length; i+=3) {
            const norm = this.normalize(this.verts[i], this.verts[i+1], this.verts[i+2]);
            this.verts[i] = norm[0];
            this.verts[i+1] = norm[1];
            this.verts[i+2] = norm[2];
        }
    }

    createIcosphere(iterations){
        for(let i=0; i<this.verts.length; i+=3) {
            this.addToVertIndex(this.verts[i], this.verts[i+1], this.verts[i+2]);
        }
        for(let i=0; i<iterations; i++) this.refineSurface();
    }

    normalize(a, b, c){
        const len = Math.sqrt(a*a + b*b + c*c);
        return [a/len, b/len, c/len];
    }

    addToVertIndex(a, b, c){
        let k = String(a).substring(0,5)+String(b).substring(0,5)+String(c).substring(0,5);
        if(this._vertIndex[k]) return;
        else this._vertIndex[k] = [this._vertIdCounter++, [a,b,c]];
    }


    getId(a, b, c){
        const k = String(a).substring(0,5)+String(b).substring(0,5)+String(c).substring(0,5);
        return this._vertIndex[k][0];
    }

    refineSurface(){
        let newVerts = [];
        let newFaces = [];

        for(let j=0; j<this.faces.length; j++){
            const f1 = this.faces[j][0];
            const f2 = this.faces[j][1];
            const f3 = this.faces[j][2];

            const v1x = this.verts[f1*3];
            const v1y = this.verts[(f1*3)+1];
            const v1z = this.verts[(f1*3)+2];
            const v2x = this.verts[f2*3];
            const v2y = this.verts[(f2*3)+1];
            const v2z = this.verts[(f2*3)+2];
            const v3x = this.verts[f3*3];
            const v3y = this.verts[(f3*3)+1];
            const v3z = this.verts[(f3*3)+2];

            // Mid Points
            const a = this.normalize((v1x+v2x)*0.5, (v1y+v2y)*0.5, (v1z+v2z)*0.5);
            const b = this.normalize((v2x+v3x)*0.5, (v2y+v3y)*0.5, (v2z+v3z)*0.5);
            const c = this.normalize((v3x+v1x)*0.5, (v3y+v1y)*0.5, (v3z+v1z)*0.5);

            this.addToVertIndex(...a);
            this.addToVertIndex(...b);
            this.addToVertIndex(...c);

            const aID = this.getId(...a);
            const bID = this.getId(...b);
            const cID = this.getId(...c);

            newVerts.push(...a, ...b, ...c);
            newFaces.push([  f1, aID, cID]);
            newFaces.push([  f2, bID, aID]);
            newFaces.push([  f3, cID, bID]);
            newFaces.push([ aID, bID, cID]);
        }

        // Replace original verts and faces
        for(let key in this._vertIndex){
            if(this._vertIndex.hasOwnProperty(key)){
                this.verts[(this._vertIndex[key][0]*3)] = this._vertIndex[key][1][0];
                this.verts[(this._vertIndex[key][0]*3)+1] = this._vertIndex[key][1][1];
                this.verts[(this._vertIndex[key][0]*3)+2] = this._vertIndex[key][1][2];
            }
        }
        this.faces = newFaces;
    }

}

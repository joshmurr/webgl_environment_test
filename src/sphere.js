import { HSVtoRGB } from "./utils.js";

export class Sphere {
    constructor(gl){
        this._slices = 8;
        this._segments = 8;
        this._uMin = 0;
        this._vMin = 0;
        this._uMax = Math.PI;
        this._vMax = Math.PI*2;
        this._R = 1;
        this._n = 2;
        this.verts = [];
        this.faces = [];
        this.norms = [];
        this.colors = [];
        this.indices = [];

        this._translate = [2.0, 0.0, -2.5];

        this.createVerts();
        this.createFaces();
        // this.createIndices();
        // this.createNormals();
        this.createColors();

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.norms), gl.STATIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        return {
            geometry: this,
            buffers: {
                position: positionBuffer,
                color: colorBuffer,
                normal: normalBuffer,
                indices: indexBuffer,
            }
        };
    }

    get numFaces(){
        return this.indices.length;
    }
    get translate(){
        return this._translate;
    }

    createVerts(){
        let x, y, z;
        for (var i = 0; i < this._slices+1; i++) {
            let u = (i * (this._uMax-this._uMin) / this._slices) + this._uMin; // theta

            for (var j = 0; j < this._segments; j++) {
                let v = (j * (this._vMax-this._vMin) / this._slices) + this._vMin; // theta
                x = this.createX(u, v);
                y = this.createY(u, v);
                z = this.createZ(u, v);

                // const ux = Math.cos(u) * Math.sin(v);
                // const uy = Math.cos(v);
                // const uz = Math.sin(u) * Math.sin(v);

                let len = Math.sqrt(x*x + y*y + z*z);
                this.norms.push(x/len, y/len, z/len);

                this.verts.push(x,y,z);
                // this.norms.push(ux, uy, uz);
            }
        }
    }

    createFaces(){
        // MAKE INDICES
        let v = 0;
        for (let i = 0; i < this._slices; i++) {
            for (let j = 0; j < this._segments; j++) {
                let next = (j+1) % this._segments;
                const p0 = v+j;
                const p1 = v+j+this._segments;
                const p2 = v+next+this._segments;
                const p3 = v+next;
                this.faces.push([p0, p1, p2, p3]);
                this.indices.push(p0, p1, p2);
                this.indices.push(p0, p2, p3);
            }
            v = v + this._segments;
        }
    }

    
    createX(u, v){
        return Math.sin(u) * Math.cos(v);
    }
    createY(u, v){
        return Math.cos(u);
    }
    createZ(u, v){
        return -Math.sin(u) * Math.sin(v);
    }

    createColors(){
        for(let i=0; i<this.verts.length; i++){
            const c = i/this.verts.length;
            const [R,G,B] = HSVtoRGB(c, 1.0, 1.0);
            this.colors.push(R, G, B, 1.0);
        }
    }
}

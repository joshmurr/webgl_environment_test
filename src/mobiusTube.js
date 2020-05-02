import { HSVtoRGB } from "./utils.js";

export class MobiusTube {
    constructor(gl){
        this._slices = 32;
        this._segments = 32;
        this._uMin = 0;
        this._vMin = 0;
        this._uMax = Math.PI*2;
        this._vMax = Math.PI*2;
        this._R = 1;
        this._n = 2;
        this.verts = [];
        this.faces = [];
        this.norms = [];
        this.colors = [];
        this.indices = [];

        this._translate = [0.0, 0.0, 0.0];

        this.createVerts();
        this.createFaces();
        this.createIndices();
        this.createNormals();
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

                this.verts.push(x,y,z);
            }
        }
    }

    createFaces(){
        // MAKE INDICES
        let v = 0;
        for (let i = 0; i < this._slices; i++) {
            for (let j = 0; j < this._segments; j++) {
                let next = (j+1) % this._segments;
                this.faces.push([v+j, v+j+this._segments, v+next+this._segments, v+next]);
            }
            v = v + this._segments;
        }
    }

    createX(u, v){
        return (1*this._R + 0.125*Math.sin(u/2)*Math.pow(Math.abs(Math.sin(v)), 2/this._n)*Math.sign(Math.sin(v)) + 0.5*Math.cos(u/2)*Math.pow(Math.abs(Math.cos(v)), 2/this._n)*Math.sign(Math.cos(v)))*Math.cos(u);
    }
    createY(u, v){
        return (1.0*this._R + 0.125*Math.sin(u/2)*Math.pow(Math.abs(Math.sin(v)), 2/this._n)*Math.sign(Math.sin(v)) + 0.5*Math.cos(u/2)*Math.pow(Math.abs(Math.cos(v)), 2/this._n)*Math.sign(Math.cos(v)))*Math.sin(u);
    }
    createZ(u, v){
        return -0.5*Math.sin(u/2)*Math.pow(Math.abs(Math.cos(v)), 2/this._n)*Math.sign(Math.cos(v)) + 0.125*Math.cos(u/2)*Math.pow(Math.abs(Math.sin(v)), 2/this._n)*Math.sign(Math.sin(v));
    }

    createNormals(){
        for(let i=0; i<this.indices.length; i+=3){
            const p0 = this.indices[i];
            const p1 = this.indices[i+1];
            const p2 = this.indices[i+2];

            const p0x = this.verts[p0*3];
            const p0y = this.verts[(p0*3)+1];
            const p0z = this.verts[(p0*3)+2];
            const p1x = this.verts[p1*3];
            const p1y = this.verts[(p1*3)+1];
            const p1z = this.verts[(p1*3)+2];
            const p2x = this.verts[p2*3];
            const p2y = this.verts[(p2*3)+1];
            const p2z = this.verts[(p2*3)+2];

            const a = [p0x-p1x, p0y-p1y, p0z-p1z];
            const b = [p2x-p0x, p2y-p0y, p2z-p0z];

            const cross = [
                a[1]*b[2] - a[2]*b[1],
                a[2]*b[0] - a[0]*b[2],
                a[0]*b[1] - a[1]*b[0]
            ];

            const mag = Math.sqrt(cross[0]*cross[0] + cross[1]*cross[1] + cross[2]*cross[2]);

            const norm = [cross[0]/mag,cross[1]/mag,cross[2]/mag];

            this.norms.push(...norm);
        }
    }

    createColors(){
        for(let i=0; i<this.verts.length; i++){
            const c = i/this.verts.length;
            const [R,G,B] = HSVtoRGB(c, 1.0, 1.0);
            this.colors.push(R, G, B, 1.0);
        }

    }

    createIndices(){
        // 8 16 17 9
        // 8 16 17
        // 17 9 8
        for(let f of this.faces){
            // this.indices.push(...f);
            this.indices.push(f[0], f[1], f[2]);
            this.indices.push(f[0], f[2], f[3]);
        }
    }

}

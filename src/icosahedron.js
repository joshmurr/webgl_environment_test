import { HSVtoRGB } from "./utils.js";

export class Icosahedron {
    constructor(gl){
        this._translate = [-1.5, 1.0, 2.5];

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
        this.norms = [];
        for(let i=0; i<this.verts.length; i+=3){
            let x = this.verts[i]
            let y = this.verts[i+1]
            let z = this.verts[i+2]
            let len = Math.sqrt(x*x + y*y + z*z);
            this.norms.push(x/len, y/len, z/len);
        }

        this.colors = [];// new Array(20*3*4); // 20 Faces, 3 Verts, RGBA
        for(let i=0; i<this.verts.length; i++){
            const c = i/this.verts.length;
            const [R,G,B] = HSVtoRGB(c, 1.0, 1.0);
            this.colors.push(R, G, B, 1.0);
        }

        this.indices = [];
        for(let f of this.faces){
            this.indices.push(...f);
        }
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
}

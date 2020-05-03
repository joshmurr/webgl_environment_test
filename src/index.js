import { createCanvas, initShaderProgram } from "./setup";
import { mat4, vec3 } from "gl-matrix";
import { HSVtoRGB } from "./utils";
import { Icosahedron } from "./icosahedron.js";
import { Icosphere } from "./icosphere.js";
import { MobiusTube } from "./mobiusTube.js";
import { Sphere } from "./sphere.js";
import './styles.css';

var width = window.innerWidth;
var height = window.innerHeight;

var [canvas, gl] = createCanvas(window.innerWidth, window.innerHeight);

var rotation = 0;
var time = 0;
var deltaTime = 0;
var AMORTIZATION = 0.95;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;
var THETA = 0, PHI = 0;

// PLAYER + CONTROLS
// var position = { x: 0, y:0, z:20 }
var position = vec3.fromValues(0, 0, 20);
var direction = vec3.fromValues(0, 0, 0);
var right = vec3.fromValues(-1, 0, 0);
var up = vec3.create();
var target = vec3.create();
var horizontalAngle = Math.PI;
var verticalAngle = 0;
var initialFOV = 45;
var speed = 10;
var mouseSpeed = 0.05;

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mouseout", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);

document.addEventListener('keydown', updatePosition, false);



main();

function main() {
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Vertex shader program
    const vsSource = `#version 300 es
        in vec4 aVertexPosition;
        in vec3 aVertexNormal;
        in vec4 aVertexColor;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform vec3 uCameraPosition;
        uniform float uTime;
        uniform vec3 u_lightWorldPosition;

        out highp vec4 vColor;
        out highp vec3 vNormal;
        out highp vec3 vLighting;
        out vec3 v_surfaceToLight;
        out vec3 v_surfaceToView;
        out float noise;

        vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
            return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r) {
            return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        // Classic Perlin noise, periodic variant
        float pnoise(vec3 P, vec3 rep) {
            vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
            vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
            return 2.2 * n_xyz;
        }

        float turbulence( vec3 p ) {
            float w = 100.0;
            float t = -.5;

            for (float f = 1.0 ; f <= 10.0 ; f++ ){
                float power = pow( 2.0, f );
                t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
            }

            return t;
        }

        void main() {
            vec3 position = aVertexPosition.xyz;
            vNormal = aVertexNormal;

            noise = 10.0 *  -.10 * turbulence( .05 * vNormal + 0.01*uTime );
            float b = 5.0 * pnoise( 0.05 * position + vec3(0.02 * uTime), vec3( 10.0 ) );
            float displacement = - 10. * noise + b;
            position = position + vNormal * displacement;

            vColor = aVertexColor;
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 1.0);
        }
    `;

    // Fragment shader program
    const fsSource = `#version 300 es
        precision highp float;
        in vec4 vColor;
        in vec3 vLighting;
        in vec3 vNormal;
        in vec3 v_surfaceToLight;
        in vec3 v_surfaceToView;
        in float noise;

        // uniform vec3 u_reverseLightDirection;
        uniform float u_shininess;
        uniform float uTime;

        out highp vec4 outColor;

        float random( vec3 scale, float seed ){
            return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
        }

        void main() {
            // vec3 normal = normalize(vNormal);

            // float light = dot(normal, normalize(u_reverseLightDirection));

            // vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
            // vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            // vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

            // float light = dot(normal, surfaceToLightDirection);
            // float specular = dot(normal, halfVector);
            // float specular = 0.0;
            // if(light > 0.0){
                // specular = pow(dot(normal, halfVector), u_shininess);
            // }

            float r = .01 * random(vec3(12.9898, 78.233, 151.7182 ), 0.0 );
            float scale = 1.3 * noise + r;
            outColor = vec4(vec3(sin(uTime*0.1), cos(uTime*0.1), sin(-uTime*0.5))  * (1.0 - 2.0 * noise), vColor.a);
            // vec3 color = vec3(0.8, 0.4, 0.1);
            // outColor = vec4(color*scale, vColor.a);
            // outColor += specular;
        }
    `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            // textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            time: gl.getUniformLocation(shaderProgram, 'uTime'),
            reverseLightDirection: gl.getUniformLocation(shaderProgram, 'u_reverseLightDirection'),
            lightWorldPosition: gl.getUniformLocation(shaderProgram, 'u_lightWorldPosition'),
            cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
            shininess: gl.getUniformLocation(shaderProgram, 'u_shininess'),
            // uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };

    // const buffers = initBuffers(gl);
    // const buffers = new Icosahedron(gl);
    // const sphere = new Sphere(gl);
    // const tube = new MobiusTube(gl);
    const icosphere = new Icosphere(gl);
    // const buffers = MobiusTube.buffers;

    var then = 0;
    function render(now){
        now *= 0.001;
        deltaTime = now - then;
        then = now;

        if (!drag) {
            dX *= AMORTIZATION, dY*=AMORTIZATION;
            THETA+=dX, PHI+=dY;
        }

        drawScene(gl, programInfo, {icosphere});
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function drawScene(gl, programInfo, geoms) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = initialFOV * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    const viewMatrix = mat4.create();
    mouseLookAt(viewMatrix);
    // const eye = vec3.fromValues(position.x,position.y,position.z);
    // const target = vec3.fromValues(0,0,0);
    // vec3.add(target, eye, vec3.fromValues(0,0,-1));
    // const up = vec3.fromValues(0,1,0);
    // mat4.lookAt(viewMatrix, eye, target, up);

    for(const g in geoms){
        const geometry = geoms[g].geometry;
        const buffers = geoms[g].buffers;
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, geometry.translate);
        // mat4.rotate(modelMatrix, modelMatrix, THETA, [0,1,0]);
        // mat4.rotate(modelMatrix, modelMatrix, PHI, [1,0,0]);
        mat4.rotate(modelMatrix, modelMatrix, rotation, [0, 1, 0]); // Rotate around z-axis
        // mat4.rotate(modelMatrix, modelMatrix, rotation * .7, [0, 1, 0]); // Rotate around z-axis

        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        // VERTICES
        {
            const numComponents = 3; // vec3
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // NORMALS
        {
            const numComponents = 3; // vec3
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexNormal);
        }
        // VERTEX COLOUR
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray( programInfo.attribLocations.vertexColor);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.viewMatrix,
            false,
            viewMatrix);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelMatrix,
            false,
            modelMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix);
        gl.uniform1f(
            programInfo.uniformLocations.time,
            time);
        gl.uniform3fv(
            programInfo.uniformLocations.reverseLightDirection,
            [0.5, 0.7, 1]);
        gl.uniform3fv(
            programInfo.uniformLocations.lightWorldPosition,
            [20, 50, 30]);
        gl.uniform3fv(
            programInfo.uniformLocations.cameraPosition,
            position);
        gl.uniform1f(
            programInfo.uniformLocations.shininess,
            150);

        {
            // console.log(MobiusTube.numFaces);
            const vertexCount = geometry.numFaces;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }

    rotation += deltaTime;
    time += deltaTime;
}


function mouseDown(e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
    return false;
};

function mouseUp(e){
    drag = false;
};

function mouseMove(e) {
    if (!drag) return false;
    // dX = (e.pageX-old_x)*2*Math.PI/canvas.width,
        // dY = (e.pageY-old_y)*2*Math.PI/canvas.height;
    dX = (e.pageX-old_x);
    dY = (e.pageY-old_y);
    // THETA+= dX;
    // PHI+=dY;
    old_x = e.pageX, old_y = e.pageY;
    horizontalAngle += mouseSpeed * deltaTime * dX;
    verticalAngle += mouseSpeed * deltaTime * dY;
    e.preventDefault();
};

function mouseLookAt(viewMatrix){
    direction = vec3.fromValues(Math.cos(verticalAngle) * Math.sin(horizontalAngle),
                                Math.sin(verticalAngle),
                                Math.cos(verticalAngle) * Math.cos(horizontalAngle));
    right = vec3.fromValues(Math.sin(horizontalAngle - 3.14/2),
                            0,
                            Math.cos(horizontalAngle - 3.14/2));
    up = vec3.cross(up, right, direction);

    target = vec3.add(target, position, direction);
    mat4.lookAt(viewMatrix, position, target, up);
}

function updatePosition(e){
    e.preventDefault();
    if (e.key === "w")      vec3.scaleAndAdd(position, position, direction, deltaTime * speed);
    else if (e.key === "s") vec3.scaleAndAdd(position, position, direction, deltaTime * -speed);
    else if (e.key === "a") vec3.scaleAndAdd(position, position, right, deltaTime * -speed);
    else if (e.key === "d") vec3.scaleAndAdd(position, position, right, deltaTime * speed);
}

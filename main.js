'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let camera3D;                   // A StereoCamera object that represents the camera


let ModelP = 0.15;
let ModelM = 0.1;
let gui;
let videoMesh, videoTexture;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function (drawLines = true) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        /* Draw the six faces of a cube, with different colors. */

        if (drawLines) {
            gl.uniform4fv(shProgram.iColor, [0, 1, 0, 1]);
            gl.drawArrays(gl.LINE_STRIP, 0, this.count);
        }
        gl.uniform4fv(shProgram.iColor, [1, 0, 1, 1]);
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.identity()
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video
    );
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniform1i(shProgram.iDrawTexture, true);
    videoMesh.Draw(false)
    gl.uniform1i(shProgram.iDrawTexture, false);
    let [project, model] = camera3D.ApplyLeftFrustum()
    modelViewProjection = m4.multiply(project, m4.multiply(model, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.colorMask(true, false, false, false);
    surface.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);

    [project, model] = camera3D.ApplyRightFrustum()
    modelViewProjection = m4.multiply(project, m4.multiply(model, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    surface.Draw();
    gl.colorMask(true, true, true, true);
}

function CreateSurfaceData() {
    let vertexList = [];

    let uMax = Math.PI * 5;
    let uMin = 0;
    let vMax = Math.PI * 2;
    let vMin = 0;
    let uStep = uMax / 50;
    let vStep = vMax / 50;

    for (let phi = uMin; phi < uMax + uStep; phi += uStep) {
        for (let v = vMin; v < vMax + vStep; v += vStep) {
            let vert = CalculateCorrugatedSpherePoint(phi, v)
            // let n1 = CalcAnalyticNormal(phi, v, vert)
            let avert = CalculateCorrugatedSpherePoint(phi + uStep, v)
            // let n2 = CalcAnalyticNormal(phi + uStep, v, avert)
            let bvert = CalculateCorrugatedSpherePoint(phi, v + vStep)
            // let n3 = CalcAnalyticNormal(phi, v + vStep, bvert)
            let cvert = CalculateCorrugatedSpherePoint(phi + uStep, v + vStep)
            // let n4 = CalcAnalyticNormal(phi + uStep, v + vStep, cvert)

            vertexList.push(vert.x, vert.y, vert.z)
            // normalsList.push(n1.x, n1.y, n1.z)
            vertexList.push(avert.x, avert.y, avert.z)
            // normalsList.push(n2.x, n2.y, n2.z)
            vertexList.push(bvert.x, bvert.y, bvert.z)
            // normalsList.push(n3.x, n3.y, n3.z)

            vertexList.push(avert.x, avert.y, avert.z)
            // normalsList.push(n2.x, n2.y, n2.z)
            vertexList.push(cvert.x, cvert.y, cvert.z)
            // normalsList.push(n4.x, n4.y, n4.z)
            vertexList.push(bvert.x, bvert.y, bvert.z)
            // normalsList.push(n3.x, n3.y, n3.z)
        }
    }

    return vertexList;
}

function CalculateCorrugatedSpherePoint(u, v) {
    let p = ModelP;
    let m = ModelM;
    let x = (Math.E ** (m * u) + (Math.E ** (p * u)) * Math.cos(v)) * Math.cos(u);
    let y = (Math.E ** (m * u) + (Math.E ** (p * u)) * Math.cos(v)) * Math.sin(u);
    let z = (Math.E ** (p * u)) * Math.sin(v);
    x = x / 30;
    y = y / 30;
    z = z / 30;
    return { x, y, z };
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iDrawTexture = gl.getUniformLocation(prog, "drawTexture");

    gui = new dat.GUI();

    camera3D = new StereoCamera(1000, 0.1, 1, 0.2, 8, 100)
    console.log(camera3D)

    gui.add(camera3D, "mConvergence", 10, 100, 1).onChange(draw)
    gui.add(camera3D, "mEyeSeparation", 0, 0.8, 0.01).onChange(draw)
    gui.add(camera3D, "mFOV", 0.05, 1, 0.01).onChange(draw)
    gui.add(camera3D, "mNearClippingDistance", 8, 12, 0.01).onChange(draw)

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(), CreateSurfaceData());
    videoMesh = new Model('Plane');
    videoMesh.BufferData(
        [-1, 1, 0, 1, 1, 0, 1, -1, 0,
        -1, 1, 0, -1, -1, 0, 1, -1, 0],
        [1, 0, 0, 0, 0, 1,
            1, 0, 1, 1, 0, 1]
    )

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    videoTexture = CreateTexture();
    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function CreateTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}
setInterval(draw, 50)
'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let stereoCamera;
let gui;
let texture, camera, cameraTexture, cameraSurface;
let sphereSurface;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.TexCoordBufferData = function(textures) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);
    }
    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
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

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw(rotationMatrix = m4.identity()) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    // let projection = m4.perspective(Math.PI/8, 1, 8, 12);
    let projection = m4.orthographic(-3, 3, -3, 3, -3, 3);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.01);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */

    let modelViewProjection = m4.identity();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        camera
    );
    cameraSurface.Draw();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    let y = 1.0 * Math.cos(deg2rad(gamma)) * Math.cos(deg2rad(beta))
    let x = 1.0 * Math.sin(deg2rad(gamma)) * Math.cos(deg2rad(beta))
    let z = 1.0 * Math.sin(deg2rad(beta));
    modelViewProjection = m4.translation(x, y, z);
    if (panner) {
        panner.setPosition(x, y, z);
    }
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    sphereSurface.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);
    stereoCamera.ApplyLeftFrustum()

    // modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, rotationMatrix)));
    // if (!notSet) {
    //     modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, m4.xRotation(deg2rad(heading)))));
    // }
    // modelViewProjection = m4.identity()
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(true, false, false, false);
    surface.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);

    stereoCamera.ApplyRightFrustum()
    // modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, rotationMatrix)));
    // if (!notSet) {
    //     modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, m4.xRotation(deg2rad(heading)))));
    // }
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    surface.Draw();

    gl.colorMask(true, true, true, true);
}

function draw_() {
    draw()
    window.requestAnimationFrame(draw_)
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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
let ModelP = 0.15;
let ModelM = 0.1;
function CalculateCorrugatedSpherePoint(u, v) {
    let p = ModelP;
    let m = ModelM;
    let x = (Math.E ** (m * u) + (Math.E ** (p * u)) * Math.cos(v)) * Math.cos(u);
    let y = (Math.E ** (m * u) + (Math.E ** (p * u)) * Math.cos(v)) * Math.sin(u);
    let z = (Math.E ** (p * u)) * Math.sin(v);
    x = x / 10;
    y = y / 10;
    z = z / 10;
    return { x, y, z };
}

function CreateSurfaceTexCoords() {
    let vertexList = [];
    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
        }
    }
    return vertexList;
}

let a = 10;
let p = 1;
const multiplier = 10


function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    camera = getCamera();
    cameraTexture = CreateTexture();
    cameraSurface = new Model();
    cameraSurface.BufferData([-1, -1, 0, 1, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 1, 0]);
    cameraSurface.TexCoordBufferData([1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0]);

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.TexCoordBufferData(CreateSurfaceTexCoords());

    sphereSurface = new Model('Sphere');
    sphereSurface.BufferData(CreateSphereData());
    sphereSurface.TexCoordBufferData(CreateSurfaceData());


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

    spaceball = new TrackballRotator(canvas, draw, 0);
    stereoCamera = new StereoCamera(50, 1, 1, 45, 1, 20);
    loadTexture()
    gui = new guify({})
    // document.getElementsByClassName('guify-container')[0].style.zIndex = 3;
    document.getElementsByClassName('guify-container')[0].style.height = '30%'
    console.log(document.getElementsByClassName('guify-container')[0])
    console.log(document.getElementById('webglcanvas'))
    gui.Register([
        {
            type: 'range',
            object: stereoCamera, property: 'mEyeSeparation',
            label: 'Eye separation',
            min: 0, max: 1, step: 0.01,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mConvergence',
            label: 'Convergence',
            min: 10, max: 100, step: 10,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mFOV',
            label: 'Field of view',
            min: 0.01, max: 3, step: 0.01,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mNearClippingDistance',
            label: 'Near clipping distance',
            min: 9, max: 11, step: 0.01,
            onChange: () => {
                draw()
            }
        },
    ])
    initAudio()
    // draw();
    // draw_();
}

function loadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://www.manytextures.com/thumbnail/253/512/cracked+ice+snow.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        // draw()
    }
}
let magSensor;
let x1, y1, z1, x2, y2, z2, notSet = true;
let angle = 0;
let initialHeading = 0
let heading = 0;
let gamma = 0,
    beta = 0;
function readMagSensor() {
    const handleOrientationEvent = (frontToBack, leftToRight, rotateDegrees) => {
        let m = m4.multiply(m4.xRotation(deg2rad(frontToBack)), m4.multiply(m4.yRotation(deg2rad(leftToRight)), m4.zRotation(deg2rad(rotateDegrees))))
        // document.getElementById("z").innerHTML = m
        draw(m)
        // do something amazing
    };
    if (window.DeviceOrientationEvent) {
        window.addEventListener(
            "deviceorientation",
            (event) => {
                const rotateDegrees = event.alpha; // alpha: rotation around z-axis
                const leftToRight = event.gamma; // gamma: left to right
                gamma = event.gamma;
                const frontToBack = event.beta; // beta: front back motion
                beta = event.beta;
                handleOrientationEvent(frontToBack, leftToRight, rotateDegrees);
            },
            true,
        );
    }


    // magSensor = new Magnetometer({ frequency: 60 });

    // magSensor.addEventListener("reading", (e) => {
    //     if (notSet) {
    //         initialHeading = Math.atan2(magSensor.y, magSensor.x) * (180 / Math.PI);
    //         if (initialHeading < 0) {
    //             initialHeading += 360;
    //         }
    //         notSet = false
    //         //     x1 = x2
    //         //     y1 = y2
    //         //     z1 = z2
    //     }
    //     document.getElementById("x").innerHTML = magSensor.x
    //     document.getElementById("y").innerHTML = magSensor.y
    //     document.getElementById("z").innerHTML = magSensor.z
    //     heading = Math.atan2(magSensor.y, magSensor.x) * (180 / Math.PI);
    //     if (heading < 0) {
    //         heading += 360;
    //     }
    //     document.getElementById("z").innerHTML = heading
    //     //- initialHeading;
    //     // x2 = magSensor.x
    //     // y2 = magSensor.y
    //     // z2 = magSensor.z
    //     // if (notSet) {
    //     //     notSet = false
    //     // } else {
    //     //     angle = getVectorAngle([x1, y1], [x2, y2])
    //     //     document.getElementById("z").innerHTML = angle
    //     // }

    // });
    // magSensor.start();
}
const getVectorAngle = ([x1, y1], [x2, y2]) => {
    const x = x2 - x1
    const y = y2 - y1
    return (((Math.acos(y / Math.sqrt(x * x + y * y)) * (Math.sign(x) || 1)) * 180 / Math.PI) + 360) % 360
}

// function requestDeviceOrientation() {
//     if(typeof DeviceOrientationEvent !== 'undefined' &&
//       typeof DeviceOrientationEvent.requestPermission === 'function') {
//         DeviceOrientationEvent.requestPermission()
//             .then(response => {
//                 console.log(response);
//                 if (response === 'granted') {
//                     console.log('Permission granted');
//                     window.addEventListener('deviceorientation', e => {...}, true); 
//                 }
//             }).catch((err => {
//             console.log('Err', err);
//         }));
//     } else
//         console.log('not iOS');        
// }
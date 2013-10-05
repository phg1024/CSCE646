var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    vloc = gl.getAttribLocation(shaderProgram, 'aVertex');
    tloc = gl.getAttribLocation(shaderProgram, 'aUV');
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var vertexBuffer;
var texBuffer;
var tex;
var texData;
var vloc, tloc;

function initBuffers() {
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    vertices = [
        -1.0,  1.0,  -2.0,
        -1.0,  -1.0,  -2.0,
        1.0, -1.0,  -2.0,
        1.0, 1.0,  -2.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexBuffer.itemSize = 3;
    vertexBuffer.numItems = 4;

    texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), gl.STATIC_DRAW);
    texBuffer.itemSize = 2;
    texBuffer.numItems = 4;

    var w = gl.viewportWidth;
    var h = gl.viewportHeight;
    texData = new Uint8Array(w * h * 4);
    tex = gl.createTexture();
}

function interpolate(c1, c2, t)
{
    var c = {};
    c.r = c1.r * t + c2.r * (1-t);
    c.g = c1.g * t + c2.g * (1-t);
    c.b = c1.b * t + c2.b * (1-t);
    c.a = c1.a * t + c2.a * (1-t);
    return c;
}

function fillRegion( data, x1, y1, x2, y2, color )
{
    var w = gl.viewportWidth;
    var h = gl.viewportHeight;

    for(var y=y1;y<y2;y++)
    {
        for(var x=x1;x<x2;x++)
        {
            var idx = (y * w + x) * 4;
            data[idx] = color.r;
            data[idx+1] = color.g;
            data[idx+2] = color.b;
            data[idx+3] = color.a;
        }
    }
}

function fillCircle( data, bg, fg )
{
    var w = gl.viewportWidth;
    var h = gl.viewportHeight;

    var r = 0.375 * h;
    var r2 = r * r;
    var center = {x: w/2, y:h/2};
    for(var y=0;y<h;y++)
    {
        var dy = y - center.y;
        var dy2 = dy * dy;
        for(var x=0;x<w;x++)
        {
            var idx = (y * w + x) * 4;

            var dx = x - center.x;
            var dx2 = dx * dx;

            var c = fg;
            if( dx2 + dy2 > r2 )
                c = bg;

            data[idx] = c.r;
            data[idx+1] = c.g;
            data[idx+2] = c.b;
            data[idx+3] = c.a;
        }
    }
}

function fillMandelbrot(data, c1, c2, c3, c4, iters)
{
    var w = gl.viewportWidth;
    var h = gl.viewportHeight;

    var cx = w / 2;
    var cy = h / 2;

    var THRES = 1e6;

    for(var y=0;y<h;y++)
    {
        for(var x=0;x<w;x++)
        {
            var idx = (y * w + x) * 4;

            var z = new Complex((x - cx) * 3.0 / w - 0.25,
                (y - cy) * 3.0 / h);
            var c = z;

            var val = z.mag();
            var i = 0;
            while( i++ < iters && val < THRES )
            {
                z = z.mul(z).add(c);
                val = z.mag();
            }

            var t = i * 1.0 / iters;
            t = Math.pow(t, 0.25);

            var color;
            if( t >= 1.0 )
                color = c1;
            else if( t >= 0.5 )
                color = interpolate(c2, c3, Math.pow((t - 0.5) / 0.5, 0.25));
            else
                color = interpolate(c3, c4, Math.pow(t / 0.5, 2.0));

            data[idx] = color.r;
            data[idx+1] = color.g;
            data[idx+2] = color.b;
            data[idx+3] = color.a;
        }
    }
}

function fillTexture() {
    var op = document.getElementById('op');

    var w = gl.viewportWidth;
    var h = gl.viewportHeight;

    // fill the texture
    switch( op.value )
    {
        case 'red':
        {
            fillRegion(texData, 0, 0, w, h, {r:255, g:0, b:0, a:255});
            break;
        }
        case 'green':
        {
            fillRegion(texData, 0, 0, w, h, {r:0, g:255, b:0, a:255});
            break;
        }
        case 'blue':
        {
            fillRegion(texData, 0, 0, w, h, {r:0, g:0, b:255, a:255});
            break;
        }
        case 'all':
        {
            fillRegion(texData, 0, 0, w/2, h/2, {r:255, g:255, b:0, a:255});
            fillRegion(texData, w/2, 0, w, h/2, {r:255, g:0, b:0, a:255});
            fillRegion(texData, 0, h/2, w/2, h, {r:0, g:255, b:0, a:255});
            fillRegion(texData, w/2, h/2, w, h, {r:0, g:0, b:255, a:255});

            break;
        }
        case 'circle':
        {
            fillCircle(texData, {r:0, g:0, b:255, a:255}, {r:255, g:255, b:0, a:255});
            break;
        }
        case 'man':
        {
            fillMandelbrot(texData,
                           {r:0, g:0, b:0, a:255},
                           {r:128, g:32, b:32, a:64},
                           {r:0, g:255, b:0, a:255},
                           {r:0, g:0, b:255, a:255},
                           256);
            break;
        }
    }

    // upload the texture
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0,  gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData);
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    fillTexture();

    mat4.ortho(pMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 100.0);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -7.0]);

    setMatrixUniforms();

    // render the texture buffer
    gl.enableVertexAttribArray(vloc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vloc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(tloc);
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.vertexAttribPointer(tloc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");

    initGL(canvas);
    initShaders();
    initBuffers();

    var op = document.getElementById('op');
    op.onchange = drawScene;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
}
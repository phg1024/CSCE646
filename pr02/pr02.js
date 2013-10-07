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
var texImg;
var antialiasing = false;

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
    tex = gl.createTexture();

    texImg = new RGBAImage(w, h);
}

function fillShaded( img, c1, c2, c3, c4 )
{
    var w = img.w;
    var h = img.h;

    var circle = new Circle(w/2, h/2, h*0.375);
    var shadeX = w/2 - w/16, shadeY = h/2 + h/16;
    var shadeR2 = circle.r2;

    if( antialiasing ) {
        console.log('using antialiasing ...');
        var samples = document.getElementById('nsamples').value;
        var hh = 1.0 / samples;
        var samples2 = samples * samples;

        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var idx = (y * w + x) * 4;

                var cnt = 0;
                var yy = y + Math.random() * hh;

                for(var i=0;i<samples;i++) {
                    var xx = x + Math.random() * hh;

                    for(var j=0;j<samples;j++) {
                        if( circle.isInside(xx, yy) )
                            cnt++;
                        xx += hh;
                    }
                    yy += hh;
                }

                var t = cnt / samples2;
                var tIn = Math.sqrt( ((x-shadeX)*(x-shadeX) + (y-shadeY)*(y-shadeY)) / shadeR2 );
                tIn = clamp(tIn, 0.0, 1.0);
                var cIn = Color.interpolate(c1, c2, tIn);

                var tOut = ((x / w) + (y / h)) / 2.0;
                tOut = clamp(tOut, 0.0, 1.0);

                var cOut = Color.interpolate(c3, c4, tOut);
                var c = Color.interpolate(cIn, cOut, t);

                img.setPixel(x, y, c);
            }
        }
    }
    else {
        var cnt = 0;
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var idx = (y * w + x) * 4;

                var tIn = Math.sqrt( ((x-shadeX)*(x-shadeX) + (y-shadeY)*(y-shadeY)) / (shadeR2 * 1.0) );

                if( tIn < 0.2 )
                    cnt++;

                tIn = clamp(tIn, 0.0, 1.0);
                var cIn = interpolate(c1, c2, tIn);

                var tOut = ((x / w) + (y / h)) / 2.0;
                tOut = clamp(tOut, 0.0, 1.0);
                var cOut = Color.interpolate(c3, c4, tOut);

                var c = cOut;
                if( circle.isInside(x, y) )
                    c = cIn;

                img.setPixel(x, y, c);
            }
        }
        console.log(cnt);
    }
}

function fillShape( s, img, fg, bg ) {
    var w = img.w;
    var h = img.h;

    if( antialiasing ) {
        console.log('using antialiasing ...');
        var samples = document.getElementById('nsamples').value;
        var hh = 1.0 / samples;
        var samples2 = samples * samples;

        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var idx = (y * w + x) * 4;

                var cnt = 0;
                var yy = y + Math.random()*hh;

                for(var i=0;i<samples;i++) {
                    var xx = x + Math.random() * hh;

                    for(var j=0;j<samples;j++) {
                        if( s.isInside(xx, yy) )
                            cnt++;
                        xx += hh;
                    }
                    yy += hh;
                }

                var t = cnt / samples2;
                var c = Color.interpolate(fg, bg, t);

                img.setPixel(x, y, c);
            }
        }
    }
    else {
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var idx = (y * w + x) * 4;

                var c = bg;
                if( s.isInside(x + 0.5, y + 0.5) )
                    c = fg;

                img.setPixel(x, y, c);
            }
        }
    }
}

function fillImage() {
    var op = document.getElementById('op');

    var w = gl.viewportWidth;
    var h = gl.viewportHeight;

    // fill the texture
    switch( op.value ) {
        case 'circle': {
            var circle = new Circle(w/2, h/2, h*0.375);
            fillShape(circle, texImg, Color.PURPLE, Color.CYAN);
            break;
        }
        case 'convex': {
            var poly = new Polygon();
            poly.addVertex(new Point2(256, 20));
            poly.addVertex(new Point2(420, 128));
            poly.addVertex(new Point2(375, 420));
            poly.addVertex(new Point2(128, 375));
            poly.addVertex(new Point2(100, 160));

            poly.genEdges();
            fillShape(poly, texImg, Color.YELLOW, Color.BLUE);
            break;
        }
        case 'concave': {
			
            var poly = new Polygon(true);
            poly.addVertex(new Point2(256, 20));
            poly.addVertex(new Point2(420, 128));
            poly.addVertex(new Point2(250, 300));
			poly.addVertex(new Point2(375, 420));
            poly.addVertex(new Point2(128, 375));
            poly.addVertex(new Point2(100, 160));

            poly.genEdges();
			
            fillShape(poly, texImg, Color.YELLOW, Color.BLUE);
			
            break;
        }
        case 'function': {
            var fun = function(x, y) {
                var py = (y - 256) / 20.0;
                var px = Math.abs(x - 320) / 20.0;

                return (py - 5.0 * Math.sin(4.0 * px + 0.5 * PI) * Math.exp(-0.3 * px));
            }

            var f = new FunctionShape(fun);
            fillShape(f, texImg, Color.YELLOW, Color.RED);
            break;
        }
        case 'blobby': {
            var b = new Blobby();
            b.addCircle( new Circle(w * 0.25, h * 0.8, 60 ) );
            b.addCircle( new Circle(w / 6, h * 0.5, 50 ) );
            b.addCircle( new Circle(w * 0.5, h * 0.7, 75 ) );
            b.addCircle( new Circle(w * 0.5, h * 0.33, 150 ) );
            b.addCircle( new Circle(w * 0.75, h * 0.6, 100 ) );
            fillShape(b, texImg, Color.GREEN, Color.WHITE);
            break;
        }
        case 'star': {
            var star = new Star(w/2, h/2, 45, 5);
            fillShape(star, texImg, Color.WHITE, Color.BLUE);
            break;
        }
        case 'shaded':
        default:
        {
            fillShaded(texImg,
                new Color(32, 64, 255, 255),
                Color.WHITE,
                new Color(255, 150, 125, 255),
                new Color(125, 255, 128, 255)
            );
            break;
        }
    }

    // upload the texture
    texImg.uploadTexture(gl, tex);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    fillImage();

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
    op.onfocus= (function(){this.selectedIndex = -1;});
    op.onchange = drawScene;

    var ata = document.getElementById('ata');
    ata.onchange = function(){
        antialiasing = this.checked;
        drawScene();
    }

    var ns = document.getElementById('nsamples');
    ns.onchange = function(){
        console.log('using ' + this.value + ' samples for antialiasing ...');
        drawScene();
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
}
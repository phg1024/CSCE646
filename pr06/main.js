// size of the two sample canvas
var canvasWidth = 320;
var canvasHeight = 240;
var mainCanvasWidth = 640;
var mainCanvasHeight = 480;

var canvas, context;
var leftCanvas, leftContext;
var rightCanvas, rightContext;

var leftImg, rightImg;
var leftImgResized, rightImgResized;
var imgIdx = 0;
var imgsrc = ['apple.jpg', 'lighthouse.jpg', 'landscape.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage( imgname, sid )
{
    imgIdx = $('#imgselect').prop("selectedIndex");
    if( imgIdx < 0 ) imgIdx = 0;

    if( imgname == undefined )
        imgname = imgsrc[imgIdx];

    console.log('loading image ' + imgname);

    if( sid == undefined )
        sid = $("input[name=sourceid]:checked", '#sourceimage').val();

    var cvs = (sid=='left')?leftCanvas:rightCanvas;
    var ctx = cvs.getContext('2d');

    img = new Image();
    img.onload = function(){

        var curImg = RGBAImage.fromImage(img, cvs);

        if( sid=='left' ){ leftImg = imresize(curImg, mainCanvasWidth, mainCanvasHeight); }
        else{ rightImg = imresize(curImg, mainCanvasWidth, mainCanvasHeight); }

        var width = curImg.w;
        var height = curImg.h;

        curImg = imresize(curImg, canvasWidth, canvasHeight);
        if( sid=='left' )
            leftImgResized = curImg;
        else
            rightImgResized = curImg;

        cvs.width = canvasWidth;
        cvs.height = canvasHeight;
        ctx.putImageData(curImg.toImageData(ctx), 0, 0);
    };

    img.src = imgname;
}

function updateColorPatch_rgb() {
    var r = $('#red').val();
    var g = $('#gre').val();
    var b = $('#blu').val();
    var c = rgb2hsv({r:r, g:g, b:b});

    $('#hue').val(c.h);
    $('#sat').val(c.s);
    $('#val').val(c.v);

    $('.colorpatch').css('background-color', 'rgb('+ r+','+ g+','+ b+')');
}

function updateColorPatch_hsv() {
    var h = $('#hue').val();
    var s = $('#sat').val();
    var v = $('#val').val();
    console.log( h + ',' + s + ',' + v );
    var c = hsv2rgb({h:h, s:s, v:v});
    c.r *= 255;
    c.g *= 255;
    c.b *= 255;

    $('#red').val(c.r);
    $('#gre').val(c.g);
    $('#blu').val(c.b);

    $('.colorpatch').css('background-color', 'rgb('+ c.r+','+ c.g+','+ c.b+')');
}

function sampleColorFromCanvas(e) {
    console.log('sampling from the canvas ...');
    var pos = findPos(leftCanvas);
    var x = e.pageX - pos.x;
    var y = e.pageY - pos.y;
    var coord = "x=" + x + ", y=" + y;
    var p = leftContext.getImageData(x, y, 1, 1).data;
    console.log(coord + ": " + p[0] + ', ' + p[1] + ', ' + p[2]);

    $('#red').val(p[0]);
    $('#gre').val(p[1]);
    $('#blu').val(p[2]);

    updateColorPatch_rgb();
}

function applyComposition() {
    var comp = $('#compselect').val();
    var img;
    switch( comp ) {
        case 'over': {
            var alpha = $('#alpha').val();
            img = blend(leftImg, rightImg, function(a, b){
                return a.mul(alpha).add(b.mul(1-alpha));
            });
            break;
        }
        case 'mul': {
            var alpha = $('#alpha').val();
            img = blend(leftImg, rightImg, function(a, b){
                var ca = a.mul(1.0/255.0);
                var cb = b.mul(1.0/255.0);
                var c = new Color(
                    ca.r * cb.r,
                    ca.g * cb.g,
                    ca.b * cb.b,
                    1.0
                );
                return c.mul(255.0*alpha).add(b.mul(1-alpha));
            });
            break;
        }
        case 'add': {
            img = blend(leftImg, rightImg, function(a, b){
                return a.add(b).clamp();
            });
            break;
        }
        case 'sub': {
            img = blend(leftImg, rightImg, function(a, b){
                var c = a.add(b.mul(-1)).clamp();
                c.a = 255;
                return c;
            });
            break;
        }
        case 'diff': {
            img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.abs(a.r - b.r);
                c.g = Math.abs(a.g - b.g);
                c.b = Math.abs(a.b - b.b);
                c.a = 255;
                return c;
            });
            break;
        }
        case 'exc':{
            img = blend(leftImg, rightImg, function(a, b){
                var ca = a.mul(1/255.0);
                var cb = b.mul(1/255.0);
                var c = new Color();
                c.r = Math.abs(ca.r + cb.r - 2.0 * ca.r * cb.r);
                c.g = Math.abs(ca.g + cb.g - 2.0 * ca.g * cb.g);
                c.b = Math.abs(ca.b + cb.b - 2.0 * ca.g * cb.g);
                c.a = 1.0;
                return c.mul(255.0).clamp();
            });
            break;
        }
        case 'min': {
            img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.min(a.r, b.r);
                c.g = Math.min(a.g, b.g);
                c.b = Math.min(a.b, b.b);
                c.a = 255;
                return c;
            });
            break;
        }
        case 'max': {
            img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.max(a.r, b.r);
                c.g = Math.max(a.g, b.g);
                c.b = Math.max(a.b, b.b);
                c.a = 255;
                return c;
            });
            break;
        }
        case 'matting': {
            // compute the alpha mat for the foreground image
            var h = $('#hue').val();
            var s = $('#sat').val();
            var v = $('#val').val();
            var tol = $('#tol').val();

            var mask = computeAlpha(leftImg, {h:h, s:s, v:v}, tol);

            // apply median filter and gaussian blur to alpha channel
            mask = median_alpha(mask, 3);

            mask = filter_alpha(mask, new Filter.blur5());


            img = blend_mask(leftImg, rightImg, mask, function(a, b, alpha){
                return a.mul(alpha / 255.0).add(b.mul(1.0 - alpha / 255.0));
            });

            break;
        }
        case 'gmatting': {
            // compute the alpha mat for the foreground image
            var h = $('#hue').val();
            var s = $('#sat').val();
            var v = $('#val').val();
            var tol = $('#tol').val();

            var mask;
            console.log($('#alphamask').val());
            if( $('#alphamask').is(':checked')  ) {
                mask = computeAlpha(leftImg, {h:h, s:s, v:v}, tol);

                // apply median filter and gaussian blur to alpha channel
                mask = median_alpha(mask, 3);

                // extend the mask a little bit
                mask = filter_alpha(mask, new Filter.dialation(7, 'round'));

            }
            else
                mask = getMaskFromInput();


            // perform gradient domain editing
            img = gde(leftImg, rightImg, mask);
            break;
        }
    }
    canvas.width = img.w;
    canvas.height = img.h;
    context.putImageData(img.toImageData(context), 0, 0);
}

function getMaskFromInput() {
    var poly = new Polygon(true);

    for(var i=0;i<lasso.length;i++) {
        poly.addVertex(lasso[i]);
    }

    poly.genEdges();

    var mask = new AlphaMask(mainCanvasWidth, mainCanvasHeight);

    for(var y=0;y<mainCanvasHeight;y++) {
        var yPos = y / (mainCanvasHeight - 1) * (canvasHeight - 1);
        for(var x=0;x<mainCanvasWidth;x++) {
            var xPos = x / (mainCanvasWidth - 1) * (canvasWidth - 1);

            var inside = poly.isInside(xPos, yPos);
            mask.setValue(x, y, (inside)?255:0);
        }
    }

    return mask;
}

var mouseDown;
var lasso = [];
function drawLasso(closeCurve) {

    leftContext.fillStyle = '#FFFFFF';
    leftContext.clearRect(0,0,canvasWidth,canvasHeight);

    leftContext.putImageData(leftImgResized.toImageData(leftContext), 0, 0);

    if( lasso.length == 0 )
        return;

    leftContext.beginPath();
    leftContext.strokeStyle="#FF0000";
    leftContext.moveTo(lasso[0].x, lasso[0].y);
    for(var i=1;i<lasso.length;i++) {
        leftContext.lineTo(lasso[i].x, lasso[i].y);
    }

    if( closeCurve ) {
        leftContext.lineTo(lasso[0].x, lasso[0].y);
        leftContext.closePath();
    }

    leftContext.stroke();
}

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("maincanvas");
    context = canvas.getContext("2d");

    leftCanvas = document.getElementById("leftcanvas");
    leftContext = leftCanvas.getContext("2d");

    leftCanvas.onclick = function() {
        $('#rightsource').prop('checked', false);
        $('#leftsource').prop('checked', true);
        $('#leftcanvas').addClass('active');
        $('#rightcanvas').removeClass('active');
    };
    leftCanvas.ondblclick = function() {
        $('#files').click();
    };

    leftCanvas.onmousedown = function(e) {
        mouseDown = true;
        lasso = [];
    };

    leftCanvas.onmouseup = function(e) {
        mouseDown = false;
        console.log(lasso);
        drawLasso(true);
    };

    leftCanvas.onmousemove = function(e){
        if(e.shiftKey ) {
            leftCanvas.style.cursor="crosshair";
            sampleColorFromCanvas(e);
        }
        else if(e.which === 1) {
            if( mouseDown ) {
                var pos = findPos(leftCanvas);
                var x = e.pageX - pos.x;
                var y = e.pageY - pos.y;
                var coord = "x=" + x + ", y=" + y;
                console.log(coord);
                lasso.push({x:x, y:y});
                drawLasso();
            }
        }
        else {
            leftCanvas.style.cursor="auto";
        }

    }

    rightCanvas = document.getElementById("rightcanvas");
    rightContext = rightCanvas.getContext("2d");

    rightCanvas.onclick = function() {
        $('#leftsource').prop('checked', false);
        $('#rightsource').prop('checked', true);
        $('#rightcanvas').addClass('active');
        $('#leftcanvas').removeClass('active');
    };
    rightCanvas.ondblclick = function() {
        $('#files').click();
    };

    // set up callbacks for image selection
    $('#imgselect').change(function(){
        loadImage();
    });
    $('#imgselect').focus(function(){
        this.selectedIndex = -1;
    });

    $('#compselect').change(function(){
        if( this.value == 'matting' || this.value == 'gmatting' ) {
            $('#alphapanel').hide();
            $('#hsvpanel').show();
        }
        else {
            $('#hsvpanel').hide();
            $('#alphapanel').show();
        }
    });

    $('#applybutton').click(function(){
        applyComposition();
    });

    $('#hsvpanel').hide();

    $('.hsvtext').change(function(){
        updateColorPatch_hsv();
    });

    $('.rgbtext').change(function(){
        updateColorPatch_rgb();
    });

    // set up callback for uploading file
    $('#files').change(handleFileSelect);
});
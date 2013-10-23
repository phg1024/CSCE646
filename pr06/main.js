// size of the two sample canvas
var canvasWidth = 320;
var canvasHeight = 240;
var mainCanvasWidth = 640;
var mainCanvasHeight = 480;

var canvas, context;
var leftCanvas, leftContext;
var rightCanvas, rightContext;

var leftImg, rightImg;
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
        if( width > canvasWidth )
        {
            height = Math.floor(height * (canvasWidth/width));
            width = canvasWidth;
            curImg = imresize(curImg, width, height);
        }

        if( height > canvasHeight )
        {
            width = Math.floor(width * (canvasHeight/height));
            height = canvasHeight;
            curImg = imresize(curImg, width, height);
        }

        cvs.width = width;
        cvs.height = height;
        console.log(width + ', ' + height);
        ctx.putImageData(curImg.toImageData(ctx), 0, 0);
    };

    img.src = imgname;
}

function applyComposition() {
    var comp = $('#compselect').val();
    switch( comp ) {
        case 'in': {
            var img = blend(leftImg, rightImg, function(a, b){
                return a.mul(b.a / 255.0);
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'out': {
            var img = blend(leftImg, rightImg, function(a, b){
                return a.mul(1.0 - b.a / 255.0);
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'atop': {
            var img = blend(leftImg, rightImg, function(a, b){
                return a.mul(b.a / 255.0).add(b.mul(1.0- a.a/255.0));
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'xor': {
            var img = blend(leftImg, rightImg, function(a, b){
                return a.mul(1.0 - b.a / 255.0).add(b.mul(1.0- a.a/255.0));
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'over': {
            var alpha = $('#alpha').val();
            var img = blend(leftImg, rightImg, function(a, b){
                return a.mul(alpha).add(b.mul(1-alpha));
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'mul': {
            var alpha = $('#alpha').val();
            var img = blend(leftImg, rightImg, function(a, b){
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
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);

            break;
        }
        case 'add': {
            var img = blend(leftImg, rightImg, function(a, b){
                return a.add(b).clamp();
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'sub': {
            var img = blend(leftImg, rightImg, function(a, b){
                var c = a.add(b.mul(-1)).clamp();
                c.a = 255;
                return c;
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'diff': {
            var img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.abs(a.r - b.r);
                c.g = Math.abs(a.g - b.g);
                c.b = Math.abs(a.b - b.b);
                c.a = 255;
                return c;
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'exc':{
            var img = blend(leftImg, rightImg, function(a, b){
                var ca = a.mul(1/255.0);
                var cb = b.mul(1/255.0);
                var c = new Color();
                c.r = Math.abs(ca.r + cb.r - 2.0 * ca.r * cb.r);
                c.g = Math.abs(ca.g + cb.g - 2.0 * ca.g * cb.g);
                c.b = Math.abs(ca.b + cb.b - 2.0 * ca.g * cb.g);
                c.a = 1.0;
                return c.mul(255.0).clamp();
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'min': {
            var img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.min(a.r, b.r);
                c.g = Math.min(a.g, b.g);
                c.b = Math.min(a.b, b.b);
                c.a = 255;
                return c;
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'max': {
            var img = blend(leftImg, rightImg, function(a, b){
                var c = new Color();
                c.r = Math.max(a.r, b.r);
                c.g = Math.max(a.g, b.g);
                c.b = Math.max(a.b, b.b);
                c.a = 255;
                return c;
            });
            canvas.width = img.w;
            canvas.height = img.h;
            context.putImageData(img.toImageData(context), 0, 0);
            break;
        }
        case 'matting': {
            break;
        }
    }
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
        if( this.value == 'matting' ) {
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

    $('#applybutton').click(function(){
        applyComposition();
    });

    // set up callback for uploading file
    $('#files').change(handleFileSelect);

    loadImage('init0.jpg', 'left');
    setTimeout(function(){
        loadImage('init1.jpg', 'right');
    }, 100);
});
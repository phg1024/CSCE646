// size of the two sample canvas
var canvasWidth = 320;
var canvasHeight = 240;

var canvas, context;
var rightCanvas, rightContext;
var imgselect;

var img, origImgData;
var leftImg, rightImg;
var imgIdx = 0;
var imgsrc = ['landscape.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage()
{
    imgIdx = imgselect.selectedIndex;
    if( imgIdx < 0 ) imgIdx = 0;

    console.log('loading image ' + imgsrc[imgIdx]);
    img = new Image();
    img.onload = function(){

        var sid = $("input[name=sourceid]:checked", '#sourceimage').val();
        console.log('loading image to ' + sid);

        var cvs = (sid=='left')?canvas:rightCanvas;
        var ctx = (sid=='left')?context:rightContext;
        var curImg = (sid=='left')?leftImg:rightImg;

        curImg = RGBAImage.fromImage(img, ctx);

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

    img.src = imgsrc[imgIdx];
}

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("leftcanvas");
    context = canvas.getContext("2d");

    rightCanvas = document.getElementById("rightcanvas");
    rightContext = rightCanvas.getContext("2d");

    canvas.onmousedown = (function(){
        console.log('mouse down');
        context.putImageData(origImgData, 0, 0);
    });

    canvas.onmouseup = (function(){
        console.log('mouse up');
        context.putImageData(filteredImgData, 0, 0);
    });

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    imgselect.onchange=loadImage;
    imgselect.onfocus = (function(){
        this.selectedIndex = -1;
    });

    $('#compselect').change(function(){
        console.log(this.value);
    });
    $('#compselect').focus(function(){
        this.selectedIndex = -1;
    });


    // set up callback for uploading file
    document.getElementById('files').addEventListener('change', handleFileSelect, false);

    loadImage();
});
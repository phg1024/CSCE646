// size of the two sample canvas
var canvasWidth = 320;
var canvasHeight = 240;

var img, origImgData;
var curImg;
var imgIdx = 0;
var imgsrc = ['landscape.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage()
{
    imgIdx = imgselect.selectedIndex;
    if( imgIdx < 0 ) imgIdx = 0;

    console.log('loading image ' + imgsrc[imgIdx]);
    img = new Image();
    img.onload = function(){
        curImg = RGBAImage.fromImage(img, context);

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

        canvasresize(width, height);
        context.putImageData(curImg.toImageData(context), 0, 0);

        rightCanvas.width = width;
        rightCanvas.height = height;
        rightContext.putImageData(curImg.toImageData(rightContext), 0, 0);
    };

    img.src = imgsrc[imgIdx];
}

function applyTransformation() {
    var trans = document.getElementById('operations').value;
    var ops = trans.split('\n');
    console.log(ops);
    var newImg = curImg;
    for(var i=0;i<ops.length;i++) {
        var parts = ops[i].split(/\s+/);
        console.log(parts);
        var t = parts[0];
        var params;
        if( t == 'cbegin' ) {
            // collect all operations until cend
            // if cend does not appear, process until the end
            t = 'c';
            params = [];
            for(var j=i+1;j<ops.length;j++,i++) {
                var cparts = ops[j].split(/\s+/);
                if( cparts[0] == 'cend' ) {
                    break;
                }
                else {
                    params.push(cparts);
                }
            }
        }
        else if( !(t in Transformations.op) ) {
            console.log('Unsupported operation!');
            continue;
        }
        else {
            params = parts.slice(1, parts.length);
        }
        var startT = new Date();
        newImg = Transformations.op[t](newImg, params);
        var endT = new Date();
        console.log( endT - startT );
    }
    canvasresize(newImg.w, newImg.h);
    context.putImageData(newImg.toImageData(context), 0, 0);
}

function applyFilter()
{
    var filtername = filterop.options[filterop.selectedIndex].value;
    console.log('applying filter ' + filtername);

    var newimg;
    switch( filtername )
    {
        case "invert":
        {
            console.log('inverting the image ...');
            newimg = filter(curImg, Filter.invert);
            break;
        }
        case "grayscale":
        {
            console.log('converting the image to grayscale ...');
            newimg = grayscale(curImg);
            break;
        }
		case "adaptiveequal":
		{
            console.log('adaptive equalizing the image ...');
            newimg = ahe(curImg);
            break;
		}
		case "equal":
		{
            console.log('equalizing the image ...');
            newimg = equalize(curImg);
            break;			
		}
		case "equalblend":
		{
            console.log('equalizing the image with blending ...');
            newimg = equalize_blend(curImg);
            break;						
		}
        case "gradient":
        {
            newimg = filter(curImg, Filter.gradient);
            break;
        }
        case 'hsobel':
        {
            newimg = filter(curImg, Filter.hsobel);
            break;
        }
        case 'vsobel':
        {
            newimg = filter(curImg, Filter.vsobel);
            break;
        }
        case 'emboss':
        {
            newimg = filter(curImg, Filter.emboss);
            break;
        }
        case 'blur':
        {
            newimg = filter(curImg, Filter.blur);
            break;
        }
        case 'sharpen':
        {
            newimg = filter(curImg, Filter.sharpen);
            break;
        }
        case 'motion':
        {
            newimg = filter(myMat, Filter.motion);
            break;
        }
        case 'customized':
        {
            console.log('customized filter');
            // get the customized filter and apply the filter to current image
            var cf = document.getElementById("cfilter");
            var params = cf.value.split(/[\s]+/);
            var f = new Filter( params );
            console.log(f);
            newimg = filter(curImg, f);
            break;
        }
    }
    context.putImageData(newimg.toImageData(context), 0, 0);
}

var canvas, context;
var rightCanvas, rightContext;
var filterop, imgselect;
var Transformations;

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
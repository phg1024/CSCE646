var img, origImg;
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
        origImg = RGBAImage.fromImage(img, context);
        curImg = origImg;
        context.putImageData(curImg.toImageData(context), 0, 0);
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

function findClosest(img, refImgs, c) {
    var minIdx = 0, minDist = Number.MAX_VALUE;
    for(var i=0;i<refImgs.length;i++) {
        var dist = 0;
        for(var y=0;y<img.h;y++) {
            for(var x=0;x<img.w;x++) {
                var clr = refImgs[i].getPixel(x, y);
                if( clr.r > 0 ) clr = c;
                var pix = img.getPixel(x, y);
                var dr = Math.abs(clr.r - pix.r);
                var dg = Math.abs(clr.g - pix.g);
                var db = Math.abs(clr.b - pix.b);
                dist += dr*dr + dg*dg + db*db;
            }
        }
        if( dist < minDist ) {
            minDist = dist;
            minIdx = i;
        }
    }
    return minIdx;
}

function generateAsciiArt() {
    var fontAspectRatio = 0.56;
    var fontSize = $('#sizeText').val();
    var blockSizeW = fontSize*fontAspectRatio;
    var blockSizeH = fontSize;

    // divided current image into regions
    var rows = Math.floor(origImg.h / blockSizeH);
    var cols = Math.floor(origImg.w / blockSizeW);

    blockSizeW = Math.round(blockSizeW);

    var bitmapCanvas = document.getElementById('bitmap');
    bitmapCanvas.width = blockSizeW;
    bitmapCanvas.height = blockSizeH;
    var bitmapContext = bitmapCanvas.getContext('2d');
    bitmapContext.font = blockSizeH + "px " + "Courier";
    bitmapContext.fillStyle = '#ffffff';
    bitmapContext.textBaseline = 'center';
    bitmapContext.textBaseline = 'middle';

    var characterSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`~!@#$%^&*()-_=+[]{}\\|;:<>,.?/';
    var characterPixmap = [];

    for(var i=0;i<characterSet.length;i++) {
        bitmapContext.clearRect(0, 0, blockSizeW, blockSizeH);
        bitmapContext.fillText(characterSet[i], 0, blockSizeH/2);

        var imgData = bitmapContext.getImageData(0, 0, blockSizeW, blockSizeH);
        characterPixmap.push( new RGBAImage(blockSizeW, blockSizeH, imgData.data) );
    }
    $('#bitmap').hide();

    var asciiStr = "";
    var tmpImg = new RGBAImage(blockSizeW, blockSizeH);

    for(var i=0;i<rows;i++) {
        var ystart = i * blockSizeH;
        var yend = Math.min((i+1) * blockSizeH, origImg.h);
        for(var j=0;j<cols;j++) {
            var xstart = j * blockSizeW;
            var xend = Math.min((j+1)*blockSizeW, origImg.w);
            // get the average color of patch
            var c = new Color();
            for(var y=0; y<blockSizeH;y++) {
                for(var x=0;x<blockSizeW;x++) {
                    var pix = origImg.getPixel(x+xstart, y+ystart);
                    tmpImg.setPixel(x, y, pix);
                    c = c.add(pix);
                }
            }
            c = c.mul( 1.0 / (blockSizeW*blockSizeH) );
            c = c.round();
            c = c.posterize(16);

            var idx = findClosest(tmpImg, characterPixmap, c);
            asciiStr += "<font color='" + rgb2hex(c) + "'>" + characterSet[idx] + "</font>"
        }
        asciiStr += "<br>";
    }

    // render the image with the given character set
    console.log(asciiStr);

    $("#pascii").html(asciiStr);
    $("#pascii").css('width', 5.0*cols + 'px');
}

var canvas, context;
var filterop, imgselect;
var Transformations;

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    imgselect.onchange=loadImage;
    imgselect.onfocus = (function(){
        this.selectedIndex = -1;
    });

    $('#genButton').click( function(){
        generateAsciiArt();
    });

    // set up callback for uploading file
    $('#files').change( function(e){
        handleFileSelect(e);
    });

    loadImage();
});
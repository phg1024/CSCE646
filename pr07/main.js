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
        canvasresize(curImg.w, curImg.h);
        adjustImageRegion(curImg.w, curImg.h);
        setupGrid();
        context.putImageData(curImg.toImageData(context), 0, 0);
    };

    img.src = imgsrc[imgIdx];
}


var gridHandles = [];
function setupGrid() {
    // get grid size
    var gridX = $('#gridx').val();
    var gridY = $('#gridy').val();

    var stepX = canvas.width / gridX;
    var stepY = canvas.height / gridY;

    // initialize handles
    gridHandles = [];

    for(var i=0;i<=gridY;i++) {
        var y = i / gridY * stepY;
        for(var j=0;j<=gridX;j++) {
            var x = j / gridX * stepX;

            gridHandles.push([x, y]);
        }
    }

    console.log(gridHandles);
    updateGridHandles(gridHandles);
}

function performBilinearMapping( pts ) {
    var params = [
        pts[0][0], pts[0][1],
        pts[1][0], pts[1][1],
        pts[2][0], pts[2][1],
        pts[3][0], pts[3][1]
    ];
    var newImg = Transformations.op['b'](curImg, params);
    canvasresize(newImg.w, newImg.h);
    adjustImageRegion(newImg.w, newImg.h);
    context.putImageData(newImg.toImageData(context), 0, 0);
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
        console.log( endT - startT + 'ms');
    }
    canvasresize(newImg.w, newImg.h);
    adjustImageRegion(newImg.w, newImg.h);
    context.putImageData(newImg.toImageData(context), 0, 0);
}

function adjustImageRegion(w, h) {
    $('#imageregion').height(h);

    $('#mycanvas').css('margin-left', -w / 2 + 'px');

    $('#mysvg').width(w);
    $('#mysvg').height(h);
    $('#mysvg').css('margin-left', -w / 2 + 'px');
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
var transbutton, filterop, imgselect;
var Transformations;

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    canvas.onmousedown = (function(){
        console.log('mouse down');
        context.putImageData(origImgData, 0, 0);
    });

    canvas.onmouseup = (function(){
        console.log('mouse up');
        context.putImageData(filteredImgData, 0, 0);
    });

    Transformations = new transformation();

    // set up callbacks for transformation operations
    transbutton = document.getElementById('transbutton');
    transbutton.onclick = applyTransformation;

    document.getElementById('forwardbutton').checked = true;

    // set up the callbacks for mapping method selection
    document.getElementById('forwardbutton').onclick = function() {
        console.log('using forward mapping');
        Transformations.setMapping( 'forward' );
    };
    document.getElementById('inversebutton').onclick = function() {
        console.log('using inverse mapping');
        Transformations.setMapping( 'inverse' );
    };

    document.getElementById('supersampling').onclick = function() {
        console.log(((this.checked)?'':'not ') + 'using supersampling');
        Transformations.setSupersampling( this.checked );
    }

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    imgselect.onchange=loadImage;
    imgselect.onfocus = (function(){
        this.selectedIndex = -1;
    });

    $('#transparams').hide();
    $('#paramtrans').click(function(){
        $('#transparams').show();
    });
    $('#gridtrans').click(function(){
        $('#transparams').hide();
        $('#gridparams').show();
        setupGrid();
    });

    // set up callback for uploading file
    document.getElementById('files').addEventListener('change', handleFileSelect, false);

    loadImage();
    initGridTool([]);
});

$(document).ready(function(){
    $('.fbox').fancybox({
        helpers: {
            title : {
                type : 'float'
            }
        }
    });
});
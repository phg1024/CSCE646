var img, origImgData, myMat;
var imgIdx = 0;
var imgsrc = ['landscape.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage()
{
    imgIdx = imgselect.selectedIndex;
    if( imgIdx < 0 ) imgIdx = 0;

    console.log('loading image ' + imgsrc[imgIdx]);
    img = new Image();
    img.onload = function(){
        myMat = image2Matrix(img);
        origMat = myMat;
        console.log(myMat);
        origImgData = matrix2ImageData( myMat );
        context.putImageData(origImgData, 0, 0);
    };

    img.src = imgsrc[imgIdx];
}

function applyFilter()
{
    var filtername = filterop.options[filterop.selectedIndex].value;
    console.log('applying filter ' + filtername);

    var newimg;
    switch( filtername )
    {
        case "edge":
        {
            console.log('edge detection ...');
            newimg = matrix2ImageData(	edge( myMat ) );
            break;
        }
        case "erosion":
        {
            console.log('erosing the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.erosion(9)) );
            break;
        }
        case "erosion_round":
        {
            console.log('erosing the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.erosion_round(9)) );
            break;
        }
        case "erosion_star":
        {
            console.log('erosing the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.erosion_star()) );
            break;
        }
        case "dialation":
        {
            console.log('dialating the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.dialation(9)) );
            break;
        }
        case "dialation_round":
        {
            console.log('dialating the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.dialation_round(9)) );
            break;
        }
        case "dialation_star":
        {
            console.log('dialating the image ...');
            newimg = matrix2ImageData(	filter(myMat, new Filter.dialation_star()) );
            break;
        }
        case "invert":
        {
            console.log('inverting the image ...');
            newimg = matrix2ImageData(	filter(myMat, Filter.invert) );
            break;
        }
        case "grayscale":
        {
            console.log('converting the image to grayscale ...');
            newimg = matrix2ImageData(	grayscale(myMat) );
            break;
        }
		case "adaptiveequal":
		{
            console.log('equalizing the image ...');
            newimg = matrix2ImageData(	ahe(myMat) );
            break;
		}
		case "equal":
		{
            console.log('equalizing the image ...');
            newimg = matrix2ImageData(	equalize(myMat) );
            break;			
		}
		case "equalblend":
		{
            console.log('equalizing the image with blending ...');
            newimg = matrix2ImageData(	equalize_blend(myMat) );
            break;						
		}
        case "gradient":
        {
            newimg = matrix2ImageData( grayscale( filter(myMat, Filter.gradient) ) );
            break;
        }
        case 'hsobel':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.hsobel) );
            break;
        }
        case 'vsobel':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.vsobel) );
            break;
        }
        case 'emboss':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.emboss) );
            break;
        }
        case 'blur':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.blur) );
            break;
        }
        case 'sharpen':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.sharpen) );
            break;
        }
        case 'motion':
        {
            newimg = matrix2ImageData( filter(myMat, Filter.motion) );
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
            newimg = matrix2ImageData( filter(myMat, f) );
            break;
        }
    }
    filteredImgData = newimg;
    context.putImageData(newimg, 0, 0);
}

var canvas, context;
var filterop, imgselect;
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

    // set up callbacks for filter selection
    filterop = document.getElementById("filterop");

    filterop.onchange=applyFilter;
    filterop.onfocus=(function(){
        this.selectedIndex = -1;
    });

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    imgselect.onchange=loadImage;
    imgselect.onfocus = (function(){
        this.selectedIndex = -1;
    });

    // set up callback for uploading file
    document.getElementById('files').addEventListener('change', handleFileSelect, false);

    loadImage();
});
var img, origImgData, myMat;
var imgIdx = 0;
var imgsrc = ['seal.jpg', 'buck.jpg', 'waterfall.jpg'];

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

function applyCurve()
{
	var curvename = curveop.options[curveop.selectedIndex].value;
	
	var row = myMat.row,
	col = myMat.col;
	var newmat = new Mat(row, col);
	var data = newmat.data,
	data2 = myMat.data;
		
	// generate lut
	var lut = [];
	for( var i=0;i<256;i++)
	lut[i] = height - pathPos(i).y;
	
	var flag = [0, 0, 0];
	switch( curvename )
	{
	case 'red':
		{
			var idx = 0;
			for (var y=0;y<row;y++)
			{
				for (var x=0;x<col;x++,idx+=4)
				{
					var val = data2[idx];
					var yval = lut[val];

					var ratio = yval / val;
					data[idx] = data2[idx] * ratio;
					data[idx+1] = data2[idx+1];
					data[idx+2] = data2[idx+2];
					data[idx+3] = data2[idx+3];
				}
			}
			
			break;
		}
	case 'green':
		{
			var idx = 0;
			for (var y=0;y<row;y++)
			{
				for (var x=0;x<col;x++,idx+=4)
				{
					var val = data2[idx+1];
					var yval = lut[val];

					var ratio = yval / val;
					data[idx] = data2[idx];
					data[idx+1] = data2[idx+1] * ratio;
					data[idx+2] = data2[idx+2];
					data[idx+3] = data2[idx+3];
				}
			}
			
			break;
		}
	case 'blue':
		{
			var idx = 0;
			for (var y=0;y<row;y++)
			{
				for (var x=0;x<col;x++,idx+=4)
				{
					var val = data2[idx+2];
					var yval = lut[val];

					var ratio = yval / val;
					data[idx] = data2[idx];
					data[idx+1] = data2[idx+1];
					data[idx+2] = data2[idx+2] * ratio;
					data[idx+3] = data2[idx+3];
				}
			}
			break;
		}
	default:
		{
			var idx = 0;
			for (var y=0;y<row;y++)
			{
				for (var x=0;x<col;x++,idx+=4)
				{
					var val = Math.floor((data2[idx] * 299 + data2[idx+1] * 587 + data2[idx+2] * 114) / 1000);
					var yval = lut[val];

					var ratio = yval / val;
					data[idx] = data2[idx] * ratio;
					data[idx+1] = data2[idx+1] * ratio;
					data[idx+2] = data2[idx+2] * ratio;
					data[idx+3] = data2[idx+3];
				}
			}
			break;
		}
	}
	
	var newimg = matrix2ImageData( newmat );

	filteredImgData = newimg;
	context.putImageData(newimg, 0, 0);
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
			newimg = matrix2ImageData(	filter(myMat, Filter.invert) );
			break;
		}
	case "grayscale":
		{
			console.log('converting the image to grayscale ...');
			newimg = matrix2ImageData(	grayscale(myMat) );
			break;
		}
	case "gradient":
		{
			newimg = matrix2ImageData( filter(myMat, Filter.gradient) );
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
var curvecanvas, curvecontext;
var curveop, imgselect;

function changeCurveType()
{
	var curvename = curveop.options[curveop.selectedIndex].value;
	console.log('manipulating ' + curvename + ' channel');
}

window.onload = (function(){
	console.log('document loaded');

	// main canvas
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
	curveop = document.getElementById("curveop");

	curveop.onchange=changeCurveType;
	curveop.onfocus=(function(){
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
	initCurveTool();
});
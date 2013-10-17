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

function initTabs() {
    $('ul.tabs').each(function(){
        // For each set of tabs, we want to keep track of
        // which tab is active and it's associated content
        var $active, $content, $links = $(this).find('a');

        // If the location.hash matches one of the links, use that as the active tab.
        // If no match is found, use the first link as the initial active tab.
        $active = $($links.filter('[href="'+location.hash+'"]')[0] || $links[0]);
        $active.addClass('active');
        $content = $($active.attr('href'));

        // Hide the remaining content
        $links.not($active).each(function () {
            $($(this).attr('href')).hide();
        });

        // Bind the click event handler
        $(this).on('click', 'a', function(e){
            // Make the old tab inactive.
            $active.removeClass('active');
            $content.hide();

            // Update the variables with the new link and content
            $active = $(this);
            $content = $($(this).attr('href'));

            // Make the tab active.
            $active.addClass('active');
            $content.show();

            // Prevent the anchor's default click action
            e.preventDefault();
        });
    });

    // color replacement tab
    $('#rrange').change(function() {
        $('#rtext').val(this.value);
        updateColorPatch();
    });
    $('#grange').change(function() {
        $('#gtext').val(this.value);
        updateColorPatch();
    });
    $('#brange').change(function() {
        $('#btext').val(this.value);
        updateColorPatch();
    });

    $('#rtext').change(function() {
        $('#rrange').val(this.value);
        updateColorPatch();
    });
    $('#gtext').change(function() {
        $('#grange').val(this.value);
        updateColorPatch();
    });
    $('#btext').change(function() {
        $('#brange').val(this.value);
        updateColorPatch();
    });

    $('#torrange').change(function(){
        $('#tortext').val(this.value);
    });
    $('#tortext').change(function(){
        $('#torrange').val(this.value);
    });

    $('#sourceC').addClass('active');

    $('#sourceC').click(function(){
        $('#targetC').removeClass('active');
        $('#sourceC').addClass('active');
        setColorRanges( parseColor( $('#sourceC').css('background-color') ) );
    });

    $('#targetC').click(function(){
        $('#sourceC').removeClass('active');
        $('#targetC').addClass('active');
        setColorRanges( parseColor( $('#targetC').css('background-color') ) );
    });
}

function setColorRanges( c ) {
    $('#rrange').val(c.r);
    $('#grange').val(c.g);
    $('#brange').val(c.b);

    $('#rtext').val(c.r);
    $('#gtext').val(c.g);
    $('#btext').val(c.b);
}

function updateColorPatch() {
    var r = $('#rrange').val();
    var g = $('#grange').val();
    var b = $('#brange').val();
    $('.colorpatch.active').css('background-color', 'rgb('+r+','+g+','+b+')');
}

function parseColor( cstr ) {
    var rgb = cstr.split(',').map(function(str){ return parseInt(str.replace(/[^\d]/g, ''));});
    return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
    }
}

function replaceColor() {
    var h = myMat.row,
        w = myMat.col;
    var newmat = new Mat(h, w);
    var data = newmat.data,
        sdata = myMat.data;

    var sourceColor = parseColor( $('#sourceC').css('background-color') );
    var targetColor = parseColor( $('#targetC').css('background-color') );
    var THRES = $('#torrange').val();

    // replace color
    // for each pixel in the image, if the color is within threshold, replace it with the target color
    var replaceMode = 'rgb';
    if( $('#hsvmode').prop('checked') )
    {
        replaceMode = 'hsv';
    }
    console.log('replacing color with ' + replaceMode + ' mode');

    switch( replaceMode ) {
        case 'rgb': {
            for(var y= 0, idx=0;y<h;y++) {
                for(var x=0;x<w;x++,idx+=4) {
                    var r = sdata[idx+0];
                    var g = sdata[idx+1];
                    var b = sdata[idx+2];

                    if( Math.abs(r - sourceColor.r) < THRES
                        && Math.abs(g - sourceColor.g) < THRES
                        && Math.abs(b - sourceColor.b) < THRES ) {
                        data[idx+0] = targetColor.r;
                        data[idx+1] = targetColor.g;
                        data[idx+2] = targetColor.b;
                        data[idx+3] = sdata[idx+3];
                    }
                    else {
                        data[idx+0] = r;
                        data[idx+1] = g;
                        data[idx+2] = b;
                        data[idx+3] = sdata[idx+3];
                    }
                }
            }
            break;
        }
        case 'hsv': {
            var sourceHSV = rgb2hsv(sourceColor)
            var targetHSV = rgb2hsv(targetColor);

            for(var y= 0, idx=0;y<h;y++) {
                for(var x=0;x<w;x++,idx+=4) {
                    var r = sdata[idx+0];
                    var g = sdata[idx+1];
                    var b = sdata[idx+2];

                    var hsvColor = rgb2hsv({r:r, g:g, b:b});
                    var hdiff = hsvColor.h - sourceHSV.h;
                    if( Math.abs(hdiff) < THRES ) {
                        var rgb = hsv2rgb({h: targetHSV.h, s:hsvColor.s, v:hsvColor.v});
                        data[idx+0] = rgb.r * 255;
                        data[idx+1] = rgb.g * 255;
                        data[idx+2] = rgb.b * 255;
                        data[idx+3] = sdata[idx+3];
                    }
                    else {
                        data[idx+0] = r;
                        data[idx+1] = g;
                        data[idx+2] = b;
                        data[idx+3] = sdata[idx+3];
                    }
                }
            }
            break;
        }
    }

    var newimg = matrix2ImageData( newmat );
    filteredImgData = newimg;
    context.putImageData(newimg, 0, 0);
}

function reduceColor() {
    var h = myMat.row,
        w = myMat.col;
    var newmat = new Mat(h, w);
    var data = newmat.data,
        sdata = myMat.data;

    // reduce color
    // store all colors presented in the image
    var inColors = [];
    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++,idx+=4) {
            inColors.push({
                r: sdata[idx+0],
                g: sdata[idx+1],
                b: sdata[idx+2]
            });
        }
    }

    var targetCount = $('#colors').val();
    console.log('target colors = ' + targetCount);

    // reduce the colors to desired number by k-means clustering
    var colors = medianCut( inColors );

    console.log('done');
    console.log(colors);

    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++,idx+=4) {
            var r = sdata[idx+0];
            var g = sdata[idx+1];
            var b = sdata[idx+2];

            // find the closest color in the table
            var minIdx = 0, minDist = Number.MAX_VALUE;
            for(var i=0;i<colors.length;i++) {
                // find the closest color
                var cref = hex2rgb(colors[i].color);
                var dr = r - cref.r;
                var dg = g - cref.g;
                var db = b - cref.b;

                var dist = dr * dr + dg * dg + db * db;
                if( dist < minDist ) {
                    minDist = dist;
                    minIdx = i;
                }
            }

            var cMin = hex2rgb(colors[minIdx].color);
            data[idx+0] = cMin.r;
            data[idx+1] = cMin.g;
            data[idx+2] = cMin.b;
            data[idx+3] = sdata[idx+3];
        }
    }

    var newimg = matrix2ImageData( newmat );

    filteredImgData = newimg;
    context.putImageData(newimg, 0, 0);
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

function sampleColorFromCanvas(e) {
    console.log('sampling from the canvas ...');
    var pos = findPos(canvas);
    var x = e.pageX - pos.x;
    var y = e.pageY - pos.y;
    var coord = "x=" + x + ", y=" + y;
    var p = context.getImageData(x, y, 1, 1).data;
    console.log(coord + ": " + p[0] + ', ' + p[1] + ', ' + p[2]);

    $('.colorpatch.active').css('background-color', 'rgb('+p[0]+','+p[1]+','+p[2]+')');
}

window.onload = (function(){
	console.log('document loaded');

	// main canvas
	canvas = document.getElementById("mycanvas");
	context = canvas.getContext("2d");

	canvas.onmousedown = (function(e){
		console.log('mouse down');
        if(e.shiftKey) {
            // sample color from image
            sampleColorFromCanvas(e);
        }
        else {
            context.putImageData(origImgData, 0, 0);
        }
	});

	canvas.onmouseup = (function(e){
		console.log('mouse up');
        if(e.shiftKey) return;
        else context.putImageData(filteredImgData, 0, 0);
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

    // set up callback for replace color
    $('#replaceButton').click(function(){
        replaceColor();
    });

    // set up callback for reduce color
    $('#reduceButton').click(function(){
        reduceColor();
    });

	// set up callback for uploading file
	document.getElementById('files').addEventListener('change', handleFileSelect, false);

    initTabs();
	initCurveTool();

    loadImage();
});
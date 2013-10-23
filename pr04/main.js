var img, origImgData, myMat;
var imgIdx = 0;
var imgsrc = ['T.png', 'flower.jpg', 'italian.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage() {
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
    var method = $('#reduction').val();
    console.log('using ' + method + ' for color reduction');
    var colors;
    var targetCount = $('#colors').val();
    console.log('target colors = ' + targetCount);

    switch( method ) {
        case 'uniform':
        {
            colors = uniform( targetCount );
            break;
        }
        case 'population':
        {
            var inColors = [];
            for(var y=0, idx=0;y<h;y++) {
                for(var x=0;x<w;x++,idx+=4) {
                    inColors.push({
                        r: sdata[idx+0],
                        g: sdata[idx+1],
                        b: sdata[idx+2]
                    });
                }
            }
            console.log(inColors);
            console.log('input colors = ' + inColors.length);

            // sample the input colors
            var sr = $('#samplingrate').val();
            var nsamples = inColors.length * sr;
            var samples = [];
            for(var i=0;i<nsamples;i++) {
                samples.push( inColors[Math.round(Math.random() * (inColors.length - 1))] );
            }

            colors = population_curved( samples, targetCount );
            break;
        }
        case 'kmeans':
        {
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
            console.log(inColors);
            console.log('input colors = ' + inColors.length);

            var sr = $('#samplingrate').val();
            colors = kmeans( inColors, targetCount, sr );
            break;
        }
        case 'neural':
        {
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
            console.log(inColors);
            console.log('input colors = ' + inColors.length);

            var sr = $('#samplingrate').val();
            colors = neuralnetwork( inColors, targetCount, sr );
            break;
        }
        case 'mediancut':
        {
            var inColors = {};
            for(var y= 0, idx=0;y<h;y++) {
                for(var x=0;x<w;x++,idx+=4) {
                    var hex = rgb2hex({
                        r: sdata[idx+0],
                        g: sdata[idx+1],
                        b: sdata[idx+2]
                    });

                    if( !(hex in inColors) ) {
                        inColors[hex] = 1;
                    }
                    else {
                        inColors[hex] ++;
                    }
                }
            }

            var tmp = [];
            for (var hex in inColors) {
                var c = hex2rgb(hex);
                c.w = inColors[hex];

                tmp.push(c);
            }
            inColors = tmp;
            console.log(inColors);
            console.log('input colors = ' + inColors.length);

            colors = medianCut( inColors, targetCount );
            break;
        }
    }


    console.log('done: actual colors used = ' + colors.length);
    for(var i=0;i<colors.length;i++)
        console.log(colors[i]);

    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++,idx+=4) {
            var r = sdata[idx+0];
            var g = sdata[idx+1];
            var b = sdata[idx+2];

            // find the closest color in the table
            var cMin, minDist = Number.MAX_VALUE;
            for(var i=0;i<colors.length;i++) {
                // find the closest color
                var cref = colors[i];
                var dr = r - cref.r;
                var dg = g - cref.g;
                var db = b - cref.b;

                var dist = dr * dr + dg * dg + db * db;
                if( dist < minDist ) {
                    minDist = dist;
                    cMin = cref;
                }
            }

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

function CatmullRomCurve( pts ) {
    // the curve is generated using uniform knots
    this.p = pts;
    this.m = [];
    // compute the m values
    for(var i=0;i< pts.length;i++) {
        if( i == 0 ) {
            this.m.push({ x:0.5 * (pts[i+1].x - pts[i].x), y: 0.5 * (pts[i+1].y - pts[i].y)});
        }
        else if( i == pts.length - 1 ) {
            this.m.push({x: 0.5 * (pts[i].x - pts[i-1].x), y: 0.5 * (pts[i].y - pts[i-1].y)});
        }
        else {
            this.m.push({x: 0.5 * (pts[i+1].x - pts[i-1].x), y: 0.5 * (pts[i+1].y - pts[i-1].y)});
        }
    }

    this.h00 = function( t ) {
        return (1 + 2 * t) * ( 1 - t) * (1 - t);
    }

    this.h10 = function( t ) {
        return t * (1-t) * (1-t);
    }

    this.h01 = function( t ) {
        return t * t * (3 - 2 * t);
    }

    this.h11 = function( t ) {
        return t * t * (t - 1);
    }

    this.getValue = function( x ) {
        // find the segment x is in
        for(var i=0;i<this.p.length-1;i++) {
            if( x >= this.p[i].x && x <= this.p[i+1].x ){
                // compute the t value using binary search

                var xl, yl, xr, yr;
                xl = this.p[i].x; yl = this.p[i].y;
                xr = this.p[i+1].x; yr = this.p[i+1].y;
                var mxl, myl, mxr, myr;
                mxl = this.m[i].x; myl = this.m[i].y;
                mxr = this.m[i+1].x; myr = this.m[i+1].y;

                var t = 0.5, lt = 0, rt = 1.0;
                var found = false;
                var y = -1;
                while( !found ) {
                    var h00 = this.h00(t), h10 = this.h10(t), h01 = this.h01(t), h11 = this.h11(t);
                    var px = h00 * xl + h10 * mxl + h01 * xr + h11 * mxr;
                    var py = h00 * yl + h10 * myl + h01 * yr + h11 * myr;

                    var THRES = 0.01;
                    if( Math.abs(px - x) < THRES )
                    {
                        found = true;
                        y = py;
                    }
                    else {
                        if( x > px ) {
                            lt = t;
                            t = 0.5 * (lt + rt);
                        }
                        else {
                            rt = t;
                            t = 0.5 * (lt + rt);
                        }
                    }
                }

                y = clamp(y, 0, 255);
                return y;
            }
        }
    }
}

function applyCurve()
{
	var curvename = curveop.options[curveop.selectedIndex].value;
	
	var row = myMat.row,
	col = myMat.col;
	var newmat = new Mat(row, col);
	var data = newmat.data,
	data2 = myMat.data;

    // get the point coordinates using the points in the SVG
    var pts = [];
    for(var i=0;i<points.length;i++) {
        // need to flip y coordinates
        pts.push({x: points[i][0], y: 255 - points[i][1]});
    }
    console.log(pts);

    var crCurve = new CatmullRomCurve(pts);

	// generate lut using catmull-rom curve
	var lut = [0];
	for( var i=1;i<255;i++) {
	    lut[i] = crCurve.getValue(i);
    }
    lut.push(255);
	
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
					data[idx] = Math.round(data2[idx] * ratio, 0, 255);
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
					data[idx+1] = Math.round(data2[idx+1] * ratio, 0, 255);
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
					data[idx+2] = Math.round(data2[idx+2] * ratio, 0, 255);
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

                    var bias = 1e-3;
					var ratio = yval / (val + bias);
					data[idx] = Math.round(clamp(data2[idx] * ratio, 0, 255));
					data[idx+1] = Math.round(clamp(data2[idx+1] * ratio, 0, 255));
					data[idx+2] = Math.round(clamp(data2[idx+2] * ratio, 0, 255));
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
        context.putImageData(origImgData, 0, 0);
	});

	canvas.onmouseup = (function(e){
		console.log('mouse up');
        if(e.shiftKey) return;
        else context.putImageData(filteredImgData, 0, 0);
	});

    canvas.onmousemove = function(e){
        if(e.shiftKey ) {
            canvas.style.cursor="crosshair";
            sampleColorFromCanvas(e);
        }
        else {
            canvas.style.cursor="auto";
        }
    }

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

    $('#curvereset').click(function(){
        resetCurveTool();
    });

    $('#replacereset').click(function() {
        context.putImageData(origImgData, 0, 0);
    });

    $('#reducereset').click(function() {
        context.putImageData(origImgData, 0, 0);
    });


    // set up callback for uploading file
	document.getElementById('files').addEventListener('change', handleFileSelect, false);

    initTabs();
	initCurveTool();

    loadImage();
});
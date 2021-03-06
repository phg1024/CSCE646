var origImg = new RGBAImage(0, 0), ditherredImg;
var imgIdx = 0;
var imgsrc = ['building.jpg', 'bumblebee-transformers-18217-1280x800.jpg', 'zebra.jpg', 'fox.jpg'];

var maxWidth = 1024;
var maxHeight = 600;

function loadImage( filename, cvs, tgt )
{
	if( !filename ) {
		imgIdx = imgselect.selectedIndex;
		if( imgIdx < 0 ) imgIdx = 0;
		filename = imgsrc[imgIdx];
	}
    console.log('loading image ' + filename);
	
	cvs = cvs || canvas;
	tgt = tgt || origImg;
    var img = new Image();
    img.onload = function(){
        var curImg = RGBAImage.fromImage(img, cvs);

        var width = curImg.w;
        var height = curImg.h;

        if( width > maxWidth )
        {
            height = Math.floor(height * (maxWidth/width));
            width = maxWidth;
            curImg = imresize(curImg, width, height);
        }

        if( height > maxWidth )
        {
            width = Math.floor(width * (maxWidth/height));
            height = maxWidth;
            curImg = imresize(curImg, width, height);
        }

        cvs.width = width;
        cvs.height = height;

        tgt.setImage(curImg);
		ctx = cvs.getContext('2d');
		ctx.putImageData(tgt.toImageData(ctx), 0, 0);
    };

    img.src = filename;
}

function applyDithering()
{
    var method = $('#ditherop').val();
    console.log('applying dithering ' + method);

    var levels = parseInt($("#levels").val());
    console.log('levels = ' + levels);
    var h = origImg.h,
        w = origImg.w;
    var newimg;
    switch( method )
    {
        case 'simple':
        {
            // copy the image
            var tmpimg = origImg.toRGBAImagef();
            var data = tmpimg.data,
                data2 = origImg.data;

            var neighbor = [[1,0], [-1, 1], [0, 1]];
            var step = 255. / levels;

            var idx = 0;
            var nn = neighbor.length;
            idx = 0;
            for(var y=0;y<h;y++)
            {
                for(var x=0;x<w;x++, idx+=4)
                {
                    var r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2];

                    /// quantize the channel, then convert back to RGB pixel
                    var r = Math.round(r0 / 255. * levels) * step;
                    var g = Math.round(g0 / 255. * levels) * step;
                    var b = Math.round(b0 / 255. * levels) * step;

                    var lev = rgb2intensity({r:r, g:g, b:b, a:255});
                    var offset = lev.r * 4;
                    var invwsum = 1.0 / coeffs[offset+3];
                    var weights = [coeffs[offset] * invwsum, coeffs[offset+1] * invwsum, coeffs[offset+2] * invwsum];


                    data[idx] = r;
                    data[idx+1] = g;
                    data[idx+2] = b;

                    var er, eg, eb;
                    er = r0 - r;
                    eg = g0 - g;
                    eb = b0 - b;

                    for(var i=0;i<nn;i++)
                    {
                        var px = clamp(x + neighbor[i][0], 0, w-1);
                        var py = clamp(y + neighbor[i][1], 0, h-1);

                        var pidx = ( py * w + px ) * 4;
                        var pr = data[pidx], pg = data[pidx+1], pb = data[pidx+2];

                        var pr = pr + weights[i] * er;
                        var pg = pg + weights[i] * eg;
                        var pb = pb + weights[i] * eb;

                        data[pidx] = pr;
                        data[pidx+1] = pg;
                        data[pidx+2] = pb;
                    }
                }
            }

            newimg = tmpimg.toRGBAImage();
            break;
        }
        case 'floyd':
        {
            // copy the image
            var tmpimg = origImg.toRGBAImagef();
            var data = tmpimg.data,
                data2 = origImg.data;

            var neighbor = [[1,0], [-1, 1], [0, 1], [1,1]];
            var weights = [7./16., 3./16., 5./16., 1./16.];
            var step = 255. / levels;

            var idx = 0;
            for(var y=0;y<h;y++)
            {
                for(var x=0;x<w;x++, idx+=4)
                {
                    var r0 = data[idx], g0 = data[idx+1], b0 = data[idx+2];

                    /// quantize the channel, then convert back to RGB pixel
                    var r = Math.round(r0 / 255. * levels) * step;
                    var g = Math.round(g0 / 255. * levels) * step;
                    var b = Math.round(b0 / 255. * levels) * step;

                    data[idx] = r;
                    data[idx+1] = g;
                    data[idx+2] = b;

                    var er, eg, eb;
                    er = r0 - r;
                    eg = g0 - g;
                    eb = b0 - b;

                    for(var i=0;i<4;i++)
                    {
                        var px = clamp(x + neighbor[i][0], 0, w-1);
                        var py = clamp(y + neighbor[i][1], 0, h-1);

                        var pidx = ( py * w + px ) * 4;
                        var pr = data[pidx], pg = data[pidx+1], pb = data[pidx+2];

                        pr = pr + weights[i] * er;
                        pg = pg + weights[i] * eg;
                        pb = pb + weights[i] * eb;

                        data[pidx] = pr;
                        data[pidx+1] = pg;
                        data[pidx+2] = pb;
                    }
                }
            }

            newimg = tmpimg.toRGBAImage();
            break;
        }
        case 'ordered':
        {
            newimg = new RGBAImage(w, h);
            var data = newimg.data,
                data2 = origImg.data;

            var m = [
                [1, 9, 3, 11],
                [13, 5, 15, 7],
                [4, 12, 2, 10],
                [16, 8, 14, 6]
            ];

            var ratio = 1.0 / 17.0;
            var step = 255. / levels;
            var idx = 0;
            for(var y=0;y<h;y++)
            {
                for(var x=0;x<w;x++,idx+=4)
                {
                    var r = data2[idx], g = data2[idx+1], b = data2[idx+2];

                    r = clamp(r + m[x%4][y%4] * ratio * step, 0., 255.);
                    g = clamp(g + m[x%4][y%4] * ratio * step, 0., 255.);
                    b = clamp(b + m[x%4][y%4] * ratio * step, 0., 255.);

                    /// quantize the channel, then convert back to RGB pixel
                    r = Math.round(r / 255. * levels) * step;
                    g = Math.round(g / 255. * levels) * step;
                    b = Math.round(b / 255. * levels) * step;

                    data[idx] = r;
                    data[idx+1] = g;
                    data[idx+2] = b;
                    data[idx+3] = data2[idx+3];
                }
            }
            break;
        }
        case 'random':
        {
            newimg = new RGBAImage(w, h);
            var data = newimg.data,
                data2 = origImg.data;

            var step = 255. / levels;
            var max_diff = Math.round(step);
            var idx = 0;
            for(var y=0;y<h;y++)
            {
                for(var x=0;x<w;x++,idx+=4)
                {
                    var r = data2[idx], g = data2[idx+1], b = data2[idx+2];

                    /// add noise to the pixel
                    var n;
                    n = (Math.random() - 0.5) * max_diff;
                    r = clamp( r + n, 0, 255 );
                    n = (Math.random() - 0.5) * max_diff;
                    g = clamp( g + n, 0, 255 );
                    n = (Math.random() - 0.5) * max_diff;
                    b = clamp( b + n, 0, 255 );

                    /// quantize the channel, then convert back to RGB pixel
                    r = Math.round(r / 255. * levels) * step;
                    g = Math.round(g / 255. * levels) * step;
                    b = Math.round(b / 255. * levels) * step;

                    data[idx] = r;
                    data[idx+1] = g;
                    data[idx+2] = b;
                    data[idx+3] = data2[idx+3];
                }
            }
            break;
        }
        case 'halftoning': {
            var blockSize = parseInt($('#levels').val());

            var yBlocks = Math.ceil(h / blockSize);
            var xBlocks = Math.ceil(w / blockSize);

            newimg = new RGBAImage(w, h);

            var nsamples = 8;
            var delta = 1.0 / nsamples;

            var fillBlock = function(x0, y0, x1, y1, r, c) {
                var xc = (x0 + x1) * 0.5;
                var yc = (y0 + y1) * 0.5;
                var r2 = r*r;
                for(var y=y0;y<y1;y++) {
                    for(var x=x0;x<x1;x++) {
                        // supersample
                        var cnt=0;
                        for(var ny=0;ny<nsamples;ny++){
                            var dy = y - yc + ny * delta;
                            for(var nx=0;nx<nsamples;nx++) {
                                var dx = x - xc + nx * delta;
                                var dist2 = dx*dx + dy*dy;
                                if( dist2 <= r2 ) {
                                    cnt++;
                                }
                            }
                        }


                        newimg.setPixel(x, y, c.mulc(cnt/(nsamples*nsamples)));
                    }
                }
            };

            for(var i=0;i<yBlocks;i++) {
                var y0 = i * blockSize;
                var y1 = clamp((i+1) * blockSize, 0, h);
                for(var j=0;j<xBlocks;j++) {
                    var x0 = j * blockSize;
                    var x1 = clamp((j+1) * blockSize, 0, w);

                    // compute average level of the block
                    var lev = 0;
                    var c = new Color(0, 0, 0, 0);
                    for(var y=y0;y<y1;y++) {
                        for(var x=x0;x<x1;x++) {
                            var pix = origImg.getPixel(x, y);
                            lev += rgb2intensity(pix).r;
                            c = c.add(pix);
                        }
                    }

                    var pixCount = ((y1-y0) * (x1-x0));
                    lev /= pixCount;
                    c = c.mul(1.0/pixCount);

                    var r = clamp(((lev / 256) + 0.25), 0, 1) * blockSize * 0.5;

                    // fill the region with a dot of radius r, using color c
                    fillBlock(x0, y0, x1, y1, r, c);
                }
            }
            break;
        }
        case 'halftoning2': {
            var blockSize = parseInt($('#levels').val());

            var yBlocks = Math.ceil(h / blockSize);
            var xBlocks = Math.ceil(w / blockSize);

            newimg = new RGBAImage(w, h);

            var nsamples = 8;
            var delta = 1.0 / nsamples;

            var fillBlock = function(x0, y0, x1, y1, r, c) {
                var xc = (x0 + x1) * 0.5;
                var yc = (y0 + y1) * 0.5;
                var r2 = r*r;
                for(var y=y0;y<y1;y++) {
                    for(var x=x0;x<x1;x++) {
                        // supersample
                        var cnt=0;
                        for(var ny=0;ny<nsamples;ny++){
                            var dy = y - yc + ny * delta;
                            for(var nx=0;nx<nsamples;nx++) {
                                var dx = x - xc + nx * delta;
                                var dist2 = dx*dx + dy*dy;
                                if( dist2 <= r2 ) {
                                    cnt++;
                                }
                            }
                        }
                        newimg.setPixel(x, y, c.mulc(cnt/(nsamples*nsamples)));
                    }
                }
            };

            for(var i=0;i<yBlocks;i++) {
                var y0 = i * blockSize;
                var y1 = clamp((i+1) * blockSize, 0, h);
                for(var j=0;j<xBlocks;j++) {
                    var x0 = j * blockSize;
                    var x1 = clamp((j+1) * blockSize, 0, w);

                    // compute average level of the block
                    var lev = 0;
                    var c = new Color(0, 0, 0, 0);
                    for(var y=y0;y<y1;y++) {
                        for(var x=x0;x<x1;x++) {
                            var pix = origImg.getPixel(x, y);
                            lev += rgb2intensity(pix).r;
                            c = c.add(pix);
                        }
                    }

                    var pixCount = ((y1-y0) * (x1-x0));
                    lev /= pixCount;
                    c = c.mul(1.0/pixCount);

                    var r = (clamp((lev / 255) + 0.1, 0, 1) * blockSize * 0.25);
                    var rr = (clamp((c.r / 255) + 0.1, 0, 1) * blockSize * 0.25);
                    var rg = (clamp((c.g / 255) + 0.1, 0, 1) * blockSize * 0.25);
                    var rb = (clamp((c.b / 255) + 0.1, 0, 1) * blockSize * 0.25);

                    // fill the region with a dot of radius r, using color c
                    var xc = (x0+x1) * 0.5;
                    var yc = (y0+y1) * 0.5;
                    fillBlock(x0, y0, xc, yc, rr, Color.RED);
                    fillBlock(xc, y0, x1, yc, rg, Color.GREEN);
                    fillBlock(x0, yc, xc, y1, rb, Color.BLUE);
                    fillBlock(xc, yc, x1, y1, r,  Color.WHITE);
                }
            }
            break;
        }
        case 'artistic1':
        {
            var blockSize = 8;
            var mask = [
                1, 1, 0, 1, 1, 0, 1, 1,
                0, 1, 1, 0, 0, 1, 1, 0,
                1, 0, 1, 1, 1, 1, 0, 1,
                1, 0, 0, 1, 1, 0, 0, 1,
                1, 0, 1, 1, 1, 1, 0, 1,
                0, 1, 1, 0, 0, 1, 1, 0,
                1, 1, 0, 1, 1, 0, 1, 1
            ];

            newimg = artisticScreen( origImg, {mask:mask, blockSize: blockSize} );

            break;
        }
        case 'artistic3':
        {
            var blockSize = parseInt($('#levels').val());

			// there should be 16 masks
			var masks = [];
            var nsamples = 8;
            var step = 1.0 / nsamples;
            var bStep = 0.25;
            var totalMasks = Math.ceil(blockSize/bStep);
			// create mask from the given mask image
			for(var sid=0;sid<totalMasks;sid++) {
                var maskSize = blockSize - sid * bStep;
                var topY = 0.5 * (blockSize - maskSize);
                var bottomY = topY + maskSize;
                var leftX = topY;
                var rightX = bottomY;
                var m = [];
				for(var i=0;i<blockSize;i++) {
                    var y = i;
					for(var j=0;j<blockSize;j++) {
                        var x = j;
                        var cnt = 0;
                        for(var ny=0;ny<nsamples;ny++) {
                            var yy = ny * step + y;
                            var yyy = (yy - topY) / maskSize;
                            for(var nx=0;nx<nsamples;nx++) {
                                var xx = nx * step + x;
                                var xxx = (xx - leftX) / maskSize;

                                if( xxx >= 0 && xxx < 1.0
                                 && yyy >= 0 && yyy < 1.0 ) {
                                    cnt += (maskImg.sample(xxx * maskImg.w, yyy * maskImg.h).r>0)?1:0;
                                }
                            }
                        }

						m.push(cnt / (nsamples*nsamples));
					}
				}
                masks.push(m);
			}
			
            newimg = artisticScreen( origImg, {mask:masks, blockSize: blockSize}, masks.length );

            break;
        }
        case 'artistic2':
        {
            var blockSize = 8;
            var mask = [
                1, 1, 0, 0, 0, 1, 1, 0,
                1, 1, 1, 0, 0, 0, 1, 1,
                0, 1, 1, 1, 0, 0, 0, 1,
                0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 0, 0, 0,
                1, 0, 0, 0, 0, 0, 0, 0,
                1, 1, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 0, 0, 0, 0, 0
            ];

            newimg = artisticScreen( origImg, {mask:mask, blockSize: blockSize} );

            break;
        }
    }

    ditherredImg = newimg;
    context.putImageData(ditherredImg.toImageData(context), 0, 0);
}

function artisticScreen( inImg, m, n ) {
    var w = inImg.w, h = inImg.h;
    var blockSize = m.blockSize;
    var mask = m.mask;
	var nmasks = n || 1;
    var ratio = m.ratio || 0.65;

    var yBlocks = Math.ceil(h / blockSize);
    var xBlocks = Math.ceil(w / blockSize);

    var newimg = new RGBAImage(w, h);

    console.log(m);
    console.log(nmasks);

    var fillBlock;
	if( nmasks == 1 ) {
		fillBlock = function(x0, y0, x1, y1) {
			for(var y=y0, i=0;y<y1;y++,i++) {
				for(var x=x0, j=0;x<x1;x++, j++) {

					var ratio = mask[i*blockSize+j] * inImg.getPixel(x, y).intensity() / 255.0;
					if( mask[i*blockSize+j] )
						newimg.setPixel(x, y, inImg.getPixel(x, y));
					else
						newimg.setPixel(x, y, inImg.getPixel(x, y).mulc(ratio));
				}
			}
		};
	}
	else {
		fillBlock = function(x0, y0, x1, y1) {
			// determine the average brightness first
            var cSum = new Color(0, 0, 0, 0);
            for(var y=y0, i=0;y<y1;y++,i++) {
                for(var x=x0, j=0;x<x1;x++, j++) {
                    var c = inImg.getPixel(x, y);
                    cSum = cSum.add(c);
                }
            }
			// choose a mask based on the average brightness
            var cAvg = cSum.mul(1.0 / ((x1-x0) * (y1-y0)));
            var avgLev = cAvg.intensity();
            var mid = Math.round((1.0 - (avgLev/255.0)) * 0.75 * (nmasks-1));
			var m = mask[mid];

			// apply the mask
            for(var y=y0, i=0;y<y1;y++,i++) {
                for(var x=x0, j=0;x<x1;x++, j++) {

                    var mVal = m[i*blockSize+j];

                    // color
                    newimg.setPixel(x, y, cAvg.round().clamp().mulc(mVal));

                    // black-white
                    //newimg.setPixel(x, y, Color.WHITE.mulc(mVal));
                }
            }
		};
	}

    for(var i=0;i<yBlocks;i++) {
        var y0 = i * blockSize;
        var y1 = clamp((i+1) * blockSize, 0, h);
        for(var j=0;j<xBlocks;j++) {
            var x0 = j * blockSize;
            var x1 = clamp((j+1) * blockSize, 0, w);

            fillBlock(x0, y0, x1, y1);
        }
    }

    return newimg;
}

var canvas, context;
var wcanvas, wcontext;
var maskImg = new RGBAImage(0, 0);
var imgselect;
window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");	
    context = canvas.getContext("2d");
	
	wcanvas = document.getElementById("worker");
	wcontext = wcanvas.getContext("2d");

    canvas.onmousedown = (function(){
        console.log('mouse down');
        context.putImageData(origImg.toImageData(context), 0, 0);
    });

    canvas.onmouseup = (function(){
        console.log('mouse up');
        context.putImageData(ditherredImg.toImageData(context), 0, 0);
    });

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    $('#imgselect').change(function(){loadImage();});
    $('#imgselect').focus(function(){
        this.selectedIndex = -1;
    });

    $('#apply_btn').click(function() {
        applyDithering();
    });

    // set up callback for uploading file
    $('#files').change(function(e) {
        handleFileSelect(e);
    });
	
	$('#worker').hide();
    $('#patterns').hide();

    $('#maskselect').change(function(){
        var filename = $('#maskselect').val();
        console.log(filename);
        loadImage(filename, wcanvas, maskImg);
    });

    $('#ditherop').change(function() {
		var dop = $('#ditherop').val();
        if( dop == 'artistic3')
            $('#patterns').show();
        else
            $('#patterns').hide();

		if( dop == 'floyd' || dop == 'ordered' || dop == 'random' || dop == 'simple' ) {
		}
		else {
		}
    });

	loadImage('TAM.jpg', wcanvas, maskImg);
    loadImage();
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
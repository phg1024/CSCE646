var origImg, ditherredImg;
var imgIdx = 0;
var imgsrc = ['building.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage()
{
    imgIdx = imgselect.selectedIndex;
    if( imgIdx < 0 ) imgIdx = 0;

    console.log('loading image ' + imgsrc[imgIdx]);
    var img = new Image();
    img.onload = function(){
        origImg = RGBAImage.fromImage(img, canvas);
        console.log(origImg);
        context.putImageData(origImg.toImageData(context), 0, 0);
    };

    img.src = imgsrc[imgIdx];
}

function applyDithering()
{
    var method = ditherop.options[ditherop.selectedIndex].value;
    console.log('applying dithering ' + method);

    var levels = parseInt(document.getElementById("levels").value);
    console.log('levels = ' + levels);
    var h = origImg.h,
        w = origImg.w;
    var newimg = new RGBAImage(w, h);
    var data = newimg.data,
        data2 = origImg.data;

    switch( method )
    {
        case 'simple':
        {
            var neighbor = [[1,0], [-1, 1], [0, 1]];
            var step = 255. / levels;

            // copy the image
            var idx = 0;
            for(var y=0;y<h;y++) {
                for(var x=0;x<w;x++) {
                    newimg.setPixel(x, y, origImg.getPixel(x, y));
                }
            }

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

                        pr = clamp(pr + weights[i] * er, 0., 255.);
                        pg = clamp(pg + weights[i] * eg, 0., 255.);
                        pb = clamp(pb + weights[i] * eb, 0., 255.);

                        data[pidx] = pr;
                        data[pidx+1] = pg;
                        data[pidx+2] = pb;
                    }
                }
            }
            break;
        }
        case 'floyd':
        {
            var neighbor = [[1,0], [-1, 1], [0, 1], [1,1]];
            var weights = [7./16., 3./16., 5./16., 1./16.];
            var step = 255. / levels;

            // copy the image
            var idx = 0;
            for(var y=0;y<h;y++) {
                for(var x=0;x<w;x++) {
                    newimg.setPixel(x, y, origImg.getPixel(x, y));
                }
            }

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

                        pr = clamp(pr + weights[i] * er, 0., 255.);
                        pg = clamp(pg + weights[i] * eg, 0., 255.);
                        pb = clamp(pb + weights[i] * eb, 0., 255.);

                        data[pidx] = pr;
                        data[pidx+1] = pg;
                        data[pidx+2] = pb;
                    }
                }
            }
            break;
        }
        case 'ordered':
        {
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
    }

    ditherredImg = newimg;
    context.putImageData(ditherredImg.toImageData(context), 0, 0);
}

var canvas, context;
var ditherop, imgselect;
window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    canvas.onmousedown = (function(){
        console.log('mouse down');
        context.putImageData(origImg.toImageData(context), 0, 0);
    });

    canvas.onmouseup = (function(){
        console.log('mouse up');
        context.putImageData(ditherredImg.toImageData(context), 0, 0);
    });

    // set up callbacks for filter selection
    ditherop = document.getElementById("ditherop");

    ditherop.onchange=applyDithering;
    ditherop.onfocus=(function(){
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
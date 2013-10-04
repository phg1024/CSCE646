var img, origImgData, myMat;
var imgIdx = 0;
var imgsrc = ['building.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

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

function applyDithering()
{
    var method = ditherop.options[ditherop.selectedIndex].value;
    console.log('applying dithering ' + method);

    var levels = parseInt(document.getElementById("levels").value);
    console.log('levels = ' + levels);
    var row = myMat.row,
        col = myMat.col;
    var newimg = new Mat(row, col);
    var data = newimg.data,
        data2 = myMat.data;

    switch( method )
    {
        case 'floyd':
        {
            var neighbor = [[1,0], [-1,-1], [0, 1], [1,1]];
            var weights = [7./16., 3./16., 5./16., 1./16.];
            var step = 255. / levels;

            // copy the image
            var idx = 0;
            for(var yy=0;yy<row;yy++)
            {
                for(var xx=0;xx<col;xx++, idx+=4)
                {
                    data[idx] = data2[idx];
                    data[idx+1] = data2[idx+1];
                    data[idx+2] = data2[idx+2];
                    data[idx+3] = data2[idx+3];
                }
            }

            idx = 0;
            for(var y=0;y<row;y++)
            {
                for(var x=0;x<col;x++, idx+=4)
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
                        var px = clamp(x + neighbor[i][0], 0, col-1);
                        var py = clamp(y + neighbor[i][1], 0, row-1);

                        var pidx = ( py * col + px ) * 4;
                        var pr = data[pidx], pg = data[pidx+1], pb = data[pidx+2];

                        pr = (clamp(pr + weights[i] * er, 0., 255.));
                        pg = (clamp(pg + weights[i] * eg, 0., 255.));
                        pb = (clamp(pb + weights[i] * eb, 0., 255.));

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
            for(var y=0;y<row;y++)
            {
                for(var x=0;x<col;x++,idx+=4)
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
            for(var y=0;y<row;y++)
            {
                for(var x=0;x<col;x++,idx+=4)
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
    newimg = matrix2ImageData(newimg);
    console.log(newimg);
    filteredImgData = newimg;
    context.putImageData(newimg, 0, 0);
}

var canvas, context;
var ditherop, imgselect;
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
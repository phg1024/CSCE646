var canvas, context;
var rescanvas, rescontext;

var sourceImages;
var radmap = {};       // radiancemap
var needupdate;

function parseDeltaT( filename ) {
    var s = filename.match(/\d+/g);
    if( !s ) return undefined;
    var norm = parseFloat(s[0]);
    var denorm = parseFloat(s[1]);
    return norm/denorm;
}

function uploadImages( files ) {
    $('#div_res').hide();
    $('#div_hdrmap').hide();

    $('#sourceimages').empty();
    sourceImages = [];
    for(var i=0;i<files.length;i++) {
        (function(file){
            var filename = file.name;
            var reader = new FileReader();
            reader.onload = function (event) {
                var img = new Image();
                img.onload = function(e) {
                    var I = RGBAImage.fromImage(this, canvas);
                    I.filename = filename;
                    (EXIF.getData(file, function(){
                        var expTime = EXIF.getTag(this, "ExposureTime");
                        I.deltaT = parseFloat(expTime);
                    }));

                    sourceImages.push(I);
                    img.width = 256;
                    img.className = 'sourceimg';
                    $('#sourceimages').append(img);
                };
                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        })(files[i]);
    }

    // if the exposure time is not found in EXIF, try to find it from the file name
    for(var i=0;i<sourceImages.length;i++) {
        var si = sourceImages[i];
        if( isNaN(si.deltaT) || !si.deltaT ) si.deltaT = parseDeltaT(filename);
        if( isNaN(si.deltaT) || !si.deltaT ) {
            // no exposure time found, yell loudly
            alert( 'Failed to find exposure time for image ' + si.filename + ', abort.' );
            throw 'Failed to find exposure time information.';
        }
    }
    console.log(sourceImages);

    radmap.needupdate = true;

    $('#div_source').show();
}

function sampleSourceImages( sourceImages ) {
    var tmpimg = sourceImages[0];
    var w = tmpimg.w, h = tmpimg.h;
    var npixels = tmpimg.w * tmpimg.h;
    var nexposures = sourceImages.length;

    var ceil = Math.ceil;

    var nsamples = ceil(255 * 2 / (nexposures - 1)) * 2;
    var step = ceil(npixels / nsamples);
    var zRed = [], zGreen = [], zBlue = [];
    var sampleindices = new Array(nsamples);

    for(var j= 0,idx=0;j<nsamples;j++, idx+= step) {
        sampleindices[j] = clamp(idx, 0, npixels-1);
    }

    for(var i=0;i<nexposures;i++) {
        var img = sourceImages[i];
        var data = img.data;
        var zri = new Array(nsamples), zgi = new Array(nsamples), zbi = new Array(nsamples);

        for(var j= 0,idx=0;j<nsamples;j++, idx+= step) {
            var pidx = clamp(idx, 0, npixels-1) * 4;

            zri[j] = data[pidx];
            zgi[j] = data[pidx+1];
            zbi[j] = data[pidx+2];
        }

        zRed.push(zri);
        zGreen.push(zgi);
        zBlue.push(zbi);
    }

    return {
        zr: zRed,
        zg: zGreen,
        zb: zBlue,
        idx: sampleindices
    };
}

function gsolve(Z, exposures, l, w) {
    var n = 256;
    var nsamples = Z[0].length;
    var nexposures = exposures.length;

    // row major storage
    var A = numeric.rep([nsamples*nexposures+n+1, n+nsamples], 0);
    var b = numeric.rep([nsamples*nexposures+n+1], 0);

    // fill in the entries
    var k = 0;
    for(var i=0;i<nsamples;i++) {
        for(var j=0;j<nexposures;j++) {
            var lev = Z[j][i];
            var wij = w[lev];
            A[k][lev] = wij;
            A[k][n+i] = -wij;
            b[k] = wij * exposures[j];
            k++;
        }
    }

    // fix the curve by setting its middle value to 0
    A[k++][129] = 1;

    // smoothness
    for(var i=0;i<n-2;i++) {
        var wi = w[i+1];
        A[k][i] = l * wi;
        A[k][i+1] = -2*l*wi;
        A[k][i+2] = l*wi;
        k++;
    }

    var At = numeric.ccsSparse(numeric.transpose(A));
    var A = numeric.ccsSparse(A);
    var AtA = numeric.ccsDot(At, A);
    var Atb = numeric.ccsMV(At, b);

    var g = numeric.ccsLUPSolve(numeric.ccsLUP(AtA), Atb);
    return g.slice(0, 256);
}

function hdr(sourceimgs, gr, gg, gb, weights) {
    var tmpimg = sourceimgs[0];
    var w = tmpimg.w, h = tmpimg.h;
    var npixels = tmpimg.w * tmpimg.h;
    var nexposures = sourceimgs.length;

    var hdrmap = new RGBAImagef(w, h);
    hdrmap.apply(function(c) {
        return new Color(0, 0, 0, 0);
    });
    var summap = new RGBAImagef(w, h);
    summap.apply(function(c) {
        return new Color(0, 0, 0, 0);
    });

    for(var i=0;i<nexposures;i++) {
        console.log('processing the ' + i + 'th out of ' + nexposures + ' images ...');
        var si = sourceimgs[i];
        var dt = Math.log(si.deltaT);
        // accumulate the weights in the sum map
        si.map(function(x, y, c) {

            // get the weights using the pixel values
            var wr = weights[c.r];
            var wg = weights[c.g];
            var wb = weights[c.b];

            // accumulate the weights
            var sc = summap.getPixel(x, y);
            summap.setPixel(x, y, new Color(sc.r + wr, sc.g + wg, sc.b + wb, 0));

            var dr = gr[c.r] - dt;
            var dg = gg[c.g] - dt;
            var db = gb[c.b] - dt;

            var hc = hdrmap.getPixel(x, y);
            hdrmap.setPixel(x, y, new Color(
                hc.r + wr * dr,
                hc.g + wg * dg,
                hc.b + wb * db,
                0
            ));

            var saturated = (c.r == 255 || c.g == 255 || c.b == 255);
            if( saturated ) {
                summap.setPixel(x, y, new Color(0, 0, 0, 1));
                hdrmap.setPixel(x, y, new Color(0, 0, 0, 1));
            }
        });
    }

    // handle saturated pixels
    var slast = sourceimgs[sourceimgs.length - 1];
    var slast_dt = Math.log(slast.deltaT);
    console.log(slast.deltaT);
    hdrmap.map(function(x, y, c) {
        var saturated = (c.a > 0);
        if( saturated ) {
            var sc = slast.getPixel(x, y);
            var dr = gr[sc.r] - slast_dt;
            var dg = gg[sc.g] - slast_dt;
            var db = gb[sc.b] - slast_dt;

            hdrmap.setPixel(x, y, new Color(dr, dg, db, 0));
            summap.setPixel(x, y, new Color(1.0, 1.0, 1.0, 0));
        }
    });

    hdrmap.map(function(x, y, c) {
        var s = summap.getPixel(x, y);
        var r = Math.exp(c.r / s.r);
        var g = Math.exp(c.g / s.g);
        var b = Math.exp(c.b / s.b);

        hdrmap.setPixel(x, y, new Color(r, g, b, 1.0));
    });

    return hdrmap;
}

function generateRadianceMap() {
    if( !radmap.needupdate ) return;

    if( !sourceImages.length || sourceImages.length < 2 ) {
        alert('Not enough images to perform reconstruction. You need at least 2 images.');
        throw 'Not enough images.';
    }

    var tmpimg = sourceImages[0];
    var w = tmpimg.w, h = tmpimg.h;
    var npixels = tmpimg.w * tmpimg.h;
    var nexposures = sourceImages.length;

    for(var i=0;i<nexposures;i++) {
        // if the exposure time is not found in EXIF, try to find it from the file name
        var si = sourceImages[i];
        if( isNaN(si.deltaT) || !si.deltaT ) si.deltaT = parseDeltaT(si.filename);
        if( isNaN(si.deltaT) || !si.deltaT ) {
            // no exposure time found, yell loudly
            alert( 'Failed to find exposure time for image ' + si.filename + ', abort.' );
            throw 'Failed to find exposure time information.';
        }
    }

    // sort the source images by their exposure time
    sourceImages.sort(function(a, b) { return b.deltaT - a.deltaT;} );
    console.log(sourceImages);

    var exposures = [];
    for(var i=0;i<nexposures;i++) {
        exposures.push(Math.log(sourceImages[i].deltaT));
    }
    console.log(exposures);

    // lambda smoothing factor
    var lmda = 50;

    // compute the weights of the weighting function
    var weights = [];
    for(var i=0;i<256;i++) {
        weights[i] = (function(z, zmin, zmax){
            if (z <= 0.5 * (zmin + zmax))
                // never let the weights be zero because that would influence the equation system!!!
                return ((z - zmin) + 1);
            else
                return ((zmax - z) + 1);
        })(i, 0, 255);
    }

    console.log(weights);

    // sample the source images
    var samples = sampleSourceImages( sourceImages );

    // solve for the curve
    var gr = gsolve(samples.zr, exposures, lmda, weights);
    var gg = gsolve(samples.zg, exposures, lmda, weights);
    var gb = gsolve(samples.zb, exposures, lmda, weights);

    // assemble the hdr radiance map
    var hdrmap = hdr(sourceImages, gr, gg, gb, weights);

    // visualize the hdr map
    var luminance = new MonoImagef(w, h);
    var maxLumin = -Number.MAX_VALUE, minLumin = Number.MAX_VALUE;
    hdrmap.map(function(x, y, c){
        var lev = c.r * 0.2125 + c.g * 0.7154 + c.g * 0.0721;
        luminance.setPixel(x, y, lev);

        maxLumin = Math.max(maxLumin, lev);
        minLumin = Math.min(minLumin, lev);
    });

    radmap = {
        needupdate : false,
        hdrmap: hdrmap,
        luminance: luminance,
        maxLumin: maxLumin,
        minLumin: minLumin
    };
}

// reinhard global operator
function tonemapping( radiancemap, method ) {
    switch( method ) {
        case 'reinhard':
        default: {
            var options = {
                a: $('#avalue').val(),
                gamma: $('#gammavalue').val()
            };
            return reinhard( radiancemap, options );
        }
        case 'bilateral': {
            var options = {
                dR: $('#drvalue').val(),
                gamma: $('#gammavalue2').val()
            };
            return bilateral_tonemapping( radiancemap, options );
        }
        /*
        case 'gradient': {
            var options = {};
            return gradient_tonemapping( radiancemap, options );
        }
        */
    }
}

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    rescanvas = document.getElementById("rescanvas");
    rescontext = rescanvas.getContext('2d');

    $('#genButton').click( function(){
        console.log("generating hdr radiance map ...");
        generateRadianceMap();
        var himg = radmap.hdrmap;
        var limg = radmap.luminance;

        console.log(radmap);

        var minL = Math.log(radmap.minLumin + 1e-16);
        var maxL = Math.log(radmap.maxLumin + 1e-16);
        var diffL = maxL - minL;
        console.log('max lumin = ' + radmap.maxLumin);
        console.log('min lumin = ' + radmap.minLumin);

        // visualize the luminance map
        var I = new RGBAImage(limg.w, limg.h);
        limg.map(function(x, y, c) {
            var ratio = (Math.log(c + 1e-16) - minL) / diffL;
            // interpolate
            I.setPixel(x, y, Color.colormap(ratio));
        });

        var ww = Math.min(I.w, 800);
        var hh = Math.round(I.h * (ww / I.w));

        I = imresize(I, ww, hh);
        I.render(canvas);
        $('#div_hdrmap').show();

        var It = tonemapping( radmap, $('#tmselect').val() );
        It = imresize(It, ww, hh);
        It.render(rescanvas);

        $('#div_res').show();

    });

    $('#div_res').hide();
    $('#div_hdrmap').hide();
    $('#div_source').hide();
    $('#control_bilateral').hide();

    $('#tmselect').change(function() {
        if( $('#tmselect').val() == 'bilateral' ) {
            $('#control_reinhard').hide();
            $('#control_bilateral').show();
        }
        else {
            $('#control_bilateral').hide();
            $('#control_reinhard').show();
        }
    });

    // set up callback for uploading file
    $('#files').change( function(e){
        handleFileSelect(e);
    });
});
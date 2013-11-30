var canvas, context;
var rescanvas, rescontext;

var sourceImages;

function parseDeltaT( filename ) {
    var s = filename.match(/\d+/g);
    var norm = parseFloat(s[0]);
    var denorm = parseFloat(s[1]);
    return norm/denorm;
}

function uploadImages( files ) {
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
                    I.deltaT = parseDeltaT(filename);
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
    // sort the source images by their exposure time
    sourceImages.sort(function(a, b) { return b.deltaT - a.deltaT;} );
    console.log(sourceImages);

    var tmpimg = sourceImages[0];
    var w = tmpimg.w, h = tmpimg.h;
    var npixels = tmpimg.w * tmpimg.h;
    var nexposures = sourceImages.length;

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

    var exposures = [];
    for(var i=0;i<nexposures;i++) {
        exposures.push(Math.log(sourceImages[i].deltaT));
    }

    console.log(exposures);

    // solve for the curve
    var gr = gsolve(samples.zr, exposures, lmda, weights);
    var gg = gsolve(samples.zg, exposures, lmda, weights);
    var gb = gsolve(samples.zb, exposures, lmda, weights);

    // assemble the hdr radiance map
    var hdrmap = hdr(sourceImages, gr, gg, gb, weights);

    // visualize the hdr map
    var luminance = new RGBAImagef(w, h);
    var maxLumin = 0, minLumin = Number.MAX_VALUE;
    hdrmap.map(function(x, y, c){
        var lev = c.r * 0.2125 + c.g * 0.7154 + c.g * 0.0721;
        luminance.setPixel(x, y, new Color(lev, lev, lev, 1.0));

        maxLumin = Math.max(maxLumin, lev);
        minLumin = Math.min(minLumin, lev);
    });

    return {
        hdrmap: hdrmap,
        luminance: luminance,
        maxLumin: maxLumin,
        minLumin: minLumin
    };
}

// reinhard global operator
function tonemapping( radiancemap ) {
    var epsilon = 1e-4;
    var a = 0.72;
    var saturation = 0.6;

    var himg = radiancemap.hdrmap;
    var limg = radiancemap.luminance;

    var w = himg.w;
    var h = himg.h;
    var npixels = w * h;

    var Lsum = 0;
    limg.map(function(x, y, c) {
        Lsum += Math.log(epsilon + c.r);
    });
    var key = Math.exp(Lsum / npixels);
    var factor = a / key;

    var scaledLumin = new RGBAImagef(w, h);
    limg.map(function(x, y, c) {
        scaledLumin.setPixel(x, y, c.mul(factor));
    });

    var ldrLuminanceMap = new RGBAImagef(w, h);
    scaledLumin.map(function(x, y, c) {
        ldrLuminanceMap.setPixel(x, y, c.mul(1.0 / (c.r+1.0)));
    });

    var I = new RGBAImage(w, h);
    // log linear mapping
    I.map(function(x, y, c) {
        var lev = limg.getPixel(x, y).r;
        var ldlev = limg.getPixel(x, y).r;
        var hc = himg.getPixel(x, y);

        var nc = new Color(
            Math.pow(hc.r / lev, saturation) * ldlev,
            Math.pow(hc.g / lev, saturation) * ldlev,
            Math.pow(hc.b / lev, saturation) * ldlev,
            255
        );
        I.setPixel(x, y, nc.round().clamp());
    });

    return I;
}

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    rescanvas = document.getElementById("rescanvas");
    rescontext = rescanvas.getContext('2d');

    $('#genButton').click( function(){
        console.log("generating hdr radiance map ...");
        var rmap = generateRadianceMap();
        var himg = rmap.hdrmap;
        var limg = rmap.luminance;

        console.log(rmap);

        var minL = rmap.minLumin;
        var maxL = rmap.maxLumin;
        var diffL = maxL - minL;
        console.log('max lumin = ' + rmap.maxLumin);
        console.log('min lumin = ' + rmap.minLumin);

        // visualize the luminance map
        var I = new RGBAImage(limg.w, limg.h);
        limg.map(function(x, y, c) {
            var lev = c.r;
            var ratio = (lev - minL) /diffL;
            // interpolate
            I.setPixel(x, y, Color.colormap(ratio));
        });

        I.render(canvas);

        var It = tonemapping( rmap );
        It.render(rescanvas);
    });

    // set up callback for uploading file
    $('#files').change( function(e){
        handleFileSelect(e);
    });
});
var canvas, context;

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
    return g;
}

function hdr(sourceimgs, gr, gg, gb, w) {
    var tmpimg = sourceimgs[0];
    var w = tmpimg.w, h = tmpimg.h;
    var npixels = tmpimg.w * tmpimg.h;
    var nexposures = sourceImages.length;

    var hdrmap = new RGBAImagef(w, h);
    var summap = new RGBAImagef(w, h);
    var m = new RGBAImagef(w, h);

    for(var i=0;i<nexposures;i++) {
        var si = sourceimgs[i];
        // accumulate the weights in the sum map
        si.map(function(x, y, c) {
            var wr = w[c.r];
            var wg = w[c.g];
            var wb = w[c.b];
            var sc = summap.getPixel(x, y);
            summap.setPixel(x, y, new Color(sc.r + wr, sc.g + wg, sc.b + wb, 0));
        });

        si.map(function(x, y, c) {
            var dr = gr[c.r] - si.deltaT;
            var dg = gg[c.g] - si.deltaT;
            var db = gb[c.b] - si.deltaT;
            m.setPixel(x, y, new Color(dr, dg, db, 0));
        });

        // handle saturated pixels
    }

    //
}

function generateRadianceMap() {
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
    var hdrmap = hdr(sourceImages, gr, gg, gb, w);
}

window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    $('#genButton').click( function(){
        console.log("generating hdr radiance map ...");
        generateRadianceMap();
    });

    // set up callback for uploading file
    $('#files').change( function(e){
        handleFileSelect(e);
    });
});
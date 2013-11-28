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
                    var I = RGBAImage.fromImage(this, context);
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
                w = ((z - zmin) + 1);
            else
                w = ((zmax - z) + 1);

        })(i, 1, 256);
    }

    // sample the source images
    var samples = sampleSourceImages( sourceImages );
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
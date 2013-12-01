/**
 * Created by PhG on 11/30/13.
 */

function reinhard( radiancemap, options ) {
    var epsilon = 1e-16;
    var a = options.a || 0.72;
    var gamma = options.gamma || 0.5;

    var himg = radiancemap.hdrmap;
    var limg = radiancemap.luminance;

    var w = himg.w;
    var h = himg.h;
    var npixels = w * h;

    var Lsum = 0;
    limg.map(function(x, y, c) {
        Lsum += Math.log(epsilon + c);
    });
    var key = Math.exp(Lsum / npixels );
    var factor = a / key;

    var scaledLumin = new MonoImagef(w, h);
    limg.map(function(x, y, c) {
        scaledLumin.setPixel(x, y, c * factor);
    });

    var ldrLuminanceMap = new MonoImagef(w, h);
    scaledLumin.map(function(x, y, c) {
        ldrLuminanceMap.setPixel(x, y, c / (c+1.0));
    });

    var I = new RGBAImage(w, h);
    I.map(function(x, y, c) {
        var lev = limg.getPixel(x, y);
        var ldlev = ldrLuminanceMap.getPixel(x, y) * 255;
        var hc = himg.getPixel(x, y);

        var nc = new Color(
            Math.pow(hc.r / lev, gamma) * ldlev,
            Math.pow(hc.g / lev, gamma) * ldlev,
            Math.pow(hc.b / lev, gamma) * ldlev,
            255
        );
        I.setPixel(x, y, nc.round().clamp());
    });

    return I;
}

function bilateral_tonemapping( radiancemap, options ) {
    var epsilon = 1e-16;
    var sigmaR = options.sigmaR || 1.0;
    var sigmaP = options.sigmaP || 2.0;
    var kernelSize = options.kernelSize || 5.0;
    var dR = options.dR || 4.0;
    var gamma = options.gamma || 0.5;

    var himg = radiancemap.hdrmap;
    var limg = radiancemap.luminance;
    var w = himg.w;
    var h = himg.h;
    var npixels = w * h;

    // log luminance
    var loglimg = new MonoImagef(w, h);
    limg.map(function(x, y, c) {
        var loglev = Math.log(c + epsilon);
        loglimg.setPixel(x, y, loglev);
    });

    // bilateral filter
    var bf = bilateralf( loglimg, sigmaP, sigmaR, kernelSize );
    var maxB = -Number.MAX_VALUE;
    var minB = Number.MAX_VALUE;

    var detail = new MonoImagef(w, h);
    loglimg.map(function(x, y, c) {
        var levb = bf.getPixel(x, y);
        var levd = c - levb;

        maxB = Math.max(maxB, levb);
        minB = Math.min(minB, levb);

        detail.setPixel(x, y, levd);
    });

    var s = Math.log(dR) / (maxB - minB);
    console.log(s);

    // B' = (B - maxB) * s
    // scale the luminance
    var ldrLuminanceMap = new MonoImagef(w, h);
    detail.map(function(x, y, c) {
        var dlev = c;
        var blev = bf.getPixel(x, y);

        var olev = Math.exp( (blev - maxB) * s + dlev);
        ldrLuminanceMap.setPixel(x, y, olev);
    });

    var I = new RGBAImage(w, h);
    I.map(function(x, y, c) {
        var lev = limg.getPixel(x, y);
        var ldlev = ldrLuminanceMap.getPixel(x, y) * 255;
        var hc = himg.getPixel(x, y);

        var nc = new Color(
            Math.pow(hc.r / lev, gamma) * ldlev,
            Math.pow(hc.g / lev, gamma) * ldlev,
            Math.pow(hc.b / lev, gamma) * ldlev,
            255
        );
        I.setPixel(x, y, nc.round().clamp());
    });


    return I;
}

// not completed yet
function gradient_tonemapping( radiancemap, options ) {
    var epsilon = 1e-16;
    var gamma = options.gamma || 0.5;

    var himg = radiancemap.hdrmap;
    var limg = radiancemap.luminance;
    var w = himg.w;
    var h = himg.h;
    var npixels = w * h;

    // log luminance
    var loglimg = new MonoImagef(w, h);
    limg.map(function(x, y, c) {
        var loglev = Math.log(c + epsilon);
        loglimg.setPixel(x, y, loglev);
    });

    // decompose the log luminance image into a Gaussian pyramid
    var pog = [];
    pog.push(loglimg);
    var levels = Math.floor(Math.log((Math.min(w, h) / 32)) / Math.log(2));
    console.log(levels);
    for(var i=0;i<levels;i++) {
        var gi = gaussianf(pog[i]);
        gi = imresizef(gi, Math.floor(gi.w/2), Math.floor(gi.h/2));
        pog.push(gi);
    }
    console.log(pog[pog.length-1].w + ' ' + pog[pog.length-1].h);



    var ldrLuminanceMap = new MonoImagef(w, h);

    var I = new RGBAImage(w, h);
    I.map(function(x, y, c) {
        var lev = limg.getPixel(x, y);
        var ldlev = ldrLuminanceMap.getPixel(x, y) * 255;
        var hc = himg.getPixel(x, y);

        var nc = new Color(
            Math.pow(hc.r / lev, gamma) * ldlev,
            Math.pow(hc.g / lev, gamma) * ldlev,
            Math.pow(hc.b / lev, gamma) * ldlev,
            255
        );
        I.setPixel(x, y, nc.round().clamp());
    });

    // the compression function
    var phi = [];
    for(var i=pog.length-1;i>=0;i--) {

    }


    return I;
}
Math.epsilon = 1e-6;

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

Array.prototype.mean = function() {
    return this.sum() / this.length;
};

Array.prototype.sum = function() {
    return this.reduce(function(a, b) { return a + b });
};

// a * x + b = 0
function linearSolve(a, b) {
    return [-b / a];
}

// a * x^2 + b * x + c = 0
function quadraticSolve(a, b, c) {
    if( a == 0 ) {
        // linear solve
        return linearSolve(b, c);
    }
    else {
        var delta = b*b - 4*a*c;
        if( delta < 0 )
        {
            return [];
        }
        else
        {
            return [(-b+Math.sqrt(delta))/(2.0*a), (-b-Math.sqrt(delta))/(2.0*a)];
        }
    }
}

function rgb2hex( c ) {
    return ("0" + c.r.toString(16)).slice(-2) +
        ("0" + c.g.toString(16)).slice(-2) +
        ("0" + c.b.toString(16)).slice(-2);
}

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if( !result ) console.log( hex );
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function clamp(val, lower, upper) {
    return Math.min(Math.max(lower, val), upper);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        uploadImage( f );
    }
}

function uploadImage( file ) {
    var fr, img;

    console.log('loading image ' + file);

    if (typeof window.FileReader !== 'function') {
        write("The file API isn't supported on this browser yet.");
        return;
    }

    fr = new FileReader();
    fr.onload = createImage;
    fr.readAsDataURL(file);

    function createImage() {
        img = new Image();
        img.onload = imageLoaded;
        img.src = fr.result;
    }

    function imageLoaded() {

        var cvs = canvas;
        var ctx = context;

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

        origImg = curImg;

        ctx.putImageData(origImg.toImageData(ctx), 0, 0);
    }
}
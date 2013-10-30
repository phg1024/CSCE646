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

function rgb2int( c ) {
    return c.r << 16 | c.g << 8 | c.b;
}

function int2rgb( v ) {
    return {
        r: (v >> 16) & 0xff,
        g: (v >> 8 ) & 0xff,
        b: v & 0xff
    }
}

function rgb2hsv(c){
    //***Returns an hsv object from RGB values
    //***The r (red), g (green), and b (blue) should be values in the range 0 to 1
    //***The returned object has .h, .s, and .v properties.
    //***h is a value from 0 to 360
    //***s and v are values between 0 and 1
    var h,s,v,max,min,d;
    r = c.r / 255.0, g = c.g / 255.0, b = c.b / 255.0;

    r=r>1?1:r<0?0:r;
    g=g>1?1:g<0?0:g;
    b=b>1?1:b<0?0:b;

    max=min=r;
    if (g>max) max=g; if (g<min) min=g;
    if (b>max) max=b; if (b<min) min=b;
    d=max-min;
    v=max;
    s=(max>0)?d/max:0;

    if (s==0) h=0;
    else {
        h=60*((r==max)?(g-b)/d:((g==max)?2+(b-r)/d:4+(r-g)/d));
        if (h<0) h+=360;
    }
    return {h:h,s:s,v:v}
}

function hsv2rgb( c ){
    //***Returns an rgb object from HSV values
    //***h (hue) should be a value from 0 to 360
    //***s (saturation) and v (value) should be a value between 0 and 1
    //***The .r, .g, and .b properties of the returned object are all in the range 0 to 1
    var r,g,b,i,f,p,q,t;
    h = c.h, s = c.s, v = c.v;
    while (h<0) h+=360;
    h%=360;
    s=s>1?1:s<0?0:s;
    v=v>1?1:v<0?0:v;

    if (s==0) r=g=b=v;
    else {
        h/=60;
        f=h-(i=Math.floor(h));
        p=v*(1-s);
        q=v*(1-s*f);
        t=v*(1-s*(1-f));
        switch (i) {
            case 0:r=v; g=t; b=p; break;
            case 1:r=q; g=v; b=p; break;
            case 2:r=p; g=v; b=t; break;
            case 3:r=p; g=q; b=v; break;
            case 4:r=t; g=p; b=v; break;
            case 5:r=v; g=p; b=q; break;
        }
    }
    return {r:r,g:g,b:b};
}

function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
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

        var sid = $("input[name=sourceid]:checked", '#sourceimage').val();

        var cvs = (sid=='left')?leftCanvas:rightCanvas;
        var ctx = (sid=='left')?leftContext:rightContext;

        var curImg = RGBAImage.fromImage(img, cvs);

        if( sid=='left' ){ leftImg = imresize(curImg, mainCanvasWidth, mainCanvasHeight); }
        else{ rightImg = imresize(curImg, mainCanvasWidth, mainCanvasHeight); }

        var width = curImg.w;
        var height = curImg.h;
        if( width > canvasWidth )
        {
            height = Math.floor(height * (canvasWidth/width));
            width = canvasWidth;
            curImg = imresize(curImg, width, height);
        }

        if( height > canvasHeight )
        {
            width = Math.floor(width * (canvasHeight/height));
            height = canvasHeight;
            curImg = imresize(curImg, width, height);
        }

        cvs.width = width;
        cvs.height = height;

        ctx.putImageData(curImg.toImageData(ctx), 0, 0);
    }
}
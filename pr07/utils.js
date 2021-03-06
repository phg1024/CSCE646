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

function canvasresize(__width, __height)
{
    canvas.width = __width;
    canvas.height = __height;
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
        curImg = RGBAImage.fromImage(img, context);

        var width = curImg.w;
        var height = curImg.h;
        if( width > 640 )
        {
            height = Math.floor(height * (640.0/width));
            width = 640;
            curImg = imresize(curImg, width, height);
        }

        if( height > 640 )
        {
            width = Math.floor(width * (640.0/height));
            height = 640;
            curImg = imresize(curImg, width, height);
        }

        console.log(curImg);
        canvasresize(width, height);
        adjustImageRegion(curImg.w, curImg.h);
        
        console.log($('#gridtrans').is(':checked'));
        if( $('#gridtrans').is(':checked') )
        {            
            setupGrid();
        }
        context.putImageData(curImg.toImageData(context), 0, 0);
    }
}
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

function rgb2hex( c ) {
    return ("0" + c.r.toString(16)).slice(-2) +
        ("0" + c.g.toString(16)).slice(-2) +
        ("0" + c.b.toString(16)).slice(-2);
}

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

    var flist = [];
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        console.log(f);
        flist.push(f);
    }

    uploadImages( flist );
}
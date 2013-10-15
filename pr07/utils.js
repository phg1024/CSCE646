Math.epsilon = 1e-6;

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

Array.prototype.mean = function() {
    return this.sum() / this.length;
}

Array.prototype.sum = function() {
    return this.reduce(function(a, b) { return a + b });
}

function clamp(val, lower, upper)
{
    if( val < lower ) return lower;
    else if( val > upper ) return upper;
    return val;
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
	    myMat = image2Matrix(img);
		var width = myMat.col;
		var height = myMat.row;
		if( width > 640 )
		{
			height = Math.floor(height * (640.0/width));
			width = 640;
			myMat = imresize(myMat, width, height);
		}
		
		if( height > 640 )
		{
			width = Math.floor(width * (640.0/height));
			height = 640;
			myMat = imresize(myMat, width, height);
		}
			
		console.log(origMat);
		origImgData = matrix2ImageData( myMat );
		canvasresize(width, height);
		
		context.putImageData(origImgData, 0, 0);
    }
}
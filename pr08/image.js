// matrix structure
function Mat(__row, __col, __data, __buffer){
	this.row = __row || 0;
	this.col = __col || 0;
	this.channel = 4;
	this.buffer = __buffer || new ArrayBuffer(__row * __col * 4);
	this.data = new Uint8ClampedArray(this.buffer);
	__data && this.data.set(__data);
	this.bytes = 1;
	this.type = "IMG_RGBA";
}

function image2Matrix(__image){
	var width = __image.width,
	height = __image.height;
	
	// resize the canvas	
	canvasresize(width, height);

    // render the image to the canvas in order to obtain image data
	context.drawImage(__image, 0, 0);
	var imageData = context.getImageData(0, 0, width, height),
	tempMat = new Mat(height, width, imageData.data);
	imageData = null;

    // clear up the canvas
	context.clearRect(0, 0, width, height);
	return tempMat;
}

function matrix2ImageData(__imgMat){
	var width = __imgMat.col,
	height = __imgMat.row,
	imageData = context.createImageData(width, height);
	imageData.data.set(__imgMat.data);
	return imageData;
}

function imresize(__src, w, h)
{
	// bilinear interpolation
	if(__src.type && __src.type === "IMG_RGBA"){
		var ih = __src.row,
		iw = __src.col;
		var dst = new Mat(h, w);
		var ddata = dst.data,
		sdata = __src.data;
		
		var ystep = 1.0 / h;
		var xstep = 1.0 / w;
		for(var i=0;i<h;i++)
		{
			var y = i * ystep;
			var yPos = y * ih;
			var ty = Math.floor(yPos);
			var dy = Math.ceil(yPos);
			
			var fy = yPos - ty;
			for(var j=0;j<w;j++)
			{
				var x = j * xstep;
				var xPos = x * iw;
				var lx = Math.floor(xPos);
				var rx = Math.ceil(xPos);
				
				var fx = xPos - lx;
				
				var idx = (i*w+j)*4;
				var idxlt = (ty*iw+lx)*4;
				var idxrt = (ty*iw+rx)*4;
				var idxld = (dy*iw+lx)*4;
				var idxrd = (dy*iw+rx)*4;
				for(var k=0;k<3;k++)
				{
					ddata[idx+k] = sdata[idxlt+k] * (1-fy) * (1-fx)
								 + sdata[idxrt+k] * (1-fy) * fx
								 + sdata[idxld+k] * fy * (1-fx)
								 + sdata[idxrd+k] * fy * fx;
				}
				ddata[idx+3] = sdata[idx+3];
			}
		}
	}else{
		return __src;
	}
	return dst;
}

function canvasresize(__width, __height)
{
	canvas.width = __width;
	canvas.height = __height;
}

function clamp(v, lower, upper)
{
	var res = v;
	res = Math.min(upper, res);
	res = Math.max(lower, res);
	return res;
}

function filter(__src, f)
{
	if(__src.type && __src.type === "IMG_RGBA"){
		var row = __src.row,
		col = __src.col;
		var dst = new Mat(row, col);
		var data = dst.data,
		data2 = __src.data;
		
		var wf = Math.floor(f.width / 2);
		var hf = Math.floor(f.height / 2);
		var bias = f.bias;
		var factor = f.factor;
		for (var y=0;y<row;y++)
		{
			for (var x=0;x<col;x++)
			{
				var fidx = 0;
				var r, g, b;
				r = g = b = 0;
				var idx = (y*col+x)*4;
				for (var i=-hf, fi=0;i<=hf;i++,fi++)
				{
					var py = clamp(i+y,0,row-1);
					for (var j=-wf, fj=0;j<=wf;j++,fj++)
					{
						var px = clamp(j+x,0,col-1);
						
						var pidx = (py * col + px) * 4;
						
						var weight = f.value[fidx++];
						
						r += data2[pidx] * weight;
						g += data2[pidx+1] * weight;
						b += data2[pidx+2] * weight;												
					}
				}
				
				r = clamp(r/factor+bias, 0.0, 255.0);
				g = clamp(g/factor+bias, 0.0, 255.0);
				b = clamp(b/factor+bias, 0.0, 255.0);
																
	  		  	data[idx] = r;
	  		  	data[idx+1] = g;
	  		  	data[idx+2] = b;
	  		  	data[idx+3] = data2[idx+3];
			}
		}
	}else{
		return __src;
	}
	return dst;	
}

function grayscale(__src)
{
	if(__src.type && __src.type === "IMG_RGBA"){
		var row = __src.row,
		col = __src.col;
		var dst = new Mat(row, col);
		var data = dst.data,
		data2 = __src.data;
		var pix1, pix2, pix = __src.row * __src.col * 4;
		while (pix){
			data[pix -= 4] = data[pix1 = pix + 1] = data[pix2 = pix + 2] = (data2[pix] * 299 + data2[pix1] * 587 + data2[pix2] * 114) / 1000;
			data[pix + 3] = data2[pix + 3];
		}
	}else{
		return __src;
	}
	return dst;
}

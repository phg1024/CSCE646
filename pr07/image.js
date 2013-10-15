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

function add(img1, img2, w)
{
	if(img1.type && img1.type === "IMG_RGBA" &&
	img2.type && img2.type === "IMG_RGBA" ){
		var row = img1.row,
		col = img1.col;
		var dst = new Mat(row, col);
		var data = dst.data,
		data1 = img1.data,
		data2 = img2.data;

		var totalpix = row*col*4;
		for (var idx=0;idx<totalpix;idx++)
		{
			data[idx] = data1[idx] * w + data2[idx] * (1.0-w);
		}

	}else{
		return __src;
	}
	return dst;
}

function equalize_blend(__src)
{
	var eimg = equalize(__src);
	var dst = add(__src, eimg, 0.5);
	return dst;
}

function histogram(img, x1, y1, x2, y2, num_bins)
{
	if( num_bins == undefined )
	num_bins = 256;
	
	var rows = img.row;
	var cols = img.col;
	var hist = [];
	for(var i=0;i<num_bins;i++)
	hist[i] = 0;

	for(var y=y1;y<y2;y++)
	{
		for(var x=x1;x<x2;x++)
		{
			var idx = (y * cols + x) * 4;
			var val = Math.floor((img.data[idx] / 256.0) * num_bins);
			hist[val]++;
		}
	}
	
	return hist;
}

function buildcdf( hist, num_bins )
{
	if( num_bins == undefined )
	num_bins = 256;
		
	var cumuhist = [];
	cumuhist[0] = hist[0];
	for(var i=1;i<num_bins;i++)
	cumuhist[i] = cumuhist[i-1] + hist[i];
		
	return cumuhist;
}

function equalize(__src)
{
	if(__src.type && __src.type === "IMG_RGBA"){
		
		var row = __src.row,
		col = __src.col;
		
		// grayscale image
		var gimg = grayscale(__src);
		
		// build histogram
		var hist = histogram(gimg, 0, 0, col, row);
		
		var cumuhist = buildcdf( hist );

		var total = cumuhist[255];
		for(var i=0;i<256;i++)
		cumuhist[i] = Math.round(cumuhist[i] / total * 255.0);
		
		// equalize
		var dst = new Mat(row, col);
		var data = dst.data,
		data2 = __src.data;
		idx = 0;
		for(var y=0;y<row;y++)
		{
			for(var x=0;x<col;x++, idx+=4)
			{
				var val = gimg.data[idx];
				var mappedval = cumuhist[val];
				
				var ratio = mappedval / val;
				data[idx] = data2[idx] * ratio;
				data[idx + 1] = data2[idx + 1] * ratio;
				data[idx + 2] = data2[idx + 2] * ratio;
				data[idx + 3] = data2[idx + 3];
			}
		}
	}else{
		return __src;
	}
	return dst;
}

function ahe(__src)
{
	// find a good window size
	if(__src.type && __src.type === "IMG_RGBA"){
		var row = __src.row,
		col = __src.col;
		
		// tile size
		var tilesize = [64, 64];
		
		// number of bins
		var num_bins = 256;
		
		// number of tiles in x and y direction
		var xtiles = Math.ceil(col / tilesize[0]);
		var ytiles = Math.ceil(row / tilesize[1]);
		
		var cdfs = new Array(ytiles);
		for(var i=0;i<ytiles;i++)
		cdfs[i] = new Array(xtiles);
		
		var inv_tile_size = [1.0 / tilesize[0], 1.0 / tilesize[1]];
		
		var binWidth = 256 / num_bins;
		
		var gimg = grayscale(__src);
		
		// create histograms
		for(var i=0;i<ytiles;i++)
		{
			var y0 = i * tilesize[1];
			var y1 = Math.min(y0+tilesize[1], row);
			for(var j=0;j<xtiles;j++)
			{
				var x0 = j * tilesize[0];
				var x1 = Math.min(x0+tilesize[0], col);
				var hist = histogram(gimg, x0, y0, x1, y1, num_bins);
				
				var cdf = buildcdf( hist );
			
				var total = cdf[255];
				for(var k=0;k<256;k++)
				cdf[k] = Math.round(cdf[k] / total * 255.0);
				
				cdfs[i][j] = cdf;
			}
		}
		
		var dst = new Mat(row, col);
		var data = dst.data,
		data2 = __src.data;
		
		console.log(xtiles);
		console.log(ytiles);
		
		console.log(row);
		console.log(col);
		
		var idx = 0;
		for(var y=0;y<row;y++)
		{
			for(var x=0;x<col;x++, idx+=4)
			{
				// intensity of current pixel
				var I = gimg.data[idx];
				
				// bin index
				var bin = Math.floor(I / binWidth);
				
				// current tile
				var tx = x * inv_tile_size[0] - 0.5;
				var ty = y * inv_tile_size[1] - 0.5;
				
				var xl = Math.max(Math.floor(tx), 0);
				var xr = Math.min(xl+1, xtiles-1);
				
				var yt = Math.max(Math.floor(ty), 0);
				var yd = Math.min(yt+1, ytiles-1);
								
				var fx = tx - xl;
				var fy = ty - yt;
				
				var cdf11 = cdfs[yt][xl][bin];
				var cdf12 = cdfs[yd][xl][bin];
				var cdf21 = cdfs[yt][xr][bin];
				var cdf22 = cdfs[yd][xr][bin];			
				
				var Iout = (1 - fx) * (1 - fy) * cdf11
				+ (1 - fx) * 	   fy  * cdf12
				+      fx  * (1 - fy) * cdf21
				+      fx  *      fy  * cdf22;
						 
				var ratio = Iout / I;
				data[idx] = clamp(data2[idx] * ratio, 0, 255);
				data[idx + 1] = clamp(data2[idx + 1] * ratio, 0, 255);
				data[idx + 2] = clamp(data2[idx + 2] * ratio, 0, 255);
				data[idx + 3] = data2[idx + 3];
			}
		}

	}else{
		return __src;
	}
	return dst;
}
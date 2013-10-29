function imresize(__src, w, h)
{
    var iw = __src.w, ih = __src.h;
    // bilinear interpolation
    var dst = new RGBAImage(w, h);

    var ystep = 1.0 / (h-1);
    var xstep = 1.0 / (w-1);
    for(var i=0;i<h;i++)
    {
        var y = i * ystep;

        for(var j=0;j<w;j++)
        {
            var x = j * xstep;

            dst.setPixel(j, i, __src.sample(x * (iw-1), y * (ih-1)));
        }
    }
    return dst;
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
    var h = __src.h,
        w = __src.w;
    var dst = new RGBAImage(w, h);
    var data = dst.data,
        data2 = __src.data;

    var wf = Math.floor(f.width / 2);
    var hf = Math.floor(f.height / 2);
    var bias = f.bias;
    var factor = f.factor;
    var p = f.p || 1.0;

    for (var y=0;y<h;y++)
    {
        for (var x=0;x<w;x++)
        {
            var fidx = 0;
            var r, g, b;
            r = g = b = 0;
            var idx = (y*w+x)*4;
            for (var i=-hf, fi=0;i<=hf;i++,fi++)
            {
                var py = clamp(i+y,0,h-1);
                for (var j=-wf, fj=0;j<=wf;j++,fj++)
                {
                    var px = clamp(j+x,0,w-1);

                    var pidx = (py * w + px) * 4;

                    var weight = f.value[fidx++];

                    r += Math.pow(data2[pidx] * weight, p);
                    g += Math.pow(data2[pidx+1] * weight, p);
                    b += Math.pow(data2[pidx+2] * weight, p);
                }
            }

            r = clamp(Math.pow(r,1/p)/factor+bias, 0.0, 255.0);
            g = clamp(Math.pow(g,1/p)/factor+bias, 0.0, 255.0);
            b = clamp(Math.pow(b,1/p)/factor+bias, 0.0, 255.0);

            data[idx] = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = data2[idx+3];
        }
    }
    return dst;
}

function grayscale(__src)
{
    var h = __src.h,
        w = __src.w;
    var dst = new RGBAImage(w, h);
    var data = dst.data,
        data2 = __src.data;
    var pix1, pix2, pix = w * h * 4;
    while (pix){
        data[pix -= 4] = data[pix1 = pix + 1] = data[pix2 = pix + 2] = (data2[pix] * 299 + data2[pix1] * 587 + data2[pix2] * 114) / 1000;
        data[pix + 3] = data2[pix + 3];
    }
    return dst;
}

function blend(img1, img2, blendfunc) {
    var h = img1.h,
        w = img1.w;
    var dst = new RGBAImage(w, h);

    for (var y=0;y<h;y++)
    {
        for( var x=0;x<w;x++ )
            dst.setPixel(x, y, blendfunc(img1.getPixel(x, y), img2.getPixel(x, y)));
    }
    return dst;
}

function edge( __src ) {
    var gx = grayscale( filter(__src, Filter.hsobel) );
    var gy = grayscale( filter(__src, Filter.vsobel) );

    // sqrt(gx^2 + gy^2)
    var h = gx.h,
        w = gx.w;
    var g = new RGBAImage(w, h);
    var data = g.data,
        data1 = gx.data,
        data2 = gy.data;

    for (var idx=0;idx<w*h*4;idx++)
    {
        data[idx] = clamp(Math.sqrt(data1[idx] * data1[idx] + data2[idx] * data2[idx]), 0.0, 255.0);
    }

    var dst = new RGBAImage(w, h);
    var ddata = dst.data, sdata = __src.data;
    for (var y= 0, idx = 0;y<h;y++)
    {
        for (var x=0;x<w;x++, idx+=4)
        {
            ddata[idx+0] = sdata[idx+0] * data[idx] / 255.0;
            ddata[idx+1] = sdata[idx+1] * data[idx] / 255.0;
            ddata[idx+2] = sdata[idx+2] * data[idx] / 255.0;
            ddata[idx+3] = 255;
        }
    }
    return dst;
}

function add(img1, img2, weight) {
    return blend(img1, img2, function(a, b){return a.mul(weight).add(b.mul(1-weight));});
}

function sub(img1, img2) {
    return blend(img1, img2, function(a, b){
        var c = a.sub(b);
        c.a = 255;
        c.clamp();
        return c;
    });
}

function diff(img1, img2) {
    return blend(img1, img2, function(a, b){
        var c = new Color();
        c.r = Math.abs(a.r - b.r);
        c.g = Math.abs(a.g - b.g);
        c.b = Math.abs(a.b - b.b);
        c.a = 255;
        return c;
    });
}

function histogram(img, x1, y1, x2, y2, num_bins)
{
    if( num_bins == undefined )
        num_bins = 256;

    var h = img.h;
    var w = img.w;
    var hist = [];
    for(var i=0;i<num_bins;i++)
        hist[i] = 0;

    for(var y=y1;y<y2;y++)
    {
        for(var x=x1;x<x2;x++)
        {
            var idx = (y * w + x) * 4;
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

function equalize(__src, amount)
{
    var h = __src.h,
        w = __src.w;

    // grayscale image
    var gimg = grayscale(__src);

    // build histogram
    var hist = histogram(gimg, 0, 0, w, h);

    var cumuhist = buildcdf( hist );

    var total = cumuhist[255];
    for(var i=0;i<256;i++)
        cumuhist[i] = Math.round(cumuhist[i] / total * 255.0);

    // equalize
    var dst = new RGBAImage(w, h);
    idx = 0;
    for(var y=0;y<h;y++)
    {
        for(var x=0;x<w;x++, idx+=4)
        {
            var val = gimg.data[idx];
            var mappedval = cumuhist[val];
            var ratio = mappedval / val;
            var c0 = __src.getPixel(x, y);
            var c = c0.mul(ratio);
            c.a = c0.a;
            c.clamp();
            dst.setPixel(x, y, c);
        }
    }

    dst = add(dst, __src, amount);

    return dst;
}

function ahe(__src, amount)
{
    // find a good window size
    var row = __src.h,
        col = __src.w;

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

    var dst = new RGBAImage(col, row);
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

    dst = add(dst, __src, amount);

    return dst;
}

function contrast( src, lev ) {
    var level = lev || 32;
    var factor = (259 * (level + 255)) / (255 * (259 - level));

    var w = src.w, h = src.h;
    var dst = new RGBAImage(w, h);
    for(var y=0;y<h;y++)
    {
        for(var x=0;x<w;x++)
        {
            var c0 = src.getPixel(x, y);
            var c = c0.sub({r:128,g:128,b:128,a:0}).mul(factor).add({r:128,g:128,b:128,a:0});
            c.clamp();
            dst.setPixel(x, y, c);
        }
    }
    return dst;
}

function unsharpenmask( src, size, amount ) {
    // first get a blurred copy
    var blurred = filter(src, Filter.blurn(size, 0.5 * size));

    var alpha = amount;

    var w = src.w, h = src.h;
    var dst = new RGBAImage(w, h);
    for(var y=0;y<h;y++)
    {
        for(var x=0;x<w;x++)
        {
            var c1 = blurred.getPixel(x, y);
            var c2 = src.getPixel(x, y);
            var diff = c2.sub(c1);

            var c = c1.add(diff.mul(alpha));
            c.clamp();

            dst.setPixel(x, y, c);
        }
    }
    return dst;
}
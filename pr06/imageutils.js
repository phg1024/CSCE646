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

// bilateral filter
function bilateral(src, sigmap, sigmaf, size) {
    var h = src.h,
        w = src.w;
    var dst = new RGBAImage(w, h);
    var data = dst.data,
        data2 = src.data;

    var fp = new Filter.blurn(size, sigmap);
    var sigmaf2 = sigmaf * sigmaf * 2;

    var wf = Math.floor(size / 2);
    var hf = Math.floor(size / 2);

    for (var y=0;y<h;y++)
    {
        for (var x=0;x<w;x++)
        {
            var fidx = 0;
            var wsum = 0;
            var r0, g0, b0;
            var c0 = src.getPixel(x, y);
            r0 = c0.r, g0 = c0.g, b0 = c0.b;
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

                    var weight = fp.value[fidx++];

                    var c = src.getPixel(px, py);
                    var dr = c.r - r0;
                    var dg = c.g - g0;
                    var db = c.b - b0;

                    weight *= Math.exp(-(dr*dr+dg*dg+db*db)/(sigmaf2));
                    wsum += weight;

                    r += c.r * weight;
                    g += c.g * weight;
                    b += c.b * weight;
                }
            }

            r = clamp((r)/wsum, 0.0, 255.0);
            g = clamp((g)/wsum, 0.0, 255.0);
            b = clamp((b)/wsum, 0.0, 255.0);

            data[idx] = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = data2[idx+3];
        }
    }
    return dst;
}

// apply filter f to image __src
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
    var p = f.p;

    if( p && p != 1.0 ) {
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
    }
    else {
        // p is undefined or p is 1.0
        // no need to compute the power, which is time consuming
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
    }

    return dst;
}

function filter_alpha(src, f) {
    var w = src.w, h = src.h;

    var wf = Math.floor(f.width / 2);
    var hf = Math.floor(f.height / 2);
    var bias = f.bias;
    var factor = f.factor;

    var dst = new AlphaMask(w, h);

    var p = f.p;

    if( p && p != 1.0 ) {
        for (var y=0;y<h;y++)
        {
            for (var x=0;x<w;x++)
            {
                var fidx = 0;
                var val = 0;
                for (var i=-hf, fi=0;i<=hf;i++,fi++)
                {
                    var py = clamp(i+y,0,h-1);
                    for (var j=-wf, fj=0;j<=wf;j++,fj++)
                    {
                        var px = clamp(j+x,0,w-1);

                        var weight = f.value[fidx++];

                        val += Math.pow(src.getValue(px, py) * weight, p);
                    }
                }

                val = clamp(Math.pow(val,1/p)/factor+bias, 0.0, 255.0);

                dst.setValue(x, y, val);
            }
        }
    }
    else {
        for (var y=0;y<h;y++)
        {
            for (var x=0;x<w;x++)
            {
                var fidx = 0;
                var val = 0;
                for (var i=-hf, fi=0;i<=hf;i++,fi++)
                {
                    var py = clamp(i+y,0,h-1);
                    for (var j=-wf, fj=0;j<=wf;j++,fj++)
                    {
                        var px = clamp(j+x,0,w-1);

                        var weight = f.value[fidx++];

                        val += src.getValue(px, py) * weight;
                    }
                }

                val = clamp(val/factor+bias, 0.0, 255.0);

                dst.setValue(x, y, val);
            }
        }
    }
    return dst;
}

function computeAlpha(src, ref, tol) {
    var h = src.h,
        w = src.w;
    var dst = new AlphaMask(w, h);
    var maxA = 0;
    var THRES = tol;
    for (var y=0;y<h;y++)
    {
        for( var x=0;x<w;x++ ) {
            var pix = src.getPixel(x, y);
            var hsv = rgb2hsv(pix);
            var dh = (Math.abs(hsv.h - ref.h) % 180 ) / 180.0;
            var ds = hsv.s - ref.s;
            var dv = hsv.v - ref.v;
            var dist = dh*dh + ds * ds + dv * dv;
            var val = Math.round( ((dist>THRES)?1.0:0.0) * 255.0);
            maxA = Math.max(val, maxA);
            dst.setValue(x, y, val);
        }
    }
    return dst;
}

// convert RGB image to grayscale imge
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

// blend two images using given blend function
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

function blend_mask(img1, img2, mask, blendfunc) {
    var h = img1.h,
        w = img1.w;
    var dst = new RGBAImage(w, h);

    for (var y=0;y<h;y++)
    {
        for( var x=0;x<w;x++ )
            dst.setPixel(x, y, blendfunc(img1.getPixel(x, y), img2.getPixel(x, y), mask.getValue(x, y)));
    }
    return dst;
}

// median filter
function median( src, size ) {

    var h = src.h,
        w = src.w;
    var hf = ( size - 1 ) / 2;
    var wf = hf;
    var mid = (size * size - 1) / 2;

    var dst = new RGBAImage(w, h);

    for (var y=0;y<h;y++)
    {
        for (var x=0;x<w;x++)
        {
            var r = [], g = [], b = [];
            for (var i=-hf, fi=0;i<=hf;i++,fi++)
            {
                var py = clamp(i+y,0,h-1);
                for (var j=-wf, fj=0;j<=wf;j++,fj++)
                {
                    var px = clamp(j+x,0,w-1);

                    var c = src.getPixel(px, py);
                    r.push(c.r);
                    g.push(c.g);
                    b.push(c.b);
                }
            }

            r.sort(function(a,b){return a-b;});
            g.sort(function(a,b){return a-b;});
            b.sort(function(a,b){return a-b;});

            dst.setPixel(x, y, {
                r: r[mid],
                g: g[mid],
                b: b[mid],
                a: 255
            });

        }
    }

    return dst;
}

function median_alpha( src, size ) {

    var h = src.h,
        w = src.w;
    var hf = ( size - 1 ) / 2;
    var wf = hf;
    var mid = (size * size - 1) / 2;

    var dst = new AlphaMask(w, h);

    for (var y=0;y<h;y++)
    {
        for (var x=0;x<w;x++)
        {
            var vals = [];
            for (var i=-hf, fi=0;i<=hf;i++,fi++)
            {
                var py = clamp(i+y,0,h-1);
                for (var j=-wf, fj=0;j<=wf;j++,fj++)
                {
                    var px = clamp(j+x,0,w-1);

                    var val = src.getValue(px, py);
                    vals.push(val);
                }
            }

            vals.sort(function(a,b){return a-b;});

            dst.setValue(x, y, vals[mid]);
        }
    }

    return dst;
}

// edge detection using Sobel operator in both x and y direction
// edge intensity is sqrt( |Gx|^2 + |Gy|^2 )
function edge( __src ) {
    var gx = grayscale( filter(__src, new Filter.hsobel()) );
    var gy = grayscale( filter(__src, new Filter.vsobel()) );

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

// normal overlay
// add img2 to to img1 with specified weight
function add(img1, img2, weight) {
    return blend(img1, img2, function(a, b){return a.mul(weight).add(b.mul(1-weight));});
}

// subtract img2 from img1
function sub(img1, img2) {
    return blend(img1, img2, function(a, b){
        var c = a.sub(b);
        c.a = 255;
        c.clamp();
        return c;
    });
}

// difference between two images
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

// build histogram of specified image region
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

// build cdf from given pdf
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

// histogram equalization, blended with orignal image
// amount is between 0 and 1
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

// adaptive histogram equalization, blended with original image
// amount is between 0 and 1
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

            // bilinear interpolation
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

// contrast adjustment
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

// gradient using Sobel operator in both x and y direction
// gradient intensity is sqrt( |Gx|^2 + |Gy|^2 )
function gradient( __src ) {
    // sqrt(gx^2 + gy^2)
    var h = __src.h,
        w = __src.w;
    var gr = new AlphaMask(w, h);
    var gg = new AlphaMask(w, h);
    var gb = new AlphaMask(w, h);

    for (var y=0;y<h;y++) {
        var yd = (y + 1) % (h - 1);
        for(var x=0;x<w;x++) {
            var xr = (x + 1) % (w-1);
            var gxc = __src.getPixel(x, y).sub(__src.getPixel(xr, y));
            var gyc = __src.getPixel(x, y).sub(__src.getPixel(x, yd));
            var r = Math.sqrt(gxc.r * gxc.r + gyc.r * gyc.r);
            var g = Math.sqrt(gxc.g * gxc.g + gyc.g * gyc.g);
            var b = Math.sqrt(gxc.b * gxc.b + gyc.b * gyc.b);
            gr.setValue(x, y, r);
            gg.setValue(x, y, g);
            gb.setValue(x, y, b);
        }
    }

    return [gr, gg, gb];
}

function laplacian( src ) {
    var w = src.w, h = src.h;

    var lr = new AlphaMask(w, h);
    var lg = new AlphaMask(w, h);
    var lb = new AlphaMask(w, h);

    var neighbors = [[0, -1], [-1, 0], [1, 0], [0, 1]]; // 4 neighbors up, left, right, down

    for (var y=0;y<h;y++) {
        for(var x=0;x<w;x++) {
            var c = src.getPixel(x, y);
            var r = c.r * 4, g = c.g * 4, b = c.b * 4;

            for(var ni=0;ni<4;ni++) {
                var nx = x + neighbors[ni][0];
                var ny = y + neighbors[ni][1];

                if( nx > w-1 || nx < 0 ) continue;
                if( ny > h-2 || ny < 0 ) continue;

                var nc = src.getPixel(nx, ny);

                r -= nc.r; g -= nc.g; b -= nc.b;
            }

            lr.setValue(x, y, r);
            lg.setValue(x, y, g);
            lb.setValue(x, y, b);
        }
    }

    return [lr, lg, lb];
}

// gradient domain editing
function gde(src, tgt, mask) {
    var w = src.w, h = src.h;

    var dst = new RGBAImage(w, h);
    var pmapping = {};
    var cnt = 0;            // number of pixels in the region \Omega
    var THRES = 250;

    var lap = laplacian(src);
    var lr = lap[0], lg = lap[1], lb = lap[2];

    // create index mapping for all pixels with non-zero alpha value
    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++, idx++) {

            var val = mask.getValue(x, y);
            if( Math.abs(val) > THRES ) {
                pmapping[idx] = cnt;
                cnt++;
            }
        }
    }

    console.log('pixels in region omega = ' + cnt);

    // assemble the matrix for all pixels in the mask region
    var A = [], br = [], bg = [], bb = [];

    var neighbors = [[0, -1], [-1, 0], [1, 0], [0, 1]]; // 4 neighbors up, left, right, down

    var bcount = 0;
    var lcnt = 0;
    var nn_avg = 0;
    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++, idx++) {
            var val = mask.getValue(x, y);
            if( Math.abs(val) > THRES ) {
                // the pixel is in region \Omega

                // get the pixel value
                var c = src.getPixel(x, y);
                var tc = tgt.getPixel(x, y);

                // target
                var tr = tc.r, tg = tc.g, tb = tc.b;

                // the neighbors on lhs
                var lhs = [];
                var fqstar = {r: 0, g: 0, b: 0};

                // for its four neighbors
                for(var i=0;i<4;i++) {
                    var nx = x + neighbors[i][0];
                    var ny = y + neighbors[i][1];

                    if( nx > w-1 ) nx -= (w-1);
                    if( nx < 0 ) nx += (w-1);

                    if( ny > h-1 ) ny -= (h-1);
                    if( ny < 0 ) ny += (h-1);

                    // if the neighbor is in regoin \Omega, it contribute to the left hand side
                    // otherwise right hand side

                    var ac = mask.getValue(nx, ny);
                    if( Math.abs(ac) <= THRES ) {
                        // neighbor not in region \Omega, place it on the rhs
                        var ntc = tgt.getPixel(nx, ny);

                        // neighbor not in region \Omega, place it on the rhs
                        fqstar.r += ntc.r;
                        fqstar.g += ntc.g;
                        fqstar.b += ntc.b;
                    }
                    else {
                        lhs.push(ny * w + nx);
                    }
                }

                var vpq_sum = { r: lr.getValue(x, y), g: lg.getValue(x, y), b: lb.getValue(x, y) };

                var rhs = {
                    r: vpq_sum.r + fqstar.r,
                    g: vpq_sum.g + fqstar.g,
                    b: vpq_sum.b + fqstar.b
                };

                nn_avg += lhs.length;

                var indices = [];
                indices.push({idx:pmapping[y * w + x], val:4});

                // lhs
                for(var ii=0;ii<lhs.length;ii++) {
                    indices.push({idx: pmapping[lhs[ii]], val: -1});
                }

                A.push(indices);
                // rhs
                br.push(rhs.r);
                bg.push(rhs.g);
                bb.push(rhs.b);

                lcnt++;
            }
        }
    }

    console.log('boundary pixels = ' + bcount);
    console.log('average number of neighbors = ' + nn_avg / lcnt);

    //$('#matA').html( stringify_mat(A) );
    //$('#vecB').html( stringify_vec(br) );

    var L = new linearsolver();

    var newr = L.cg(A,br);
    var newg = L.cg(A,bg);
    var newb = L.cg(A,bb);

    // put the new r, g, b values to the region
    for(var y= 0, idx=0;y<h;y++) {
        for(var x=0;x<w;x++, idx++) {
            var val = mask.getValue(x, y);
            if( Math.abs(val) > THRES ) {
                var xidx = pmapping[idx];
                var c = src.getPixel(x, y);
                dst.setPixel(x, y, {
                    r: clamp(Math.round(newr[xidx]), 0, 255),
                    g: clamp(Math.round(newg[xidx]), 0, 255),
                    b: clamp(Math.round(newb[xidx]), 0, 255),
                    a: 255
                });
            }
            else {
                dst.setPixel(x, y, tgt.getPixel(x, y));
            }
        }
    }

    return dst;
}
/**
 * Created by Peihong Guo on 10/15/13.
 */

var transformation = function(){
    this.op = {
        's': scale,
        't': translate,
        'r': rotate,
        'sh': shear,
        'p': perspective,
        'b': bilinear,
        'm': mirror,
        'c': composite
    }

    var mapping = 'forward';
    var supersampling = false;

    this.setMapping = function( m ) {
        mapping = m;
    };

    this.setSupersampling = function( v ) {
        supersampling = v;
    }

    // composition of a sequence of transformations
    function composite(src, ops) {
        console.log('composite operations');
        console.log(ops);

        var mat = Matrix3x3.identity();
        for(var i=0;i<ops.length;i++) {
            var m = Matrix3x3.identity();
            var params = ops[i];
            switch( params[0] ) {
                case 'r': {
                    var deg = parseFloat(params[1]);
                    mat = mat.mul(Matrix3x3.rotation(deg));
                    break;
                }
                case 'p': {
                    var px = parseFloat(params[1]);
                    var py = parseFloat(params[2]);
                    mat = mat.mul(Matrix3x3.perspective(px, py));
                    break;
                }
                case 's': {
                    var sx = parseFloat(params[1]);
                    var sy = parseFloat(params[2]);
                    mat = mat.mul(Matrix3x3.scale(sx, sy));
                    break;
                }
                case 't': {
                    var tx = parseFloat(params[1]);
                    var ty = parseFloat(params[2]);
                    mat = mat.mul(Matrix3x3.translate(tx, ty));
                    break;
                }
                case 'sh': {
                    var shx = parseFloat(params[1]);
                    var shy = parseFloat(params[2]);
                    mat = mat.mul(Matrix3x3.shear(shx, shy));
                    break;
                }
                default: {
                    console.log('operation ' + params[0] + ' is not supported in composite mode!');
                }
            }
        }

        return affine(src, mat);
    }

    function perspective(img, params) {
        var px = parseFloat(params[0]);
        var py = parseFloat(params[1]);
        console.log('perspective transformation with px = ' + px + ' and py = ' + py);

        return affine(img, Matrix3x3.perspective(px, py));
    }

    function shear(img, params) {
        var shx = parseFloat(params[0]);
        var shy = parseFloat(params[1]);
        console.log('shear transformation with shx = ' + shx + ' and shy = ' + shy);

        return affine(img, Matrix3x3.shear(shx, shy));
    }

    function scale(img, params) {
        var sx = parseFloat(params[0]);
        var sy = parseFloat(params[1]);
        console.log('scaling the image with sx = ' + sx + ' and sy = ' + sy);

        return affine(img, Matrix3x3.scale(sx, sy));
    }

    function translate(img, params) {
        var tx = parseFloat(params[0]);
        var ty = parseFloat(params[1]);
        console.log('translating the image with tx = ' + tx + ' and ty = ' + ty);

        return affine(img, Matrix3x3.translate(tx, ty));
    }

    function rotate(img, params) {
        var deg = parseFloat(params[0]);
        console.log('rotating the image with deg = ' + deg);

        return affine(img, Matrix3x3.rotation(deg));
    }

    function affineTransform(u, v, mat) {
        var p = new Point3(u, v, 1);
        var pp = mat.mul(p);
        return {
            x : pp.x / pp.z,
            y : pp.y / pp.z
        };
    }

    function inverseAffineTransform(x, y, invMat) {
        var p = new Point3(x, y, 1);
        var pp = invMat.mul(p);

        return {
            u : pp.x / pp.z,
            v : pp.y / pp.z
        };
    }

    function affine(src, mat) {
        // compute the corners first, create a larger image if the size is larger than current size
        var w = src.w;
        var h = src.h;

        var invmat = mat.inv();

        var p00 = affineTransform(0, 0, mat);
        var p01 = affineTransform(0, h, mat);
        var p10 = affineTransform(w, 0, mat);
        var p11 = affineTransform(w, h, mat);

        var corners = {
            x: [p00.x, p01.x, p10.x, p11.x],
            y: [p00.y, p01.y, p10.y, p11.y]
        };

        var minX = Math.min(0, corners.x.min());
        var minY = Math.min(0, corners.y.min());
        var maxX = Math.max(w, corners.x.max());
        var maxY = Math.max(h, corners.y.max());

        var neww = Math.ceil(maxX - minX);
        var newh = Math.ceil(maxY - minY);

        var offset = {
            x: Math.round(minX),
            y: Math.round(minY)
        };

        console.log(offset);

        var dst = new RGBAImage(neww, newh);

        if( mapping == 'inverse' ) {
            console.log('inverse mapping');
            var nsamples = 1;
            var samples = [new Point2(0, 0)];

            if( supersampling ) {
                nsamples = 9;
                samples = [
                    new Point2(0, 0), new Point2(1/3, 0), new Point2(2/3, 0),
                    new Point2(0, 1/3), new Point2(1/3, 1/3), new Point2(2/3, 1/3),
                    new Point2(0, 2/3), new Point2(1/3, 2/3), new Point2(2/3, 2/3)
                ];
            }

            // inverse mapping
            for(var i= 0, idx=0;i<newh;i++) {
                var y = i + offset.y;
                for(var j=0;j<neww;j++, idx+=dst.channels) {
                    var x = j + offset.x;

                    var c = new Color(0, 0, 0, 0);
                    for(var ns = 0; ns<samples.length;ns++){
                        var xx = x + samples[ns].x;
                        var yy = y + samples[ns].y;

                        var p  = inverseAffineTransform(xx, yy, invmat);


                        if( p.u < 0 || p.v < 0 || p.u >= w || p.v >= h ) {
                            // set the pixel to black
                            c = c.add(Color.BLACK);
                        }
                        else {
                            // set the pixel
                            c = c.add(src.sample(p.u, p.v));
                        }
                    }

                    dst.setPixel(j, i, c.mul(1.0/nsamples));
                }
            }
        }
        else
        {
            console.log('forward mapping');
            // forward mapping
            // set all pixels to black
            for(var y=0;y<newh;y++) {
                for(var x=0;x<neww;x++) {
                    dst.setPixel(x, y, Color.BLACK);
                }
            }

            for(var i= 0, sidx=0;i<h;i++) {
                var y = i;
                for(var j=0;j<w;j++, sidx+=src.channels) {
                    var x = j;

                    var p  = affineTransform(x, y, mat);

                    p.x -= offset.x;
                    p.y -= offset.y;

                    if( p.x < 0 || p.y < 0 || p.x >= neww || p.y >= newh ) {
                    }
                    else
                    {
                        // set the pixel
                        dst.setPixel(Math.round(p.x), Math.round(p.y), src.getPixel(x, y));
                    }
                }
            }
        }

        // draw the boundaries of the original image
        for(var x=0;x<w;x++) {
            dst.setPixel(x-offset.x, 0 - offset.y, Color.RED);
            dst.setPixel(x-offset.x, h-1 - offset.y, Color.RED);
        }
        for(var y=0;y<h;y++) {
            dst.setPixel(0-offset.x, y - offset.y, Color.RED);
            dst.setPixel(w-1-offset.x, y - offset.y, Color.RED);
        }

        // put the original image in background
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var c1 = src.getPixel(x,y).mul(0.4);
                var c2 = dst.getPixel(x-offset.x, y-offset.y);
                var alpha = 1.0;
                if( c2.equal(Color.BLACK) ) alpha = 0.0;
                var c = Color.interpolate(c2, c1, alpha);
                c.a = 255;
                dst.setPixel(x-offset.x, y-offset.y, c);
            }
        }
        return dst;
    }

    // should specify new position for 4 corners
    function bilinear(src, params) {
        console.log('bilinear transformation');
        var w = src.w, h = src.h;

        var p00 = new Point2(parseFloat(params[0]), parseFloat(params[1]));
        var p10 = new Point2(parseFloat(params[2]), parseFloat(params[3]));
        var p01 = new Point2(parseFloat(params[4]), parseFloat(params[5]));
        var p11 = new Point2(parseFloat(params[6]), parseFloat(params[7]));

        var v1 = Vector2.fromPoint2(p00, p10);
        var v2 = Vector2.fromPoint2(p00, p01);
        var v3 = Vector2.fromPoint2(p11, p01);
        var e1 = v1.normalized();
        var e2 = v2.normalized();

        var corners = {
            x: [p00.x, p10.x, p01.x, p11.x],
            y: [p00.y, p10.y, p01.y, p11.y]
        };

        console.log(corners);

        var minX = Math.min(0, corners.x.min());
        var minY = Math.min(0, corners.y.min());
        var maxX = Math.max(w, corners.x.max());
        var maxY = Math.max(h, corners.y.max());

        var neww = Math.ceil(maxX - minX);
        var newh = Math.ceil(maxY - minY);

        var offset = {
            x: Math.round(minX),
            y: Math.round(minY)
        };

        console.log(offset);

        var dst = new RGBAImage(neww, newh);

        if( mapping == 'inverse' ) {
            console.log('inverse mapping');
            // inverse mapping
            for(var i= 0, idx=0;i<newh;i++) {
                var y = i;
                for(var j=0;j<neww;j++, idx+=dst.channels) {
                    var x = j;

                    var p = new Point2(x, y);

                    // solve for a and b
                    // p00 + v1 * a + v2 * b - (v1 + v3) * ab = p
                    // equivalent to
                    // (x00 - x) + x1 * a + x2 * b - (x1 + x3) * ab = 0
                    // (y00 - y) + y1 * a + y2 * b - (y1 + y3) * ab = 0

                    // (x00 - x) + x1 * a + b * (x2 - (x1 + x3) * a) = 0
                    // (y00 - y) + y1 * a + b * (y2 - (y1 + y3) * a) = 0

                    // b = - (x00 - x + x1 * a) / (x2 - (x1 + x3) * a)
                    // b = - (y00 - y + y1 * a) / (y2 - (y1 + y3) * a)

                    // (x00 - x + x1 * a) / (x2 - (x1 + x3) * a) = (y00 - y + y1 * a) / (y2 - (y1 + y3) * a)
                    // (x00 - x + x1 * a) * (y2 - (y1 + y3) * a) = (y00 - y + y1 * a) * (x2 - (x1 + x3) * a)
                    // equivalent to
                    // A * a^2 + B * a + C = 0
                    // A = x1*(y1+y3) -y1*(x1+x3)
                    // B = (x00-x)*(y1+y3) - y2*x1 + x2*y1 - (y00-y)*(x1+x3)
                    // C = (y00-y)*x2 - (x00-x)*y2
                    var A = v1.x*(v1.y+v3.y) - v1.y*(v1.x+v3.x);
                    var B = (p00.x-p.x)*(v1.y+v3.y)-v2.y*v1.x+v2.x*v1.y-(p00.y-p.y)*(v1.x+v3.x);
                    var C = (p00.y- p.y)*v2.x-(p00.x- p.x)*v2.y;
                    var roots = quadraticSolve(A, B, C);

                    if( roots.length == 0 ) {
                        // set the pixel to black
                        dst.setPixel(j, i, Color.BLACK);
                    }
                    else {
                        var a = roots.min();
                        if( a < 0 ) a = roots.max();
                        if( a < 0 || a > 1.0 ) {
                            dst.setPixel(j, i, Color.BLACK);
                            continue;
                        }
                        var b = ( - (p00.x - p.x + v1.x * a) / (v2.x - (v1.x + v3.x) * a) )
                            || (- (p00.y - p.y + v1.y * a) / (v2.y - (v1.y + v3.y) * a));

                        if( b < 0 || b > 1.0 ) {
                            dst.setPixel(j, i, Color.BLACK);
                            continue;
                        }
                        else {
                            // set the pixel by bilinearly sampling the source image
                            dst.setPixel(j, i, src.sample(a*(w-1), b*(h-1)));
                        }
                    }
                }
            }
        }
        else
        {
            console.log('forward mapping');
            // forward mapping
            // set all pixels to black
            for(var y=0;y<newh;y++) {
                for(var x=0;x<neww;x++) {
                    dst.setPixel(x, y, Color.BLACK);
                }
            }

            for(var i= 0;i<h;i++) {
                var y = i;
                for(var j=0;j<w;j++) {
                    var x = j;

                    var a = x / (w-1);
                    var b = y / (h-1);

                    var p = p00.add(v1.mul(a)).add(v2.mul(b)).sub(v1.add(v3).mul(a*b));

                    p.x += offset.x;
                    p.y += offset.y;

                    if( p.x < 0 || p.y < 0 || p.x >= neww || p.y >= newh ) {
                    }
                    else
                    {
                        // set the pixel by bilinearly sampling the source image
                        dst.setPixel(Math.round(p.x), Math.round(p.y), src.getPixel(x, y));
                    }
                }
            }
        }

        // draw the boundaries of the original image
        for(var x=0;x<w;x++) {
            dst.setPixel(x-offset.x, 0 - offset.y, Color.RED);
            dst.setPixel(x-offset.x, h-1 - offset.y, Color.RED);
        }
        for(var y=0;y<h;y++) {
            dst.setPixel(0-offset.x, y - offset.y, Color.RED);
            dst.setPixel(w-1-offset.x, y - offset.y, Color.RED);
        }

        // put the original image in background
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var c1 = src.getPixel(x,y).mul(0.4);
                var c2 = dst.getPixel(x-offset.x, y-offset.y);
                var alpha = 1.0;
                if( c2.equal(Color.BLACK) ) alpha = 0.0;
                var c = Color.interpolate(c2, c1, alpha);
                c.a = 255;
                dst.setPixel(x-offset.x, y-offset.y, c);
            }
        }

        return dst;
    }

    // for mirror transformation, forward mapping and inverse mapping are equivalent
    function mirror(img, params) {
        var axis = params[0];
        var w = img.w, h = img.h;
        var dst = new RGBAImage(w, h);
        switch( axis ) {
            case 'x':
            case 'X':
            {
                for(var i=0;i<h;i++) {
                    for(var j=0;j<w;j++) {
                        dst.setPixel(j, h-1-i, img.getPixel(j, i));
                    }
                }
                break;
            }
            case 'y':
            case 'Y':
            {
                for(var i=0;i<h;i++) {
                    for(var j=0;j<w;j++) {
                        dst.setPixel(w-1-j, i, img.getPixel(j, i));
                    }
                }
                break;
            }
        }
        return dst;
    }

};
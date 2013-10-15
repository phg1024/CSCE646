/**
 * Created by Peihong Guo on 10/15/13.
 */

var transformation = function(){
    this.op = {
        's': scale,
        't': translate,
        'r': rotate,
        'sh': shear
    }

    var mapping = 'forward';
    var supersampling = false;

    this.setMapping = function( m ) {
        mapping = m;
    };

    this.setSupersampling = function( v ) {
        supersampling = v;
    }

    function shear(img, params) {
        var shx = parseFloat(params[0]);
        var shy = parseFloat(params[1]);

        console.log('shear transformation with shx = ' + shx + ' and shy = ' + shy);
        return affine(img, 1, 1, 0, 0, shx, shy);
    }

    function scale(img, params) {
        var sx = parseFloat(params[0]);
        var sy = parseFloat(params[1]);

        console.log('scaling the image with sx = ' + sx + ' and sy = ' + sy);

        return affine(img, sx, sy, 0, 0, 0, 0);
    }

    function translate(img, params) {
        var tx = parseFloat(params[0]);
        var ty = parseFloat(params[1]);

        console.log('translating the image with tx = ' + tx + ' and ty = ' + ty);

        return affine(img, 1, 1, tx, ty, 0, 0);
    }

    function rotate(img, params) {
        var deg = parseFloat(params[0]);

        console.log('rotating the image with deg = ' + deg);

        var theta = deg / 180.0 * Math.PI + Math.epsilon;
        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);
        return affine(img, cosTheta, cosTheta, 0, 0, -sinTheta, sinTheta);
    }

    function affineTransform(u, v, mat) {
        var p = new Point3(u, v, 1);
        var pp = mat.mul(p);
        return {
            x : pp.x,
            y : pp.y
        };
    }

    function inverseAffineTransform(x, y, invMat) {
        var p = new Point3(x, y, 1);
        var pp = invMat.mul(p);

        return {
            u : pp.x,
            v : pp.y
        };
    }

    function affine(src, sx, sy, tx, ty, shx, shy) {
        // compute the corners first, create a larger image if the size is larger than current size
        var w = src.w;
        var h = src.h;

        var mat = Matrix3x3.zero();
        mat.setElement(0, 0, sx); mat.setElement(0, 1, shx); mat.setElement(0, 2, tx);
        mat.setElement(1, 0, shy); mat.setElement(1, 1, sy); mat.setElement(1, 2, ty);
        mat.setElement(2, 0, 0); mat.setElement(2, 1, 0); mat.setElement(2, 2, 1);

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
            // inverse mapping
            for(var i= 0, idx=0;i<newh;i++) {
                var y = i + offset.y;
                for(var j=0;j<neww;j++, idx+=dst.channels) {
                    var x = j + offset.x;

                    var p  = inverseAffineTransform(x, y, invmat);
                    if( p.u < 0 || p.v < 0 || p.u >= w || p.v >= h ) {
                        // set the pixel to black
                        dst.setPixel(j, i, Color.BLACK);
                    }
                    else {
                        // set the pixel
                        dst.setPixel(j, i, src.getPixel(Math.round(p.u), Math.round(p.v)));
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
};
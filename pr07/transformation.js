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

    this.setMapping = function( m ) {
        mapping = m;
    };

    function shear(mat, params) {
        var shx = parseFloat(params[0]);
        var shy = parseFloat(params[1]);

        console.log('shear transformation with shx = ' + shx + ' and shy = ' + shy);
        return affine(mat, 1, 1, 0, 0, shx, shy);
    }

    function scale(mat, params) {
        var sx = parseFloat(params[0]);
        var sy = parseFloat(params[1]);

        console.log('scaling the image with sx = ' + sx + ' and sy = ' + sy);

        return affine(mat, sx, sy, 0, 0, 0, 0);
    }

    function translate(mat, params) {
        var tx = parseFloat(params[0]);
        var ty = parseFloat(params[1]);

        console.log('translating the image with tx = ' + tx + ' and ty = ' + ty);

        return affine(mat, 1, 1, tx, ty, 0, 0);
    }

    function rotate(mat, params) {
        var deg = parseFloat(params[0]);

        console.log('rotating the image with deg = ' + deg);

        var theta = deg / 180.0 * Math.PI + Math.epsilon;
        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);
        return affine(mat, cosTheta, cosTheta, 0, 0, -sinTheta, sinTheta);
    }

    function affineTransform(u, v, sx, sy, tx, ty, shx, shy) {
        var px = u * sx + shx * v + tx;
        var py = v * sy + shy * u + ty;
        return {
            x : px,
            y : py
        };
    }

    function inverseAffineTransform(x, y, sx, sy, tx, ty, shx, shy) {
        var norm = shx*shy - sx*sy;
        return {
            u : (-sy * x + shx * y - (shx*ty-sy*tx)) / norm,
            v : (-sx * y + shy * x - (shy*tx-sx*ty)) / norm
        };
    }

    function affine(src, sx, sy, tx, ty, shx, shy) {
        // compute the corners first, create a larger image if the size is larger than current size
        var w = src.col;
        var h = src.row;

        var p00 = affineTransform(0, 0, sx, sy, tx, ty, shx, shy);
        var p01 = affineTransform(0, h, sx, sy, tx, ty, shx, shy);
        var p10 = affineTransform(w, 0, sx, sy, tx, ty, shx, shy);
        var p11 = affineTransform(w, h, sx, sy, tx, ty, shx, shy);

        var corners = {
            x: [p00.x, p01.x, p10.x, p11.x],
            y: [p00.y, p01.y, p10.y, p11.y]
        };

        var cols = Math.ceil(Math.max(corners.x.max(), w) - Math.min(corners.x.min(), 0));
        var rows = Math.ceil(Math.max(corners.y.max(), h) - Math.min(corners.y.min(), 0));

        var offset = {
            x: corners.x.min() - tx,
            y: corners.y.min() - ty
        }

        console.log(offset);

        var dst = new Mat(rows, cols);
        var ddata = dst.data,
            sdata = src.data;

        if( mapping == 'inverse' ) {
            console.log('inverse mapping');
            // inverse mapping
            for(var i= 0, idx=0;i<rows;i++) {
                var y = i + offset.y;
                for(var j=0;j<cols;j++, idx+=dst.channel) {
                    var x = j + offset.x;

                    var p  = inverseAffineTransform(x, y, sx, sy, tx, ty, shx, shy);
                    if( p.u < 0 || p.v < 0 || p.u >= w || p.v >= h ) {
                        // set the pixel
                        ddata[idx+0] = 0;
                        ddata[idx+1] = 0;
                        ddata[idx+2] = 0;
                        ddata[idx+3] = 255;
                    }
                    else {
                        var sidx = (Math.round(p.v) * w + Math.round(p.u)) * src.channel;
                        // set the pixel
                        ddata[idx+0] = sdata[sidx+0];
                        ddata[idx+1] = sdata[sidx+1];
                        ddata[idx+2] = sdata[sidx+2];
                        ddata[idx+3] = sdata[sidx+3];
                    }
                }
            }
        }
        else
        {
            console.log('forward mapping');
            // forward mapping
            // set all pixels to black
            for(var idx=0;idx<cols*rows*4;idx+=4) {
                ddata[idx+0] = 0;
                ddata[idx+1] = 0;
                ddata[idx+2] = 0;
                ddata[idx+3] = 255;
            }

            for(var i= 0, sidx=0;i<h;i++) {
                var y = i;
                for(var j=0;j<w;j++, sidx+=src.channel) {
                    var x = j;

                    var p  = affineTransform(x, y, sx, sy, tx, ty, shx, shy);

                    p.x -= offset.x;
                    //p.y -= offset.y;

                    if( p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows ) {
                    }
                    else
                    {
                        var idx = (Math.round(p.y) * cols + Math.round(p.x)) * dst.channel;

                        // set the pixel
                        ddata[idx+0] = sdata[sidx+0];
                        ddata[idx+1] = sdata[sidx+1];
                        ddata[idx+2] = sdata[sidx+2];
                        ddata[idx+3] = sdata[sidx+3];
                    }
                }
            }
        }
        return dst;
    }
};
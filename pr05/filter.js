function Filter( params )
{
    if( params == undefined )
    {
        this.width = 0;
        this.height = 0;
        this.factor = 0;
        this.bias = 0;
        this.p = 1;
        this.value = [];
        return this;
    }
    else
    {
        this.width = params.width;
        this.height = params.height;

        this.value = params.value;

        var weights = 0;
        if( !this.value ) {
            this.value = [];
            var idx = 0;
            for(var i=0;i<this.height;i++)
                for(var j=0;j<this.width;j++, idx++)
                {
                    var val = parseInt(params.weights[i][j]);
                    this.value[idx] = val;
                    weights += val;
                }
        }

        this.p = params.p || 1.0;
        this.bias = parseFloat(params.bias) || 0.0;
        this.factor = parseFloat(params.factor) || weights;
        if( this.factor == 0 ) this.factor = 1;
        return this;
    }
}

Filter.prototype.toString = function() {
    var str = '<p>Filter Matrix</p><table align=center class="fmtable" cellspacing=0 cellpadding=2>';

    var maxVal = 0, minVal = Number.MAX_VALUE;
    for(var i=0;i<this.value.length;i++) {
        maxVal = Math.max(maxVal, this.value[i]);
        minVal = Math.min(minVal, this.value[i]);
    }

    var diffVal = maxVal - minVal;

    for(var i= 0,idx=0;i<this.height;i++) {
        str += '<tr>';
        for(var j=0;j<this.width;j++,idx++) {
            var ratio = Math.round(((this.value[idx] - minVal) / diffVal)*255.0);
            var c = rgb2hex({r:ratio, g:ratio, b:ratio});
            str += '<td class="fmelem"' + 'bgcolor=#' + c + '>' + this.value[idx].toFixed(2).toString() + '</td>';
        }
        str += '</tr>';
    }
    str += '</table>';
    return str;
}

Filter.gradient = function() {
    return new Filter({
    width : 3,
    height : 3,
    value : [-1, -1, -1,
        -1, 8, -1,
        -1, -1, -1],
    factor : 1.0,
    bias : 0.0
    });
};

Filter.hsobel = function(){
    return new Filter({
        width : 3,
            height : 3,
        value : [-1, 0, 1,
        -2, 0, 2,
        -1, 0, 1],
        factor : 1.0,
        bias : 0.0
    });
};

Filter.vsobel = function(){
    return new Filter({
    width : 3,
    height : 3,
    value : [-1, -2, -1,
        0,  0,  0,
        1,  2,  1],
    factor : 1.0,
    bias : 0.0
    });
};

Filter.emboss = function( size, degree ) {

    var val = new Float32Array(size * size);
    var cx = size * 0.5;
    var cy = size * 0.5;

    var theta = degree / 180.0 * Math.PI;

    // line direction
    var v = {
        x: Math.cos(theta),
        y: Math.sin(theta)
    };

    var n = {
        x: -v.y,
        y: v.x
    }

    var THRES = 0.5;
    var weight = 0;
    var N = 8;
    var step = 1.0 / N;
    var step2 = step * step;
    for(var i= 0,idx=0;i<size;i++) {
        var y = cy - 1 - i;
        for(var j=0;j<size;j++,idx++) {
            var x = j - cx;
            // super sampling, make it soft
            var cnt = 0;
            var yy = y + 0.5 * step;
            for(var k=0;k<N;k++) {
                var xx = x + 0.5 * step;
                for(var l=0;l<N;l++) {
                    // compute the distance of point (x, y) to line (0,0) + t * v
                    // the distance is the dot product of vector (x, y) with v
                    cnt += (Math.abs(xx * n.x + yy * n.y) < THRES)?1:0;
                    xx += step;
                }
                yy += step;
            }

            var sign = (x + 0.5) * v.x + (y + 0.5) * v.y;
            sign = (Math.abs(sign) < 1e-6)?1:sign;
            val[idx] = (Math.abs(cnt) < 1e-6) ? 0 : cnt * step2;
            val[idx] *= (1.0 / sign);
            weight += val[idx];
        }
    }

    if( size & 0x1 ) {
        val[(size*size-1) / 2] = 0.0;
    }

    return new Filter({
        width : size,
        height : size,
        factor : 1.0,
        bias : 128.0,
        value : val
    });
}

Filter.blurn = function( size, sigma ) {

    var val = new Float32Array(size * size);
    // create a gaussian blur filter

    var cx = (size-1) * 0.5;
    var cy = (size-1) * 0.5;
    var r = sigma;

    var weight = 0;

    for(var i= 0,idx=0;i<size;i++) {
        var dy = i - cy;
        for(var j=0;j<size;j++,idx++) {
            var dx = j - cx;
            val[idx] = Math.exp(-(dx*dx + dy*dy) / (2*r*r));
            weight += val[idx];
        }
    }

    return new Filter({
        width: size,
        height : size,
        factor : weight,
        bias : 0,
        value : val
    });
};

Filter.blur3 = function(){
    return new Filter({
        width : 3,
            height : 3,
        factor : 16,
        bias : 0,
        value : [1, 2, 1,
        2, 4, 2,
        1, 2, 1]
    });
};

Filter.blur5 = function(){
    return new Filter({
    width : 5,
    height : 5,
    factor : 273,
    bias : 0,
    value : [
        1, 4, 7, 4, 1,
        4, 16, 26, 16, 4,
        7, 26, 41, 26, 7,
        4, 16, 26, 16, 4,
        1, 4, 7, 4, 1
    ]
    });
};

Filter.blur7 = function(){
    new Filter({
        width : 7,
            height : 7,
        factor : 1.0,
        bias : 0,
        value : [
        0.0000, 0.0003, 0.0110, 0.0172, 0.0110, 0.0003, 0.0000,
        0.0003, 0.0245, 0.0354, 0.0354, 0.0354, 0.0245, 0.0003,
        0.0110, 0.0354, 0.0354, 0.0354, 0.0354, 0.0354, 0.0110,
        0.0172, 0.0354, 0.0354, 0.0354, 0.0354, 0.0354, 0.0172,
        0.0110, 0.0354, 0.0354, 0.0354, 0.0354, 0.0354, 0.0110,
        0.0003, 0.0245, 0.0354, 0.0354, 0.0354, 0.0245, 0.0003,
        0.0000, 0.0003, 0.0110, 0.0172, 0.0110, 0.0003, 0.0000
    ]
    });
};

Filter.sharpen = function() {
    return new Filter({
    width : 5,
    height : 5,
    factor : 10.0,
    bias : 0.0,
    value : [
        0, -1, -2, -1, 0,
        -1, -2, -4, -2, -1,
        -2, -4, 50, -4, -2,
        -1, -2, -4, -2, -1,
        0, -1, -2, -1, 0
    ]});
};

Filter.usm = function(size, alpha) {
    // build a gaussian blur kernel
    var usmf = new Filter.blurn(size, 0.5 * size);

    // modify the blur kernel with alpha
    for(var i=0;i<usmf.value.length;i++) {
        usmf.value[i] *= (1.0 - alpha);
    }
    usmf.value[(usmf.value.length-1)/2] += alpha * usmf.factor;

    // compute the new weighting factor
    usmf.factor = 0;
    for(var i=0;i<usmf.value.length;i++) {
        usmf.factor += usmf.value[i];
    }

    return usmf;
}

Filter.motion = function(size, degree){

    var val = new Float32Array(size * size);
    var cx = size * 0.5;
    var cy = size * 0.5;

    var theta = degree / 180.0 * Math.PI;

    // line direction, normalized
    var v = {
        x: Math.cos(theta),
        y: Math.sin(theta)
    };

    var n = {
        x: -v.y,
        y: v.x
    };

    var N = 8;
    var N2 = N*N;
    var step = 1.0 / N;
    var weight = 0.0;
    var bw = 0.5;

    for(var i= 0,idx=0;i<size;i++) {
        var y = cy - 1 - i;
        for(var j=0;j<size;j++,idx++) {
            // supersampling, make it soft
            var x = j - cx;

            var cnt = 0;
            var yy = y + 0.5 * step;
            for(var ni=0;ni<N;ni++) {
                var xx = x + 0.5 * step;
                for(var nj=0;nj<N;nj++) {
                    // compute the distance of point (x, y) to line (0,0) + t * v
                    // the distance is the dot product of vector (x, y) with n
                    var dist = xx * n.x + yy * n.y;
                    cnt += (Math.abs(dist) <= bw)?1.0:0.0
                    xx += step;
                }
                yy += step;
            }

            val[idx] = cnt / N2;
            weight += val[idx];
        }
    }

    console.log(val);

    return new Filter({
        width : size,
        height : size,
        factor : weight,
        bias : 0.0,
        value : val
    });
};

Filter.invert = function(){
    return new Filter({
        width : 1,
            height : 1,
        factor : -1,
        bias : 255,
        value : [1.0]
    });
};

Filter.erosion = function(size, shape){
    var v = new Float32Array(size*size);

    switch( shape ) {
        case 'square': {
            for(var i=0;i< v.length;i++)
                v[i] = 1.0;
            break;
        }
        case 'round': {
            var r = size * 0.375;
            for(var i= 0, idx=0;i< size;i++)
                for(var j=0;j<size;j++, idx++) {
                    var dy = i - size / 2.0;
                    var dx = j - size / 2.0;
                    if( dx * dx + dy * dy < r * r )
                        v[idx] = 1.0;
                    else
                        v[idx] = 1e4;
                }
            break;
        }
        case 'plus':{
            for(var i= 0, idx=0;i<size;i++) {
                var flagi = ((i>=size/3.0) && (i<size*2.0/3.0));
                for(var j=0;j<size;j++, idx++) {
                    var flagj = ((j>=size/3.0) && (j<size*2.0/3.0));
                    if( flagi || flagj ) {
                        v[idx] = 1.0;
                    }
                    else v[idx] = 1e4;
                }
            }
            break;
        }
        case 'star':{
            var cx = (size-1) * 0.5;
            var cy = (size-1) * 0.5;
            var r = (size-1) * 0.5 * 0.375;
            var s = new Star(cx, cy, r, 5);

            for(var i= 0, idx=0;i<size;i++) {
                for(var j=0;j<size;j++, idx++) {
                    if( s.isInside(j, i) ) {
                        v[idx] = 1.0;
                    }
                    else v[idx] = 1e4;
                }
            }

            break;
        }
    }

    console.log(v);

    return new Filter({
        width : size,
        height: size,
        value : v,
        p : -20,
        factor: 1,
        bias : 0.0
    });
};

Filter.dialation = function(size, shape){
    var v = new Float32Array(size*size);
    switch( shape ) {
        case 'square': {
            for(var i=0;i< v.length;i++)
                v[i] = 1.0;
            break;
        }
        case 'round': {
            var r = size * 0.375;
            for(var i= 0, idx=0;i< size;i++)
                for(var j=0;j<size;j++, idx++) {
                    var dy = i - size / 2.0;
                    var dx = j - size / 2.0;
                    if( dx * dx + dy * dy < r * r )
                        v[idx] = 1.0;
                    else
                        v[idx] = 1e-4;
                }
            break;
        }
        case 'plus':{
            for(var i= 0, idx=0;i<size;i++) {
                var flagi = ((i>=size/3.0) && (i<size*2.0/3.0));
                for(var j=0;j<size;j++, idx++) {
                    var flagj = ((j>=size/3.0) && (j<size*2.0/3.0));
                    if( flagi || flagj ) {
                        v[idx] = 1.0;
                    }
                    else v[idx] = 1e-4;
                }
            }
            break;
        }
        case 'star':{
            var cx = (size-1) * 0.5;
            var cy = (size-1) * 0.5;
            var r = (size-1) * 0.5 * 0.375;
            var s = new Star(cx, cy, r, 5);

            for(var i= 0, idx=0;i<size;i++) {
                for(var j=0;j<size;j++, idx++) {
                    if( s.isInside(j, i) ) {
                        v[idx] = 1.0;
                    }
                    else v[idx] = 1e-4;
                }
            }
            break;
        }
    }
    return new Filter({
        width : size,
        height: size,
        value : v,
        p : 20,
        factor: 1,
        bias : 0.0
    });
};

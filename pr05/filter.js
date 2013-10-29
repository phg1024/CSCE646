function Filter( params )
{
	if( params == undefined )
	{
		this.width = 0;
		this.height = 0;
		this.factor = 0;
		this.bias = 0;
		this.value = [];
		return this;
	}
	else
	{
		this.width = params.width;
		this.height = params.height;
			
		this.value = [];
        var weights = 0;
        var idx = 0;
		for(var i=0;i<this.height;i++)
        for(var j=0;j<this.width;j++, idx++)
        {
            var val = parseInt(params.weights[i][j]);
		    this.value[idx] = val;
            weights += val;
        }
		
		this.bias = parseFloat(params.bias) || 0.0;
		this.factor = parseFloat(params.factor) || weights;
        if( this.factor == 0 ) this.factor = 1;
		return this;
	}
}

Filter.gradient = {
	width : 3,
	height : 3,
	value : [-1, -1, -1,
	-1, 8, -1, 
	-1, -1, -1],
	factor : 1.0,
	bias : 0.0	 
};
	
Filter.hsobel = {
	width : 3,
	height : 3,
	value : [-1, 0, 1,
	-2, 0, 2,
	-1, 0, 1],
	factor : 1.0,
	bias : 0.0
};

Filter.vsobel = {
	width : 3,
	height : 3,
	value : [-1, -2, -1,
	0,  0,  0,
	1,  2,  1],
	factor : 1.0,
	bias : 0.0
};

Filter.emboss = function( size, degree ) {

    var val = new Float32Array(size * size);
    var cx = (size-1) * 0.5;
    var cy = (size-1) * 0.5;

    var theta = degree / 180.0 * Math.PI;

    // line direction
    var v = {
        x: Math.cos(theta),
        y: Math.sin(theta)
    };

    // line normal
    var n = {
        x: -v.y,
        y: v.x
    }

    for(var i= 0,idx=0;i<size;i++) {
        var y = i - cy;
        for(var j=0;j<size;j++,idx++) {
            var x = j - cx;
            // compute the distance of point (x, y) to line (0,0) + t * v
            // the distance is the dot product of vector (x, y) with n
            val[idx] = x * n.x + y * n.y;
        }
    }

    if( size & 0x1 ) {
        val[(size*size-1) / 2] = 1;
    }

    return {
        width : size,
        height : size,
        factor : 1.0,
        bias : 0.0,
        value : val
    };
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

    return {
        width: size,
        height : size,
        factor : weight,
        bias : 0,
        value : val
    };
};
	
Filter.blur3 = {
	width : 3,
	height : 3,
	factor : 16,
	bias : 0,
	value : [1, 2, 1,
	2, 4, 2,
	1, 2, 1]
};

Filter.blur5 = {
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
};

Filter.blur7 = {
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
}
	
Filter.sharpen = {
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
	]
};
	
Filter.motion = function(size, degree){

    var val = new Float32Array(size * size);
    var cx = (size-1) * 0.5;
    var cy = (size-1) * 0.5;

    var theta = (180.0 - degree) / 180.0 * Math.PI;
    var bw = 1.0;

    // line direction, normalized
    var v = {
        x: Math.cos(theta),
        y: Math.sin(theta)
    };

    var n = {
        x: -v.y,
        y: v.x
    };

    var weight = 0.0;
    for(var i= 0,idx=0;i<size;i++) {
        var y = i - cy;
        for(var j=0;j<size;j++,idx++) {
            var x = j - cx;
            // compute the distance of point (x, y) to line (0,0) + t * v
            // the distance is the dot product of vector (x, y) with n
            var dist = x * n.x + y * n.y;

            val[idx] = (Math.abs(dist) <= bw)?1.0:0.0;
            weight += val[idx];
        }
    }

    console.log(val);

    return {
	width : size,
	height : size,
	factor : weight,
	bias : 0.0,
	value : val
    }
};

Filter.invert = {
	width : 1,
	height : 1,
	factor : -1,
	bias : 255,
	value : [1.0]
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

    return {
    width : size,
    height: size,
    value : v,
    p : -20,
    factor: 1,
    bias : 0.0
    };
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
    return {
    width : size,
    height: size,
    value : v,
    p : 20,
    factor: 1,
    bias : 0.0
    };
};

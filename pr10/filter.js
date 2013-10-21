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
		var idx = 0;
		this.width = parseInt(params[idx++]);
		this.height = parseInt(params[idx++]);
			
		this.value = [];
		for(var i=0;i<this.width*this.height;i++,idx++)
		this.value[i] = parseInt(params[idx]);
		
		this.bias = parseFloat(params[idx++]);
		this.factor = parseFloat(params[idx]);
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
	
Filter.emboss = {
	width : 3,
	height : 3,
	factor : 1.0,
	bias : 0.0,
	value : [-2, -1, 0,
	-1, 1, 1,
	0, 1, 2]
};
	
Filter.blur = {
	width : 3,
	height : 3,
	factor : 16,
	bias : 0,
	value : [1, 2, 1,
	2, 4, 2,
	1, 2, 1]
};
	
Filter.sharpen = {
	width : 5,
	height : 5,
	factor : 8.0,
	bias : 0.0,
	value : [
	-1, -1, -1, -1, -1,
	-1, 2, 2, 2, -1,
	-1, 2, 8, 2, -1,
	-1, 2, 2, 2, -1,
	-1, -1, -1, -1, -1
	]
};
	
Filter.motion = {
	width : 9,
	height : 9,
	factor : 25.0,
	bias : 0.0,
	value : [
	1, 1, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 1, 0, 0, 0, 0, 0, 0,
	0, 1, 1, 1, 0, 0, 0, 0, 0,
	0, 0, 1, 1, 1, 0, 0, 0, 0,
	0, 0, 0, 1, 1, 1, 0, 0, 0,
	0, 0, 0, 0, 1, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 1, 1, 1, 0,
	0, 0, 0, 0, 0, 0, 1, 1, 1,
	0, 0, 0, 0, 0, 0, 0, 1, 1
	]
};

Filter.invert = {
	width : 1,
	height : 1,
	factor : -1,
	bias : 255,
	value : [1.0]
};
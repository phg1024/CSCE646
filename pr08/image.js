/**
 * Created by peihongguo on 10/5/13.
 */

function Color(r, g, b, a)
{
    if( arguments.length !== 4 )
    {
        this.r = this.g = this.b = this.a = 0;
    }
    else
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

Color.RED = new Color(255, 0, 0, 255);
Color.GREEN = new Color(0, 255, 0, 255);
Color.BLUE = new Color(0, 0, 255, 255);
Color.YELLOW = new Color(255, 255, 0, 255);
Color.PURPLE = new Color(255, 0, 255, 255);
Color.CYAN = new Color(0, 255, 255, 255);
Color.WHITE = new Color(255, 255, 255, 255);
Color.BLACK = new Color(0, 0, 0, 255);
Color.GRAY = new Color(128, 128, 128, 255);

Color.prototype.setColor = function(that)
{
    if( that != null &&
        that.constructor === Color )
    {
        this.r = that.r;
        this.g = that.g;
        this.b = that.b;
        this.a = that.a;
        return this;
    }
    else
        return null;
};

Color.prototype.equal = function( that ) {
    return (this.r == that.r && this.g == that.g && this.b == that.b);
}

Color.prototype.add = function(that) {
    return new Color(this.r + that.r, this.g + that.g, this.b + that.b, this.a + that.a);
};

Color.prototype.sub = function(that) {
    return new Color(this.r - that.r, this.g - that.g, this.b - that.b, this.a - that.a);
};

Color.prototype.mul = function(c)
{
    return new Color(this.r * c, this.g * c, this.b * c, this.a * c);
};

Color.prototype.round = function() {
    this.r = Math.round(this.r);
    this.g = Math.round(this.g);
    this.b = Math.round(this.b);
    this.a = Math.round(this.a);
    return this;
}

Color.prototype.clamp = function() {
    this.r = clamp(this.r, 0, 255);
    this.g = clamp(this.g, 0, 255);
    this.b = clamp(this.b, 0, 255);
    this.a = clamp(this.a, 0, 255);
    return this;
}

Color.interpolate = function(c1, c2, t)
{
    return c1.mul(t).add(c2.mul(1-t));
};

function ImageBase(w, h) {
    this.channels = 4;
    this.w = w;
    this.h = h;
    this.data = undefined;
}

ImageBase.prototype.getPixel = function(x, y) {
    var idx = (y * this.w + x) * this.channels;
    return new Color(
        this.data[idx+0],
        this.data[idx+1],
        this.data[idx+2],
        this.data[idx+3]
    );
};

// bilinear sample of the image
ImageBase.prototype.sample = function(x, y) {
    var w = this.w, h = this.h;
    var ty = Math.floor(y);
    var dy = Math.ceil(y);

    var lx = Math.floor(x);
    var rx = Math.ceil(x);

    var fx = x - lx;
    var fy = y - ty;

    var c = this.getPixel(lx, ty).mul((1-fy) * (1-fx))
        .add(this.getPixel(lx, dy).mul(fy * (1-fx)))
        .add(this.getPixel(rx, ty).mul((1-fy) * fx))
        .add(this.getPixel(rx, dy).mul(fy * fx));

    c.clamp();

    return c;
};

ImageBase.prototype.setPixel = function(x, y, c) {
    var idx = (y * this.w + x) * this.channels;
    this.data[idx] = c.r;
    this.data[idx+1] = c.g;
    this.data[idx+2] = c.b;
    this.data[idx+3] = c.a;
};

function RGBAImagef(w, h, data) {
    var that = new ImageBase(w, h);
    that.data = new Float32Array(w*h*that.channels);
    data && that.data.set(data);

    that.toRGBAImage = function() {
        var w = this.w, h = this.h;
        var img = new RGBAImage(w, h);
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                var c = this.getPixel(x, y);
                c.round();
                c.clamp();
                img.setPixel(x, y, c);
            }
        }
        return img;
    };

    return that;
}

function RGBAImage( w, h, data )
{
    var that = new ImageBase(w, h);
    that.data = new Uint8Array(w*h*that.channels);
    data && that.data.set(data);

    that.toRGBAImagef = function() {
        var w = this.w, h = this.h;
        var img = new RGBAImagef(w, h);
        for(var y=0;y<h;y++) {
            for(var x=0;x<w;x++) {
                img.setPixel(x, y, this.getPixel(x, y));
            }
        }
        return img;
    };

    that.uploadTexture = function( ctx, texId )
    {
        var w = this.w;
        var h = this.h;

        ctx.bindTexture(ctx.TEXTURE_2D, texId);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.texImage2D(ctx.TEXTURE_2D, 0,  ctx.RGBA, w, h, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, this.data);
    };

    that.toImageData = function( ctx ) {
        var imgData = ctx.createImageData(this.w, this.h);
        imgData.data.set(this.data);
        return imgData;
    };

    return that;
}

/* get RGBA image data from the passed image object */
RGBAImage.fromImage = function( img, cvs ) {
    var w = img.width;
    var h = img.height;

    // resize the canvas for drawing
    cvs.width = w;
    cvs.height = h;

    var ctx = cvs.getContext('2d');

    // render the image to the canvas in order to obtain image data
    ctx.drawImage(img, 0, 0);
    var imgData = ctx.getImageData(0, 0, w, h);
    var newImage = new RGBAImage(w, h, imgData.data);
    imgData = null;

    // clear up the canvas
    ctx.clearRect(0, 0, w, h);
    return newImage;
};
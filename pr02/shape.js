/**
 * Created by peihongguo on 10/5/13.
 */

function Point2(x, y) {
    if( arguments.length != 2 ) {
        this.x = this.y = 0;
    }
    else {
        this.x = x;
        this.y = y;
    }
}

Point2.prototype.distanceTo = function( that ) {
    var dx = this.x - that.x;
    var dy = this.y - that.y;
    return Math.sqrt(dx * dx + dy * dy);
}

Point2.prototype.add = function( that ) {
    return new Point2(this.x + that.x, this.y + that.y);
}

Point2.prototype.mul = function( factor ) {
    return new Point2(this.x * factor, this.y * factor);
}

function Vector2(x, y) {
    if (arguments.length != 2) {
        this.x = this.y = 0;
    } else {
        this.x = x;
        this.y = y;
    }
}

Vector2.prototype.add = function( that ) {
    return new Vector2(this.x + that.x, this.y + that.y);
}

Vector2.prototype.mul = function( factor ) {
    return new Vector2(this.x * factor, this.y * factor);
}

Vector2.prototype.dot = function( that ) {
    return this.x * that.x + this.y * that.y;
}

Vector2.prototype.cross = function( that ) {
    return this.x * that.y - this.y * that.x;
}

Vector2.prototype.normSquared = function() {
    return this.x * this.x + this.y * this.y;
}

Vector2.prototype.norm = function() {
    return Math.sqrt( this.x * this.x + this.y * this.y );
}

Vector2.prototype.normalize = function() {
    var L = this.norm();
    var THRES = 1e-16;
    if( L > THRES ) {
        this.x /= L;
        this.y /= L;
    }
    return this;
}

/*
    Shape base class
 */
function Shape()
{
    this.distanceTo = function(x, y)
    {
        return 0;
    }
    this.isInside = function(x, y)
    {
        return ( this.distanceTo(x, y) <= 0 );
    }
}

/*
    Edge
 */
function Edge(p, n, dir)
{
    var that = new Shape();
    that.p = p;
    that.n = n.normalize();
    that.dir = dir;
    that.distanceTo = function(x, y) {
        return n.dot( new Vector2(x - p.x, y - p.y) );
    }
    return that;
}

/*
    Polygon
 */
function Polygon()
{
    var that = new Shape();

    that.e = [];
    that.v = [];

    that.distanceTo = function(x, y) {
        var res = -1e32;
        for(var i=0; i<this.e.length; i++) {
            var dist = this.e[i].distanceTo(x, y);
            res = Math.max(res, dist);
        }
        return res;
    }

    that.genEdges = function() {
        this.e = [];
        for(var i=0; i<this.v.length; i++) {
            var j = (i+1) % this.v.length;
            var dir = new Vector2(this.v[j].x - this.v[i].x, this.v[j].y - this.v[i].y);
            var n = new Vector2(dir.y, -dir.x);
            var ed = new Edge(this.v[i], n, dir);
            this.e.push(ed);
        }
    }

    that.addVertex = function( p ) {
        this.v.push(p);
    }

    return that;
}

/*
    Circle
 */

function Circle(x, y, r) {
    var that = new Shape();
    that.r = r;
    that.x = x;
    that.y = y;
    that.r2 = r * r;

    that.distanceTo = function( x, y )
    {
        var dx = x - this.x;
        var dy = y - this.y;
        return (Math.sqrt(dx*dx+dy*dy) - r);
    }

    return that;
}

/*
    Star
 */
function Star(x, y, r, corners) {
    var that = new Shape();

    that.x = x;
    that.y = y;
    that.r = r;
    that.corners = corners;

    that.e = [];
    var center = new Point2(x, y);
    var theta = PI / corners * ((corners & 0x1)?0.5:1.0);
    for( var i=0; i<corners; i++ ) {
        var n = new Vector2(Math.cos(theta), Math.sin(theta));
        var p = center.add( (new Point2(Math.cos(theta), Math.sin(theta))).mul(r) );
        that.e.push(new Edge(p, n));

        theta += 2.0 * PI / corners;
    }

    that.distanceTo = function(x, y) {
        var cnt = 0;
        for(var i=0;i<corners;i++) {
            if( this.e[i].distanceTo(x, y) <= 0 )
                cnt++;
        }
        return ((cnt >= (corners-1))?-1:1);
    }

    return that;
}

/*
    Blobby
 */
function Blobby() {
    var that = new Shape();

    that.circles = [];

    that.addCircle = function( c ) {
        this.circles.push( c );
        console.log(this.circles.length);
    }

    that.distanceTo = function( x, y ) {
        var alpha = 1.5e-4;
        var res = 0;
        for( var i=0;i<this.circles.length;i++) {
            var dx = x - this.circles[i].x;
            var dy = y - this.circles[i].y;

            res += Math.exp( -alpha * ((dx*dx+dy*dy) - this.circles[i].r2) );
        }
        res = -1.0 / alpha * Math.log(res);
        return res;
    }

    return that;
}

function FunctionShape( fun ) {
    var that = new Shape();

    that.distanceTo = function( x, y ) {
        return fun(x, y);
    }

    return that;
}
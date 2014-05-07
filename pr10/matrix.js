/**
 * Created by phg on 10/15/13.
 */

function Matrix3x3( val ) {
    if( arguments.length < 1 ) {
        this.data = [];
    }
    else {
        this.data = val;
    }
}

Matrix3x3.identity = function() {
    return new Matrix3x3([1, 0, 0, 0, 1, 0, 0, 0, 1]);
};

Matrix3x3.zero = function() {
    return new Matrix3x3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
};

Matrix3x3.rotation = function( deg ) {
    var theta = deg / 180.0 * Math.PI + Math.epsilon;
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    var mat = Matrix3x3.identity();

    mat.setElement(0, 0, cosTheta); mat.setElement(0, 1, -sinTheta);
    mat.setElement(1, 0, sinTheta); mat.setElement(1, 1, cosTheta);
    return mat;
};

Matrix3x3.perspective = function(px, py) {
    var mat = Matrix3x3.identity();
    mat.setElement(2, 0, px); mat.setElement(2, 1, py);
    return mat;
};

Matrix3x3.shear = function(shx, shy) {
    var mat = Matrix3x3.identity();
    mat.setElement(0, 1, shx); mat.setElement(1, 0, shy);
    return mat;
};

Matrix3x3.scale = function(sx, sy) {
    var mat = Matrix3x3.identity();
    mat.setElement(0, 0, sx); mat.setElement(1, 1, sy);
    return mat;
};

Matrix3x3.translate = function(tx, ty) {
    var mat = Matrix3x3.identity();
    mat.setElement(0, 2, tx); mat.setElement(1, 2, ty);
    return mat;
};

Matrix3x3.prototype.det = function() {
    var m = this.data;
    return m[0] * (m[4]*m[8] - m[5]*m[7])
         - m[1] * (m[8]*m[3] - m[5]*m[6])
         + m[2] * (m[3]*m[7] - m[4]*m[6]);
};

Matrix3x3.prototype.getElement = function(row, col) {
    var idx = row * 3 + col;
    return this.data[idx];
};

Matrix3x3.prototype.setElement = function(row, col, val) {
    var idx = row * 3 + col;
    this.data[idx] = val;
    return this;
};

Matrix3x3.prototype.mul = function( v ) {
    if( v instanceof Matrix3x3 ) {
        var mat = new Matrix3x3();

        for(var i=0;i<3;i++) {
            for(var j=0;j<3;j++) {
                var s = 0;
                for(var k=0;k<3;k++) {
                    s += v.getElement(k, j) * this.getElement(i, k);
                }
                mat.setElement(i, j, s);
            }
        }
        return mat;
    }
    else if( v instanceof Point3 ) {
        var m = this.data;
        var x = m[0] * v.x + m[1] * v.y + m[2] * v.z;
        var y = m[3] * v.x + m[4] * v.y + m[5] * v.z;
        var z = m[6] * v.x + m[7] * v.y + m[8] * v.z;
        return new Point3(x, y, z);
    }
    else if( v instanceof Vector3 ) {
        var m = this.data;
        var x = m[0] * v.x + m[1] * v.y + m[2] * v.z;
        var y = m[3] * v.x + m[4] * v.y + m[5] * v.z;
        var z = m[6] * v.x + m[7] * v.y + m[8] * v.z;
        return new Vector3(x, y, z);
    }
};

Matrix3x3.prototype.inv = function() {
    var m = this.data;
    var mat = Matrix3x3.zero();
    var det = this.det();

    mat.setElement(0, 0, (m[4]*m[8] - m[5]*m[7])/det);
    mat.setElement(0, 1, -(m[1]*m[8] - m[2]*m[7])/det);
    mat.setElement(0, 2, (m[1]*m[5] - m[2]*m[4])/det);

    mat.setElement(1, 0, -(m[3]*m[8] - m[5]*m[6])/det);
    mat.setElement(1, 1, (m[0]*m[8] - m[2]*m[6])/det);
    mat.setElement(1, 2, -(m[0]*m[5] - m[2]*m[3])/det);

    mat.setElement(2, 0, (m[3]*m[7] - m[4]*m[6])/det);
    mat.setElement(2, 1, -(m[0]*m[7] - m[1]*m[6])/det);
    mat.setElement(2, 2, (m[0]*m[4] - m[1]*m[3])/det);

    return mat;
};

Matrix3x3.prototype.transpose = function() {

    for(var i=0;i<3;i++) {
        for(var j=i;j<3;j++) {
            var tmp = this.getElement(j, i);
            this.setElement(j, i, this.getElement(i,j));
            this.setElement(i, j, tmp);
        }
    }

    return this;
};

Matrix3x3.prototype.transposed = function() {
    var m = Matrix3x3.zero();

    for(var i=0;i<3;i++) {
        for(var j=i;j<3;j++) {
            m.setElement(j, i, this.getElement(i,j));
        }
    }

    return m;
};


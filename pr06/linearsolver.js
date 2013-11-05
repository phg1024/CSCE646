/**
 * Created by peihongguo on 11/4/13.
 */

var linearsolver = function(){
    this.maxIters = 4096;
    this.alpha = 1.75;
    this.THRES = 1e-6;

    this.dot = function(u, v) {
        var res = 0;
        var L = u.length;
        for(var i=0;i<L;i++) res += u[i] * v[i];
        return res;
    }

    this.mv = function(A, v) {
        var rows = A.length;
        var Av = new Float32Array(rows);
        // initialize x
        for (var i = 0; i < rows; i++) Av[i] = 0;

        for ( var i=0; i<rows;i++ ) {
            for (var j = 0; j < A[i].length; j++) {
                var aij = A[i][j].val;
                var jidx = A[i][j].idx;

                Av[i] += aij * v[jidx];
            }
        }

        return Av;
    };

    this.vsub = function(u, v) {
        var rows = u.length;
        var w = new Float32Array(rows);
        for (var i = 0; i < rows; i++) w[i] = (u[i] - v[i]);
        return w;
    };

    this.vadd = function(u, v) {
        var rows = u.length;
        var w = new Float32Array(rows);
        for (var i = 0; i < rows; i++) w[i] = (u[i] + v[i]);
        return w;
    };

    this.axpy = function(u, alpha, v) {
        var rows = u.length;
        var w = new Float32Array(rows);
        for (var i = 0; i < rows; i++) w[i] = (u[i] + v[i] * alpha);
        return w;
    };

    // conjugate gradient
    this.cg = function(A, b) {
        // initialization
        var iters = 0;
        var converged = false;
        var w = 1.0 - this.alpha;
        var rows = A.length;
        var x = [];
        // initialize x
        for (var i = 0; i < rows; i++) x.push(0);

        // r = b - A x
        // x is zero initially
        var r = [];
        var p = [];
        for (var i = 0; i < rows; i++) {
            r.push(b[i]);
            p.push(b[i]);
        }

        while( !converged && iters < this.maxIters ) {
            var rDotr = this.dot(r, r);
            var Ap = this.mv(A, p);
            var pAp = this.dot(p, Ap);
            var alpha = rDotr / pAp;

            x = this.axpy(x, alpha, p);

            r = this.axpy(r, -alpha, Ap);

            var rDotr_new = this.dot(r, r);

            if( rDotr_new < this.THRES ) {
                converged = true;
                break;
            }

            var beta = rDotr_new / rDotr;
            p = this.axpy(r, beta, p);

            iters++;
        }

        console.log('converged in ' + iters + ' iterations');

        return x;
    };

    // gauss seidel with over relaxation
    this.solve = function (A, b) {
        var iters = 0;
        var converged = false;
        var w = 1.0 - this.alpha;
        var rows = A.length;
        var x = [];
        // initialize x
        for (var i = 0; i < rows; i++) x.push(0);

        while (!converged && iters < this.maxIters) {

            var diff = 0;
            for (var i = 0; i < rows; i++) {

                var aii = A[i][0].val;
                var bi = b[i];

                for (var j = 1; j < A[i].length; j++) {
                    var aij = A[i][j].val;
                    var jidx = A[i][j].idx;

                    bi -= aij * x[jidx];
                }

                var x0 = x[i];
                x[i] = bi / aii * this.alpha + x[i] * w;
                diff += Math.abs(x[i] - x0);
            }
            iters++;

            converged = (diff / rows) < this.THRES;
        }
        console.log('converged in ' + iters + ' iterations');

        return x;
    };
}
/**
 * Created by PhG on 11/13/13.
 */

function solveMLSDeformation(controlPts, deformedPts, w, h) {

    var alpha = 1.5;

    var p = new Array(controlPts.length);
    var q = new Array(deformedPts.length);

    if(p.length !== q.length){
        throw 'The number of control points is not equal to the number of deformed points.'
        return;
    }

    var m = p.length;

    for(var i=0;i<m;i++) {
        p[i].x = controlPts[i][0];
        p[i].y = controlPts[i][1];
        q[i].x = deformedPts[i][0];
        q[i].y = deformedPts[i][1];
    }

    // first set up grid
    var n = n | 100;

    var stepX = w / n;
    var stepY = h / n;

    var gridPoints = [];
    for(var i=0;i<=n;i++) {
        var y = i * stepY;
        for(var j=0;j<=n;j++) {
            var x = j * stepX;

            gridPoints.push(new Point2(x, y));
        }
    }

    // compute weights for each control point p
    var w = new Array(p.length);

    for(var i=0;i< p.length;i++) {
        w[i] = new Array(gridPoints.length);
        var wi = w[i];

        var pi = p[i];

        for(var j=0;j<gridPoints.length;j++) {

            var dx = pi.x - gridPoints[j].x;
            var dy = pi.y - gridPoints[j].y;
            var norm = dx * dx + dy * dy;

            var wij = 1.0 / Math.pow(norm, alpha);

            wi[j] = (wij);
        }
    }

    // compute p* and q*
    var pStar = new Array(gridPoints.length), qStar = new Array(gridPoints.length);
    for(var j=0;j< gridPoints.length;j++) {
        var wSumj = 0;
        var pStarj = [0, 0], qStarj = [0, 0];

        for(var i=0;i<m;i++) {
            var wij = w[i][j];
            wSumj += wij;
            pStarj = pStarj.add(p[i].mul(wij));
            qStarj = qStarj.add(q[i].mul(wij));
        }

        pStar[j] = pStarj.mul(1.0 / wSumj);
        qStar[j] = qStarj.mul(1.0 / wSumj);
    }

    // compute phat and qhat
    var phat = new Array(gridPoints.length), qhat = new Array(gridPoints.length);
    for(var j=0;j<gridPoints.length;j++) {
        var phatj = new Array(m);
        var qhatj = new Array(m);
        for(var i=0;i<m;i++) {
            phatj[i] = p[i].sub(pStar[i]);
            qhatj[i] = q[i].sub(qStar[i]);
        }
        phat[j] = phatj;
        qhat[j] = qhatj;
    }

    // compute the local affine matrix
    var M = new Array(gridPoints.length);
    var A = new Array(gridPoints.length);

    for(var r= 0, idx=0;r<=n;r++) {
        for(var c=0;c<=n;c++, idx++) {
            if( r == 0 || c == 0 || r == n || c == n ) {
                M.push(new Matrix2x2.identity());
            }
            else {
                var v = gridPoints[idx];
                var pStari = pStar[idx];
                var Acurr = [];

                var C = new Matrix2x2([0, 0, 0, 0]);
                for(var i=0;i<m;i++) {
                    var phati = phat[idx][i];
                    var Ci = Matrix2x2.outerProduct(phati, phati).mul(w[i][idx]);
                    C = C.add(Ci);
                }

                C = C.inv();
                for(var i=0;i<m;i++) {
                    var Ai = (v.sub(pStari)).dot(C.mul(phat[idx][i].w[i][idx]));
                    Acurr.push(Ai);
                }
                A.push(Acurr);
            }
        }
    }
}
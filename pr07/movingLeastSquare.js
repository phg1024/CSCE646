/**
 * Created by PhG on 11/13/13.
 */

function solveMLSDeformation(controlPts, deformedPts, w, h) {

    var alpha = 1.5;

    var p = new Array(controlPts.length);
    var q = new Array(deformedPts.length);

    // first set up grid
    var n = n | 100;

    var stepX = w / n;
    var stepY = h / n;

    var gridPoints = [];
    for(var i=0;i<=n;i++) {
        var y = i * stepY;
        for(var j=0;j<=n;j++) {
            var x = j * stepX;

            gridPoints.push([x, y]);
        }
    }

    // compute weights for each control point p
    var w = new Array(p.length);

    for(var i=0;i< p.length;i++) {
        w[i] = new Array(gridPoints.length);
        var wi = w[i];

        var px = p[i][0], py = p[i][1];

        for(var j=0;j<gridPoints.length;j++) {

            var dx = px - gridPoints[j][0];
            var dy = py - gridPoints[j][1];
            var norm = dx * dx + dy * dy;

            var wij = 1.0 / Math.pow(norm, alpha);

            wi[j] = (wij);
        }
    }

    // compute p* and q*
    var pStar = new Array(gridPoints.length), qStar = new Array(gridPoints.length);
    for(var j=0;j< gridPoints.length;j++) {
        var wSumi = 0;
        var pStari = [0, 0], qStari = [0, 0];

        for(var i=0;i< p.length;i++) {
            var wij = w[i][j];
            wSumi += wij;
            pStari[0] += wij * p[i][0];
            pStari[1] += wij * p[i][1];
            qStari[0] += wij * q[i][0];
            qStari[1] += wij * q[i][1];
        }

        pStari[0] /= wSumi;
        pStari[1] /= wSumi;
        qStari[0] /= wSumi;
        qStari[1] /= wSumi;

        pStar[i] = pStari;
        qStar[i] = qStari;
    }

    // compute phat and qhat
    var phat = new Array(gridPoints.length), qhat = new Array(gridPoints.length);
    for(var i=0;i< p.length;i++) {
        phat[i][0] = p[i][0] - pStar[i][0];
        phat[i][1] = p[i][1] - pStar[i][1];

        qhat[i][0] = q[i][0] - qStar[i][0];
        qhat[i][1] = q[i][1] - qStar[i][1];
    }

    // compute the local affine matrix

}
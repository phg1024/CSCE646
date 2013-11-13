/**
 * Created by PhG on 11/13/13.
 */


function updateImageWithMLSGrids( pts ) {
    // perform a series of bilinear mapping for each cell
    // first set up grid
    var n = n | 8;

    var stepX = width / n;
    var stepY = height / n;

    // get the original cell region
    var cellRegion = [];
    var mappedRegion = [];
    for(var i=0;i<n;i++) {
        var y0 = i * stepY;
        var y1 = (i + 1) * stepY;
        for(var j=0;j<n;j++) {
            var x0 = j * stepX;
            var x1 = (j+1) * stepX;
            cellRegion.push([[x0, y0], [x1, y0], [x0, y1], [x1, y1]]);

            mappedRegion.push([
                pts[i*(n+1) + j], // top-left
                pts[i*(n+1) + j + 1], // top-right
                pts[(i + 1)*(n+1) + j], // bottom-left
                pts[(i + 1)*(n+1) + j + 1], // bottom-right
            ]);
        }
    }

    // for each cell region, perform a bilinear mapping defined by the input points
    var newImg = Transformations.op['mb'](curImg, pts, cellRegion, mappedRegion);
    canvasresize(newImg.w, newImg.h);
    adjustImageRegion(newImg.w, newImg.h);
    context.putImageData(newImg.toImageData(context), 0, 0);
}

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
        q[i] = new Point2(controlPts[i][0], controlPts[i][1]);
        p[i] = new Point2(deformedPts[i][0], deformedPts[i][1]);
    }

    // first set up grid
    var n = n | 8;

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
        var pStarj = new Point2(0, 0), qStarj = new Point2(0, 0);

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
    var A = new Array(gridPoints.length);

    for(var r= 0, idx=0;r<=n;r++) {
        for(var c=0;c<=n;c++, idx++) {
                var v = gridPoints[idx];
                var pStari = pStar[idx];
                var Acurr = [];

                var C = new Matrix2x2([0, 0, 0, 0]);
                for(var i=0;i<m;i++) {
                    var phati = phat[idx][i];
                    var Ci = Matrix2x2.outerProduct(phati, phati).muls(w[i][idx]);
                    C = C.add(Ci);
                }

                C = C.inv();
                for(var i=0;i<m;i++) {
                    var Ai = Vector2.fromPoint2(pStari, v).dot(C.mul(phat[idx][i].mul(w[i][idx])));
                    Acurr.push(Ai);
                }
                A[idx] = Acurr;
        }
    }

    // compute mapped grid points
    var mappedGrids = [];
    for(var r= 0,idx=0;r<=n;r++) {
        for(var c=0;c<=n;c++, idx++) {
                var v = new Point2(0, 0);
                for(var j=0;j<m;j++) {
                    v = v.add(qhat[idx][j].mul(A[idx][j]));
                }
                v = v.add(qStar[idx]);
                mappedGrids.push(v);
        }
    }

    return mappedGrids;
}
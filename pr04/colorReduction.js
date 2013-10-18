/**
 * Created by phg on 10/17/13.
 */

function uniform( inColors, n ) {
    // levels^3 colors in total
    var levels = Math.ceil(Math.pow(n, 1/3));
    var colors = [];
    var step = 255 / (levels - 1);
    for(var i=0;i<levels;i++) {
        var r = i * step;
        for(var j=0;j<levels;j++) {
            var g = j * step;
            for(var k=0;k<levels;k++) {
                var b = k * step;
                colors.push({r:r, g:g, b:b, count:0});
            }
        }
    }

    // assign colors to the bins, and select the most populated bins
    for(var i=0;i<inColors.length;i++) {
        var idx, minDist = Number.MAX_VALUE;
        for(var j=0;j<colors.length;j++) {
            var dr = inColors[i].r - colors[j].r;
            var dg = inColors[i].g - colors[j].g;
            var db = inColors[i].b - colors[j].b;
            var dist = dr * dr + dg * dg + db * db;
            if( dist < minDist ) {
                minDist = dist;
                idx = j;
            }
        }
        colors[idx].count++;
    }

    colors.sort(function(a, b){return b.count- a.count;});

    return colors.slice(0, n);
}

function buildcdf( hist, num_bins )
{
    if( num_bins == undefined )
        num_bins = 256;

    var cumuhist = [];
    cumuhist[0] = hist[0];
    for(var i=1;i<num_bins;i++)
        cumuhist[i] = cumuhist[i-1] + hist[i];

    for(var i=0;i<num_bins;i++) {
        cumuhist[i] /= cumuhist[num_bins-1];
    }

    return cumuhist;
}

function population( inColors, n ) {
    var rhist = new Array(256);
    var ghist = new Array(256);
    var bhist = new Array(256);

    for(var i=0;i<256;i++) {
        rhist[i] = ghist[i] = bhist[i] = 0;
    }

    for(var i=0;i<inColors.length;i++) {
        var r = inColors[i].r;
        var g = inColors[i].g;
        var b = inColors[i].b;
        rhist[r] ++;
        ghist[g] ++;
        bhist[b] ++;
    }

    var rcdf = buildcdf(rhist);
    var gcdf = buildcdf(ghist);
    var bcdf = buildcdf(bhist);

    var levels = Math.ceil(Math.pow(n, 1/3));

    var step = 1.0 / levels;
    var rPoints = [0];
    var gPoints = [0];
    var bPoints = [0];

    for(var j=0;j<=levels;j++) {
        var p = step * j;
        for(var i=1;i<256;i++) {
            if( rcdf[i-1] <= p && rcdf[i] >= p ) {
                rPoints.push(i);
                break;
            }
        }
        for(var i=1;i<256;i++) {
            if( gcdf[i-1] <= p && gcdf[i] >= p ) {
                gPoints.push(i);
                break;
            }
        }
        for(var i=1;i<256;i++) {
            if( bcdf[i-1] <= p && bcdf[i] >= p ) {
                bPoints.push(i);
                break;
            }
        }
    }

    var colors = [];
    for(var i=0;i<levels;i++) {
        for(var j=0;j<levels;j++) {
            for(var k=0;k<levels;k++) {
                colors.push({
                    r: Math.round(0.5*(rPoints[i] + rPoints[i+1])),
                    g: Math.round(0.5*(gPoints[j] + gPoints[j+1])),
                    b: Math.round(0.5*(bPoints[k] + bPoints[k+1])),
                    count: 0
                });
            }
        }
    }

    // assign colors to the bins, and select the most populated bins
    for(var i=0;i<inColors.length;i++) {
        var idx, minDist = Number.MAX_VALUE;
        for(var j=0;j<colors.length;j++) {
            var dr = inColors[i].r - colors[j].r;
            var dg = inColors[i].g - colors[j].g;
            var db = inColors[i].b - colors[j].b;
            var dist = dr * dr + dg * dg + db * db;
            if( dist < minDist ) {
                minDist = dist;
                idx = j;
            }
        }
        colors[idx].count++;
    }

    colors.sort(function(a, b){return b.count- a.count;});

    return colors.slice(0, n);
}

function kmeans( inColors, n ) {
    // sample 1% colors
    var ncolors = inColors.length / 100;
    console.log(ncolors);
    var samples = [];
    for(var i=0;i<ncolors;i++) {
        samples.push( inColors[Math.round(Math.random() * (inColors.length - 1))] );
    }

    // initialize the centroids
    var centroids = [];
    centroids.push( {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
    })

    var m = 16;
    var initsamples = [];
    while( centroids.length < n ) {
        // get m samples from the input color
        for(var i=0;i<m;i++) {
            initsamples.push(inColors[Math.round(Math.random() * (inColors.length - 1))]);
        }

        // assign the samples to the clusters
        for(var i=0;i<initsamples.length;i++) {
            var idx, minDist = Number.MAX_VALUE;
            for(var j=0;j<centroids.length;j++) {
                var dr = initsamples[i].r - centroids[j].r;
                var dg = initsamples[i].g - centroids[j].g;
                var db = initsamples[i].b - centroids[j].b;
                var dist = dr * dr + dg * dg + db * db;
                if( dist < minDist ) {
                    minDist = dist;
                    idx = j;
                }
            }
            initsamples[i].cluster = idx;
        }

        // compute the new centroids
        for(var j=0;j<centroids.length;j++) {
            centroids[j].r = 0;
            centroids[j].g = 0;
            centroids[j].b = 0;
            centroids[j].count = 0;
        }
        for(var i=0;i<initsamples.length;i++) {
            var c = initsamples[i].cluster;
            centroids[c].r += initsamples[i].r;
            centroids[c].g += initsamples[i].g;
            centroids[c].b += initsamples[i].b;
            centroids[c].count++;
        }
        var maxCluster = 0, maxCount = 0;
        for(var j=0;j<centroids.length;j++) {
            if( centroids[j].count == 0 ) {
                // randomly reinitialize this centroid
                centroids[j] = {
                    r: Math.random() * 255,
                    g: Math.random() * 255,
                    b: Math.random() * 255
                };
                continue;
            }

            centroids[j].r /= centroids[j].count;
            centroids[j].g /= centroids[j].count;
            centroids[j].b /= centroids[j].count;

            if( centroids[j].count > maxCount )
            {
                maxCluster = j;
                maxCount = centroids[j].count;
            }
        }

        // split the largest cluster
        var moveSize = 20;
        var newcentroid = {
            r: centroids[maxCluster].r + (Math.random() - 0.5) * moveSize,
            g: centroids[maxCluster].g + (Math.random() - 0.5) * moveSize,
            b: centroids[maxCluster].b + (Math.random() - 0.5) * moveSize
        };

        centroids[maxCluster].r += (Math.random() - 0.5) * moveSize;
        centroids[maxCluster].g += (Math.random() - 0.5) * moveSize;
        centroids[maxCluster].b += (Math.random() - 0.5) * moveSize;
        centroids.push(newcentroid);
    }

    // k-means
    var THRES = 32;
    var MAX_ITERS = 32;
    var iters = 0;
    var moveCount = Number.MAX_VALUE;
    while( moveCount > THRES && iters < MAX_ITERS ) {
        iters++;
        moveCount = 0;

        // assign samples to clusters
        for(var i=0;i<samples.length;i++) {
            var idx, minDist = Number.MAX_VALUE;
            for(var j=0;j<centroids.length;j++) {
                var dr = samples[i].r - centroids[j].r;
                var dg = samples[i].g - centroids[j].g;
                var db = samples[i].b - centroids[j].b;
                var dist = dr * dr + dg * dg + db * db;
                if( dist < minDist ) {
                    minDist = dist;
                    idx = j;
                }
            }
            if( idx != samples[i].cluster ) {
                moveCount++;
            }
            samples[i].cluster = idx;
        }

        // update centroids
        for(var j=0;j<centroids.length;j++) {
            centroids[j].r = 0;
            centroids[j].g = 0;
            centroids[j].b = 0;
            centroids[j].count = 0;
        }
        for(var i=0;i<initsamples.length;i++) {
            var c = initsamples[i].cluster;
            centroids[c].r += initsamples[i].r;
            centroids[c].g += initsamples[i].g;
            centroids[c].b += initsamples[i].b;
            centroids[c].count++;
        }
        for(var j=0;j<centroids.length;j++) {
            if( centroids[j].count == 0 ) {
                // randomly reinitialize this centroid
                centroids[j] = {
                    r: Math.random() * 255,
                    g: Math.random() * 255,
                    b: Math.random() * 255
                };
                continue;
            }

            centroids[j].r /= centroids[j].count;
            centroids[j].g /= centroids[j].count;
            centroids[j].b /= centroids[j].count;
        }
    }

    console.log('iters = ' + iters);
    return centroids;
}

function medianCut( inColors, n ) {

    function BoundingBox( colors ) {
        var min = {r:255, g:255, b:255}, max = {r:0, g:0, b:0};
        var bc = [];
        for(var i=0;i<colors.length;i++) {
            var c = colors[i];
            min.r = Math.min(c.r, min.r);
            min.g = Math.min(c.g, min.g);
            min.b = Math.min(c.b, min.b);

            max.r = Math.max(c.r, max.r);
            max.g = Math.max(c.g, max.g);
            max.b = Math.max(c.b, max.b);
            bc.push({r: c.r, g: c.g, b: c.b, w: c.w});
        }

        //console.log(min);
        //console.log(max);

        return {
            colors: bc,
            min: min,
            max: max
        }
    }

    function split( box ) {
        var dr = box.max.r - box.min.r;
        var dg = box.max.g - box.min.g;
        var db = box.max.b - box.min.b;

        var dir = 'r';
        if( dg > dr ) {
            if( db > dg ) dir = 'b';
            else dir = 'g';
        }
        else {
            if( db > dr ) dir = 'b';
        }

        //console.log( dir );

        var lBox, rBox;

        switch( dir ) {
            case 'r':{
                // sort the colors along r axis
                box.colors.sort( function(a, b) {return a.r - b.r;} );
                break;
            }
            case 'g':{
                box.colors.sort( function(a, b) {return a.g - b.g;} );
                break;
            }
            case 'b':{
                box.colors.sort( function(a, b) {return a.b - b.b;} );
                break;
            }
        }

        var mid = box.colors.length/2;
        lBox = new BoundingBox(box.colors.slice(0, mid));
        rBox = new BoundingBox(box.colors.slice(mid));

        return {
            left: lBox,
            right: rBox
        }
    }

    function meanColor( box ) {
        var r = 0, g = 0, b = 0, wSum = 0;
        for(var i=0;i<box.colors.length;i++) {
            var w = box.colors[i].w;
            r += box.colors[i].r * w;
            g += box.colors[i].g * w;
            b += box.colors[i].b * w;
            wSum += w;
        }
        r /= wSum;
        g /= wSum;
        b /= wSum;

        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b)
        }
    }

    // build the mean cut tree
    var root = new BoundingBox( inColors );

    var Q = [];
    Q.push(root);

    while(Q.length < n ) {
        // recursively refine the tree
        var cur = Q[0];
        Q.shift();

        var children = split(cur);

        Q.push(children.left);
        Q.push(children.right);
    }

    var colors = [];
    for(var i=0;i< Q.length;i++) {
        colors.push( meanColor(Q[i]) );
    }

    return colors;
}
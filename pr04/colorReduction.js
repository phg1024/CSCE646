/**
 * Created by phg on 10/17/13.
 */

function uniform( levels ) {
    // levels^3 colors in total
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

/*
This is a tree based method:
   1. Build an octree of all color samples by split the nodes in the octree if the node's MSE is larger than a threshold
   2. Prune the octree by repeatedly merging leaf nodes with minimum MSE until the desired number of tree nodes
 */
function minErrorReduction( inColors ) {

}
/**
 * Created by phg on 10/17/13.
 */

function medianCut( inColors ) {

    function BoundingBox( colors ) {
        var min = {r:255, g:255, b:255}, max = {r:0, g:0, b:0};
        for(var i=0;i<colors.length;i++) {
            var c = colors[i];
            min.r = Math.min(c.r, min.r);
            min.g = Math.min(c.g, min.g);
            min.b = Math.min(c.b, min.b);

            max.r = Math.max(c.r, max.r);
            max.g = Math.max(c.g, max.g);
            max.b = Math.max(c.b, max.b);
        }
        return {
            colors: colors,
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

        var lBox, rBox;

        switch( dir ) {
            case 'r':{
                // sort the colors along r axis
                box.colors.sort( function(a, b) {return a.r < b.r;} );
                // determine the boundary
                var midR = box.colors[box.colors.length / 2].r;

                // left box
                lBox.min.r = box.min.r;
                lBox.min.g = box.min.g;
                lBox.min.b = box.min.b;

                lBox.max.r = midR;
                lBox.max.g = box.max.g;
                lBox.max.b = box.max.b;

                lBox.colors = box.colors.slice(0, box.colors.length/2);


                // right box
                rBox.min.r = midR;
                rBox.min.g = box.min.g;
                rBox.min.b = box.min.b;

                rBox.max.r = box.max.r;
                rBox.max.g = box.max.g;
                rBox.max.b = box.max.b;

                rBox.colors = box.colors.slice(box.colors.length/2);

                break;
            }
            case 'g':{
                box.colors.sort( function(a, b) {return a.g < b.g;} );
                var midG = box.colors[box.colors.length / 2].g;

                break;
            }
            case 'b':{
                box.colors.sort( function(a, b) {return a.b < b.b;} );
                var midG = box.colors[box.colors.length / 2].b;

                break;
            }
        }

        return {
            left: lBox,
            right: rBox
        }
    }
}

/*
This is a tree based method:
   1. Build an octree of all color samples by split the nodes in the octree if the node's MSE is larger than a threshold
   2. Prune the octree by repeatedly merging leaf nodes with minimum MSE until the desired number of tree nodes
 */
function minErrorReduction( inColors ) {

}
/**
 * Created by Peihong Guo on 11/9/13.
 */
var points = [];
var points2 = [];
var width, height;

var dragged = null,
    selected = points[0];

var svg, svg2;

function updateGridHandles(pts) {
    points = pts;

    redraw();
}

function updateGridToolSize(w, h) {
    width = w;
    height = h;

    points = [];

    svg.select("#rect")
        .attr("width", width)
        .attr("height", height);

    redraw();
}

function initGridTool(pts)
{
    points = pts;
    width = $('#mysvg').width();
    height = $('#mysvg').height();

    svg = d3.select("#mysvg");
    svg2 = d3.select("#mysvg2");

    svg.append("rect")
        .attr("id", "rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown);

    svg2.append("rect")
        .attr("id", "rect2")
        .attr("width", width)
        .attr("height", height);

    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

    redraw();
}

function redraw() {
    console.log('redrawing...');

    var circle = svg.selectAll("circle")
        .data(points, function(d) { return d; });

    circle.enter().append("circle")
        .attr("r", 1e-6)
        .on("mousedown", function(d) { selected = dragged = d; redraw(); })
        .transition()
        .duration(750)
        .ease("elastic")
        .attr("r", 6.5);

    circle
        .classed("selected", function(d) { return d === selected; })
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; });

    circle.exit().remove();


    var circle2 = svg2.selectAll("circle")
        .data(points2, function(d) {return d;});

    circle2.enter().append("circle")
        .attr("r", 1e-6)
        .on("mousedown", function(d) { selected = dragged = d; redraw(); })
        .transition()
        .duration(750)
        .ease("elastic")
        .attr("r", 3.0);

    circle2
        .classed("selected", function(d) { return d === selected; })
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; });

    circle2.exit().remove();

    if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }
}

function sortpoints()
{
    points.sort(function(a, b){
        if( a[0] == b[0] ) return b[1] - a[1];
        else return a[0] - b[0];
    });


    //console.log('updating path');
    //svg.select("path").attr("d", line(points));
}

function change() {
    console.log(this.value);
    redraw();
}

function pathPos( x )
{
    var pathEl = svg.select("path").node();
    var pathLength = pathEl.getTotalLength();

    var svgcanvas = document.getElementById("rect");
    var offsetLeft = svgcanvas.getBoundingClientRect().left;
    var beginning = x, end = pathLength, target;
    var pos;
    while (true) {
        target = Math.floor((beginning + end) / 2);
        pos = pathEl.getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== x) {
            break;
        }
        if (pos.x > x)      end = target;
        else if (pos.x < x) beginning = target;
        else                break; //position found
    }
    return pos;
}

function trackMouse()
{
    var pathEl = svg.select("path").node();
    var pathLength = pathEl.getTotalLength();

    var svgcanvas = document.getElementById("rect");
    var offsetLeft = svgcanvas.getBoundingClientRect().left;
    var x = d3.event.pageX - offsetLeft;
    var beginning = x, end = pathLength, target;
    return pathPos( x );
}

var initHandlePos = [];

function mousedown() {

    var method = $("input[name=transmode]:checked").val();
    console.log(method);

    if( method == 'mls' ) {
        points.push(selected = dragged = d3.mouse(svg.node()));

        var m = d3.mouse(svg.node());
        console.log(m);
        initHandlePos.push(m);

        //sortpoints();
        redraw();
    }
}

function mousemove() {
    if (!dragged)
    {
        //var pos = trackMouse();
        //console.log(pos);
        return;
    }
    
    // make a copy of old points

    var m = d3.mouse(svg.node());
    dragged[0] = Math.max(0, Math.min(width, m[0]));
    dragged[1] = Math.max(0, Math.min(height, m[1]));

    var method = $("input[name=transmode]:checked").val();
    if( method == 'gridtrans' )
        updateImageWithGrids(points);
    else {
        for(var i=0;i<points.length;i++) {
            console.log(
                '(' + points[i][0] + ', ' + points[i][1] + ' <- ' + '(' + initHandlePos[i][0] + ', ' + initHandlePos[i][1] + ')'
            );
        }

        var mappedGrids = solveMLSDeformation(points, initHandlePos, width, height);
        points2 = [];
        for(var i=0;i<mappedGrids.length;i++) {
            points2.push([mappedGrids[i].x, mappedGrids[i].y]);
        }
    }

    redraw();
}

function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;

    var method = $("input[name=transmode]:checked").val();
    if( method == 'gridtrans' )
        updateImageWithGrids(points);
    else {
        for(var i=0;i<points.length;i++) {
            console.log(
                '(' + points[i][0] + ', ' + points[i][1] + ' <- ' + '(' + initHandlePos[i][0] + ', ' + initHandlePos[i][1] + ')'
            );
        }

        var mappedGrids = solveMLSDeformation(points, initHandlePos, width, height);
        points2 = [];
        for(var i=0;i<mappedGrids.length;i++) {
            points2.push([mappedGrids[i].x, mappedGrids[i].y]);
        }

        if( points.length > 3 )
            updateImageWithMLSGrids(points2);
    }
}

var gridVisible = true;
var cpVisible = true;

function keydown() {
    if (!selected) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
            var i = points.indexOf(selected);
            points.splice(i, 1);
            initHandlePos.splice(i, 1);
            selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
            redraw();
            break;
        }
        case 71: {
            gridVisible = !gridVisible;
            if( gridVisible )
                $('#mysvg2').show();
            else
                $('#mysvg2').hide();
            break;
        }
        case 67: {
            cpVisible = !cpVisible;
            if( cpVisible ) {
                $('#mysvg').show();
            }
            else {
                $('#mysvg').hide();
            }
        }
    }
}

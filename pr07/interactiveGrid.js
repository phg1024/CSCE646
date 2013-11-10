/**
 * Created by Peihong Guo on 11/9/13.
 */
var points = [];
var width, height;

var dragged = null,
    selected = points[0];

var svg;

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

    svg.append("rect")
        .attr("id", "rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown);

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

function mousedown() {
    //points.push(selected = dragged = d3.mouse(svg.node()));
    //sortpoints();
    //redraw();
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

    updateImageWithGrids(points);

    redraw();
}

function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;
}

function keydown() {
    if (!selected) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
            var i = points.indexOf(selected);
            points.splice(i, 1);
            selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
            redraw();
            break;
        }
    }
}

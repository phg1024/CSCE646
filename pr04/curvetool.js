/**
 * Created by peihongguo on 9/30/13.
 */

var width = 256,
    height = 256;

var points = [[0, height], [width, 0]];

var dragged = null,
    selected = points[0];

var line = d3.svg.line();

var svg;

function initCurveTool()
{
    svg = d3.select("#curvepanel").append("svg")
        .attr("id", "curvetool")
        .attr("width", width)
        .attr("height", height)
        .attr("tabindex", 1);

    svg.append("rect")
        .attr("id", "rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", mousedown);

    svg.append("path")
        .datum(points)
        .attr("class", "line")
        .call(redraw);

    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

    line.interpolate("cardinal");
    redraw();
}

function redraw() {
    console.log('redrawing...');

    svg.select("path").attr("d", line);

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
        if( a[0] == b[0] ) return a[1] > b[1];
        else return a[0] > b[0];
    });


    //console.log('updating path');
    //svg.select("path").attr("d", line(points));
}

function change() {
    console.log(this.value);
    line.interpolate(this.value);
    redraw();
}

function mousedown() {
    points.push(selected = dragged = d3.mouse(svg.node()));
    sortpoints();
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

function mousemove() {
    if (!dragged)
    {
        //var pos = trackMouse();
        //console.log(pos);
        return;
    }

    var m = d3.mouse(svg.node());
    dragged[0] = Math.max(0, Math.min(width, m[0]));
    dragged[1] = Math.max(0, Math.min(height, m[1]));

    sortpoints();

    redraw();
}

function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;

    // update the image based on the curve
    applyCurve();
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

function drawIntensityBars()
{
    // intensity bars
    var grd=curvecontext.createLinearGradient(0,0,256,0);
    grd.addColorStop(0,"black");
    grd.addColorStop(1,"white");
    curvecontext.fillStyle=grd;
    curvecontext.fillRect(20, 256, 256, 20);

    grd=curvecontext.createLinearGradient(0,0,0,256);
    grd.addColorStop(0,"white");
    grd.addColorStop(1,"black");
    curvecontext.fillStyle=grd;
    curvecontext.fillRect(0, 0, 20, 256);
}

function drawGrids()
{
    var left = 20;
    var top = 256;
    var width = 256, height = 256;
    var ngrids = 5;

    var xstep = width / ngrids;
    var ystep = height / ngrids;

    // horizontal grids
    curvecontext.strokeStyle = '#aaaaaa';
    for(var i= 0, y = 0;i<=ngrids;i++, y+=ystep)
    {
        curvecontext.moveTo(left, y);
        curvecontext.lineTo(left+width, y);
        curvecontext.stroke();
    }

    // vertical grids
    for(var i= 0, x = left;i<=ngrids;i++, x+=xstep)
    {
        curvecontext.moveTo(x, 0);
        curvecontext.lineTo(x, height);
        curvecontext.stroke();
    }
}
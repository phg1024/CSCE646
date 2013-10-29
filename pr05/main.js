var origImg, filteredImg;
var imgIdx = 0;
var imgsrc = ['landscape.jpg', 'seal.jpg', 'buck.jpg', 'waterfall.jpg'];

function loadImage()
{
    imgIdx = imgselect.selectedIndex;
    if( imgIdx < 0 ) imgIdx = 0;

    console.log('loading image ' + imgsrc[imgIdx]);
    var img = new Image();
    img.onload = function(){
        origImg = RGBAImage.fromImage(img, canvas);
        console.log(origImg);
        context.putImageData(origImg.toImageData(context), 0, 0);
    };

    img.src = imgsrc[imgIdx];
}

function applyFilter()
{
    var filtername = $('#filterop').val();
    console.log('applying filter ' + filtername);

    var newimg;
    switch( filtername )
    {
        case "edge":
        {
            console.log('edge detection ...');
            newimg = edge( origImg );
            break;
        }
        case "erosion":
        {
            var size = $('#FilterSizeslider').val();
            console.log('erosing the image ...');
            var shape = $('#Shapeselect').val();
            console.log('using ' + shape + ' shape filter ...');
            newimg = filter(origImg, new Filter.erosion(size, shape));
            break;
        }
        case "dialation":
        {
            var size = $('#FilterSizeslider').val();
            console.log('dialating the image ...');
            var shape = $('#Shapeselect').val();
            console.log('using ' + shape + ' shape filter ...');
            newimg = filter(origImg, new Filter.dialation(size, shape));
            break;
        }
        case "invert":
        {
            console.log('inverting the image ...');
            newimg = (	filter(origImg, Filter.invert) );
            break;
        }
        case "grayscale":
        {
            console.log('converting the image to grayscale ...');
            newimg = (	grayscale(origImg) );
            break;
        }
		case "adaptiveequal":
		{
            var amount = parseFloat($('#Amountslider').val()) / 200.0;
            console.log('amount = ' + amount);

            console.log('equalizing the image ...');
            newimg = (	ahe(origImg, amount) );
            break;
		}
		case "equal":
		{
            var amount = parseFloat($('#Amountslider').val()) / 200.0;
            console.log('amount = ' + amount);

            console.log('equalizing the image ...');
            newimg = (	equalize(origImg, amount) );
            break;			
		}
        case "gradient":
        {
            newimg = ( grayscale( filter(origImg, Filter.gradient) ) );
            break;
        }
        case 'hsobel':
        {
            newimg = ( filter(origImg, Filter.hsobel) );
            break;
        }
        case 'vsobel':
        {
            newimg = ( filter(origImg, Filter.vsobel) );
            break;
        }
        case 'emboss':
        {
            var size = $('#FilterSizeslider').val();
            console.log('filter size = ' + size);
            var degree = $('#Angleslider').val();
            console.log('degree = ' + degree);

            newimg = ( filter(origImg, new Filter.emboss(size, degree)) );
            break;
        }
        case 'blur':
        {
            var size = $('#FilterSizeslider').val();
            console.log('filter size = ' + size);
            var sigma = $('#Sigmaslider').val();
            console.log('sigma = ' + sigma);
            newimg = ( filter(origImg, new Filter.blurn(size, sigma)) );
            break;
        }
        case 'sharpen':
        {
            newimg = ( filter(origImg, Filter.sharpen) );
            break;
        }
        case 'usm':{
            var size = $('#FilterSizeslider').val();
            console.log('filter size = ' + size);

            var amount = parseFloat($('#Amountslider').val()) / 10.0 + 1.0;
            console.log('amount = ' + amount);
            newimg = unsharpenmask(origImg, size, amount);
            break;
        }
        case 'motion':
        {
            var size = $('#FilterSizeslider').val();
            console.log('filter size = ' + size);
            var degree = $('#Angleslider').val();
            console.log('degree = ' + degree);

            newimg = ( filter(origImg, new Filter.motion(size, degree)) );
            break;
        }
        case 'contrast':
        {
            var amount = parseFloat($('#Amountslider').val());
            newimg = contrast(origImg, amount);
            break;
        }
        case 'bilateral':
        {
            var size = $('#FilterSizeslider').val();
            console.log('filter size = ' + size);
            var sigma = $('#Sigmaslider').val();
            console.log('sigma = ' + sigma);
            var amount = $('#Amountslider').val();

            newimg = bilateral(origImg, sigma, amount, size);
            break;
        }
        case 'customized':
        {
            console.log('customized filter');
            // get the customized filter and apply the filter to current image
            var cf = document.getElementById("cfilter");
            var lines = cf.value.split(/[\n]+/);
            for(var i=0;i<lines.length;i++) {
                lines[i] = lines[i].split(/[\s]+/);
            }

            // check if the input is valid
            if( !(lines.length & 0x1) ){ alert('filter size must be uneven!'); return; }
            var cols = lines[0].length;
            for(var i=0;i<lines.length;i++) {
                if( lines[i].length != cols ) {
                    alert('The size of the ' + i + 'th row of the filter is invalid!');
                    return;
                }
            }

            console.log(lines);
            var params = {width: lines[0].length, height: lines.length, weights: lines};
            var f = new Filter( params );
            console.log(f);
            newimg = ( filter(origImg, f) );
            break;
        }
    }
    filteredImg = newimg;
    context.putImageData(newimg.toImageData(context), 0, 0);
}

var canvas, context;
var imgselect;
window.onload = (function(){
    console.log('document loaded');

    canvas = document.getElementById("mycanvas");
    context = canvas.getContext("2d");

    canvas.onmousedown = (function(){
        console.log('mouse down');
        context.putImageData(origImg.toImageData(context), 0, 0);
    });

    canvas.onmouseup = (function(){
        console.log('mouse up');
        context.putImageData(filteredImg.toImageData(context), 0, 0);
    });

    // set up callbacks for image selection
    imgselect = document.getElementById("imgselect");
    imgselect.onchange=loadImage;
    imgselect.onfocus = (function(){
        this.selectedIndex = -1;
    });

    $('#apply_btn').click(function() {
        applyFilter();
    });

    $('#controls').append( createInput('FilterSize', 'slidertext', {init:3, min:3, max:15, step: 2}) );
    $('#controls').append( createInput('Sigma', 'slidertext', {init:1, min:1, max:5}) );
    $('#controls').append( createInput('Angle', 'slidertext', {init:0, min:0, max:359}) );
    $('#controls').append( createInput('Amount', 'slidertext', {init:50, min:0, max:100}) );
    $('#controls').append( createInput('Shape', 'combo', ['square', 'round', 'star', 'plus']));
    $('#controls').append( createInput('Customized Filter', 'textarea', {id:'cfilter', init:'Please input the filter here.'}));

    $('#filterop').change(function() {
        var op = this.value;
        if( op == 'erosion' || op == 'dialation' ) {
            $('#Shape').show();
        }
        else {
            $('#Shape').hide();
        }

        if( op == 'contrast' || op == 'usm' || op == 'equal'
         || op == 'adaptiveequal' || op == 'bilateral') {
            $('#Amount').show();
        }
        else {
            $('#Amount').hide();
        }

        if( op == 'blur' || op == 'bilateral' || op == 'emboss'
         || op == 'motion' || op == 'usm'
         || op == 'erosion' || op == 'dialation' ) {
            $('#FilterSize').show();
        }
        else {
            $('#FilterSize').hide();
        }

        if( op == 'blur' || op == 'bilateral' ) {
            $('#Sigma').show();
        }
        else {
            $('#Sigma').hide();
        }

        if( op == 'emboss' || op == 'motion' ) {
            $('#Angle').show();
        }
        else {
            $('#Angle').hide();
        }
    });

    $('#Sigma').hide();
    $('#FilterSize').hide();
    $('#Angle').hide();
    $('#Shape').hide();


    // set up callback for uploading file
    document.getElementById('files').addEventListener('change', handleFileSelect, false);

    loadImage();
});
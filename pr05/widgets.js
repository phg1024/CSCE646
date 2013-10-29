/**
 * Created by phg on 10/29/13.
 */

function connectInput(input1, input2) {
    input1.onchange = (function(){
        input2.value = this.value;
    });
    input2.onchange = (function(){
        input1.value = this.value;
    });
}

function createSlider(name, props) {
    var slider = document.createElement('input');
    slider.id = name + 'slider';
    slider.type = 'range';
    if( props ) {
        slider.max = props.max || 100;
        slider.min = props.min || 0;
        slider.value = props.init || 0;
        slider.step = props.step || 1;
    }
    return slider;
}

function createTextBox(name, props) {
    var textbox = document.createElement('input');
    textbox.id = name + 'text';
    textbox.type = 'text';
    if( props ) {
        textbox.value = props.init || 0;
        var digits = Math.ceil(Math.log((props.max||100)) / Math.log(10));
        textbox.size = digits;
    }
    return textbox;
}

function createComboBox(name, props) {
    var combo = document.createElement('select');
    combo.id = name + 'select';

    if( props ) {
        for(var i=0;i<props.length;i++) {
            var opt = document.createElement('option');
            opt.value = props[i];
            opt.innerHTML = props[i];
            combo.appendChild(opt);
        }
    }
    return combo;
}

function createTextArea(name, props) {
    var textarea = document.createElement('textarea');
    textarea.id = props.id || (name + 'textarea');
    if( props ) {
        textarea.rows = props.rows || 10;
        textarea.cols = props.cols || 32;
        textarea.innerHTML = props.init || '';
    }
    return textarea;
}

function createInput( name, type, props ) {
    var node;
    switch( type ) {
        case 'slidertext':
        {
            node = document.createElement('p');
            node.id = name;

            var slider = createSlider(name, props);
            var textbox = createTextBox(name, props);

            node.innerHTML = name;
            node.appendChild(slider);
            node.appendChild(textbox);

            connectInput(slider, textbox);

            node.getValue = function() {
                return slider.value;
            }

            return node;
        }
        case 'combo':
        {
            node = document.createElement('p');
            node.id = name;
            var combo = createComboBox(name, props);
            node.innerHTML = name + ' ';
            node.appendChild(combo);

            node.getValue = function() {
                return combo.value;
            }

            return node;
        }
        case 'textarea':
        {
            node = document.createElement('div');
            node.id = name;
            var label = document.createElement('p');
            label.innerHTML = name;
            node.appendChild( label );
            var area = createTextArea(name, props);
            node.appendChild( area );

            node.getValue = function() {
                return area.value;
            }
            return node;
        }
        default:
            return undefined;
    }
}
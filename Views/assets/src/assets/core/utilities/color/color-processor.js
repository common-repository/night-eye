import Color from './color';
import ModeBackground from './mode-background';
import ModeForeground from './mode-foreground';

class ColorProcessor {
    constructor() {

        this.mode_background = new ModeBackground(this);
        this.mode_foreground = new ModeForeground(this);
        this.out = { 'style_string': '', 'jump_size': 0, colors: null };
    }

    convertBackgroundColorString(style_string) {
        return this.convertColorString(style_string, this.mode_background);
    }

    convertForegroundColorString(style_string) {
        return this.convertColorString(style_string, this.mode_foreground);
    }

    convertColorString(style_string, mode) {
        var start_index = style_string.indexOf(':');
        if (start_index === -1)
            start_index = 0;

        var result = style_string.substring(0, start_index);
        for (var i = start_index; i < style_string.length;) {
            this.convertHEX(style_string, i, mode);
            if (this.out.jump_size !== 0) {
                result += this.out.style_string;
                i += this.out.jump_size + 1;
                continue;
            }

            this.convertRGB(style_string, i, mode);
            if (this.out.jump_size !== 0) {
                result += this.out.style_string;
                i += this.out.jump_size + 1;
                continue;
            }

            this.convertName(style_string, i, mode);
            if (this.out.jump_size !== 0) {
                result += this.out.style_string;
                i += this.out.jump_size + 1;
                continue;
            }

            result += style_string[i++];
        }

        return result;
    }

    convertHEX(style_string, i, mode) {
        var valid, c, j;

        this.out.jump_size = 0;

        if (style_string[i] !== '#')
            return;

        //search for next 6
        if (i + 6 < style_string.length) {
            valid = true;
            for (j = 1; j <= 6; ++j) {
                c = style_string[i + j].toLowerCase();
                if ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9'))
                    continue;

                valid = false;
                break;
            }

            if (valid) {
                var colors = [parseInt(style_string[i + 1] + style_string[i + 2], 16), parseInt(style_string[i + 3] + style_string[i + 4], 16), parseInt(style_string[i + 5] + style_string[i + 6], 16), 1];
                //if (mode.isApplicable(colors)) {
                this.out.style_string = mode.applyToRGBColorsAsString(colors);
                this.out.jump_size = 6;
                //}
                return;
            }

            if (j >= 4) { //optimization, if fail at 4th sign => it is 3 digit hex
                let colors = [parseInt(style_string[i + 1] + style_string[i + 1], 16), parseInt(style_string[i + 2] + style_string[i + 2], 16), parseInt(style_string[i + 3] + style_string[i + 3], 16), 1];
                //if (mode.isApplicable(colors)) {
                this.out.style_string = mode.applyToRGBColorsAsString(colors);
                this.out.jump_size = 3;
                //}
                return;
            }
        }

        //search for next 3
        if (i + 3 < style_string.length) {
            valid = true;
            for (j = 1; j <= 3; ++j) {
                c = style_string[i + j].toLowerCase();
                if ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9'))
                    continue;

                valid = false;
                break;
            }

            if (valid) {
                let colors = [parseInt(style_string[i + 1] + style_string[i + 1], 16), parseInt(style_string[i + 2] + style_string[i + 2], 16), parseInt(style_string[i + 3] + style_string[i + 3], 16), 1];
                //if (mode.isApplicable(colors)) {
                this.out.style_string = mode.applyToRGBColorsAsString(colors);
                this.out.jump_size = 3;
                //}
                return;
            }
        }
    }

    convertRGB(style_string, i, mode) {
        this.parseColorsToHSL(style_string, i);

        if (this.out.jump_size === 0)
            return;

        /*if (mode.isApplicable(out.colors) === false) {
         out.jump_size = 0;
         return;
         }*/

        //ColorProcessor.colors[Color.makeColorKeyFromArray(this.out.colors)] = null;
        this.out.style_string = mode.applyToHSLColorsAsString(this.out.colors);
    }

    convertName(style_string, i, mode) {
        var j, match = null, parent_map = ColorProcessor.text_colors;

        this.out.jump_size = 0;

        for (j = i; j < style_string.length; ++j) {
            let map = parent_map[style_string[j]];
            if (typeof (map) === 'undefined')
                break;

            if (typeof (map.colors) !== 'undefined') {
                if (j + 1 === style_string.length)
                    match = map.colors;
                else {
                    var c = style_string[j + 1];
                    if (c === ';' || c === ' ' || c === '!')
                        match = map.colors;
                }
            }

            parent_map = map;
        }

        if (match !== null) {
            if (match[0] === -1) //initial color
                return;
            //match = mode.initial;

            //if (mode.isApplicable(match) === true) {
            this.out.style_string = mode.applyToRGBColorsAsString(match.slice());
            this.out.jump_size = j - i - 1;
            //}
        }
    }

    parseColorsToHSL(style_string, i) {
        this.out.jump_size = 0;

        if (i + 2 >= style_string.length)
            return null;

        var hsl = false;
        if (style_string[i] !== 'r' || style_string[i + 1] !== 'g' || style_string[i + 2] !== 'b') {
            if (style_string[i] !== 'h' || style_string[i + 1] !== 's' || style_string[i + 2] !== 'l')
                return null;
            hsl = true;
        }

        var c, commas = 0;
        // dots = 0;
        var j, open_bracket = -1, close_bracket = -1;
        for (j = i + 3; j < style_string.length; ++j) {
            c = style_string[j];

            if (c === '(') {
                open_bracket = j;
                continue;
            }

            if (open_bracket === -1)
                continue;

            if (c === ')') {
                close_bracket = j;
                break;
            }

            if (c >= '0' && c <= '9')
                continue;
            if (c === ' ' || c === '.' || c === '%')
                continue;
            if (c === ',') {
                ++commas;
                continue;
            }

            break;
        }

        if (open_bracket === -1 || close_bracket === -1)
            return null;
        if (commas < 2 || commas > 3)
            return null;

        var colors = [0, 0, 0, 1];
        var colors_index = 0; //alpha_divider = 1; - this is not used
        var float_divider = 1;

        for (j = open_bracket + 1; j < close_bracket; ++j) {
            c = style_string[j];
            if (c >= '0' && c <= '9') {
                if (float_divider === 1) {
                    colors[colors_index] *= 10;
                    colors[colors_index] += parseInt(c);
                } else {
                    colors[colors_index] += parseInt(c) / float_divider;
                    float_divider *= 10;
                }
            } else if (c === '.') {
                float_divider = 10;
            } else if (c === ',') {
                ++colors_index;
                float_divider = 1;
                if (colors_index === 3)
                    colors[colors_index] = 0;
            }
        }

        if (hsl === false)
            Color.RGBtoHSL(colors);

        this.out.jump_size = close_bracket - i;
        return this.out.colors = colors;
    }

}

ColorProcessor.colors = {};
ColorProcessor.colorsWithKey = {};
ColorProcessor.text_colors = { "i": { "n": { "i": { "t": { "i": { "a": { "l": { "colors": [0, 0, 0, 1] } } } } }, "d": { "i": { "a": { "n": { "r": { "e": { "d": { "colors": [205, 92, 92, 1] } } } } }, "g": { "o": { "colors": [75, 0, 130, 1] } } } } }, "v": { "o": { "r": { "y": { "colors": [255, 255, 240, 1] } } } } }, "-": { "w": { "e": { "b": { "k": { "i": { "t": { "-": { "l": { "i": { "n": { "k": { "colors": [0, 0, 238, 1] } } } } } } } } } } } }, "w": { "i": { "n": { "d": { "o": { "w": { "colors": [255, 255, 255, 1], "t": { "e": { "x": { "t": { "colors": [0, 0, 0, 1] } } } } } } } } }, "h": { "i": { "t": { "e": { "colors": [255, 255, 255, 1], "s": { "m": { "o": { "k": { "e": { "colors": [245, 245, 245, 1] } } } } } } } }, "e": { "a": { "t": { "colors": [245, 222, 179, 1] } } } } }, "l": { "i": { "g": { "h": { "t": { "y": { "e": { "l": { "l": { "o": { "w": { "colors": [255, 255, 224, 1] } } } } } }, "p": { "i": { "n": { "k": { "colors": [255, 182, 193, 1] } } } }, "s": { "a": { "l": { "m": { "o": { "n": { "colors": [255, 160, 122, 1] } } } } }, "t": { "e": { "e": { "l": { "b": { "l": { "u": { "e": { "colors": [176, 196, 222, 1] } } } } } } } }, "k": { "y": { "b": { "l": { "u": { "e": { "colors": [135, 206, 250, 1] } } } } } }, "l": { "a": { "t": { "e": { "g": { "r": { "e": { "y": { "colors": [119, 136, 153, 1] } }, "a": { "y": { "colors": [119, 136, 153, 1] } } } } } } } }, "e": { "a": { "g": { "r": { "e": { "e": { "n": { "colors": [32, 178, 170, 1] } } } } } } } }, "g": { "o": { "l": { "d": { "e": { "n": { "r": { "o": { "d": { "y": { "e": { "l": { "l": { "o": { "w": { "colors": [250, 250, 210, 1] } } } } } } } } } } } } } }, "r": { "e": { "y": { "colors": [211, 211, 211, 1] }, "e": { "n": { "colors": [144, 238, 144, 1] } } }, "a": { "y": { "colors": [211, 211, 211, 1] } } } }, "c": { "o": { "r": { "a": { "l": { "colors": [240, 128, 128, 1] } } } }, "y": { "a": { "n": { "colors": [224, 255, 255, 1] } } } }, "b": { "l": { "u": { "e": { "colors": [173, 216, 230, 1] } } } } } } }, "n": { "e": { "n": { "colors": [250, 240, 230, 1] } } }, "m": { "e": { "g": { "r": { "e": { "e": { "n": { "colors": [50, 205, 50, 1] } } } } }, "colors": [0, 255, 0, 1] } } }, "e": { "m": { "o": { "n": { "c": { "h": { "i": { "f": { "f": { "o": { "n": { "colors": [255, 250, 205, 1] } } } } } } } } } } }, "a": { "v": { "e": { "n": { "d": { "e": { "r": { "b": { "l": { "u": { "s": { "h": { "colors": [255, 240, 245, 1] } } } } }, "colors": [230, 230, 250, 1] } } } } } }, "w": { "n": { "g": { "r": { "e": { "e": { "n": { "colors": [124, 252, 0, 1] } } } } } } } } }, "y": { "e": { "l": { "l": { "o": { "w": { "colors": [255, 255, 0, 1], "g": { "r": { "e": { "e": { "n": { "colors": [154, 205, 50, 1] } } } } } } } } } } }, "s": { "n": { "o": { "w": { "colors": [255, 250, 250, 1] } } }, "e": { "a": { "s": { "h": { "e": { "l": { "l": { "colors": [255, 245, 238, 1] } } } } }, "g": { "r": { "e": { "e": { "n": { "colors": [46, 139, 87, 1] } } } } } } }, "a": { "l": { "m": { "o": { "n": { "colors": [250, 128, 114, 1] } } } }, "n": { "d": { "y": { "b": { "r": { "o": { "w": { "n": { "colors": [244, 164, 96, 1] } } } } } } } }, "d": { "d": { "l": { "e": { "b": { "r": { "o": { "w": { "n": { "colors": [139, 69, 19, 1] } } } } } } } } } }, "i": { "l": { "v": { "e": { "r": { "colors": [192, 192, 192, 1] } } } }, "e": { "n": { "n": { "a": { "colors": [160, 82, 45, 1] } } } } }, "k": { "y": { "b": { "l": { "u": { "e": { "colors": [135, 206, 235, 1] } } } } } }, "l": { "a": { "t": { "e": { "g": { "r": { "e": { "y": { "colors": [112, 128, 144, 1] } }, "a": { "y": { "colors": [112, 128, 144, 1] } } } }, "b": { "l": { "u": { "e": { "colors": [106, 90, 205, 1] } } } } } } } }, "t": { "e": { "e": { "l": { "b": { "l": { "u": { "e": { "colors": [70, 130, 180, 1] } } } } } } } }, "p": { "r": { "i": { "n": { "g": { "g": { "r": { "e": { "e": { "n": { "colors": [0, 255, 127, 1] } } } } } } } } } } }, "f": { "l": { "o": { "r": { "a": { "l": { "w": { "h": { "i": { "t": { "e": { "colors": [255, 250, 240, 1] } } } } } } } } } }, "u": { "c": { "h": { "s": { "i": { "a": { "colors": [255, 0, 255, 1] } } } } } }, "i": { "r": { "e": { "b": { "r": { "i": { "c": { "k": { "colors": [178, 34, 34, 1] } } } } } } } }, "o": { "r": { "e": { "s": { "t": { "g": { "r": { "e": { "e": { "n": { "colors": [34, 139, 34, 1] } } } } } } } } } } }, "c": { "o": { "r": { "n": { "s": { "i": { "l": { "k": { "colors": [255, 248, 220, 1] } } } }, "f": { "l": { "o": { "w": { "e": { "r": { "b": { "l": { "u": { "e": { "colors": [100, 149, 237, 1] } } } } } } } } } } }, "a": { "l": { "colors": [255, 127, 80, 1] } } } }, "r": { "i": { "m": { "s": { "o": { "n": { "colors": [220, 20, 60, 1] } } } } } }, "h": { "o": { "c": { "o": { "l": { "a": { "t": { "e": { "colors": [210, 105, 30, 1] } } } } } } }, "a": { "r": { "t": { "r": { "e": { "u": { "s": { "e": { "colors": [127, 255, 0, 1] } } } } } } } } }, "a": { "d": { "e": { "t": { "b": { "l": { "u": { "e": { "colors": [95, 158, 160, 1] } } } } } } } }, "y": { "a": { "n": { "colors": [0, 255, 255, 1] } } } }, "p": { "a": { "p": { "a": { "y": { "a": { "w": { "h": { "i": { "p": { "colors": [255, 239, 213, 1] } } } } } } } }, "l": { "e": { "g": { "o": { "l": { "d": { "e": { "n": { "r": { "o": { "d": { "colors": [238, 232, 170, 1] } } } } } } } }, "r": { "e": { "e": { "n": { "colors": [152, 251, 152, 1] } } } } }, "v": { "i": { "o": { "l": { "e": { "t": { "r": { "e": { "d": { "colors": [219, 112, 147, 1] } } } } } } } } }, "t": { "u": { "r": { "q": { "u": { "o": { "i": { "s": { "e": { "colors": [175, 238, 238, 1] } } } } } } } } } } } }, "e": { "a": { "c": { "h": { "p": { "u": { "f": { "f": { "colors": [255, 218, 185, 1] } } } } } } }, "r": { "u": { "colors": [205, 133, 63, 1] } } }, "i": { "n": { "k": { "colors": [255, 192, 203, 1] } } }, "l": { "u": { "m": { "colors": [221, 160, 221, 1] } } }, "o": { "w": { "d": { "e": { "r": { "b": { "l": { "u": { "e": { "colors": [176, 224, 230, 1] } } } } } } } } }, "u": { "r": { "p": { "l": { "e": { "colors": [128, 0, 128, 1] } } } } } }, "b": { "l": { "a": { "n": { "c": { "h": { "e": { "d": { "a": { "l": { "m": { "o": { "n": { "d": { "colors": [255, 235, 205, 1] } } } } } } } } } } }, "c": { "k": { "colors": [0, 0, 0, 1] } } }, "u": { "e": { "v": { "i": { "o": { "l": { "e": { "t": { "colors": [138, 43, 226, 1] } } } } } }, "colors": [0, 0, 255, 1] } } }, "i": { "s": { "q": { "u": { "e": { "colors": [255, 228, 196, 1] } } } } }, "e": { "i": { "g": { "e": { "colors": [245, 245, 220, 1] } } } }, "u": { "r": { "l": { "y": { "w": { "o": { "o": { "d": { "colors": [222, 184, 135, 1] } } } } } } } }, "r": { "o": { "w": { "n": { "colors": [165, 42, 42, 1] } } } } }, "m": { "i": { "s": { "t": { "y": { "r": { "o": { "s": { "e": { "colors": [255, 228, 225, 1] } } } } } } }, "n": { "t": { "c": { "r": { "e": { "a": { "m": { "colors": [245, 255, 250, 1] } } } } } } }, "d": { "n": { "i": { "g": { "h": { "t": { "b": { "l": { "u": { "e": { "colors": [25, 25, 112, 1] } } } } } } } } } } }, "o": { "c": { "c": { "a": { "s": { "i": { "n": { "colors": [255, 228, 181, 1] } } } } } } }, "a": { "g": { "e": { "n": { "t": { "a": { "colors": [255, 0, 255, 1] } } } } }, "r": { "o": { "o": { "n": { "colors": [128, 0, 0, 1] } } } } }, "e": { "d": { "i": { "u": { "m": { "v": { "i": { "o": { "l": { "e": { "t": { "r": { "e": { "d": { "colors": [199, 21, 133, 1] } } } } } } } } }, "o": { "r": { "c": { "h": { "i": { "d": { "colors": [186, 85, 211, 1] } } } } } }, "p": { "u": { "r": { "p": { "l": { "e": { "colors": [147, 112, 219, 1] } } } } } }, "s": { "l": { "a": { "t": { "e": { "b": { "l": { "u": { "e": { "colors": [123, 104, 238, 1] } } } } } } } }, "e": { "a": { "g": { "r": { "e": { "e": { "n": { "colors": [60, 179, 113, 1] } } } } } } }, "p": { "r": { "i": { "n": { "g": { "g": { "r": { "e": { "e": { "n": { "colors": [0, 250, 154, 1] } } } } } } } } } } }, "a": { "q": { "u": { "a": { "m": { "a": { "r": { "i": { "n": { "e": { "colors": [102, 205, 170, 1] } } } } } } } } } }, "t": { "u": { "r": { "q": { "u": { "o": { "i": { "s": { "e": { "colors": [72, 209, 204, 1] } } } } } } } } }, "b": { "l": { "u": { "e": { "colors": [0, 0, 205, 1] } } } } } } } } } }, "n": { "a": { "v": { "a": { "j": { "o": { "w": { "h": { "i": { "t": { "e": { "colors": [255, 222, 173, 1] } } } } } } } }, "y": { "colors": [0, 0, 128, 1] } } } }, "g": { "o": { "l": { "d": { "colors": [255, 215, 0, 1], "e": { "n": { "r": { "o": { "d": { "colors": [218, 165, 32, 1] } } } } } } } }, "h": { "o": { "s": { "t": { "w": { "h": { "i": { "t": { "e": { "colors": [248, 248, 255, 1] } } } } } } } } }, "a": { "i": { "n": { "s": { "b": { "o": { "r": { "o": { "colors": [220, 220, 220, 1] } } } } } } } }, "r": { "e": { "e": { "n": { "y": { "e": { "l": { "l": { "o": { "w": { "colors": [173, 255, 47, 1] } } } } } }, "colors": [0, 128, 0, 1] } }, "y": { "colors": [128, 128, 128, 1] } }, "a": { "y": { "colors": [128, 128, 128, 1] } } } }, "o": { "r": { "a": { "n": { "g": { "e": { "colors": [255, 165, 0, 1], "r": { "e": { "d": { "colors": [255, 69, 0, 1] } } } } } } }, "c": { "h": { "i": { "d": { "colors": [218, 112, 214, 1] } } } } }, "l": { "d": { "l": { "a": { "c": { "e": { "colors": [253, 245, 230, 1] } } } } }, "i": { "v": { "e": { "colors": [128, 128, 0, 1], "d": { "r": { "a": { "b": { "colors": [107, 142, 35, 1] } } } } } } } } }, "d": { "a": { "r": { "k": { "o": { "r": { "a": { "n": { "g": { "e": { "colors": [255, 140, 0, 1] } } } }, "c": { "h": { "i": { "d": { "colors": [153, 50, 204, 1] } } } } }, "l": { "i": { "v": { "e": { "g": { "r": { "e": { "e": { "n": { "colors": [85, 107, 47, 1] } } } } } } } } } }, "s": { "a": { "l": { "m": { "o": { "n": { "colors": [233, 150, 122, 1] } } } } }, "e": { "a": { "g": { "r": { "e": { "e": { "n": { "colors": [143, 188, 143, 1] } } } } } } }, "l": { "a": { "t": { "e": { "b": { "l": { "u": { "e": { "colors": [72, 61, 139, 1] } } } }, "g": { "r": { "e": { "y": { "colors": [47, 79, 79, 1] } }, "a": { "y": { "colors": [47, 79, 79, 1] } } } } } } } } }, "k": { "h": { "a": { "k": { "i": { "colors": [189, 183, 107, 1] } } } } }, "g": { "o": { "l": { "d": { "e": { "n": { "r": { "o": { "d": { "colors": [184, 134, 11, 1] } } } } } } } }, "r": { "e": { "y": { "colors": [169, 169, 169, 1] }, "e": { "n": { "colors": [0, 100, 0, 1] } } }, "a": { "y": { "colors": [169, 169, 169, 1] } } } }, "v": { "i": { "o": { "l": { "e": { "t": { "colors": [148, 0, 211, 1] } } } } } }, "m": { "a": { "g": { "e": { "n": { "t": { "a": { "colors": [139, 0, 139, 1] } } } } } } }, "r": { "e": { "d": { "colors": [139, 0, 0, 1] } } }, "t": { "u": { "r": { "q": { "u": { "o": { "i": { "s": { "e": { "colors": [0, 206, 209, 1] } } } } } } } } }, "c": { "y": { "a": { "n": { "colors": [0, 139, 139, 1] } } } }, "b": { "l": { "u": { "e": { "colors": [0, 0, 139, 1] } } } } } } }, "e": { "e": { "p": { "p": { "i": { "n": { "k": { "colors": [255, 20, 147, 1] } } } }, "s": { "k": { "y": { "b": { "l": { "u": { "e": { "colors": [0, 191, 255, 1] } } } } } } } } } }, "i": { "m": { "g": { "r": { "e": { "y": { "colors": [105, 105, 105, 1] } }, "a": { "y": { "colors": [105, 105, 105, 1] } } } } } }, "o": { "d": { "g": { "e": { "r": { "b": { "l": { "u": { "e": { "colors": [30, 144, 255, 1] } } } } } } } } } }, "h": { "o": { "t": { "p": { "i": { "n": { "k": { "colors": [255, 105, 180, 1] } } } } }, "n": { "e": { "y": { "d": { "e": { "w": { "colors": [240, 255, 240, 1] } } } } } } } }, "t": { "o": { "m": { "a": { "t": { "o": { "colors": [255, 99, 71, 1] } } } } }, "h": { "i": { "s": { "t": { "l": { "e": { "colors": [216, 191, 216, 1] } } } } } }, "a": { "n": { "colors": [210, 180, 140, 1] } }, "u": { "r": { "q": { "u": { "o": { "i": { "s": { "e": { "colors": [64, 224, 208, 1] } } } } } } } }, "e": { "a": { "l": { "colors": [0, 128, 128, 1] } } } }, "r": { "e": { "d": { "colors": [255, 0, 0, 1] }, "b": { "e": { "c": { "c": { "a": { "p": { "u": { "r": { "p": { "l": { "e": { "colors": [102, 51, 153, 1] } } } } } } } } } } } }, "o": { "s": { "y": { "b": { "r": { "o": { "w": { "n": { "colors": [188, 143, 143, 1] } } } } } } }, "y": { "a": { "l": { "b": { "l": { "u": { "e": { "colors": [65, 105, 225, 1] } } } } } } } } }, "a": { "n": { "t": { "i": { "q": { "u": { "e": { "w": { "h": { "i": { "t": { "e": { "colors": [250, 235, 215, 1] } } } } } } } } } } }, "z": { "u": { "r": { "e": { "colors": [240, 255, 255, 1] } } } }, "l": { "i": { "c": { "e": { "b": { "l": { "u": { "e": { "colors": [240, 248, 255, 1] } } } } } } } }, "q": { "u": { "a": { "m": { "a": { "r": { "i": { "n": { "e": { "colors": [127, 255, 212, 1] } } } } } }, "colors": [0, 255, 255, 1] } } } }, "k": { "h": { "a": { "k": { "i": { "colors": [240, 230, 140, 1] } } } } }, "v": { "i": { "o": { "l": { "e": { "t": { "colors": [238, 130, 238, 1] } } } } } } };

export default ColorProcessor;
export { ColorProcessor };



// console.log(RGBtoHSL([0, 0, 0]));
// console.log(RGBtoHSL([255, 255, 255]));
// console.log(RGBtoHSL([255, 0, 0]));
// console.log(RGBtoHSL([0, 255, 0]));
// console.log(RGBtoHSL([0, 0, 255]));
// console.log(RGBtoHSL([255, 255, 0]));

// console.log(RGBtoHSL([205, 170, 153]));
// var hsl = RGBtoHSL([255, 227, 150]);
// console.log(hsl);
// HSLtoRGB(hsl);
// console.log(hsl);

//console.log(parseColorsToHSL('rgba(0,0,0, 0.15)', 0));

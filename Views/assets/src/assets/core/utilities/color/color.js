
class Color {
    static makeHSLColorString(colors) {
        return 'hsl(' + colors[0] + ',' + colors[1] + '%,' + colors[2] + '%)';
    }

    static makeColorKeyFromArray(colors) {
        return (colors[0] << 16) | (colors[1] << 8) | (colors[2]);
    }

    static makeHSLColorArrayFromKey(color_key) {
        return [(color_key >> 16) & 0xFF, (color_key >> 8) & 0xFF, color_key & 0xFF];
    }

    static RGBtoHSL(colors) {
        var r = colors[0] / 255;
        var g = colors[1] / 255;
        var b = colors[2] / 255;
        var hue, sat, light;

        var c_max = Math.max(r, Math.max(g, b));
        var c_min = Math.min(r, Math.min(g, b));
        var d = c_max - c_min;

        light = (c_max + c_min) * 0.5;

        if (d === 0) {
            hue = 0;
            sat = 0;
        } else {
            if (c_max === r) {
                hue = 60 * Color.modFloat((g - b) / d, 6);
            } else if (c_max === g) {
                hue = 60 * ((b - r) / d + 2);
            } else
                hue = 60 * ((r - g) / d + 4);

            sat = d / (1 - Math.abs(2 * light - 1));
        }

        colors[0] = Math.round(hue);
        colors[1] = Math.round(sat * 100);
        colors[2] = Math.round(light * 100);
    }

    static HSLtoRGB(colors) {
        colors[0] %= 360;

        var S = colors[1] * 0.01;
        var L = colors[2] * 0.01;

        var C = (1 - Math.abs(2 * L - 1)) * S;
        var X = C * (1 - Math.abs(Color.modFloat(colors[0] / 60, 2) - 1));
        var m = L - C * 0.5;

        if (colors[0] < 180) {
            if (colors[0] < 60) {
                colors[0] = C;
                colors[1] = X;
                colors[2] = 0;
            } else if (colors[0] < 120) {
                colors[0] = X;
                colors[1] = C;
                colors[2] = 0;
            } else {
                colors[0] = 0;
                colors[1] = C;
                colors[2] = X;
            }
        } else {
            if (colors[0] < 240) {
                colors[0] = 0;
                colors[1] = X;
                colors[2] = C;
            } else if (colors[0] < 300) {
                colors[0] = X;
                colors[1] = 0;
                colors[2] = C;
            } else {
                colors[0] = C;
                colors[1] = 0;
                colors[2] = X;
            }
        }

        colors[0] = Math.round((colors[0] + m) * 255);
        colors[1] = Math.round((colors[1] + m) * 255);
        colors[2] = Math.round((colors[2] + m) * 255);
    }

    static modFloat(v, base) {
        var a = v / base;
        a -= Math.floor(a);
        return a * base;
    }
}

export default Color;

import Color from './color';

class ColorMapProcessor {

    static lowerBound(source, target) {
        let result = -1;
        let l = 0;
        let r = source.length - 1;

        while (l < r) {
            const m = (l + r) >> 1;

            if (m === l || m === r) {
                if (target <= source[l]) {
                    result = l;
                } else {
                    result = target <= source[r] ? r : r + 1;
                }
                break;
            }

            if (source[m] < target) {
                l = m;
            } else {
                r = m;
            }
        }

        return result;
    }

    static getColorIndex(rgb) {
        const indices = ColorMapProcessor.colorKeys.map((k, i) => {
            return ColorMapProcessor.lowerBound(k, rgb[i])
        });

        for (let i = indices.length; i-- > 0;) {
            const index = indices[i];
            const currentOffset = ColorMapProcessor.colorKeys[i][index] - rgb[i];
            const previousOffset = rgb[i] - ColorMapProcessor.colorKeys[i][index - 1];
            if (previousOffset < currentOffset) {
                --indices[i];
            }
        }

        const keys = indices.map((k, i) => {
            return ColorMapProcessor.colorKeys[i][k];
        });

        return ColorMapProcessor.getLabel(ColorMapProcessor.colorMap[keys[0]][keys[1]][keys[2]]);
    }

    static getCustomColor(colorsHSL, customColors) {
        const colors = [...colorsHSL];
        Color.HSLtoRGB(colors);
        const rgb = [colors[0], colors[1], colors[2]];
        const mainColorIndexLabel = ColorMapProcessor.getColorIndex(rgb);
        const newColorValue = customColors[mainColorIndexLabel];

        if (mainColorIndexLabel === newColorValue) {
            return null;
        }

        return newColorValue;
    }

    static getLabel(index) {
        switch (index) {
            case 1:
                return 'red';
            case 2:
                return 'blue';
            case 3:
                return 'green';
            case 4:
                return 'yellow';
            case 5:
                return 'pink';
            case 6:
                return 'purple';
            case 7:
                return 'orange';
            case 8:
                return 'brown';
            case 9:
                return 'grey';
            case 10:
                return 'black';
            case 11:
                return 'white';
            default:
                return '-';

        }
    }

}

ColorMapProcessor.colorMap = { "0": { "0": { "0": 10, "32": 10, "64": 2, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "32": { "0": 3, "32": 10, "64": 2, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "64": { "0": 3, "32": 3, "64": 3, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "96": { "0": 3, "32": 3, "64": 3, "96": 9, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "128": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 2, "192": 2, "224": 2, "255": 2 }, "160": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 2, "192": 2, "224": 2, "255": 2 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 9, "192": 2, "224": 2, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 3, "224": 11, "255": 2 }, "255": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 11, "224": 2, "255": 2 } }, "32": { "0": { "0": 8, "32": 6, "64": 2, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "32": { "0": 10, "32": 10, "64": 2, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "64": { "0": 3, "32": 3, "64": 9, "96": 2, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "96": { "0": 3, "32": 3, "64": 3, "96": 9, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "128": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "160": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 2, "192": 2, "224": 2, "255": 2 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 2, "224": 2, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 11, "224": 2, "255": 2 }, "255": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 11, "192": 11, "224": 2, "255": 2 } }, "64": { "0": { "0": 8, "32": 6, "64": 6, "96": 6, "128": 6, "160": 2, "192": 2, "224": 2, "255": 2 }, "32": { "0": 8, "32": 8, "64": 6, "96": 6, "128": 6, "160": 2, "192": 2, "224": 2, "255": 2 }, "64": { "0": 8, "32": 8, "64": 9, "96": 9, "128": 2, "160": 6, "192": 2, "224": 2, "255": 2 }, "96": { "0": 3, "32": 3, "64": 3, "96": 9, "128": 2, "160": 2, "192": 2, "224": 2, "255": 2 }, "128": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 9, "192": 2, "224": 2, "255": 2 }, "160": { "0": 3, "32": 3, "64": 3, "96": 9, "128": 3, "160": 3, "192": 2, "224": 2, "255": 2 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 9, "224": 2, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 11, "224": 2, "255": 2 }, "255": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 3, "224": 3, "255": 2 } }, "96": { "0": { "0": 8, "32": 1, "64": 6, "96": 6, "128": 6, "160": 6, "192": 2, "224": 2, "255": 2 }, "32": { "0": 8, "32": 8, "64": 6, "96": 6, "128": 6, "160": 6, "192": 2, "224": 6, "255": 2 }, "64": { "0": 8, "32": 8, "64": 8, "96": 6, "128": 6, "160": 6, "192": 6, "224": 2, "255": 2 }, "96": { "0": 8, "32": 8, "64": 3, "96": 9, "128": 9, "160": 6, "192": 6, "224": 6, "255": 2 }, "128": { "0": 3, "32": 3, "64": 3, "96": 9, "128": 9, "160": 2, "192": 2, "224": 2, "255": 2 }, "160": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 9, "192": 2, "224": 2, "255": 2 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 9, "192": 2, "224": 2, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 3, "224": 11, "255": 2 }, "255": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 11, "192": 11, "224": 11, "255": 2 } }, "128": { "0": { "0": 1, "32": 1, "64": 1, "96": 6, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "32": { "0": 8, "32": 8, "64": 1, "96": 6, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "64": { "0": 8, "32": 8, "64": 8, "96": 5, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "96": { "0": 8, "32": 8, "64": 8, "96": 8, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "128": { "0": 3, "32": 3, "64": 8, "96": 9, "128": 9, "160": 9, "192": 6, "224": 2, "255": 6 }, "160": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 9, "192": 9, "224": 2, "255": 2 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 9, "192": 9, "224": 11, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 3, "224": 2, "255": 2 }, "255": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 3, "192": 3, "224": 11, "255": 2 } }, "160": { "0": { "0": 1, "32": 1, "64": 1, "96": 6, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "32": { "0": 1, "32": 1, "64": 1, "96": 6, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "64": { "0": 8, "32": 8, "64": 1, "96": 5, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "96": { "0": 7, "32": 8, "64": 8, "96": 5, "128": 6, "160": 6, "192": 6, "224": 6, "255": 6 }, "128": { "0": 8, "32": 8, "64": 8, "96": 8, "128": 9, "160": 6, "192": 6, "224": 6, "255": 6 }, "160": { "0": 3, "32": 3, "64": 3, "96": 8, "128": 9, "160": 9, "192": 9, "224": 6, "255": 6 }, "192": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 9, "160": 9, "192": 9, "224": 9, "255": 2 }, "224": { "0": 3, "32": 3, "64": 3, "96": 3, "128": 3, "160": 11, "192": 3, "224": 2, "255": 11 }, "255": { "0": 3, "32": 3, "64": 3, "96": 4, "128": 3, "160": 11, "192": 11, "224": 11, "255": 11 } }, "192": { "0": { "0": 1, "32": 1, "64": 1, "96": 5, "128": 6, "160": 5, "192": 5, "224": 5, "255": 6 }, "32": { "0": 1, "32": 1, "64": 1, "96": 1, "128": 5, "160": 5, "192": 5, "224": 6, "255": 6 }, "64": { "0": 7, "32": 7, "64": 1, "96": 1, "128": 5, "160": 5, "192": 6, "224": 6, "255": 6 }, "96": { "0": 7, "32": 7, "64": 7, "96": 5, "128": 5, "160": 5, "192": 5, "224": 6, "255": 6 }, "128": { "0": 7, "32": 7, "64": 8, "96": 8, "128": 5, "160": 5, "192": 5, "224": 5, "255": 6 }, "160": { "0": 7, "32": 7, "64": 8, "96": 8, "128": 8, "160": 5, "192": 5, "224": 6, "255": 6 }, "192": { "0": 4, "32": 3, "64": 4, "96": 8, "128": 4, "160": 9, "192": 9, "224": 5, "255": 11 }, "224": { "0": 3, "32": 3, "64": 4, "96": 4, "128": 4, "160": 3, "192": 11, "224": 11, "255": 11 }, "255": { "0": 4, "32": 3, "64": 4, "96": 4, "128": 4, "160": 4, "192": 11, "224": 11, "255": 11 } }, "224": { "0": { "0": 1, "32": 1, "64": 1, "96": 1, "128": 6, "160": 5, "192": 5, "224": 5, "255": 6 }, "32": { "0": 1, "32": 1, "64": 1, "96": 5, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "64": { "0": 7, "32": 1, "64": 1, "96": 1, "128": 5, "160": 5, "192": 5, "224": 6, "255": 6 }, "96": { "0": 7, "32": 7, "64": 7, "96": 1, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "128": { "0": 7, "32": 7, "64": 7, "96": 7, "128": 5, "160": 5, "192": 5, "224": 5, "255": 6 }, "160": { "0": 7, "32": 7, "64": 7, "96": 8, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "192": { "0": 4, "32": 4, "64": 7, "96": 4, "128": 4, "160": 11, "192": 5, "224": 5, "255": 6 }, "224": { "0": 4, "32": 4, "64": 4, "96": 4, "128": 4, "160": 4, "192": 11, "224": 9, "255": 11 }, "255": { "0": 4, "32": 4, "64": 4, "96": 4, "128": 4, "160": 4, "192": 4, "224": 11, "255": 11 } }, "255": { "0": { "0": 1, "32": 1, "64": 1, "96": 1, "128": 6, "160": 5, "192": 5, "224": 5, "255": 5 }, "32": { "0": 1, "32": 1, "64": 1, "96": 5, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "64": { "0": 1, "32": 1, "64": 1, "96": 1, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "96": { "0": 7, "32": 7, "64": 7, "96": 1, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "128": { "0": 7, "32": 7, "64": 7, "96": 5, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "160": { "0": 7, "32": 7, "64": 7, "96": 7, "128": 5, "160": 5, "192": 5, "224": 5, "255": 5 }, "192": { "0": 7, "32": 7, "64": 7, "96": 7, "128": 7, "160": 5, "192": 5, "224": 5, "255": 5 }, "224": { "0": 4, "32": 4, "64": 4, "96": 4, "128": 4, "160": 4, "192": 11, "224": 5, "255": 5 }, "255": { "0": 4, "32": 4, "64": 4, "96": 4, "128": 4, "160": 4, "192": 4, "224": 11, "255": 11 } } };
ColorMapProcessor.colorKeys = [[-1, 0, 32, 64, 96, 128, 160, 192, 224, 255], [-1, 0, 32, 64, 96, 128, 160, 192, 224, 255], [-1, 0, 32, 64, 96, 128, 160, 192, 224, 255]];

export default ColorMapProcessor;
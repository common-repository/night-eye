import ColorProcessorUtilities from './color-processor-utility';
import Color from './color';
import ColorProcessor from './color-processor';
import ColorMapProcessor from './color-map-processor';

class ModeBackground {
    constructor(colorProcessor) {
        this.initial = [0, 0, 0, 0];
        this.colorProcessor = colorProcessor;
    }

    applyToHSLColorsAsString(colors) {
        ColorProcessorUtilities.processBackgroundHSLColorArray(colors);

        var key = Color.makeColorKeyFromArray(colors);

        ColorProcessor.colorsWithKey[key] = colors;
        ColorProcessor.colors[key] = null;

        //===================== CUSTOM COLORS ==================
        if (window.nightEyeProOptions !== undefined) {
            const newColorValue = ColorMapProcessor.getCustomColor(colors, window.nightEyeProOptions.colorsBackground);
            if (newColorValue !== null) {
                return newColorValue;
            }
        }
        //=======================================================

        return ColorProcessorUtilities.makeHSLAString(colors);
    }

    applyToRGBColorsAsString(colors) {
        Color.RGBtoHSL(colors);
        return this.applyToHSLColorsAsString(colors);
    }

}

export default ModeBackground;

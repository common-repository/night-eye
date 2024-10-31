import ColorProcessorUtilities from './color-processor-utility';
import Color from './color';
import ColorProcessor from './color-processor';
import ColorMapProcessor from './color-map-processor';

class ModeForeground {
    constructor(colorProcessor) {
        this.initial = [0, 0, 0, 1];
        this.colorProcessor = colorProcessor;
    }

    applyToHSLColorsAsString(colors) {
        ColorProcessorUtilities.processForegroundHSLColorArray(colors);
        ColorProcessor.colors[Color.makeColorKeyFromArray(colors)] = null;

        //===================== CUSTOM COLORS ==================
        if (window.nightEyeProOptions !== undefined) {
            const newColorValue = ColorMapProcessor.getCustomColor(colors, window.nightEyeProOptions.colorsForeground);
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

export default ModeForeground;

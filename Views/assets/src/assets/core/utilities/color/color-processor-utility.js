import { DarkThemes } from '../../constants/constants';

//Private utilities
class ColorProcessorUtilities {

    static processBackgroundHSLColorArray(colors) {
        var success = false;

        if (colors[1] > 60) {
            colors[1] = 60;
            success = true;
        }

        if (colors[2] > 60) {
            colors[2] = 10 + (100 - colors[2]);
            success = true;
        }


        // converting dark colors - convert to brigter one
        if (colors[2] < 20) {
            colors[2] += ColorProcessorUtilities.getLightValueBasedOnDarkTheme();
            success = true;
        }

        // converting yellow color
        if (colors[0] > 40 && colors[0] <= 60 && colors[1] > 40 && colors[2] < 70) {
            colors[0] = 44;
            colors[1] = 100;
            colors[2] = 20;
            // colors[3] = 0.66;
            success = true;
        }

        return success;
    }

    static processForegroundHSLColorArray(colors) {
        var success = false;
        if (colors[1] > 60) {
            colors[1] = 60;
            success = true;
        }
        if (colors[2] < 75) {
            colors[2] = 75;
            success = true;
        }
        return success;
    }

    static makeHSLAString(colors) {
        return 'hsla(' + colors[0] + ',' + colors[1] + '%,' + colors[2] + '%,' + colors[3] + ')';
    }

    static getLightValueBasedOnDarkTheme() {
        if (window.nightEyeProOptions === undefined) {
            return 0;
        }
        switch (parseInt(window.nightEyeProOptions.darkTheme)) {
            case DarkThemes.THEME_0:
                return 0;
            case DarkThemes.THEME_1:
                return 7;
            case DarkThemes.THEME_2:
                return 15;
            default:
                return 7; //Default DarkThemes.THEME_1
        }
    }
}

export default ColorProcessorUtilities;

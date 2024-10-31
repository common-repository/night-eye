
import Widget from './widget';
import { LOCAL_STORAGE_KEY, Mode } from '../constants/constants';
import Utilities from '../utilities/utilities';

import Core from 'NightEyeCore';

class NightEyeStart {
    constructor(options) {
        this.options = options;
        this.isDarkMode = false;
    }

    init() {

        if (Utilities.isMobile()) {
            this.options.position = this.options.mobilePosition;
        } else {
            this.options.position = this.options.desktopPosition;
        }

        this.isDarkMode = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY.STATE)) === Mode.DARK;
        if (this.isDarkMode) {
            var core = new Core();
            core.start();
            this.startWidget();
            return;
        }
        this.startWidget();

        document.documentElement.setAttribute('nighteyeplgn', 'disabled');
    }

    startWidget() {
        var widget = new Widget(this.isDarkMode, this.options);
        widget.show();
    }
}

var nighteyeStart = new NightEyeStart(window.nightEyeOptions);
nighteyeStart.init();
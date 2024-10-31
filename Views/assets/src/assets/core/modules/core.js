import Utilities from '../utilities/utilities';
import State from './state';
import { Mode } from '../constants/constants';
import StyleConverter from './style-converter';
import MutationManager from './mutation-manager';

window.PLATFORM = 'chrome';

class Core {

    constructor() {
        this.enabled = true;
        this.local_settings = null;
        this.mode = -1;
        this.state = new State();
        this.styleConverter = new StyleConverter(this.local_settings);
        this.mutationManager = new MutationManager(this);
    }

    start() {
        if (document.documentElement.hasAttribute('data-reactroot')) {
            var timer = setInterval(() => {
                if (document.readyState === 'complete') {
                    clearInterval(timer);
                    this.startConverting();
                }
            }, 100);
        } else {
            this.startConverting();
        }
    }

    startConverting() {
        setTimeout(() => { //on next iteration of event loop to prevent some site error stops our script
            // if (this.mode === Mode.DARK) {
            this.addDefaultCSS();
            this.state.initAndShowLoading(true);
            this.styleConverter.init();
            this.styleConverter.convert();
            this.mutationManager.init();
            //}

        }, 0);
    }



    reinitDomElements() {
        this.mode = parseInt(localStorage.getItem(Utilities.LOCAL_STORAGE.MODE));

        if (this.mode !== Mode.DARK) { //not NORMAL mode
            this.addDefaultCSS();
        }

        if (this.mode === Mode.DARK) { //Dark Mode
            this.styleConverter.convertProcedure(true);
        }
    }
    addDefaultCSS() {
        var container = document.head === null ? document.documentElement : document.head;

        //these styles will be parsed
        var style_n = document.createElement('style');
        style_n.id = 'nighteyedefaultcss';
        //        style_n.tgIgnore = true;
        //        style_n.tgParsed = true; // add these and change colors
        style_n.innerHTML = 'html {\
                            color:#000;\
                            background-image:none !important;\
                            background:#fff !important;\
                        }\
                        body {\
                            background-color:#fff;\
                            background-image:none !important;\
                        }\
                        input, select, textarea, button {\
                            color:#000;\
                            background-color:#fff;\
                        }\
                        font {\
                            color:#000;\
                        }';

        container.insertBefore(style_n, container.childNodes[0]);

        //these styles will not be parsed
        style_n = Utilities.makeParsedStyleNode();
        //style_n.id = 'nighteyedefaultcss2';
        style_n.innerHTML = 'a {\
                            color:rgb(140,140,250);\
                        }\
                        *::-webkit-scrollbar-track-piece {\
                            background-color:rgba(255, 255, 255, 0.2) !important;\
                        }\
                        *::-webkit-scrollbar-track {\
                            background-color:rgba(255, 255, 255, 0.3) !important;\
                        }\
                        *::-webkit-scrollbar-thumb {\
                            background-color:rgba(255, 255, 255, 0.5) !important;\
                        }\
                        embed[type="application/pdf"] {\
                            filter:invert(1);\
                        }';

        container.insertBefore(style_n, container.childNodes[0]);
    }

}

export default Core;
export { Core };
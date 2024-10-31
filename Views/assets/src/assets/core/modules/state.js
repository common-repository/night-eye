
import { S } from '../constants/constants';

class State {
    constructor() {
        this.loading_added = false;
        this.isReady = false;
        this.emergencyCheckCounter = 0;
    }

    initAndShowLoading(isDarkMode) {
        if (this.loading_added === true || this.isReady) return;

        this.loading_added = true;

        if (isDarkMode) { //Filter mode
            this.checkDocumentState(isDarkMode);

            //Emergency - too long browser loading of some stupped script
            setTimeout(() => {
                this.onReady(isDarkMode);
            }, 6000);
            //========
            return;
        }

        this.onReady(false);
    }

    onReady(isDarkMode) {
        if (this.isReady) {
            return;
        }

        if (isDarkMode) {
            document.documentElement.setAttribute('nighteyeplgn', 'active'); //SLOW
            if (window.self === window.top) { //Insert custom styles only in main document, not in inframes
                // this.modifyCustomSites();
            }
        } else {
            document.documentElement.setAttribute('nighteyeplgn', 'disabled'); //SLOW
        }

        this.isReady = true;
    }

    checkDocumentState(isDarkMode) {
        var bodyTimer = setInterval(() => {
            if (document.body === null) {
                return;
            }
            clearInterval(bodyTimer);

            this.checkCSSParsedFinished(isDarkMode);

            var timer = setInterval(() => {
                // console.log("LOOP");

                if (this.checkCSSParsedFinished(isDarkMode) || ++this.emergencyCheckCounter >= 70) { //7 seconds
                    clearInterval(timer);
                }

            }, 100);
        }, 100);
    }

    checkCSSParsedFinished(isDarkMode) {
        var links = document.documentElement.querySelectorAll('link[rel="stylesheet"]');
        var queryLinksCount = links.length;

        var styleSheetLinksCount = 0;
        for (var i = 0; i < document.styleSheets.length; ++i) {
            if (document.styleSheets[i].ownerNode.nodeName === 'LINK') {
                ++styleSheetLinksCount;
            }

            if (!document.styleSheets[i].ownerNode.tgParsed) {
                return false;
            }
        }

        if (queryLinksCount > styleSheetLinksCount) { //this is very important - when <link> is at the bottom of the page, it is not in document.styleSheets on first parse
            return false;
        }

        if (S.isInitialConvertedCounter === 0) {
            this.onReady(isDarkMode);
            // console.log("READY");
            return true;
        }

        return false;
    }

}

export default State;
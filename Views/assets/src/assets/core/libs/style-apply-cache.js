const TYPE_TRANSITION = 1;
const TYPE_WEBGL_IMAGE = 2;
const TYPE_WEBGL_BACKGROUND_SIZE = 3;

export default class StyleApplyCache {

    constructor() {
        this.timeout = null;
        this.timeout_interval;
        this.cache = [];

        this.apply = this.apply.bind(this);
    }

    onFinish() {
        this.timeout = null;
        this.timeout_interval = 1000;
        this.cache = [];
    }

    clearTimeout() {
        if (this.timeout !== null)
            clearTimeout(this.timeout);
    }

    addTransitionItem(css_rule, transition_duration) {
        this.clearTimeout();

        this.cache.push([
            TYPE_TRANSITION,
            css_rule,
            transition_duration
        ]);

        this.setTimeout(1000);
    }

    addWebGlImageItem(css_rule, response, priority) {
        this.clearTimeout();

        this.cache.push([
            TYPE_WEBGL_IMAGE,
            css_rule,
            response,
            priority
        ]);

        this.setTimeout(500);
    }

    addWebGlBackgroundSizeItem(css_rule, imageBackgroundSize, imageBackgroundSizePriority) {
        this.clearTimeout();

        this.cache.push([
            TYPE_WEBGL_BACKGROUND_SIZE,
            css_rule,
            imageBackgroundSize,
            imageBackgroundSizePriority
        ]);

        this.setTimeout(500);
    }

    setTimeout(max_interval) {
        this.timeout_interval = Math.min(this.timeout_interval, max_interval);
        this.timeout = setTimeout(this.apply, this.timeout_interval);
    }

    apply() {
        for (var i = this.cache.length;  i-- > 0; ) {
            const item = this.cache[i];
            switch (item[0]) {
                case TYPE_TRANSITION:
                    if (item[1].style.transitionDuration === '0s') //someonce has modified it before us
                        item[1].style.transitionDuration = item[2];
                    break;
                case TYPE_WEBGL_IMAGE:
                    item[1].style.setProperty(item[2].property, item[2].css_text, item[3]);
                    break;
                case TYPE_WEBGL_BACKGROUND_SIZE:
                    item[1].style.setProperty('background-size', item[2], item[3]);
                    break;
            }
        }

        this.onFinish();
    }

}
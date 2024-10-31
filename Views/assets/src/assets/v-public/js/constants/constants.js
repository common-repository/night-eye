const Strings = {
    EMPTY: '',
    TRUE: 't',
    FALSE: 'f',
    OK: '0',
    ERROR: '1',
    NOT_EXISTS: '-2147483648',
    UNDEF: 'undefined'
};

const S = {
    NOT_EXISTS: -2147483648,
    EXISTS: -2147483647,
    page: null,
    page_cpanel: null,
    mobile: false,
    PAGE_URL: '',
    PAGE_PROTOCOL: '',
    PAGE_HOSTNAME: '',
    IFRAME: '',
    IMAGE_PROCESSING_ENABLED: false,
    URL: '',
    isInitialConvertedCounter: 0,
    IMPORT_CSS_INDEX_LAST_POSITION: 1000 //BIG NUMBER - need to be last element in the DOM order
};

const Results = {
    OK: '0',
    ERROR: '1'
};

const Colors = {
    WHITE: '#fff',
    LIGHT_RED: '#ffd7d7',
    RED: '#f00',
    GRAY128: '#808080',
    GRAY242: '#f2f2f2'
};

const LOCAL_STORAGE_KEY = {
    STATE: 'nighteyewState',
    USER_EXPLICITY_CHANGED: 'nighteyeuschedts'
};

const CookieNames = {
    MODE: 'ne_pl_m'
};

const Mode = {
    DARK: 1,
    NORMAL: 2
};

const WidgetScreenPosition = {
    BOTTOM_LEFT: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_RIGHT: 3,
}

export { Strings, S, Results, Colors, LOCAL_STORAGE_KEY, CookieNames, Mode, WidgetScreenPosition };

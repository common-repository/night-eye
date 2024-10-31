import { S } from '../constants/constants';
import Color from '../utilities/color/color';
import Utilities from '../utilities/utilities';
import LRUCache from '../libs/lru-cache';
import ColorProcessor from '../utilities/color/color-processor';
import StyleApplyCache from '../libs/style-apply-cache';
import WebGLProcessor from './webgl-processor';

class StyleConverter {
    constructor(local_settings) {
        this.colorProcessor = new ColorProcessor();
        this.local_settings = local_settings;
        this.converted = false;

        this.cache_bg = new LRUCache(1 << 22);
        this.cache_fr = new LRUCache(1 << 22);

        this.startObserver = null;
        this.stopObserver = null;

        this.convertBackground = this.colorProcessor.convertBackgroundColorString.bind(this.colorProcessor);
        this.convertForeground = this.colorProcessor.convertForegroundColorString.bind(this.colorProcessor);

        this.style_apply_cache = new StyleApplyCache();

        this.googleDocsNodeMaps = [];
    }

    init() {
        for (var i = StyleConverter.BACKGROUND_PROPERTIES.length; i-- > 0;)
            StyleConverter.BACKGROUND_PROPERTIES_SET.add(StyleConverter.BACKGROUND_PROPERTIES[i]);
        for (var j = StyleConverter.FOREGROUND_PROPERTIES.length; j-- > 0;)
            StyleConverter.FOREGROUND_PROPERTIES_SET.add(StyleConverter.FOREGROUND_PROPERTIES[j]);
    }

    convert() {
        if (this.converted === true) {
            console.error(
                'StyleConverted.convert() must be invoked only once. All other invoked must go through MutationObserver for specific node'
            );
            return;
        }

        this.converted = true;

        if (navigator.userAgent.indexOf('Firefox') === -1) {
            // This breaks docs.google.com
            this.convertProcedure(false);
        }

        // setTimeout(() => {
        //     console.error("START PROCEDURE");
        //     this.convertProcedure(false);
        // }, 5000);
        // return;

        //This is very important - never remove it
        var timerCounter1 = 0;
        var timer1 = setInterval(() => {
            this.convertProcedure();
            if (document.readyState === 'complete') {
                clearInterval(timer1);
                this.checkForDynamicChanges();

                if (S.URL === 'bugs.chromium.org') {// Dom Shadow website
                    this.checkAndConvertDomShadowElements(document.body);
                    setTimeout(() => {
                        //There is ajax elements to be loaded
                        this.checkAndConvertDomShadowElements(document.body);
                    }, 2000);
                }
            }

            if (++timerCounter1 > 50) {
                //emergency, when some website cannot load completely
                clearInterval(timer1);
                this.checkForDynamicChanges();
            }
        }, 300);
    }

    checkForDynamicChanges() {
        // Styled Component - dynamic add classes before use it --> ex: add .Link class with JS to DOM and then append to some popup window
        setInterval(() => {
            this.convertStyleNodes(false);
        }, 1000);
    }

    convertProcedure(isReInit) {
        this.convertStyleNodes(isReInit);
        this.convertIFrames();
        this.convertLinkImports();
        this.convertInlineStyles();
        this.convertImgNodes();
    }

    convertStyleNodes(isReInit) {
        var style_nodes = document.styleSheets;
        for (var i = 0; i < style_nodes.length; ++i) {
            if (style_nodes[i].ownerNode !== null) {
                if (isReInit) {
                    style_nodes[i].ownerNode.tgParsed = false;
                }
                if (style_nodes[i].ownerNode.getAttribute('rel') === 'alternate stylesheet') continue;
            }

            this.convertStyleSheet(style_nodes[i], false);
        }
    }

    convertStyleSheetFromMutator(style_sheet, forced, download) {
        this.convertStyleSheet(style_sheet, forced);

        var owner_node = style_sheet.ownerNode;
        if (download) {
            this.downloadCSS(owner_node.href, owner_node, owner_node.media, 0);
        }
    }

    convertIFrames() {
        var iframes_n = document.querySelectorAll('iframe:not([src])');
        for (var i = iframes_n.length; i-- > 0;) this.convertIFrame(iframes_n[i]);

        iframes_n = document.querySelectorAll('iframe[src^="javascript"]');
        for (var j = iframes_n.length; j-- > 0;) this.convertIFrame(iframes_n[j]);
    }

    convertStyleSheets(sheets) {
        for (var j = sheets.length; j-- > 0;) {
            this.convertStyleSheet(sheets[j], false);
        }
    }
    convertLinkImports() {
        var nodes = document.querySelectorAll('link[rel="import"]');
        for (var i = nodes.length; i-- > 0;) {
            var node = nodes[i];
            var importedDocument = node.import;

            if (importedDocument == null) {
                this.addEventListenerLinkImportNode(node);
                continue;
            }

            if (importedDocument.readyState === 'complete') {
                this.convertStyleSheets(importedDocument.styleSheets);
            } else {
                this.addEventListenerLinkImportNode(node);
            }
        }
    }

    addEventListenerLinkImportNode(node) {
        node.addEventListener('load', () => {
            this.convertStyleSheets(node.import.styleSheets);
        });
    }

    convertInlineStyles() {
        var nodes = document.querySelectorAll('[style],[fill],[stroke],[bgcolor]');
        for (var i = nodes.length; i-- > 0;) this.convertInlineStyle(nodes[i]);
    }

    convertImgNodes() {
        var nodes = document.querySelectorAll('img');
        for (var i = nodes.length; i-- > 0;) this.convertImgNode(nodes[i]);
    }

    convertStyleSheet(style_sheet, forced) {
        var owner_node = style_sheet.ownerNode;

        if (owner_node === undefined) {
            return;
        }

        try {
            var parsed_rules_length = owner_node.tg_parsed_rules;
            if (parsed_rules_length !== undefined) {
                if (parseInt(parsed_rules_length) !== style_sheet.cssRules.length) {
                    owner_node.tgParsed = false;
                }
            }
        } catch (e) { }

        if (forced === false && owner_node.tgParsed) return;

        // no idea why, but sometimes styles nodes still do not have innerHTML
        if (owner_node.tagName === 'STYLE' && owner_node.innerHTML.length === 0 && owner_node.cssRules === null) return;

        owner_node.tgParsed = true;

        try {
            owner_node.tg_parsed_rules = style_sheet.cssRules.length;
        } catch (e) { }


        if (owner_node.tagName === 'LINK') {
            var href_css_values = 'data:text/css';
            if (owner_node.href.substring(0, href_css_values.length) === href_css_values) {
                try {
                    //Sometimes .cssRules could not be access. This is in try->catch block in order to prevent other logic from breaking
                    if (style_sheet.cssRules !== null)
                        //sometimes these values are null, no idea why
                        this.processCSSRules(style_sheet.cssRules, owner_node);
                } catch (e) { }
            } else {
                var fontsWebsites = ['https://fonts.go', '.woff'];
                for (var i = 0; i < fontsWebsites.length; ++i) {
                    if (owner_node.href.indexOf(fontsWebsites[i]) !== -1) {
                        return;
                    }
                }

                try {
                    if (owner_node.hasAttribute('ng-href')) { //AngularJS property in LINK - it refresh the element after some delay and overrides our first parse
                        this.downloadCSS(owner_node.href, owner_node, owner_node.media, 0); //download sheet   
                        return;
                    }
                    this.processCSSRules(style_sheet.cssRules, owner_node);
                } catch (e) {
                    this.downloadCSS(owner_node.href, owner_node, owner_node.media, 0); //download sheet
                }
            }
        } else {
            if (owner_node.hasAttribute('data-styled')) { // react library
                this.duplicateAndParseStyleElement(owner_node, owner_node.media, style_sheet.cssRules);
                return;
            }

            this.processCSSRules(style_sheet.cssRules, owner_node);
        }
    }

    convertInlineStyle(node) {
        if (typeof node.getAttribute === 'undefined') return;

        var style_string = node.getAttribute('style');

        if (style_string !== null) {
            var background_properties = [],
                foreground_properties = [];
            var properties = style_string.split(';');
            for (var i = properties.length; i-- > 0;) {
                var dots_index = properties[i].indexOf(':');
                if (dots_index === -1) continue;

                var pair = [properties[i].substring(0, dots_index), properties[i].substring(dots_index + 1)];
                var target_property_name = pair[0].trim();
                if (StyleConverter.BACKGROUND_PROPERTIES_SET.has(target_property_name) === true)
                    background_properties.push(target_property_name);
                else if (StyleConverter.FOREGROUND_PROPERTIES_SET.has(target_property_name) === true)
                    foreground_properties.push(target_property_name);
            }

            if (S.URL === 'docs.google.com') {
                //Google Document - Word
                if (node.className === 'kix-wordhtmlgenerator-word-node') {
                    this.parseCSSRule(node, foreground_properties, background_properties);
                    if (this.googleDocsNodeMaps[style_string] == null) {
                        this.googleDocsNodeMaps[style_string] = 1;
                        this.convertGoogleDocsNode(node, style_string);
                    }
                }
                // Google Sheet
                else if (node.className.indexOf('color') > -1) { //docs-material-colorpalette-colorswatch
                    //do not convert color pallette
                } else if (node.nodeName === 'SPAN' && node.parentNode !== null
                    && node.parentNode.className !== undefined
                    && node.parentNode.className.indexOf('editable') > -1) {
                    //do not convert colors in edit box
                } else {
                    this.parseCSSRule(node, foreground_properties, background_properties);
                }
            } else {
                this.parseCSSRule(node, foreground_properties, background_properties);
            }

        }

        var foreground_attributes = ['text', 'link', 'vlink', 'alink'];
        for (var j = foreground_attributes.length; j-- > 0;) node.removeAttribute(foreground_attributes[j]);

        var fill_string = node.getAttribute('fill');
        if (fill_string !== null) {
            node.tgIgnore = true;
            node.setAttribute('fill', this.colorProcessor.convertBackgroundColorString(fill_string)); //SLOW
        }

        var stroke_string = node.getAttribute('stroke');
        if (stroke_string !== null) {
            node.tgIgnore = true;
            node.setAttribute('stroke', this.colorProcessor.convertForegroundColorString(stroke_string)); //SLOW
        }

        var bgcolor_string = node.getAttribute('bgcolor');
        if (bgcolor_string !== null) {
            node.tgIgnore = true;
            var newBGColor = this.colorProcessor.convertBackgroundColorString(bgcolor_string); //SLOW MAY NOT BE SLOW, MUST BE CHECKED;
            if (bgcolor_string === newBGColor) {
                newBGColor = '#1a1a1a';
            }
            node.style.backgroundColor = newBGColor;
        }
    }
    convertImgNode(node) {
        //To do: convert svg image in src tag
    }

    convertIFrame(node) {
        var src = node.getAttribute('src');
        if (src !== null && src.indexOf('javascript') !== 0) return;

        try {
            node.contentWindow.document.body.style.backgroundColor = '#292929';
            node.contentWindow.document.body.style.color = '#cecece';
        } catch (e) { }
    }

    downloadCSS(href, owner_node, media, importCSSIndex) {
        if (href === '') return;

        ++S.isInitialConvertedCounter;

        href = Utilities.makeURL(href);

        this.executeDownloadCSS(href)
            .then((data) => {
                this.processResponseDownloadCSS(data, owner_node, media, href, importCSSIndex);
            })
            .catch((error) => {
                --S.isInitialConvertedCounter;
                console.warn('Implement fetch from background - ', error);
            });

    }

    //Using promise to cath error like crossorign
    executeDownloadCSS(href) {
        return new Promise((resolve, reject) => {
            var ajax = new XMLHttpRequest();
            ajax.open('get', href, true);
            ajax.onerror = (errorV, errorV1) => {
                //ajax.status = 0
                //ajax.readyState = 4
                reject();
                console.clear();
            };

            ajax.onreadystatechange = () => {
                if (ajax.readyState !== 4) return;

                if (ajax.status === 200) {
                    resolve(ajax.responseText);
                } else {
                    reject();
                }
            };
            ajax.send();
        });
    }

    processResponseDownloadCSS(responseText, owner_node, media, href, importCSSIndex) {
        var isRemovingImports = importCSSIndex === S.IMPORT_CSS_INDEX_LAST_POSITION;

        var url_parsed_css_text = this.convertImportUrls(responseText, isRemovingImports);
        if (PLATFORM === 'safari') {
            //Fix for baseURI for style
            url_parsed_css_text = this.convertRelativeUrlsToAbsolute(url_parsed_css_text, href);
        }

        var style_n = this.addStyleNodeWithCSSText(href, url_parsed_css_text, owner_node, media, importCSSIndex);

        setTimeout(() => { //because of firefox
            this.convertStyleSheet(style_n.sheet, false);
        }, 0);

        --S.isInitialConvertedCounter;
    }

    duplicateAndParseStyleElement(owner_node, media, css_rules) {
        var style_n = this.addStyleNodeWithCSSText('', '', owner_node, media, 0);

        var styleSheet = style_n.sheet;
        for (var i = 0; i < css_rules.length; i++) {
            var rule = css_rules[i];

            styleSheet.insertRule(rule.cssText, styleSheet.cssRules.length);
        }
        setTimeout(() => { //because of firefox
            this.convertStyleSheet(style_n.sheet, false);
        }, 0);
    }

    checkAndParseImportURL(css_import_rule) {
        var parentHref = css_import_rule.parentStyleSheet.href;
        var parentNodeHref = css_import_rule.parentStyleSheet.ownerNode.href;
        var href = css_import_rule.href;
        var rootPath = '';
        if (href.indexOf('://') > -1) {
            return href;
        } else if (href[0] === '/' && href[1] === '/') {
            return href;
        } else if (href[0] === '/') {
            return S.PAGE_PROTOCOL + '//' + S.PAGE_HOSTNAME + href;
        } else if (parentHref !== null) {
            rootPath = parentHref.substring(0, parentHref.lastIndexOf('/') + 1);
            return rootPath + href;
        } else if (parentNodeHref !== null) {
            if (parentNodeHref === undefined) {
                return S.PAGE_PROTOCOL + '//' + S.PAGE_HOSTNAME + '/' + href; //parent node is STYLE, not LINK
            }
            rootPath = parentNodeHref.substring(0, parentNodeHref.lastIndexOf('/') + 1);
            return rootPath + href;
        }

        return S.PAGE_URL + '/' + href;
    }

    convertImportUrls(styles, isRemovingImports) {
        var result = '';

        for (var start = 0; ;) {
            var import_start_index = styles.indexOf('@import', start);
            if (import_start_index === -1) {
                result += styles.substring(start);
                break;
            }

            var import_end_index = styles.indexOf(';', import_start_index);
            if (import_end_index === -1) {
                result += styles.substring(start);
                break;
            }
            ++import_end_index;

            result += styles.substring(start, import_start_index);
            start = import_end_index;

            if (isRemovingImports) {
                continue;
            }

            var start_offset = 7;
            for (; import_start_index + start_offset < import_end_index; ++start_offset) {
                if (styles[import_start_index + start_offset] !== ' ') break;
            }

            if (styles.substr(import_start_index + start_offset, 4) !== 'url(') {
                var closing_symbol_start_index = import_start_index + start_offset;
                var closing_symbol = styles[closing_symbol_start_index];
                var closing_symbol_end_index = styles.indexOf(closing_symbol, closing_symbol_start_index + 1);

                if (closing_symbol_end_index !== -1) {
                    result +=
                        '@import url(' +
                        closing_symbol +
                        styles.substring(closing_symbol_start_index + 1, closing_symbol_end_index) +
                        closing_symbol +
                        ')';
                    result += styles.substring(closing_symbol_end_index + 1, import_end_index);
                    continue;
                }
            }

            result += styles.substring(import_start_index, import_end_index);
        }

        return result;
    }

    convertRelativeUrlsToAbsolute(styles, url) {
        var result = '';
        var urlStub = document.createElement('a');
        urlStub.href = url;
        var baseURL =
            urlStub.protocol +
            '//' +
            urlStub.host +
            urlStub.pathname
                .split('/')
                .slice(0, -1)
                .join('/');

        var startPattern = 'url(';
        var start_offset = startPattern.length;
        var endPattern = ')';
        for (var start = 0; ;) {
            var import_start_index = styles.indexOf(startPattern, start);
            if (import_start_index === -1) {
                result += styles.substring(start);
                break;
            }

            var import_end_index = styles.indexOf(endPattern, import_start_index + start_offset);
            if (import_end_index === -1) {
                result += styles.substring(start);
                break;
            }
            ++import_end_index;

            result += styles.substring(start, import_start_index);
            start = import_end_index;

            if (styles.substr(import_start_index + start_offset + 1, 1) === '.') {
                var startIndexURL = import_start_index + start_offset;
                var startCharacter = styles.substr(startIndexURL, 1);
                if (startCharacter === '\'' || startCharacter === '"') {
                    startIndexURL += 1;
                }

                var endIndexURL = import_end_index - 2;
                var endCharacter = styles.substr(endIndexURL, 1);
                if (endCharacter !== '\'' && endCharacter !== '"') {
                    endIndexURL = import_end_index - 1;
                }

                var urlImage = styles.substring(startIndexURL, endIndexURL);
                var absoluteImage = 'url("' + baseURL + '/' + urlImage + '")';
                result += absoluteImage;
                continue;
            }

            result += styles.substring(import_start_index, import_end_index);
        }

        return result;
    }

    convertURLs(styles, parentHref, checkForImportUrls) {
        if (typeof parentHref === 'undefined' || parentHref === null) {
            parentHref = S.PAGE_URL;
        }

        var locationHref = parentHref.substring(0, parentHref.lastIndexOf('/') + 1);
        var result = '';
        if (checkForImportUrls) {
            //it is not invoked
            for (var start = 0; ;) {
                var import_start_index = styles.indexOf('@import', start);
                if (import_start_index === -1) {
                    result += styles.substring(start);
                    break;
                }

                var import_end_index = styles.indexOf(';', import_start_index);
                if (import_end_index === -1) {
                    result += styles.substring(start);
                    break;
                }
                ++import_end_index;

                result += styles.substring(start, import_start_index);
                start = import_end_index;

                if (styles.substr(import_start_index + 8, 4) !== 'url(') {
                    var closing_symbol_start_index = import_start_index + 8;
                    var closing_symbol = styles[closing_symbol_start_index];
                    var closing_symbol_end_index = styles.indexOf(closing_symbol, closing_symbol_start_index + 1);

                    if (closing_symbol_end_index !== -1) {
                        result +=
                            '@import url(' +
                            closing_symbol +
                            styles.substring(closing_symbol_start_index + 1, closing_symbol_end_index) +
                            closing_symbol +
                            ')';
                        result += styles.substring(closing_symbol_end_index + 1, import_end_index);
                        continue;
                    }
                }

                result += styles.substring(import_start_index, import_end_index);
            }
            styles = result;
        }

        result = '';
        for (let start = 0; ;) {
            var url_start_index = styles.indexOf('url(', start);
            if (url_start_index === -1) {
                result += styles.substring(start);
                break;
            }

            var url_end_index = styles.indexOf(')', url_start_index);
            if (url_end_index === -1) {
                result += styles.substring(start);
                break;
            }
            ++url_end_index;

            result += styles.substring(start, url_start_index);
            start = url_end_index;

            var start_content = url_start_index + 4;
            if (styles[start_content] === '\'' || styles[start_content] === '"') ++start_content;

            var end_content = url_end_index - 2;
            if (styles[end_content] === '\'' || styles[end_content] === '"') --end_content;

            var content = styles.substring(start_content, end_content + 1);
            if (content[0] === '#') {
                result += styles.substring(url_start_index, url_end_index);
                continue;
            }
            if (
                content.length > 5 &&
                content[0] === 'd' &&
                content[1] === 'a' &&
                content[2] === 't' &&
                content[3] === 'a' &&
                content[4] === ':'
            ) {
                result += styles.substring(url_start_index, url_end_index);
                continue;
            }
            if (content.indexOf('://') !== -1) {
                result += styles.substring(url_start_index, url_end_index);
                continue;
            }

            if (content.length <= 2 || content[0] != '/' || content[1] != '/') {
                if (content[0] === '/') {
                    var first_slash_index = locationHref.indexOf('/', locationHref.indexOf('://') + 3);
                    var domain = first_slash_index === -1 ? locationHref : locationHref.substr(0, first_slash_index);
                    content = domain + content;
                } else content = locationHref + content;
            }
            content = content.replace(/ /g, '%20');
            result += 'url(' + content + ')';
        }

        return result;
    }

    addStyleNodeWithCSSText(href, css_text, owner_node, media, importCSSIndex) {
        var style_n = document.createElement('style');
        style_n.tgParsed = false;
        style_n.tgIgnore = true;

        if (media !== '') {
            style_n.media = media;
        }

        if (window.navigator.userAgent.indexOf('Edge') > -1) {
            if (media === 'only x') {
                style_n.media = 'all';
            }
        }

        if (href !== '') {
            style_n.href = href;
        }

        style_n.innerHTML = css_text;

        style_n.tgImportCSSIndex = importCSSIndex;

        var previousNode = owner_node;
        var nextNode = previousNode;

        for (; ;) {
            nextNode = nextNode.nextSibling;

            if (nextNode === null || nextNode.tgImportCSSIndex === undefined) {
                break;
            }

            if (importCSSIndex < nextNode.tgImportCSSIndex) {
                break;
            }

            previousNode = nextNode;
        }

        Utilities.insertAfter(style_n, previousNode);

        return style_n;
    }

    processCSSRules(css_rules, owner_node) {
        var hasImports = false;

        for (var i = 0; i < css_rules.length; ++i) {
            switch (css_rules[i].type) {
                case CSSRule.STYLE_RULE:
                    this.parseCSSRule(css_rules[i]);
                    break;
                case CSSRule.MEDIA_RULE:
                case CSSRule.SUPPORTS_RULE:
                    this.processCSSRules(css_rules[i].cssRules, owner_node);
                    break;
                case CSSRule.IMPORT_RULE:
                    hasImports = true;
                    var href = this.checkAndParseImportURL(css_rules[i]);

                    owner_node.tgImportCSSCounter = owner_node.tgImportCSSCounter === undefined ? 1 : ++owner_node.tgImportCSSCounter;
                    this.downloadCSS(
                        href,
                        owner_node,
                        css_rules[i].media.mediaText === '' ? owner_node.media : css_rules[i].media.mediaText,
                        owner_node.tgImportCSSCounter
                    );
                    break;
            }
        }

        if (hasImports && owner_node.nodeName === 'LINK') {
            this.downloadCSS(
                owner_node.href,
                owner_node,
                owner_node.media,
                S.IMPORT_CSS_INDEX_LAST_POSITION
            );
        }
    }

    parseCSSRule(css_rule, foreground_properties, background_properties) {
        const trasition_duration = css_rule.style.transitionDuration;
        const control_duration = trasition_duration !== '';
        if (control_duration === true) css_rule.style.transitionDuration = '0s'; //SLOW

        if (foreground_properties === undefined) foreground_properties = StyleConverter.FOREGROUND_PROPERTIES;
        if (background_properties === undefined) background_properties = StyleConverter.BACKGROUND_PROPERTIES;

        //parseCSSVariables - have to be rewrite to executed for every style and after that to executed parse function, because
        // when this.parse - changes variables with _night_eye - those variables don't exists and browsers discard this property
        this.parseCSSVariables(css_rule);

        this.parse(css_rule, background_properties, this.convertBackground, this.cache_bg);
        this.parse(css_rule, foreground_properties, this.convertForeground, this.cache_fr);

        if (control_duration === true) {
            this.style_apply_cache.addTransitionItem(css_rule, trasition_duration);
            // setTimeout(() => {
            //     css_rule.style.transitionDuration = trasition_duration; //SLOW
            // });
        }
    }

    /* sub function of parseCSSRule */
    parseCSSVariables(css_rule) {
        if (typeof css_rule.tgIgnoreVariableCounter === 'undefined') {
            css_rule.tgIgnoreVariableCounter = 0;
        }

        var variable_names_indices = [];
        for (var style_name, j = css_rule.style.length; j-- > 0;) {
            style_name = css_rule.style[j];

            if (style_name.length > 2 && style_name[0] === '-' && style_name[1] === '-') {
                variable_names_indices.push(j);
            }
        }

        for (var value = '', variable_name = '', i = variable_names_indices.length; i-- > 0;) {
            variable_name = css_rule.style[variable_names_indices[i]];

            if (variable_name === undefined) continue;

            if (variable_name.indexOf('-night-eye') !== -1) {
                continue;
            }

            value = this.extractCSSVariable(css_rule, variable_name);
            var firstChar = value.charAt(0);
            if (firstChar >= '0' && firstChar <= '9' && value.indexOf(',') > -1) { // 255,255,255 - https://openai.com/
                value = 'rgb(' + value + ')';
            }

            var fgValue = this.colorProcessor.convertForegroundColorString(value);
            var bgValue = this.colorProcessor.convertBackgroundColorString(value);

            try {
                ++css_rule.tgIgnoreVariableCounter;
                css_rule.style.setProperty(variable_name, fgValue);
                ++css_rule.tgIgnoreVariableCounter;
                css_rule.style.setProperty(variable_name + '-night-eye', bgValue); //
            } catch (e) {
                console.warn(e);
            }
        }
    }

    /* sub function of parseCSSRule */
    extractCSSVariable(css_rule, variable_name) {
        var value;

        var tempValue = css_rule.style.getPropertyValue(variable_name);

        if (tempValue.indexOf('var(--') !== -1) {
            //nested variable - recursion
            value = this.parseCSSVariable(tempValue, css_rule);
        } else {
            value = tempValue;
        }

        return value.trim();
    }

    /* sub function of parseCSSRule */
    parseCSSVariable(content, cssRule) {
        var result = '';

        var startPattern = 'var(';
        var start_offset = startPattern.length;
        var endPattern = ')';
        var alternativeEndPattern = ',';

        for (var start = 0; ;) {
            var import_start_index = content.indexOf(startPattern, start);
            if (import_start_index === -1) {
                result += content.substring(start);
                break;
            }

            var import_end_index = content.indexOf(endPattern, import_start_index + start_offset);
            if (import_end_index === -1) {
                result += content.substring(start);
                break;
            }

            var alternativeEndIndex = content.indexOf(alternativeEndPattern, import_start_index + start_offset);
            if (alternativeEndIndex !== -1) {
                if (import_end_index > alternativeEndIndex) {
                    import_end_index = alternativeEndIndex;
                }
            }

            result += content.substring(start, import_start_index);
            start = import_end_index;

            var startIndexURL = import_start_index + start_offset;
            var endIndexURL = import_end_index;

            var variableName = content.substring(startIndexURL, endIndexURL);
            var tempValue = cssRule.style.getPropertyValue(variableName);
            var afterIndex = content.substring(endIndexURL, endIndexURL + 1);

            if (tempValue === '' && afterIndex === ',') {
                return content;
            }

            if (tempValue.indexOf('var(--') !== -1) {
                result += this.parseCSSVariable(tempValue, cssRule);
            } else {
                result += tempValue;
            }
        }

        return result;
    }

    /* sub function of parseCSSRule */
    markCSSVariable(content, cssRule, converter, isBackgroundParsing) {
        var result = '';

        var startPattern = 'var(';
        var startOffset = startPattern.length;
        var endPattern = ')';
        var alternativeEndPattern = ',';

        for (var start = 0; ;) {
            var varStartIndex = content.indexOf(startPattern, start);
            if (varStartIndex === -1) {
                result += content.substring(start);
                break;
            }

            var varEndIndex = content.indexOf(endPattern, varStartIndex + startOffset);
            if (varEndIndex === -1) {
                result += content.substring(start);
                break;
            }

            let endIndexPattern = start;
            var alternativeEndIndex = content.indexOf(alternativeEndPattern, varStartIndex + startOffset);
            if (alternativeEndIndex !== -1) {
                if (varEndIndex > alternativeEndIndex) {
                    //Have default value - we have to convert it
                    endIndexPattern = alternativeEndIndex;
                } else {
                    endIndexPattern = varEndIndex;
                }
            } else {
                endIndexPattern = varEndIndex;
            }

            result += content.substring(start, varStartIndex);
            start = varEndIndex;

            let startIndexVar = varStartIndex + startOffset;
            let endIndexVar = endIndexPattern;

            var variableName = content.substring(startIndexVar, endIndexVar);
            var variableNightEye = isBackgroundParsing ? variableName + '-night-eye' : variableName;
            result += startPattern + variableNightEye;

            if (alternativeEndIndex !== -1) {
                if (varEndIndex > alternativeEndIndex) {
                    var defaultValue = content.substring(alternativeEndIndex + 1, varEndIndex);
                    if (defaultValue.indexOf('var(--') === -1) {
                        var defaultValues = defaultValue.split(',');
                        if (defaultValues.length === 3) { // => RGB - 255,255,255
                            defaultValue = 'rgb(' + defaultValue + ')';
                        }
                        let convertDefaultValue = converter(defaultValue);


                        if (defaultValues.length === 3) { // => RGB - 255,255,255. This works only for rgb - https://app.slack.com
                            let HSL_values = convertDefaultValue.substring(5, convertDefaultValue.length - 1).split(','); //hsla( === 5 symbols
                            let parsedHSLValues = [];
                            for (let t = 0; t < HSL_values.length; ++t) {
                                parsedHSLValues.push(parseFloat(HSL_values[t]));
                            }

                            Color.HSLtoRGB(parsedHSLValues);
                            let RGB_values = parsedHSLValues;
                            result += ',' + RGB_values[0] + ',' + RGB_values[1] + ',' + RGB_values[2];
                        } else {
                            result += ',' + convertDefaultValue;
                        }

                    } else {
                        this.markCSSVariable(defaultValue, cssRule, converter, isBackgroundParsing);
                    }
                }
            }
        }

        return result;
    }

    /* sub function of parseCSSRule */
    extractStyles(css_text) {
        const result = new Map();
        if (css_text !== undefined) {
            const start = css_text.indexOf('{');
            const end = css_text.indexOf('}');

            if (start !== -1 && end !== -1) {
                css_text = css_text.substring(start + 1, end);
                const rules = css_text.split(';');
                for (var i = rules.length; i-- > 0;) {
                    const pair = rules[i].split(':');
                    if (pair.length !== 2) continue;

                    pair[0] = pair[0].trim();
                    pair[1] = pair[1].trim();
                    result.set(pair[0], pair[1]);
                }
            }
        }

        return result;
    }

    /* sub function of parseCSSRule */
    parse(css_rule, properties, convert, cache) {

        if (css_rule.selectorText !== undefined && css_rule.selectorText.indexOf('html[nighteyeplgn="active"]') === 0) {
            return;
        }

        var isBackgroundParsing = this.convertBackground === convert;
        var is_body_or_html = this.isCSSRuleBodyOrHTML(css_rule);

        var filtered_properties = new Map();
        var custom_properties = this.extractStyles(css_rule.cssText);
        for (let value, i = properties.length; i-- > 0;) {
            value = css_rule.style.getPropertyValue(properties[i]);

            if (value === '') {
                value = custom_properties.get(properties[i]);
                if (value === undefined) {
                    continue;
                }
            }

            filtered_properties.set(properties[i], value);
        }

        if (filtered_properties.has('background') === true) {
            filtered_properties.delete('background-image');
            filtered_properties.delete('background-color');
        }
        if (filtered_properties.has('border') === true) {
            filtered_properties.delete('border-color');
            filtered_properties.delete('border-left');
            filtered_properties.delete('border-left-color');
            filtered_properties.delete('border-right');
            filtered_properties.delete('border-right-color');
            filtered_properties.delete('border-top');
            filtered_properties.delete('border-top-color');
            filtered_properties.delete('border-bottom');
            filtered_properties.delete('border-bottom-color');
        }
        if (filtered_properties.has('border-color') === true) {
            filtered_properties.delete('border-left-color');
            filtered_properties.delete('border-right-color');
            filtered_properties.delete('border-top-color');
            filtered_properties.delete('border-bottom-color');
        }
        if (filtered_properties.has('border-left') === true) filtered_properties.delete('border-left-color');
        if (filtered_properties.has('border-right') === true) filtered_properties.delete('border-right-color');
        if (filtered_properties.has('border-top') === true) filtered_properties.delete('border-top-color');
        if (filtered_properties.has('border-bottom') === true) filtered_properties.delete('border-bottom-color');

        var cached_key, cached, priority;
        filtered_properties.forEach((value, property) => {
            cached_key = value;
            if (value === '') return;



            priority = css_rule.style.getPropertyPriority(property);

            cached = cache.get(value);
            if (cached !== -1) {
                this.applyNewColor(css_rule, property, cached, priority, true);
                return;
            }

            var startVariableIndex = value.indexOf('var(--');
            if (startVariableIndex !== -1) {
                //variable -  RGBA(var(--primary-bg--alt),1)
                //var(--yt-main-app-background-tmp)

                var valueWithDarkBG = this.markCSSVariable(value, css_rule, convert, isBackgroundParsing);

                if (this.applyNewColor(css_rule, property, valueWithDarkBG, priority, false)) {
                    cache.set(cached_key, valueWithDarkBG);
                    return;
                }
            }

            if (isBackgroundParsing) {
                if (value.indexOf('url') !== -1) {
                    if (window.location.href.indexOf('photos.google.com') > -1 || value.indexOf('/cleardot.gif') > -1) {
                        // Google Photos do not invert them || google books(layer)
                        return;
                    }

                    if (property === 'background') {
                        if (value.lastIndexOf('fancybox/blank.gif') > -1) {
                            //jQuery fancybox gallery extension
                            return;
                        }

                        if (is_body_or_html) {
                            //Very important, but test it without it
                            var beforeValue = value;
                            value = convert(value);
                            if (value === beforeValue) {
                                value = '#1f1f1f';
                            }
                        } else {
                            value = convert(value);
                        }
                    } else if (property === 'background-image') {
                        //if (value.indexOf('ssl.gstatic.com') > -1) {
                        if (value.indexOf('gstatic.com') > -1) {
                            property = 'filter';
                            value = 'invert(85%)';
                        }
                    }

                    var hrefLocation = null;
                    if (typeof css_rule.parentStyleSheet !== 'undefined') {
                        if (css_rule.parentStyleSheet.href === null) {
                            hrefLocation = css_rule.parentStyleSheet.ownerNode.href;
                        } else {
                            hrefLocation = css_rule.parentStyleSheet.href;
                        }
                    }

                    value = this.convertURLs(value, hrefLocation, false);

                    this.applyNewColor(css_rule, property, value, priority, false);

                    if (S.IFRAME === false && S.IMAGE_PROCESSING_ENABLED === true) {
                        if (value.indexOf('svg') === -1) {
                            if (
                                window.location.href.indexOf('app.asana.com') > -1 ||
                                window.location.href.indexOf('feedly.com') > -1 ||
                                window.location.href.indexOf('google.com') > -1 ||
                                window.location.href.indexOf('wikidot.com') > -1
                            ) {
                                return;
                            }

                            let isRepeated =
                                css_rule.style.background.indexOf('repeat') > -1 &&
                                css_rule.style.backgroundRepeat.indexOf('repeat') > -1;

                            let imageBackgroundSize = null;
                            let imageBackgroundSizePriority = '';

                            // if (window.image_processing_started === undefined)
                            //     window.image_processing_started = new Date().getTime();
                            WebGLProcessor.processBackgroundCSSString({
                                value: value,
                                PAGE_PROTOCOL: S.PAGE_PROTOCOL,
                                PAGE_HOSTNAME: S.PAGE_HOSTNAME,
                                PAGE_URL: S.PAGE_URL,
                                property: property
                            }, response => {
                                // console.log(`Total converting time ${new Date().getTime() - window.image_processing_started}`);
                                if (response.css_text !== null) {
                                    var is_node = css_rule.tagName !== undefined;
                                    if (is_node) {
                                        css_rule.tgIgnore = true;
                                        this.style_apply_cache.addWebGlImageItem(css_rule, response, priority);
                                        // css_rule.style.setProperty(response.property, response.css_text, priority); //SLOW
                                    } else {
                                        css_rule.tgIgnore = true;
                                        this.style_apply_cache.addWebGlImageItem(css_rule, response, priority);
                                        // css_rule.style.setProperty(response.property, response.css_text, priority); //SLOW
                                    }
                                }

                                if (imageBackgroundSize !== null) {
                                    css_rule.tgIgnore = true;
                                    this.style_apply_cache.addWebGlBackgroundSizeItem(
                                        css_rule,
                                        imageBackgroundSize,
                                        imageBackgroundSizePriority
                                    );
                                    // css_rule.style.setProperty('background-size', imageBackgroundSize, imageBackgroundSizePriority); //SLOW
                                }
                            }, () => {
                                if (isRepeated === false)
                                    return;

                                imageBackgroundSize = css_rule.style.backgroundSize;
                                imageBackgroundSizePriority = css_rule.style.getPropertyPriority('background-size');
                                if (imageBackgroundSize === '0px 0px' && imageBackgroundSizePriority === 'important') {
                                    imageBackgroundSize = null;
                                    imageBackgroundSizePriority = '';
                                    return;
                                }

                                css_rule.tgIgnore = true;
                                css_rule.style.setProperty('background-size', '0 0', 'important');
                            });
                        } else if (is_body_or_html === false) {
                            if (window.location.hostname.indexOf('google') > -1) {
                                css_rule.tgIgnore = true;
                                css_rule.style.filter = 'invert(100%)';
                                css_rule.style.backgroundBlendMode = 'luminosity';
                            }
                        }
                    }
                } else {
                    value = convert(value);
                    if (this.applyNewColor(css_rule, property, value, priority, false)) {
                        cache.set(cached_key, value);
                    }
                }
            } else {
                value = convert(value);
                if (this.applyNewColor(css_rule, property, value, priority, false)) {
                    cache.set(cached_key, value);
                }
            }
        });
    }

    /* sub function of parseCSSRule */
    applyNewColor(css_rule, property, value, priority, force) {
        var oldValue = css_rule['eye-' + property];
        if (oldValue === value && !force) {
            return false;
        }
        css_rule['eye-' + property] = value;
        css_rule.tgIgnore = true;

        css_rule.style.setProperty(property, value, priority);
        if (typeof css_rule.setAttribute !== 'undefined') {
            css_rule.setAttribute('ne', Math.random());
        }

        return true;
    }

    /* sub function of parseCSSRule */
    isCSSRuleBodyOrHTML(css_rule) {

        if (css_rule === document.body || css_rule === document.documentElement) {
            return true;
        }

        if (css_rule.selectorText === undefined) return false;

        var html_index = css_rule.selectorText.indexOf('html');
        var body_index = css_rule.selectorText.indexOf('body');


        if (html_index === 0) {
            if (css_rule.selectorText.trim() !== 'html') html_index = -1;
        } else if (html_index > 0) {
            if (css_rule.selectorText.length > 5) { //5 html + next symbol, because next symbol can be [ or . - There are allowed
                if (css_rule.selectorText.indexOf('.', 5) > 0) html_index = -1;
                else if (css_rule.selectorText.indexOf(' ', 5) > 0) html_index = -1;
            }
        }

        if (body_index === 0) {
            if (css_rule.selectorText.trim() !== 'body') body_index = -1;
        } else if (body_index > 0) {
            var missingBodySelector = true;
            var selectors = css_rule.selectorText.split(' ');
            for (var i = 0; i < selectors.length; ++i) {
                var selector = selectors[i];
                if (selector.indexOf('body') === 0) {
                    if (i + 1 === selectors.length) { //it has to be last element
                        missingBodySelector = false;
                        break;
                    }
                }
            }

            if (missingBodySelector) {
                body_index = -1;
            }

            // let previous_char = css_rule.selectorText[body_index - 1].toLowerCase();
            // if (previous_char === '.' || previous_char === '_' || previous_char === '-' || previous_char === ',') body_index = -1;
            // else if (previous_char >= 'a' && previous_char <= 'z') body_index = -1;
            // else if (previous_char >= '0' && previous_char <= '9') body_index = -1;
        }

        // if (html_index !== -1 || body_index !== -1) {
        //     console.log("RESULT: ", html_index, body_index, css_rule.selectorText);
        // }

        return html_index !== -1 || body_index !== -1;
    }

    checkAndConvertDomShadowElements(parentNode) {
        //https://bugs.chromium.org/p/chromium/issues/detail?id=941910
        var nodes = parentNode.children;
        for (var i = 0; i < nodes.length; ++i) {
            var node = nodes[i];
            if (node.nodeName === 'SCRIPT') {
                continue;
            }
            if (node.nodeName === 'STYLE') {
                this.convertStyleSheet(node.sheet);
            }

            var computedStyle = null;
            if (node.shadowRoot) {
                this.checkAndConvertDomShadowElements(node.shadowRoot);
                computedStyle = window.getComputedStyle(node, ':host');
            } else {
                computedStyle = window.getComputedStyle(node);
            }

            var bgColor = computedStyle.getPropertyValue('background-color');
            var frColor = computedStyle.getPropertyValue('color');

            var newBGcolor = this.convertBackground(bgColor);
            var newFRcolor = this.convertForeground(frColor);

            // var sheet = new CSSStyleSheet();
            // sheet.replaceSync(`a:-webkit-any-link { color: red }`)
            // node.adoptedStyleSheets = [sheet];

            node.style.backgroundColor = newBGcolor;
            node.style.color = newFRcolor;

            this.checkAndConvertDomShadowElements(node);
        }
    }

    //==============================
}

StyleConverter.BACKGROUND_PROPERTIES = [
    'background',
    'background-image',
    'background-color',
    'border',
    'border-color',
    'border-left',
    'border-left-color',
    'border-right',
    'border-right-color',
    'border-top',
    'border-top-color',
    'border-bottom',
    'border-top-color',
    'text-shadow',
    'box-shadow'
];
StyleConverter.FOREGROUND_PROPERTIES = ['fill', 'color', 'text-decoration', 'outline', 'column-rule', 'caret'];

StyleConverter.BACKGROUND_PROPERTIES_SET = new Set();
StyleConverter.FOREGROUND_PROPERTIES_SET = new Set();

export default StyleConverter;
export { StyleConverter };

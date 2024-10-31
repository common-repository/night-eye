import { S } from '../constants/constants';

class MutationManager {

    constructor(core) {
        this.observer = null;
        this.config = {
            'childList': true,
            'attributes': true,
            'subtree': true,
            'attributeFilter': ['style', 'fill', 'src', 'bgcolor', 'ne'],
        };

        this.repeatedElementsMap = [];
        this.running = false;

        this.core = core;
        this.styleConverter = core.styleConverter;
        this.styleConverter.startObserver = this.start.bind(this);
        this.styleConverter.stopObserver = this.stop.bind(this);
    }

    init() {

        this.observer = new MutationObserver((mutations) => {
            this.onMutations(mutations);
        });
        this.start();
    }

    onMutations(mutations) {
        if (this.running === false)
            return;

        setTimeout(() => {
            ++S.isInitialConvertedCounter;
            this.process(mutations);
            --S.isInitialConvertedCounter;
        }, 0);
    }

    start() {
        this.running = true;
        this.observer.observe(document.documentElement, this.config);
    }

    stop() {
        this.running = false;
        this.observer.disconnect();
    }

    process(mutations) {
        for (var i = mutations.length; i-- > 0;) {
            var mutation = mutations[i];

            if (mutation.target.nodeName === 'HEAD') {
                this.onNodesRemoved(mutation.removedNodes);
            }

            this.onAttributeChange(mutation);
            this.onNodesAdded(mutation.addedNodes);

            if (mutation.target.tagName === 'STYLE') {
                this.styleConverter.convertStyleNodes();
            }
        }
    }

    onNodesRemoved(child_list) {
        for (var i = child_list.length; i-- > 0;) {
            var node = child_list[i];

            if (node.id === 'nighteyedefaultcss') {
                this.reinitContentScripts();
            }
        }
    }

    onNodesAdded(child_list) {
        for (var i = child_list.length; i-- > 0;) {
            var node = child_list[i];

            this.onNodeAdded(node);

            if (typeof (node.querySelectorAll) !== 'undefined') {
                var inner_nodes = node.querySelectorAll('*');
                for (var j = inner_nodes.length; j-- > 0;)
                    this.onNodeAdded(inner_nodes[j]);
            }
        }
    }

    onNodeAdded(node) {
        if (node.tgIgnore) {
            node.tgIgnore = false;
            return;
        }

        switch (node.tagName) {
            case 'VIDEO':
            case 'CANVAS':
            case 'SCRIPT':
                break;
            case 'LINK':
                if ('import' === node.rel) {
                    this.styleConverter.convertLinkImports();
                    break;
                }

                if ('stylesheet' !== node.rel)
                    break;

                var currentMedia = node.media;
                node.addEventListener('load', () => {
                    var needDownload = currentMedia !== node.media; //when someone add link with media='x only' and then change media to all -> changing media reset file
                    this.styleConverter.convertStyleSheetFromMutator(node.sheet, false, needDownload);
                });
            // falls through - no need for break in order ot parse styles if it is already loaded
            case 'STYLE':
                this.styleConverter.convertStyleNodes();
                break;
            case 'IMG':
                this.styleConverter.convertImgNode(node);
            // falls through - no need for break in order ot parse style attribute
            default:
                if (typeof (node.getAttribute) === 'undefined')
                    return;

                if (node.fileUrl !== undefined) { //Edge loop problem - huffingtonpost.com
                    return;
                }

                this.styleConverter.convertInlineStyle(node);
                break;
        }
    }

    onAttributeChange(mutation) {

        if (mutation.type !== 'attributes')
            return;

        if (mutation.target.getAttribute === undefined)
            return;

        if (mutation.target.tgIgnore) {
            mutation.target.tgIgnore = false;
            return;
        }

        if (mutation.attributeName === 'ne') { //night eye attribute
            mutation.target.removeAttribute('ne');
            mutation.target.tgIgnore = false;
            return;
        }

        if (mutation.target.tgIgnoreVariableCounter > 0) {
            --mutation.target.tgIgnoreVariableCounter;
            return;
        }

        if (typeof (mutation.target.invokeCounter) === 'undefined') {
            mutation.target.invokeCounter = 0;
        }

        //Different animations, svg, video players - change Class or Attribute in a loop, so mutator invoke indefinitely
        if (++mutation.target.invokeCounter > 50) {
            return;
        }

        switch (mutation.target.tagName) {
            case 'VIDEO':
            case 'CANVAS':
            case 'SCRIPT':
            case 'LINK':
            case 'STYLE':
                break;
            case 'IFRAME':
                this.styleConverter.convertIFrame(mutation.target);
                break;
            case 'IMG':
                this.styleConverter.convertImgNode(mutation.target);
            // falls through - no need for break in order ot parse style attribute
            default:
                this.styleConverter.convertInlineStyle(mutation.target);
                break;
        }
    }

    reinitContentScripts() {
        //Should be uncommented
        this.core.reinitDomElements();
        this.core.state.addCustomStyles();
    }
}

export default MutationManager;

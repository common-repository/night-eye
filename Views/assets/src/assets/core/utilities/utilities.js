import { S, Strings } from '../constants/constants';

export default class Utilities {

    static makeURL(url, PAGE_PROTOCOL, PAGE_HOSTNAME, PAGE_PORT, PAGE_URL) {
        if (PAGE_PROTOCOL === undefined) {
            PAGE_PROTOCOL = S.PAGE_PROTOCOL;
            PAGE_HOSTNAME = S.PAGE_HOSTNAME;
            PAGE_PORT = S.PAGE_PORT;
            PAGE_URL = S.PAGE_URL;
        }

        if (PAGE_PORT !== '') {
            PAGE_PORT = ':' + PAGE_PORT;
        }

        var pos = url.lastIndexOf('/%20/'); //import css urls
        if (pos > -1) {
            return PAGE_PROTOCOL + '//' + PAGE_HOSTNAME + PAGE_PORT + url.substring(pos + 4);
        }

        if (url.slice(0, 2) === '//')
            return PAGE_PROTOCOL + url;

        if (url[0] === '/')
            return PAGE_PROTOCOL + '//' + PAGE_HOSTNAME + PAGE_PORT + url;

        if (url.slice(0, 8).lastIndexOf('://') !== -1)
            return url;


        return PAGE_URL + url;
    }

    static parseURL(url) {
        url = url.replace('www.', Strings.EMPTY);
        var index = url.indexOf('://');
        if (index !== -1) {
            url = url.substring(index + 3);
            index = url.indexOf('/');
            if (index !== -1)
                url = url.substring(0, index);
        }

        return url;
    }

    static insertAfter(new_node, ref_node) {
        if (ref_node.nextSibling !== null)
            ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
        else
            (ref_node.parentNode === null ? document.documentElement : ref_node.parentNode).appendChild(new_node);
    }
    static insertBefore(new_node, ref_node) {
        ref_node.parentNode.insertBefore(new_node, ref_node);
    }

    static makeParsedStyleNode() {
        var style_n = document.createElement('style');
        style_n.tgParsed = true;
        style_n.tgIgnore = true;
        return style_n;
    }

    static makeParsedLinkNode(href) {
        var link_n = document.createElement('link');
        link_n.tgParsed = true;
        link_n.tgIgnore = true;
        link_n.rel = 'stylesheet';
        link_n.href = href;
        return link_n;
    }

}



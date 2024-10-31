// version 1.2.1
import S from '../constants/SV';

export default class Ajax {

    constructor(background_) {
        this.ajax = new XMLHttpRequest();
        this.ajax.onreadystatechange = this.listener.bind(this);
        this.ajax.onprogress = this.onProgressListener.bind(this);

        this.background = background_ === undefined ? false : background_;

        this.method = S.Strings.EMPTY;
        this.url = S.Strings.EMPTY;
        this.async = null;
        this.headers = [];
        // eslint-disable-next-line no-use-before-define
        this.request_query_builder = new RequestQueryBuilder();

        this.readyState = S.NOT_EXISTS;
        this.status = S.NOT_EXISTS;
        this.responseText = null;
        this.wiped = false;

        this.onResponse = null;
        this.onResponseJson = null;
        this.onResponseData = null;
        this.onProgress = null;
        this.onError = null;
        this.onWipe = null;
    }

    open(method_, url_, async_) {
        this.method = method_;
        this.url = url_;
        this.async = (async_ === undefined ? true : async_);
        if (this.method === Ajax.POST)
            this.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    setRequestHeader(name, value) {
        // eslint-disable-next-line no-use-before-define
        this.headers.push(new Header(name, value));
    }

    setResponseType(response_type) {
        this.ajax.responseType = response_type;
    }

    addParam(key, value) {
        this.request_query_builder.add(key, value);
    }

    getResponseHeader(name) {
        return this.ajax.getResponseHeader(name);
    }

    send() {
        var header;

        this.ajax.open(this.method, this.url + (this.method === Ajax.GET ? '?' + this.request_query_builder.build() : S.Strings.EMPTY), this.async);
        for (var i = this.headers.length - 1; i >= 0; --i) {
            header = this.headers[i];
            this.ajax.setRequestHeader(header.name, header.value);
        }
        this.ajax.send((this.method === Ajax.POST ? this.request_query_builder.build() : S.Strings.EMPTY));
    }

    listener() {
        if (this.wiped === true) {
            if (this.onWipe !== null)
                this.onWipe();
            return;
        }

        this.readyState = this.ajax.readyState;
        this.status = this.ajax.status;
        if (this.ajax.readyState !== 4)
            return;

        switch (this.ajax.responseType) {
            case S.Strings.EMPTY:
            case 'text':
                this.responseText = this.ajax.responseText;
                break;
            default:
                this.responseText = this.ajax.response;
        }

        if (this.ajax.status !== 200) {
            if (this.onError !== null)
                this.onError(this.status, this.responseText);
            return;
        }

        if (this.onResponse !== null) {
            this.onResponse(this.responseText);
            return;
        }

        const json = JSON.parse(this.responseText);
        if (json.reason !== undefined) {
            json.message = json.reason;
            delete json.reason;
        }
        if (this.onResponseJson !== null)
            this.onResponseJson(json);

        if (json.status === Ajax.STATUS_OK && this.onResponseData !== null)
            this.onResponseData(json.obj);
    }

    onProgressListener(e) {
        if (this.onProgress !== null)
            this.onProgress(e);
    }

    wipe() {
        this.wiped = true;
    }

}

class RequestQueryBuilder {

    constructor() {
        this.params = [];
    }

    add(key, value) {
        this.params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    build() {
        return this.params.join('&');
    }
}

class Header {

    constructor(name_, value_) {
        this.name = name_;
        this.value = value_;
    }

}

Ajax.GET = 'get';
Ajax.POST = 'post';

Ajax.STATUS_OK = 0;

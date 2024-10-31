
import '../../css/widget.css';
import { CookieNames, LOCAL_STORAGE_KEY, Mode, WidgetScreenPosition } from '../constants/constants';
import Cookies from '../utilities/cookies';

export default class Widget {

    constructor(isDarkMode, options) {
        this.isDarkMode = isDarkMode;
        this.options = options;
        this.iconButton = null;
        this.dialogBackground = null;
        this.dialog = null;
    }

    show() {
        this.iconButton = document.createElement('div');
        this.iconButton.className = 'NightEyeWidget';

        var positionClass = '';
        var propertyX = '';
        var propertyY = '';

        var offsetX = 0;
        var offsetY = 10;
        switch (parseInt(this.options.position)) {
            case WidgetScreenPosition.TOP_LEFT:
                positionClass = 'NightEyePositionLeft';
                propertyX = 'left';
                propertyY = 'top';
                break;
            case WidgetScreenPosition.TOP_RIGHT:
                positionClass = 'NightEyePositionRight';
                propertyX = 'right';
                propertyY = 'top';
                break;
            case WidgetScreenPosition.BOTTOM_RIGHT:
                positionClass = 'NightEyePositionRight';
                propertyX = 'right';
                propertyY = 'bottom';
                break;
            default:
                //bottom left
                positionClass = 'NightEyePositionLeft';
                propertyX = 'left';
                propertyY = 'bottom';
                break;
        }
        this.UI_addClass(this.iconButton, positionClass);
        this.iconButton.style[propertyX] = offsetX + 'px';
        this.iconButton.style[propertyY] = offsetY + 'px';

        this.iconButton.innerHTML = this.getIcon();

        this.iconButton.addEventListener('click', () => {
            this.showDialog();
        });

        document.documentElement.appendChild(this.iconButton);
    }

    showDialog() {
        if (this.dialog !== null) {
            return;
        }

        this.dialogBackground = document.createElement('div');
        this.dialogBackground.className = 'NightEyeDialogBackground';
        this.UI_addClass(document.documentElement, 'NightEyeNoScroll');
        this.dialogBackground.addEventListener('click', () => {
            this.closeDialog();
        });

        this.dialog = document.createElement('div');
        this.dialog.className = 'NightEyeDialog';

        var closeButton = document.createElement('div');
        this.dialog.appendChild(closeButton);
        closeButton.className = 'NightEyeCloseButton';
        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
        closeButton.addEventListener('click', () => {
            this.closeDialog();
        });

        var titleEl = document.createElement('div');
        this.dialog.appendChild(titleEl);
        titleEl.className = 'NightEyeTitle';
        titleEl.innerHTML = 'Night mode';

        var desctiptionEl = document.createElement('div');
        this.dialog.appendChild(desctiptionEl);
        desctiptionEl.className = 'NightEyeDesc';
        desctiptionEl.innerHTML = 'Working at night or in low-light, having some visual impairments, migranes or simply enjoying dark UI.';


        //===========================================
        var toggleButtonEl = document.createElement('div');
        this.dialog.appendChild(toggleButtonEl);
        toggleButtonEl.className = 'NightEyeToggleButton';

        var switchEl = document.createElement('label');
        toggleButtonEl.appendChild(switchEl);
        switchEl.className = 'switchNE';

        var input = document.createElement('input');
        switchEl.appendChild(input);
        input.type = 'checkbox';
        if (this.isDarkMode) {
            input.checked = true;
        }

        var toggle = document.createElement('span');
        switchEl.appendChild(toggle);
        toggle.className = 'sliderNE roundNE';

        var loading = document.createElement('div');
        toggle.appendChild(loading);
        loading.className = 'NightEyeLoading';
        loading.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>';

        input.addEventListener('change', () => {
            var mode = input.checked ? Mode.DARK : Mode.NORMAL;
            this.UI_addClass(loading, 'NightEyeActive NightEyeMode-' + mode);
            setTimeout(() => {
                this.changeMode(mode);
            }, 0);
        });

        //===========================================

        document.documentElement.appendChild(this.dialogBackground);
        document.documentElement.appendChild(this.dialog);
    }

    closeDialog() {
        this.UI_removeClass(document.documentElement, 'NightEyeNoScroll');
        document.documentElement.removeChild(this.dialogBackground);
        document.documentElement.removeChild(this.dialog);
        this.dialogBackground = null;
        this.dialog = null;
    }

    changeMode(mode) {
        var currentTS = (new Date()).getTime();
        localStorage.setItem(LOCAL_STORAGE_KEY.STATE, mode)
        localStorage.setItem(LOCAL_STORAGE_KEY.USER_EXPLICITY_CHANGED, currentTS);

        Cookies.set(CookieNames.MODE, mode);

        window.location.reload();

    }

    getIcon() {
        return '<svg viewBox="0 0 512 512" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="467" cy="45" fill="#dddce6" r="15" /><circle cx="497" cy="165" fill="#dddce6" r="15" /><path d="m407 90c-24.901 0-45-20.099-45-45 0-8.401-6.599-15-15-15s-15 6.599-15 15c0 24.901-21.099 45-46 45-8.401 0-15 6.599-15 15s6.599 15 15 15c24.901 0 46 20.099 46 45 0 8.401 6.599 15 15 15s15-6.599 15-15c0-24.901 20.099-45 45-45 8.401 0 15-6.599 15-15s-6.599-15-15-15z" fill="#f2eef3" /><path d="m422 105c0 8.401-6.599 15-15 15-24.901 0-45 20.099-45 45 0 8.401-6.599 15-15 15v-150c8.401 0 15 6.599 15 15 0 24.901 20.099 45 45 45 8.401 0 15 6.599 15 15z" fill="#dddce6" /><path d="m492.796 320.541c-5.449-3.794-12.788-3.56-18.003.63-32.329 26.059-71.338 39.829-112.793 39.829-46.126 0-89.116-18.585-121-47.214-36.727-32.975-60-80.654-60-133.786 0-51.736 22.134-99.688 60-133.555 7.56-6.762 15.516-13.163 24.302-18.701 5.654-3.56 7.617-10.459 5.757-16.875-1.846-6.416-8.379-10.869-15.059-10.869-5.063 0-10.009.467-15 .76-133.616 7.831-241 118.693-241 254.24s107.384 248.409 241 256.24c4.991.293 9.937.76 15 .76 109.336 0 207.353-70.668 242.421-174.35 2.139-6.313-.161-13.286-5.625-17.109z" fill="#ffda2d" /><g fill="#fdbf00"><path d="m498.421 337.65c2.139-6.313-.161-13.286-5.625-17.109-5.449-3.794-12.788-3.56-18.003.63-32.329 26.059-71.338 39.829-112.793 39.829-46.126 0-89.116-18.585-121-47.214v197.454c4.991.293 9.937.76 15 .76 109.336 0 207.353-70.668 242.421-174.35z" /><path d="m265.302 27.744c5.654-3.56 7.617-10.459 5.757-16.875-1.846-6.416-8.379-10.869-15.059-10.869-5.063 0-10.009.467-15 .76v45.685c7.56-6.762 15.516-13.164 24.302-18.701z" /></g></svg>';
    }

    UI_addClass(el, className) {
        el.className += ' ' + className;
    }

    UI_removeClass(el, className) {
        var newClassName = "";
        var i;
        var classes = el.className.split(" ");
        for (i = 0; i < classes.length; i++) {
            if (classes[i] !== className) {
                newClassName += classes[i] + " ";
            }
        }
        el.className = newClassName;
    }

}
import '../../css/options-page.css';
import Ajax from '../utilities/Ajax';
import S from '../constants/SV';

class OptionsPage {

    constructor() {

        this.pageContent = document.querySelector('.PageContent');
        if (this.pageContent === null) {
            alert('Problem! Contact the developer!')
            return;
        }
        this.initConfig();
        this.createUIElements();
    }

    initConfig() {

        this.dataValues = JSON.parse(NightEyeConfig.options);
        this.dataValues.status = parseInt(this.dataValues.status);
        this.dataValues.desktopPosition = parseInt(this.dataValues.desktopPosition);
        this.dataValues.mobilePosition = parseInt(this.dataValues.mobilePosition);
        this.inputConstants = JSON.parse(NightEyeConfig.inputConstants);
    }

    createUIElements() {
        let row = null;
        let box = null;

        row = document.createElement('div');
        this.pageContent.appendChild(row);
        row.className = 'SectionRow';

        box = this.createBox(row, 'Status');
        this.renderLicenseKey(box);
        this.renderRestrictions(box);

        this.renderPoweredByNightEye(box);

        box = this.createBox(row, 'Night Eye Pro');
        box.className += ' Pro'
        this.renderProVersionContent(box);


        box = this.createBox(this.pageContent, 'Configuration');
        this.renderStatusSettings(box);
        this.renderDesktopPositionSettings(box);
        this.renderMobilePositionSettings(box);
        this.renderSubmitButton(box);

    }

    createBox(parent, name) {
        const box = document.createElement('div');
        parent.appendChild(box);
        box.className = 'Box';

        const title = document.createElement('div');
        box.appendChild(title);
        title.className = 'Title';
        title.textContent = name;

        return box;
    }

    renderLicenseKey(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'License Key';

        const value = document.createElement('div');
        row.appendChild(value);
        value.className = 'Value';
        value.innerHTML = `You are using Night Eye - no license is required.<br> To unlock more features and to support an honest business, consider <a href="https://plugins.nighteye.app" target="_blank">upgrading to PRO</a>`;
    }

    renderRestrictions(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'Restrictions';

        const value = document.createElement('div');
        row.appendChild(value);
        value.className = 'Value';
        value.innerHTML = 'Night Eye enables dark mode on every page on your website without any limitations. The free version comes with customization features such as colors, position, auto-schedule, and more.';
    }

    renderPoweredByNightEye(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'Powered by';

        const value = document.createElement('div');
        row.appendChild(value);
        value.className = 'Value';
        value.innerHTML = '<a href="https://nighteye.app" target="_blank">Night Eye - the leading dark mode browser extension with more than 190 000 daily users</a>';
    }

    renderProVersionContent(parent) {

        const value = document.createElement('div');
        parent.appendChild(value);
        value.className = 'Content';
        value.innerHTML = `        
        <div class="LabelTitle"><b>By upgrading to Night Eye Pro you will unlock all customization options to provide even better dark mode experience for your visitors.</b></div>
        <div class="FeatureRow"><span class="dashicons dashicons-hourglass"></span><span>Schedule when the Night Eye toggle to be visible to your visitors. For example you can turn it off during the day hours.</span></div>
        <div class="FeatureRow"><span class="dashicons dashicons-admin-customizer"></span><span>Make the dark mode even more custom by adjusting the colors of your website while dark mode is active.</span></div>
        <div class="FeatureRow"><span class="dashicons dashicons-format-aside"></span><span>Customize the pop-up text of the toggle and its title.</span></div>
        <div class="FeatureRow"><span class="dashicons dashicons-fullscreen-alt"></span><span>Customize the position of the dark mode toggle for both desktop and mobile.</span></div>
        <div class="FeatureRow"><span class="dashicons dashicons-art"></span><span>Pick one of the 3 predefined dark themes. More to come soon.</span></div>
        `;

        const buttonsWrapper = document.createElement('div');
        parent.appendChild(buttonsWrapper);
        buttonsWrapper.className = 'Buttons';

        const buyButton = document.createElement('a');
        buttonsWrapper.appendChild(buyButton);
        buyButton.textContent = 'Buy Pro version';
        buyButton.className = 'button button-primary';
        buyButton.href = 'https://plugins.nighteye.app';
        buyButton.target = '_blank';

        const useFremiumButton = document.createElement('a');
        buttonsWrapper.appendChild(useFremiumButton);
        useFremiumButton.textContent = 'Get Pro for free';
        useFremiumButton.className = 'button';
        useFremiumButton.href = 'https://plugins.nighteye.app';
        useFremiumButton.target = '_blank';

    }

    renderStatusSettings(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'Status';

        const select = document.createElement('select');
        row.appendChild(select);
        select.name = this.inputConstants.status;

        for (let i = 0; i < S.PluginStatus.length; ++i) {
            const statusItem = S.PluginStatus[i];
            const option = document.createElement('option');
            select.appendChild(option);
            option.textContent = statusItem.name;
            option.value = statusItem.id;

            if (statusItem.id === this.dataValues.status) {
                option.setAttribute('selected', '');
            }
        }

        const explanationEl = document.createElement('div');
        row.appendChild(explanationEl);
        explanationEl.className = 'Explanation';
        explanationEl.innerHTML = '<b>Active</b> - the dark mode toggle is visible to your websites\' visitors. <b>Deactivated</b> - the dark mode toggle is NOT visible to your websites\' visitors. If this is selected, dark mode will not work on your website.';
    }

    renderDesktopPositionSettings(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'Desktop position';

        const select = document.createElement('select');
        row.appendChild(select);
        select.name = this.inputConstants.desktopPosition;

        for (let i = 0; i < S.WidgetPositions.length; ++i) {
            const positionItem = S.WidgetPositions[i];
            const option = document.createElement('option');
            select.appendChild(option);
            option.textContent = positionItem.name;
            option.value = positionItem.id;

            if (positionItem.id === this.dataValues.desktopPosition) {
                option.setAttribute('selected', '');
            }
        }

        const explanationEl = document.createElement('div');
        row.appendChild(explanationEl);
        explanationEl.className = 'Explanation';
        explanationEl.textContent = 'You can choose the position of the Night Eye dark mode toggle on your website. This menu affects only the desktop version of the website.';
    }

    renderMobilePositionSettings(parent, options) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row';

        const label = document.createElement('div');
        row.appendChild(label);
        label.className = 'Label';
        label.textContent = 'Mobile position';

        const select = document.createElement('select');
        row.appendChild(select);
        select.name = this.inputConstants.mobilePosition;

        for (let i = 0; i < S.WidgetPositions.length; ++i) {
            const positionItem = S.WidgetPositions[i];
            const option = document.createElement('option');
            select.appendChild(option);
            option.textContent = positionItem.name;
            option.value = positionItem.id;

            if (positionItem.id === this.dataValues.mobilePosition) {
                option.setAttribute('selected', '');
            }
        }

        const explanationEl = document.createElement('div');
        row.appendChild(explanationEl);
        explanationEl.className = 'Explanation';
        explanationEl.textContent = 'You can choose the position of the Night Eye dark mode toggle on your website. This menu affects only the mobile version of the website.';
    }

    renderSubmitButton(parent) {
        const row = document.createElement('div');
        parent.appendChild(row);
        row.className = 'Row Buttons';

        const saveButton = document.createElement('div');
        row.appendChild(saveButton);
        saveButton.className = 'button button-primary';
        saveButton.textContent = 'Save Changes';
        saveButton.addEventListener('click', () => {
            this.updatePage();
        });

        const moreOptionButton = document.createElement('a');
        row.appendChild(moreOptionButton);
        moreOptionButton.className = 'button';
        moreOptionButton.textContent = 'Upgrade to PRO to unlock all options';
        moreOptionButton.href = 'https://plugins.nighteye.app';
        moreOptionButton.target = '_blank';
    }

    updatePage() {
        this.collectAllInputValues();

        const controller = NightEyeConfig.generalController + '/updateOptions'

        const ajax = new Ajax();

        ajax.addParam('json', JSON.stringify(this.dataValues));
        ajax.open(Ajax.POST, controller, true);
        ajax.setRequestHeader('X-WP-Nonce', NightEyeConfig.requestNonce)
        ajax.onResponse = (response) => {
            response = JSON.parse(response);

            if (response === 'updated') {
                this.showSuccessMessage();
            }
        }

        ajax.send();
    }

    showSuccessMessage() {
        var messageEl = document.createElement('div');
        messageEl.className = 'updated notice';
        messageEl.innerHTML = '<p>Successfully updated</p>';

        this.pageContent.parentNode.insertBefore(messageEl, this.pageContent);

        setTimeout(function () {
            messageEl.parentNode.removeChild(messageEl);
        }, 4000);
    }

    isTimerActivate() {
        if (this.timeActiveCheckbox.checked) {
            this.startTimePicker.className = '';
            this.endTimePicker.className = '';
            this.buttonHiddenCheckbox.className = '';
        } else {
            this.startTimePicker.className = 'Readonly';
            this.endTimePicker.className = 'Readonly';
            this.buttonHiddenCheckbox.className = 'Readonly';
        }
    }

    collectAllInputValues() {
        const inputs = this.pageContent.querySelectorAll('input, textarea, select');

        for (let i = 0; i < inputs.length; ++i) {
            const input = inputs[i];

            if (input.name === S.Strings.EMPTY) {
                continue;
            }

            this.dataValues[input.name] = input.value;

            switch (input.type.toLowerCase()) {
                case 'checkbox':
                    console.log("input.name: ", input.name, input.checked);
                    this.dataValues[input.name] = input.checked ? S.INT_TRUE : S.INT_FALSE;
                    break;
                case 'time':
                    break;
            }
        }
    }
}

jQuery(document).ready(function ($) {
    var optionsPage = new OptionsPage();
});

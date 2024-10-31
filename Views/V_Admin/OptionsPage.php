<?php

namespace NightEye\Views\V_Admin;

use NightEye\Filters\Filter;
use NightEye\Models\Domain\OptionsModel;
use NightEye\Utilities\Constants\SV;

class OptionsPage
{
    private const PAGE_SLUG = 'nighteye';

    public static function initPage()
    {
        // register a new setting for "nighteye" page
        register_setting(self::PAGE_SLUG, OptionsModel::SLUG, [
            'default' => OptionsModel::getDefaults()
        ]);
    }

    public static function loadScripts()
    {
        $optionsModel = OptionsModel::fromDB(OptionsModel::SLUG);

        wp_enqueue_style('night-eye-options-page', plugins_url('/assets/v-admin/view/options-page/bundle.css', dirname(__FILE__)));
        wp_enqueue_style('jquery-ui-datepicker');

        $configData = array(
            'generalController' => get_site_url() . '/wp-json/' . Filter::API_NAMESPACE . '/general',
            'requestNonce' => wp_create_nonce('wp_rest'),
            'options' => json_encode($optionsModel),
            'inputConstants' => json_encode(OptionsModel::getConsts()),
        );

        wp_register_script('night-eye-options-page-bundle', plugins_url('/assets/v-admin/view/options-page/bundle.js', dirname(__FILE__)));
        wp_localize_script('night-eye-options-page-bundle', 'NightEyeConfig', $configData);
        wp_enqueue_script('night-eye-options-page-bundle', '', array('jquery', 'jquery-ui-core', 'jquery-ui-datepicker'), time(), true);
    }

    public static function renderPage()
    {
        // check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }

        // add error/update messages

        // check if the user have submitted the settings
        // wordpress will add the "settings-updated" $_GET parameter to the url
        if (isset($_GET['settings-updated'])) {
            // add settings saved message with the class of "updated"
            add_settings_error('nighteye_messages', 'nighteye_message', __('Settings Saved', SV::NS), 'updated');
        }

        // show error/update messages
        settings_errors('nighteye_messages'); ?>
        <div class="wrap">
            <div class="notice notice-warning">You’re using <b>Night Eye</b>. To unlock more features consider upgrading to use FREE upgrade or buy Pro.</div>
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="PageContent"></div>
        </div>
<?php
    }
}

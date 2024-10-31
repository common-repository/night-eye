<?php

namespace NightEye;

use NightEye\Filters\Filter;
use NightEye\Utilities\Activator;
use NightEye\Utilities\Deactivator;
use NightEye\Views\V_Admin\OptionsPage;
use NightEye\Models\Domain\OptionsModel;
use NightEye\Utilities\Constants\SV;
use NightEye\Utilities\SF;

class Main
{
    const PAGE_TOP_PREFIX = 'toplevel_page_';
    const PAGE_MAIN_ADMIN_ID = 'night-eye-admin';

    public static function init()
    {
        register_activation_hook(__FILE__, array(__NAMESPACE__ . '\Main', 'activate'));
        register_deactivation_hook(__FILE__, array(__NAMESPACE__ . '\Main', 'deactivate'));
        Main::initHooks();
        Main::initAdminHooks();
    }

    public static function activate()
    {
        require_once __DIR__ . '/vendor/autoload.php';
        Activator::activate();

        OptionsPage::initPage();
    }

    /**
     * The code that runs during plugin deactivation.
     * This action is documented in includes/class-plugin-name-deactivator.php
     */
    public static function deactivate()
    {
        Deactivator::deactivate();
    }

    public static function initHooks()
    {
        add_action('wp_enqueue_scripts', array(__NAMESPACE__ . '\Main', 'loadFrontEndScripts'));
        Filter::initCommon();
        Filter::initFront();
    }

    public static function initAdminHooks()
    {
        add_action('admin_menu', array(__NAMESPACE__ . '\Main', 'attachToAdminMenu'));
        add_action('admin_enqueue_scripts', array(__NAMESPACE__ . '\Main', 'loadAdminScripts'));
        // Update Database on Admin Panel
        add_action('admin_init', array(__NAMESPACE__ . '\Main', 'activate'));

        Filter::initAdmin();
    }

    public static function attachToAdminMenu()
    {
        $icon = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDgwMCA3OTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDgwMCA3OTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj48Y2lyY2xlIGN4PSI2NTIuMiIgY3k9IjE0My44IiByPSIxNy45Ii8+PGNpcmNsZSBjeD0iNjg4LjEiIGN5PSIyODcuMiIgcj0iMTcuOSIvPjxwYXRoIGQ9Ik01ODAuNSwxOTcuNmMtMjkuOCwwLTUzLjgtMjQtNTMuOC01My44YzAtMTAtNy45LTE3LjktMTcuOS0xNy45cy0xNy45LDcuOS0xNy45LDE3LjljMCwyOS44LTI1LjIsNTMuOC01NSw1My44Yy0xMCwwLTE3LjksNy45LTE3LjksMTcuOXM3LjksMTcuOSwxNy45LDE3LjljMjkuOCwwLDU1LDI0LDU1LDUzLjhjMCwxMCw3LjksMTcuOSwxNy45LDE3LjlzMTcuOS03LjksMTcuOS0xNy45YzAtMjkuOCwyNC01My44LDUzLjgtNTMuOGMxMCwwLDE3LjktNy45LDE3LjktMTcuOVM1OTAuNSwxOTcuNiw1ODAuNSwxOTcuNnoiLz48cGF0aCBkPSJNNTk4LjQsMjE1LjVjMCwxMC03LjksMTcuOS0xNy45LDE3LjljLTI5LjgsMC01My44LDI0LTUzLjgsNTMuOGMwLDEwLTcuOSwxNy45LTE3LjksMTcuOVYxMjUuOWMxMCwwLDE3LjksNy45LDE3LjksMTcuOWMwLDI5LjgsMjQsNTMuOCw1My44LDUzLjhDNTkwLjUsMTk3LjYsNTk4LjQsMjA1LjUsNTk4LjQsMjE1LjV6Ii8+PHBhdGggZD0iTTY4Myw0NzMuMWMtNi41LTQuNS0xNS4zLTQuMy0yMS41LDAuOGMtMzguNiwzMS4xLTg1LjMsNDcuNi0xMzQuOCw0Ny42Yy01NS4xLDAtMTA2LjUtMjIuMi0xNDQuNi01Ni40Yy00My45LTM5LjQtNzEuNy05Ni40LTcxLjctMTU5LjljMC02MS44LDI2LjUtMTE5LjIsNzEuNy0xNTkuNmM5LTguMSwxOC41LTE1LjcsMjktMjIuNGM2LjgtNC4zLDkuMS0xMi41LDYuOS0yMC4yYy0yLjItNy43LTEwLTEzLTE4LTEzYy02LjEsMC0xMiwwLjYtMTcuOSwwLjlDMjIyLjQsMTAwLjMsOTQsMjMyLjgsOTQsMzk0LjhzMTI4LjQsMjk2LjksMjg4LjEsMzA2LjNjNiwwLjQsMTEuOSwwLjksMTcuOSwwLjljMTMwLjcsMCwyNDcuOS04NC41LDI4OS44LTIwOC40QzY5Mi4zLDQ4Ni4xLDY4OS42LDQ3Ny43LDY4Myw0NzMuMXoiLz48Zz48cGF0aCBkPSJNNjg5LjgsNDkzLjZjMi42LTcuNS0wLjItMTUuOS02LjctMjAuNWMtNi41LTQuNS0xNS4zLTQuMy0yMS41LDAuOGMtMzguNiwzMS4xLTg1LjMsNDcuNi0xMzQuOCw0Ny42Yy01NS4xLDAtMTA2LjUtMjIuMi0xNDQuNi01Ni40djIzNmM2LDAuNCwxMS45LDAuOSwxNy45LDAuOUM1MzAuNyw3MDIsNjQ3LjksNjE3LjUsNjg5LjgsNDkzLjZMNjg5LjgsNDkzLjZ6Ii8+PHBhdGggZD0iTTQxMS4xLDEyMy4yYzYuOC00LjMsOS4xLTEyLjUsNi45LTIwLjJjLTIuMi03LjctMTAtMTMtMTgtMTNjLTYuMSwwLTEyLDAuNi0xNy45LDAuOXY1NC42QzM5MS4xLDEzNy40LDQwMC42LDEyOS44LDQxMS4xLDEyMy4yTDQxMS4xLDEyMy4yeiIvPjwvZz48L3N2Zz4=';
        add_menu_page('Night Eye Options', 'Night Eye', 'edit_published_posts', self::PAGE_MAIN_ADMIN_ID, array(__NAMESPACE__ . '\Main', 'initOptionsPage'), $icon);
    }

    public static function initOptionsPage()
    {
        OptionsPage::renderPage();
    }

    public static function loadFrontEndScripts($hook)
    {
        if (OptionsModel::isActive()) {
            add_filter('script_loader_tag', array(__NAMESPACE__ . '\Main', 'addES5VersionOfScript'), 10, 3);

            add_action('wp_head', array(__NAMESPACE__ . '\Main', 'hookHeadCSS'));
            add_action('wp_head', array(__NAMESPACE__ . '\Main', 'printOptions'), 2);

            wp_enqueue_style('night-eye', plugins_url('/Views/assets/v-public/view/startup-page/bundle.css', __FILE__));
            wp_enqueue_script('night-eye', plugins_url('/Views/assets/v-public/view/startup-page/bundle.js', __FILE__));
        }
    }


    public static function addES5VersionOfScript($tag, $handle, $source)
    {
        //we must use wp_enqueue_script!!!!
        if ('night-eye' === $handle) {
            $tag = "";
            $tag .= '<script type="module" src="' . $source . '"></script>';
            $tag .= '<script nomodule src="' . str_replace('bundle.js', 'bundle.es5.js', $source) . '"></script>';
        }

        return $tag;
    }

    public static function printOptions()
    {
        $optionsModel = OptionsModel::fromDB(OptionsModel::SLUG);
        echo "<script>"
            . "window.nightEyeOptions = " . \json_encode($optionsModel)
            . "</script>";
    }

    public static function hookHeadCSS()
    {
        if (SF::getCookieIntValue(SV::COOKIE_NAME_MODE) != SV::MODE_DARK) {
            return;
        }

        $loadingFilePath = plugin_dir_path(__FILE__) . '/Views/assets/v-public/css/inline/loading.css';

        $cssContent = file_get_contents($loadingFilePath, true);
        echo '<style>'. $cssContent . '</style>';
    }

    //Load function for
    public static function loadAdminScripts($hook)
    {
        switch ($hook) {
            case self::PAGE_TOP_PREFIX . self::PAGE_MAIN_ADMIN_ID:
            case self::PAGE_MAIN_ADMIN_ID:
                OptionsPage::loadScripts();
                break;
            default:
                return;
        }
    }
}

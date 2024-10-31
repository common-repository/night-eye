<?php

/**
 * Plugin Name: Night Eye - Dark Mode Plugin
 * Plugin URI: https://nighteye.app
 * Description: Night Eye enables a smooth dark mode of your site. It's easy, powerful, and your readers will love it. It keeps your privacy and allows customization.
 * Version: 1.0.2
 * Author: Promotino Ltd.
 * Author URI: https://promotino.com
 * Tags: dark, dark mode, wordpress dark mode, dark theme, dark background, background, night eye, wordpress night mode, night mode, brightness, color
 * Requires PHP: 7.1
 * Tested up to: 5.9
 * License: GPL v2 or later
 * License URI:https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: night-eye
 * */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Currently plugin version.
 * use SemVer - https://semver.org
 */
define('NIGHT_EYE_VERSION', '1.0.2');

require_once __DIR__ . '/vendor/autoload.php';

use NightEye\Main;

Main::init();

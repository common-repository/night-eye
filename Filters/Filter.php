<?php

namespace NightEye\Filters;

class Filter
{
    const API_NAMESPACE = 'night-eye/v1';

    public static function initCommon()
    {
        add_action('rest_api_init', function () {
            // Common
            // register_rest_route(self::API_NAMESPACE, 'image/get/', array(
            //     'methods' => 'GET',
            //     'callback' => array('ImageController', 'get'),
            // ));

            register_rest_route(self::API_NAMESPACE, 'general/updateStatus/', array(
                'methods' => 'POST',
                'callback' => array('NightEye\Controllers\GeneralController', 'updateStatus'),
            ));
            // End Common
        });
    }

    public static function initFront()
    {
        add_action('rest_api_init', function () {
            // Front End View Controller
            // register_rest_route(self::API_NAMESPACE, 'frontend/getAll/', array(
            //     'methods' => 'GET',
            //     'callback' => array('FrontController', 'getAll'),
            // ));
            // End Front End View Controller
        });
    }

    public static function initAdmin()
    {
        //localhost/wp-json/night-eye/v1/general/updateOptions/
        add_action('rest_api_init', function () {
            register_rest_route(self::API_NAMESPACE, 'general/updateOptions/', array(
                'methods' => 'POST',
                'callback' => array('NightEye\Controllers\GeneralController', 'updateOptions'),
                'args' => [
                    'json' => [
                        'required' => true,
                    ],
                ],
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },
            ));
        });
    }
}

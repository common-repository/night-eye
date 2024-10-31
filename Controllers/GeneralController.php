<?php

namespace NightEye\Controllers;

use NightEye\Models\Domain\OptionsModel;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class GeneralController
{
    public static function updateOptions(WP_REST_Request $request)
    {
        $parameters = $request->get_params();
        if (!isset($parameters['json'])) {
            return new WP_Error('Missing json data');
        }
        $jsonString = $parameters['json'];
        $json = OptionsModel::sanitizeJson($jsonString);

        if ($json == null) {
            return new WP_Error('Data is not valid');
        }

        OptionsModel::updateDB(OptionsModel::SLUG, $json);

        return new WP_REST_Response('updated', 200);
    }
}

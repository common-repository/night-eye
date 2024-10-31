<?php

namespace NightEye\Models\Domain;

use NightEye\Utilities\Constants\SV;
use stdClass;

class OptionsModel
{
    public const SLUG = "night_eye_options";

    private const STATUS = 'status';
    private const DESKTOP_POSITION = 'desktopPosition';
    private const MOBILE_POSITION = 'mobilePosition';

    public $status = "0";
    public $desktopPosition = "0";
    public $mobilePosition = "0";

    public static function getConsts()
    {
        $obj = new stdClass();

        $obj->status = self::STATUS;
        $obj->desktopPosition = self::DESKTOP_POSITION;
        $obj->mobilePosition = self::MOBILE_POSITION;

        return $obj;
    }


    public static function fromDB($name)
    {
        $dbData = get_option($name);
        if ($dbData == null || empty($dbData)) {
            $dbData = OptionsModel::getDefaults();
        } elseif (is_string($dbData)) {
            $dbData = json_decode($dbData);
        }

        $model = new OptionsModel();

        if (isset($dbData->status)) {
            $model->status = $dbData->status;
        }

        if (isset($dbData->desktopPosition)) {
            $model->desktopPosition = $dbData->desktopPosition;
        }

        if (isset($dbData->mobilePosition)) {
            $model->mobilePosition = $dbData->mobilePosition;
        }

        return $model;
    }

    public static function updateDB($name, $data)
    {
        if (!is_string($data)) {
            $data = json_encode($data);
        }

        update_option($name, $data);
    }

    public static function getDefaults()
    {
        return  new OptionsModel();
    }

    public static function isActive()
    {
        $optionsModel = self::fromDB(self::SLUG);
        return $optionsModel->status == SV::STATUS_ACTIVE;
    }

    public static function sanitizeJson($jsonString)
    {
        $json = json_decode($jsonString);

        if (isset($json->status)) {
            $json->status = intval(sanitize_key($json->status));
        } else {
            return null;
        }

        if (isset($json->desktopPosition)) {
            $json->desktopPosition = intval(sanitize_key($json->desktopPosition));
        } else {
            return null;
        }

        if (isset($json->mobilePosition)) {
            $json->mobilePosition = intval(sanitize_key($json->mobilePosition));
        } else {
            return null;
        }

        return $json;
    }
}

<?php

namespace NightEye\Utilities;

use NightEye\Utilities\Constants\SV;

class SF
{
    public static function getCookieIntValue($name)
    {
        if (isset($_COOKIE[$name])) {
            return intval(sanitize_key($_COOKIE[$name]));
        }
        return SV::NOT_EXISTS;
    }
}

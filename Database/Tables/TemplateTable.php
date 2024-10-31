<?php

namespace NightEye\DB\Tables;

class TemplateTable
{
    const TABLE_NAME = 'n_eye_template';

    const ID = 'id';
 

    public static function generateSQL()
    {
        return self::ID . " INT NOT NULL AUTO_INCREMENT,\n"
        . "PRIMARY KEY  (" . self::ID . ")";
    }

}

<?php

namespace NightEye\Models\Network\Template;

class TemplateReq
{
    public $id;
    

    public function __construct()
    {
    }

    public static function fromJSON($data)
    {
        $req = new TemplateReq();

        $req->id = intval($data['id']);
       
        return $req;
    }
}

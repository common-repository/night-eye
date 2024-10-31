<?php

namespace NightEye\Models\Network\Template;

use NightEye\Models\Domain\TemplateModel;


class TempalteResp
{
    public $id;

    public static function fromModel(TemplateModel $model)
    {
        $estateResp = new TemplateResp();

        $estateResp->id = $model->id;
     
        return $estateResp;
    }
}

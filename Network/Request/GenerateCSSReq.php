<?php

namespace NightEye\Network\Request;

use NightEye\Utilities\Helpers\Payload;

class GenerateCSSReq
{

	public $url;

	public static function fromJSON($json)
	{
		$req = new GenerateCSSReq();
		$json = $req->json;

		$req->url = strval($json->url);

		return $req;
	}
}

<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Ipe\Sdk\Facades\SmsIr;


class SMS
{
    public function send_code(){
        $mobile = "9040724357"; // شماره موبایل گیرنده
        $templateId = 192206; // شناسه الگو
        $parameters = [
            [
                "name" => "Code",
                "value" => "12345"
            ]
        ];

        $response = SmsIr::verifySend($mobile, $templateId, $parameters);
        return $response;
    } 
}

<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\IsClosed;
use Illuminate\Support\Facades\Cache;

class CafeController
{
    public function toggleStatus(){
        $cafeStat = IsClosed::first();
        if (!$cafeStat) {
            $cafeStat = IsClosed::create(['is_closed' => false]);
        }

        $cafeStat->is_closed = !$cafeStat->is_closed;
        $cafeStat->save();

        Cache::forget('cafe:is_closed');

        $message = $cafeStat->is_closed ? 'cafe is closed' : 'cafe is open';

        return response()->json(['message' => $message]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\IsClosed;
use Illuminate\Support\Facades\Cache;

class CafeController
{
    public function status()
    {
        $cafeStat = IsClosed::first();
        if (!$cafeStat) {
            $cafeStat = IsClosed::create(['is_closed' => false]);
        }

        return response()->json([
            'is_closed' => $cafeStat->is_closed,
        ]);
    }

    public function toggleStatus(){
        $cafeStat = IsClosed::first();
        if (!$cafeStat) {
            $cafeStat = IsClosed::create(['is_closed' => false]);
        }

        $cafeStat->is_closed = !$cafeStat->is_closed;
        $cafeStat->save();

        Cache::forget('cafe:is_closed');

        return response()->json([
            'is_closed' => $cafeStat->is_closed,
            'message' => $cafeStat->is_closed ? 'کافه بسته شد' : 'کافه باز شد',
        ]);
    }
}

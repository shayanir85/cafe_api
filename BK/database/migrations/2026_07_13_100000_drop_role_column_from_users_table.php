<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        $users = DB::table('users')->whereNotNull('role')->get(['id', 'role']);
        $roles = DB::table('roles')->whereIn('name', ['super_admin', 'admin', 'user'])->get(['id', 'name'])->keyBy('name');

        foreach ($users as $user) {
            if (isset($roles[$user->role])) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $roles[$user->role]->id,
                    'model_type' => 'App\Models\User',
                    'model_id' => $user->id,
                ]);
            }
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable();
        });
    }
};

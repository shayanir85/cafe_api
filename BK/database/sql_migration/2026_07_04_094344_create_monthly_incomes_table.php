<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('monthly_incomes', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('income');
            $table->bigInteger('year');
            $table->bigInteger('month');
            $table->timestamp('recorded_at');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_incomes');
    }
};

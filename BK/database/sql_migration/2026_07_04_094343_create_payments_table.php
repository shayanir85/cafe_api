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

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('order_id');
            $table->foreign('order_id')->references('id')->on('orders');
            $table->bigInteger('authority')->unique();
            $table->enum('status', ["pending","paid","failed"]);
            $table->geometry('reference_id', 'linestring');
            $table->bigInteger('amount');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

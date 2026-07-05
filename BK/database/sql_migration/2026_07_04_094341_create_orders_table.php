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

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->geometry('customer_name', 'linestring');
            $table->geometry('customer_phone', 'linestring');
            $table->geometry('table_number', 'linestring')->nullable();
            $table->enum('status', [""]);
            $table->bigInteger('total_amount');
            $table->text('notes')->nullable();
            $table->boolean('is_out')->default(false);
            $table->text('address')->nullable();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

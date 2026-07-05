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

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->bigInteger('price')->nullable();
            $table->text('image_url')->nullable();
            $table->text('description');
            $table->boolean('is_available');
            $table->bigInteger('category_id');
            $table->foreign('category_id')->references('id')->on('categories');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};

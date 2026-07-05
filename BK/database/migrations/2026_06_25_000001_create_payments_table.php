<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->string('authority')->unique();

            $table->enum('status', ['pending', 'paid', 'failed'])
                ->default('pending');

            $table->string('reference_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->timestamps();

            $table->index('authority');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

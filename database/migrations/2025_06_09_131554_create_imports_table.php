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
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('party_id')->constrained()->onDelete('cascade');
            $table->string('container_no')->nullable();
            $table->date('movement_date')->nullable();
            $table->string('bl_no')->nullable();
            $table->date('bl_date')->nullable();
            $table->string('be_no')->nullable();
            $table->date('be_date')->nullable();
            $table->double('bl_weight', 15, 2)->nullable();
            $table->double('weigh_bridge_weight', 15, 2)->nullable();
            $table->string('type')->default('container'); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};

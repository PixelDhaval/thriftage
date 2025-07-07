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
        Schema::table('items', function (Blueprint $table) {
            // Remove unique constraint from the 'name' column
            $table->dropUnique(['name']);
        });

        Schema::table('weights', function (Blueprint $table) {
            // Remove unique constraint from the 'weight' column
            $table->dropUnique(['weight']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items_weights', function (Blueprint $table) {
            //
        });
    }
};

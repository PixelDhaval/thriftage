<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared("
            CREATE TRIGGER update_import_stock_on_insert_import_bags
            AFTER INSERT ON import_bags
            FOR EACH ROW
            BEGIN
                UPDATE import_stocks
                SET quantity = quantity + 1
                WHERE party_id = NEW.party_id AND weight_id = NEW.weight_id;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_import_stock_on_delete_import_bags
            AFTER DELETE ON import_bags
            FOR EACH ROW
            BEGIN
                UPDATE import_stocks
                SET quantity = quantity - 1
                WHERE party_id = OLD.party_id AND weight_id = OLD.weight_id;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS update_import_stock_on_insert_import_bags");
        DB::unprepared("DROP TRIGGER IF EXISTS update_import_stock_on_delete_import_bags");
    }
};

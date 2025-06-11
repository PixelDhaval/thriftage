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
        // Drop existing triggers to avoid errors on re-run
        $this->down();

        DB::unprepared("
            CREATE TRIGGER create_import_stocks_on_insert_parties
            AFTER INSERT ON parties
            FOR EACH ROW
            BEGIN
                INSERT INTO import_stocks (party_id, weight_id, quantity)
                SELECT NEW.id, w.id, 0
                FROM weights w
                WHERE w.id IS NOT NULL;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER create_in_process_stocks_on_insert_parties
            AFTER INSERT ON parties
            FOR EACH ROW
            BEGIN
                INSERT INTO in_process_stocks (party_id, weight) VALUES (NEW.id, 0);
            END
        ");

        DB::unprepared("
            CREATE TRIGGER create_import_stocks_on_insert_weights
            AFTER INSERT ON weights
            FOR EACH ROW
            BEGIN
                INSERT INTO import_stocks (party_id, weight_id, quantity)
                SELECT p.id, NEW.id, 0
                FROM parties p
                WHERE p.id IS NOT NULL;
            END
        ");


        DB::unprepared("
            CREATE TRIGGER create_export_stocks_on_insert_items
            AFTER INSERT ON items
            FOR EACH ROW
            BEGIN
                INSERT INTO export_stocks (item_id, grade_id, weight_id, quantity)
                SELECT NEW.id, g.id, w.id, 0
                FROM grades g CROSS JOIN weights w
                WHERE g.id IS NOT NULL AND w.id IS NOT NULL;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER create_export_stocks_on_insert_grades
            AFTER INSERT ON grades
            FOR EACH ROW
            BEGIN
                INSERT INTO export_stocks (item_id, grade_id, weight_id, quantity)
                SELECT i.id, NEW.id, w.id, 0
                FROM items i CROSS JOIN weights w
                WHERE i.id IS NOT NULL AND w.id IS NOT NULL;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER create_export_stocks_on_insert_weights_for_export
            AFTER INSERT ON weights
            FOR EACH ROW
            BEGIN
                INSERT INTO export_stocks (item_id, grade_id, weight_id, quantity)
                SELECT i.id, g.id, NEW.id, 0
                FROM items i CROSS JOIN grades g
                WHERE i.id IS NOT NULL AND g.id IS NOT NULL;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS create_import_stocks_on_insert_parties");
        DB::unprepared("DROP TRIGGER IF EXISTS create_in_process_stocks_on_insert_parties");
        DB::unprepared("DROP TRIGGER IF EXISTS create_import_stocks_on_insert_weights");
        DB::unprepared("DROP TRIGGER IF EXISTS create_in_process_stocks_on_insert_weights");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_items");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_grades");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_weights_for_export");
    }
};

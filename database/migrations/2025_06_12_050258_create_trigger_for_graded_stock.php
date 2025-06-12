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
            CREATE TRIGGER create_graded_stock_on_insert_items
            AFTER INSERT ON items
            FOR EACH ROW
            BEGIN
                INSERT INTO graded_stocks (item_id, grade_id, weight)
                SELECT NEW.id, g.id, 0
                FROM grades g
                WHERE g.id IS NOT NULL;
            END");

        DB::unprepared("
            CREATE TRIGGER create_graded_stock_on_insert_grades
            AFTER INSERT ON grades
            FOR EACH ROW
            BEGIN
                INSERT INTO graded_stocks (item_id, grade_id, weight)
                SELECT i.id, NEW.id, 0
                FROM items i
                WHERE i.id IS NOT NULL;
            END");

        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_insert_graded_items_pools
            AFTER INSERT ON graded_items_pools
            FOR EACH ROW
            BEGIN
                UPDATE graded_stocks
                SET weight = weight + NEW.weight
                WHERE item_id = NEW.item_id AND grade_id = NEW.grade_id;

                UPDATE in_process_stocks
                SET weight = weight - NEW.weight
                WHERE party_id = NEW.party_id;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_update_graded_items_pools
            AFTER UPDATE ON graded_items_pools
            FOR EACH ROW
            BEGIN
                UPDATE graded_stocks
                SET weight = weight + (NEW.weight - OLD.weight)
                WHERE item_id = NEW.item_id AND grade_id = NEW.grade_id;

                UPDATE in_process_stocks
                SET weight = weight - (NEW.weight - OLD.weight)
                WHERE party_id = NEW.party_id;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_delete_graded_items_pools
            AFTER DELETE ON graded_items_pools
            FOR EACH ROW
            BEGIN
                UPDATE graded_stocks
                SET weight = weight - OLD.weight
                WHERE item_id = OLD.item_id AND grade_id = OLD.grade_id;

                UPDATE in_process_stocks
                SET weight = weight + OLD.weight
                WHERE party_id = OLD.party_id;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("
            DROP TRIGGER IF EXISTS create_graded_stock_on_insert_items
        ");
        DB::unprepared("
            DROP TRIGGER IF EXISTS create_graded_stock_on_insert_grades
        ");
        DB::unprepared("
            DROP TRIGGER IF EXISTS update_graded_stock_on_insert_graded_items_pools
        ");
        DB::unprepared("
            DROP TRIGGER IF EXISTS update_graded_stock_on_update_graded_items_pools
        ");
        DB::unprepared("
            DROP TRIGGER IF EXISTS update_graded_stock_on_delete_graded_items_pools
        ");
    }
};

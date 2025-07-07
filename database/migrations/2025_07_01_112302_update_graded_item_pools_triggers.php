<?php

namespace Database\Migrations;

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
        // Drop existing triggers first
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_insert_graded_items_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_update_graded_items_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_delete_graded_items_pools");

        // Create trigger for INSERT operations
        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_insert_graded_items_pools
            AFTER INSERT ON graded_items_pools
            FOR EACH ROW
            BEGIN
                DECLARE wght_tp VARCHAR(10);
                SELECT weight_type INTO wght_tp FROM sections WHERE id = NEW.section_id;

                IF wght_tp = 'kg' THEN
                    UPDATE graded_stocks
                    SET weight = weight + NEW.weight
                    WHERE section_id = NEW.section_id AND grade_id = NEW.grade_id;
                ELSE 
                    UPDATE graded_stocks
                    SET weight = weight + NEW.weight, pair = pair + NEW.pair
                    WHERE section_id = NEW.section_id AND grade_id = NEW.grade_id;
                END IF;

                UPDATE in_process_stocks
                SET weight = weight - NEW.weight
                WHERE party_id = NEW.party_id;
            END
        ");

        // Create trigger for UPDATE operations
        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_update_graded_items_pools
            AFTER UPDATE ON graded_items_pools
            FOR EACH ROW
            BEGIN
                DECLARE wght_tp VARCHAR(10);
                SELECT weight_type INTO wght_tp FROM sections WHERE id = NEW.section_id;
                
                IF wght_tp = 'kg' THEN
                    UPDATE graded_stocks
                    SET weight = weight + (NEW.weight - OLD.weight)
                    WHERE section_id = NEW.section_id AND grade_id = NEW.grade_id;
                ELSE 
                    UPDATE graded_stocks
                    SET weight = weight + (NEW.weight - OLD.weight), pair = pair + (NEW.pair - OLD.pair)
                    WHERE section_id = NEW.section_id AND grade_id = NEW.grade_id;
                END IF;

                UPDATE in_process_stocks
                SET weight = weight - (NEW.weight - OLD.weight)
                WHERE party_id = NEW.party_id;
            END
        ");

        // Create trigger for DELETE operations
        DB::unprepared("
            CREATE TRIGGER update_graded_stock_on_delete_graded_items_pools
            AFTER DELETE ON graded_items_pools
            FOR EACH ROW
            BEGIN
                DECLARE wght_tp VARCHAR(10);
                SELECT weight_type INTO wght_tp FROM sections WHERE id = OLD.section_id;
                
                IF wght_tp = 'kg' THEN
                    UPDATE graded_stocks
                    SET weight = weight - OLD.weight
                    WHERE section_id = OLD.section_id AND grade_id = OLD.grade_id;
                ELSE
                    UPDATE graded_stocks
                    SET weight = weight - OLD.weight, pair = pair - OLD.pair
                    WHERE section_id = OLD.section_id AND grade_id = OLD.grade_id;
                END IF;

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
        // Drop triggers when rolling back
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_insert_graded_items_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_update_graded_items_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_stock_on_delete_graded_items_pools");
    }
};

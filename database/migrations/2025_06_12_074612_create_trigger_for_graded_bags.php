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
            CREATE TRIGGER update_graded_bags_on_insert_graded_bags_pools
            AFTER INSERT ON graded_bags_pools
            FOR EACH ROW
            BEGIN
                UPDATE export_stocks
                SET quantity = quantity + 1
                WHERE item_id = NEW.item_id AND grade_id = NEW.grade_id AND weight_id = NEW.weight_id;

                UPDATE graded_stocks
                SET weight = weight - (SELECT weight FROM weights WHERE id = NEW.weight_id)
                WHERE item_id = NEW.item_id AND grade_id = NEW.grade_id;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_graded_bags_on_delete_graded_bags_pools
            AFTER DELETE ON graded_bags_pools
            FOR EACH ROW
            BEGIN
                UPDATE export_stocks
                SET quantity = quantity - 1
                WHERE  item_id = OLD.item_id AND grade_id = OLD.grade_id AND weight_id = OLD.weight_id;

                UPDATE graded_stocks
                SET weight = weight + (SELECT weight FROM weights WHERE id = OLD.weight_id)
                WHERE item_id = OLD.item_id AND grade_id = OLD.grade_id;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_insert_graded_bags_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_delete_graded_bags_pools");
    }
};

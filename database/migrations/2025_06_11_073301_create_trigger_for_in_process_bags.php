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
        // Drop existing triggers first
        DB::unprepared("DROP TRIGGER IF EXISTS update_in_process_bags_on_update_import_bags");
        DB::unprepared("DROP TRIGGER IF EXISTS update_in_process_bags_on_delete_import_bags");

        DB::unprepared("
            CREATE TRIGGER update_in_process_bags_on_update_import_bags
            AFTER UPDATE ON import_bags
            FOR EACH ROW
            BEGIN
                DECLARE import_weight DOUBLE;
                SET import_weight = (SELECT weight FROM weights WHERE id = NEW.weight_id);

                UPDATE in_process_stocks
                SET weight = weight + (CASE
                    WHEN NEW.status = 'opened' AND OLD.status = 'unopened' THEN import_weight
                    WHEN NEW.status = 'unopened' AND OLD.status = 'opened' THEN -import_weight
                    ELSE 0
                END)
                WHERE party_id = NEW.party_id;

                UPDATE import_stocks
                SET quantity = quantity - (CASE
                    WHEN NEW.status = 'opened' AND OLD.status = 'unopened' THEN 1
                    WHEN NEW.status = 'unopened' AND OLD.status = 'opened' THEN -1
                    ELSE 0
                END)
                WHERE party_id = NEW.party_id AND weight_id = NEW.weight_id;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_in_process_bags_on_delete_import_bags
            AFTER DELETE ON import_bags
            FOR EACH ROW
            BEGIN
                DECLARE import_weight DOUBLE;
                SET import_weight = (SELECT weight FROM weights WHERE id = OLD.weight_id);

                UPDATE in_process_stocks
                SET weight = weight - (CASE
                    WHEN OLD.status = 'opened' THEN import_weight
                    WHEN OLD.status = 'unopened' THEN 0
                    ELSE 0
                END)
                WHERE party_id = OLD.party_id;

                UPDATE import_stocks
                SET quantity = quantity - (CASE
                    WHEN OLD.status = 'opened' THEN 0
                    WHEN OLD.status = 'unopened' THEN 1
                    ELSE 0
                END)
                WHERE party_id = OLD.party_id AND weight_id = OLD.weight_id;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS update_in_process_bags_on_update_import_bags");
        DB::unprepared("DROP TRIGGER IF EXISTS update_in_process_bags_on_delete_import_bags");
    }
};

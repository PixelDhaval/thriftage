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
        Schema::table('sections', function (Blueprint $table) {
            $table->string('weight_type')->default('kg')->after('name');
        });

        Schema::table('weights', function (Blueprint $table) {
            $table->string('weight_type')->default('kg')->after('weight');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('grade_id')->constrained('grades')->onDelete('cascade')->after('name');
            $table->foreignId('default_weight_id')->nullable()->constrained('weights')->nullOnDelete()->after('grade_id');
        });

        Schema::table('graded_items_pools', function (Blueprint $table) {
            $table->integer('pair')->default(0)->after('weight');
        });

        Schema::table('graded_stocks', function (Blueprint $table) {
            $table->integer('pair')->default(0)->after('weight');
        });

        Schema::table('graded_bags_pools', function (Blueprint $table) {
            $table->double('weight')->default(0)->after('grade_id');
        });

        Schema::table('export_stocks', function (Blueprint $table) {
            $table->dropForeign(['grade_id']    );
            $table->dropColumn('grade_id');
        });

        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_items");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_grades");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_weights_for_export");

        DB::unprepared("
            CREATE TRIGGER create_export_stocks_on_insert_items
            AFTER INSERT ON items
            FOR EACH ROW
            BEGIN
                INSERT INTO export_stocks (item_id, weight_id, quantity)
                SELECT NEW.id, w.id, 0
                FROM weights w
                WHERE w.id IS NOT NULL;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER create_export_stocks_on_insert_weights_for_export
            AFTER INSERT ON weights
            FOR EACH ROW
            BEGIN
                INSERT INTO export_stocks (item_id, weight_id, quantity)
                SELECT i.id, NEW.id, 0
                FROM items i
                WHERE i.id IS NOT NULL;
            END
        ");

        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_insert_graded_bags_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_delete_graded_bags_pools");

        DB::unprepared("
            CREATE TRIGGER update_graded_bags_on_insert_graded_bags_pools
            AFTER INSERT ON graded_bags_pools
            FOR EACH ROW
            BEGIN
                DECLARE sec_id INT;
                DECLARE grd_id INT;
                DECLARE weight_type VARCHAR(10);
                SELECT section_id INTO sec_id, grade_id INTO grd_id FROM items WHERE id = NEW.item_id;
                SELECT weight_type INTO weight_type FROM weights WHERE id = NEW.weight_id;
                
                UPDATE export_stocks
                SET quantity = quantity + 1
                WHERE item_id = NEW.item_id AND weight_id = NEW.weight_id;

                IF weight_type = 'kg' THEN

                    UPDATE graded_stocks
                    SET weight = weight - (SELECT weight FROM weights WHERE id = NEW.weight_id)
                    WHERE section_id = sec_id AND grade_id = grd_id;

                ELSE

                    UPDATE graded_stocks
                    SET pair = pair - (SELECT weight FROM weights WHERE id = NEW.weight_id),
                    weight = weight - NEW.weight
                    WHERE section_id = sec_id AND grade_id = grd_id;

                END IF;

            END
        ");

        DB::unprepared("
            CREATE TRIGGER update_graded_bags_on_delete_graded_bags_pools
            AFTER DELETE ON graded_bags_pools
            FOR EACH ROW
            BEGIN
                DECLARE sec_id INT;
                DECLARE grd_id INT;
                DECLARE weight_type VARCHAR(10);
                SELECT section_id INTO sec_id, grade_id INTO grd_id FROM items WHERE id = OLD.item_id;
                SELECT weight_type INTO weight_type FROM weights WHERE id = OLD.weight_id;
                
                UPDATE export_stocks
                SET quantity = quantity - 1
                WHERE  item_id = OLD.item_id AND weight_id = OLD.weight_id;

                IF weight_type = 'kg' THEN

                    UPDATE graded_stocks
                    SET weight = weight + (SELECT weight FROM weights WHERE id = OLD.weight_id)
                    WHERE section_id = sec_id AND grade_id = grd_id;

                ELSE

                    UPDATE graded_stocks
                    SET pair = pair + (SELECT weight FROM weights WHERE id = OLD.weight_id),
                    weight = weight + OLD.weight
                    WHERE section_id = sec_id AND grade_id = grd_id;

                END IF;
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropColumn('weight_type');
        });

        Schema::table('weights', function (Blueprint $table) {
            $table->dropColumn('weight_type');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['grade_id']);
            $table->dropColumn('grade_id');
            $table->dropForeign(['default_weight_id']);
            $table->dropColumn('default_weight_id');
        });

        Schema::table('graded_items_pools', function (Blueprint $table) {
            $table->dropColumn('pair');
        });

        Schema::table('graded_stocks', function (Blueprint $table) {
            $table->dropColumn('pair');
        });

        Schema::table('graded_bags_pools', function (Blueprint $table) {
            $table->dropColumn('weight');
        });

        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_items");
        DB::unprepared("DROP TRIGGER IF EXISTS create_export_stocks_on_insert_weights_for_export");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_insert_graded_bags_pools");
        DB::unprepared("DROP TRIGGER IF EXISTS update_graded_bags_on_delete_graded_bags_pools");
    }
};

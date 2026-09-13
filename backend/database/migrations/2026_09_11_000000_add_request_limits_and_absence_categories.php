<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            $table->unsignedSmallInteger('monthly_permission_limit')->nullable()->after('description');
            $table->unsignedSmallInteger('monthly_absence_limit')->nullable()->after('monthly_permission_limit');
        });

        Schema::table('workers', function (Blueprint $table) {
            $table->unsignedSmallInteger('monthly_permission_limit')->nullable()->after('phone');
            $table->unsignedSmallInteger('monthly_absence_limit')->nullable()->after('monthly_permission_limit');
        });

        Schema::table('request_categories', function (Blueprint $table) {
            $table->boolean('is_absence')->default(false)->after('allow_approved_cancellation');
        });

        DB::table('request_categories')->where('name', 'like', '%falta%')->update(['is_absence' => true]);
    }

    public function down(): void
    {
        Schema::table('request_categories', fn (Blueprint $table) => $table->dropColumn('is_absence'));
        Schema::table('workers', fn (Blueprint $table) => $table->dropColumn(['monthly_permission_limit', 'monthly_absence_limit']));
        Schema::table('areas', fn (Blueprint $table) => $table->dropColumn(['monthly_permission_limit', 'monthly_absence_limit']));
    }
};

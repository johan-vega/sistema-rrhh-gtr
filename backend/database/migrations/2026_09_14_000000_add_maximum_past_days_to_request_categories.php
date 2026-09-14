<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('request_categories', function (Blueprint $table) {
            $table->unsignedSmallInteger('maximum_past_days')->default(7)->after('minimum_notice_days');
        });
    }

    public function down(): void
    {
        Schema::table('request_categories', function (Blueprint $table) {
            $table->dropColumn('maximum_past_days');
        });
    }
};

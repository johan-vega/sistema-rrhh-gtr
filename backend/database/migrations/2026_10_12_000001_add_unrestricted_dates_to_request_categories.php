<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('request_categories', function (Blueprint $table) {
            // Opt-in: conservar las reglas de fechas de las categorías existentes.
            $table->boolean('unrestricted_dates')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('request_categories', fn (Blueprint $table) => $table->dropColumn('unrestricted_dates'));
    }
};

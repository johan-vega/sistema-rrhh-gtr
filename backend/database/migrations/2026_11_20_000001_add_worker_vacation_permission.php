<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\{DB, Schema};

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workers', fn (Blueprint $table) => $table->boolean('can_request_vacation')->default(true));
        Schema::table('request_categories', fn (Blueprint $table) => $table->boolean('is_vacation')->default(false));
        // Identificar una sola vez la categoría existente, sin duplicarla ni depender
        // de su nombre en las validaciones futuras.
        DB::table('request_categories')->whereRaw('LOWER(TRIM(name)) = ?', ['vacaciones'])->update(['is_vacation' => true]);
    }

    public function down(): void
    {
        Schema::table('request_categories', fn (Blueprint $table) => $table->dropColumn('is_vacation'));
        Schema::table('workers', fn (Blueprint $table) => $table->dropColumn('can_request_vacation'));
    }
};

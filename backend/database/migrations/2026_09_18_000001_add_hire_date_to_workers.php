<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workers', function (Blueprint $table) {
            // Sin fecha automática para los trabajadores que ya existen.
            $table->date('hire_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('workers', fn (Blueprint $table) => $table->dropColumn('hire_date'));
    }
};

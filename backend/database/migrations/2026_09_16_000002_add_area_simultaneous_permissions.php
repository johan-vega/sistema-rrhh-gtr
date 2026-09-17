<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('areas', fn (Blueprint $table) => $table->unsignedInteger('max_simultaneous_permissions')->nullable());
    }
    public function down(): void {
        Schema::table('areas', fn (Blueprint $table) => $table->dropColumn('max_simultaneous_permissions'));
    }
};

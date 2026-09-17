<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('workers', function (Blueprint $table) {
            $table->string('dni_address')->nullable();
            $table->string('emergency_phone', 30)->nullable();
            $table->string('worker_type', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('photo_path')->nullable();
        });
    }
    public function down(): void {
        Schema::table('workers', fn (Blueprint $table) => $table->dropColumn(['dni_address', 'emergency_phone', 'worker_type', 'birth_date', 'photo_path']));
    }
};

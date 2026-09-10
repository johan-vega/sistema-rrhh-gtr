<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });
        Schema::table('users', fn (Blueprint $t) => $t->foreignId('role_id')->nullable()->after('id')->constrained()->restrictOnDelete());
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->string('dni', 20)->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->foreignId('area_id')->constrained()->restrictOnDelete();
            $table->foreignId('position_id')->constrained()->restrictOnDelete();
            $table->string('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->boolean('active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('request_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('requires_document')->default(false);
            $table->unsignedSmallInteger('minimum_notice_days')->default(0);
            $table->boolean('allow_approved_cancellation')->default(false);
            $table->boolean('active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('labor_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->constrained('request_categories')->restrictOnDelete();
            $table->date('start_date')->index();
            $table->date('end_date')->index();
            $table->text('reason');
            $table->string('status', 15)->default('PENDIENTE')->index();
            $table->timestamp('requested_at');
            $table->timestamp('responded_at')->nullable();
            $table->text('hr_observation')->nullable();
            $table->timestamps();
            $table->index(['worker_id', 'status']);
        });
        Schema::create('request_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labor_request_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('stored_name');
            $table->string('path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
        Schema::create('request_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('labor_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['labor_request_id', 'created_at']);
        });
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('request_histories');
        Schema::dropIfExists('request_documents');
        Schema::dropIfExists('labor_requests');
        Schema::dropIfExists('request_categories');
        Schema::dropIfExists('workers');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('areas');
        Schema::table('users', fn (Blueprint $t) => $t->dropConstrainedForeignId('role_id'));
        Schema::dropIfExists('roles');
    }
};

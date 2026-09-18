<?php

namespace Tests\Feature;

use App\Models\{Area, LaborRequest, Position, RequestCategory, Role, User, Worker};
use App\Notifications\LaborRequestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Storage};
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkerDeletionTest extends TestCase
{
    use RefreshDatabase;
    private User $hr;
    private Worker $worker;

    protected function setUp(): void
    {
        parent::setUp();
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        $hr = Role::create(['code' => Role::HR, 'name' => 'RRHH']);
        $role = Role::create(['code' => Role::WORKER, 'name' => 'Trabajador']);
        $this->hr = User::factory()->create(['role_id' => $hr->id]);
        $this->worker = Worker::create(['user_id' => User::factory()->create(['role_id' => $role->id])->id,
            'dni' => '12345678', 'first_name' => 'Ana', 'last_name' => 'Pérez', 'photo_path' => 'worker-photos/ana.png',
            'area_id' => Area::create(['name' => 'Producción'])->id, 'position_id' => Position::create(['name' => 'Operario'])->id]);
        Storage::disk('s3')->put('worker-photos/ana.png', 'foto');
        Sanctum::actingAs($this->hr);
    }

    public function test_hr_deletes_worker_account_photo_and_access_without_affecting_other_users(): void
    {
        $user = $this->worker->user;
        $user->createToken('eliminar');
        $hrToken = $this->hr->createToken('conservar')->accessToken;
        $user->notify(new LaborRequestNotification('PRUEBA', 999, 'Eliminar'));
        $this->hr->notify(new LaborRequestNotification('PRUEBA', 999, 'Conservar'));
        DB::table('sessions')->insert(['id' => 'sesion-prueba', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'prueba']);
        Storage::disk('s3')->put('worker-photos/otro.png', 'conservar');
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseMissing('workers', ['id' => $this->worker->id]);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertSame(0, $user->tokens()->count());
        $this->assertSame(0, $user->notifications()->count());
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $hrToken->id]);
        $this->assertSame(1, $this->hr->notifications()->count());
        $this->assertDatabaseHas('areas', ['id' => $this->worker->area_id]);
        Storage::disk('s3')->assertMissing('worker-photos/ana.png');
        Storage::disk('s3')->assertExists('worker-photos/otro.png');
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertNotFound();
    }

    public function test_requests_in_any_status_prevent_deleting_worker_or_photo(): void
    {
        $category = RequestCategory::create(['name' => 'Permiso']);
        $request = LaborRequest::create(['worker_id' => $this->worker->id, 'category_id' => $category->id,
            'start_date' => today(), 'end_date' => today(), 'reason' => 'Conservar', 'status' => 'PENDIENTE', 'requested_at' => now()]);
        foreach (['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'] as $status) {
            $request->update(['status' => $status]);
            $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertUnprocessable()->assertJsonValidationErrors('worker');
            $this->assertDatabaseHas('workers', ['id' => $this->worker->id]);
            $this->assertDatabaseHas('users', ['id' => $this->worker->user_id]);
            $this->assertDatabaseHas('labor_requests', ['id' => $request->id, 'status' => $status]);
            Storage::disk('s3')->assertExists('worker-photos/ana.png');
        }
    }

    public function test_worker_cannot_delete_worker_and_hr_accounts_are_protected(): void
    {
        Sanctum::actingAs($this->worker->user);
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertForbidden();
        Sanctum::actingAs($this->hr);
        $this->worker->update(['user_id' => $this->hr->id]);
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $this->hr->id]);
    }

    public function test_storage_failure_keeps_database_for_retry(): void
    {
        Storage::shouldReceive('disk')->with('s3')->andReturnSelf();
        Storage::shouldReceive('exists')->with('worker-photos/ana.png')->andReturn(true);
        Storage::shouldReceive('delete')->with('worker-photos/ana.png')->andReturn(false);
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertStatus(503);
        $this->assertDatabaseHas('workers', ['id' => $this->worker->id]);
        $this->assertDatabaseHas('users', ['id' => $this->worker->user_id]);
    }

    public function test_missing_photo_can_be_deleted_but_out_of_scope_path_cannot(): void
    {
        Storage::disk('s3')->put('request-documents/1/private.pdf', 'conservar');
        $this->worker->update(['photo_path' => 'request-documents/1/private.pdf']);
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertStatus(503);
        Storage::disk('s3')->assertExists('request-documents/1/private.pdf');
        $this->worker->update(['photo_path' => 'worker-photos/ausente.png']);
        $this->deleteJson("/api/hr/workers/{$this->worker->id}")->assertOk();
    }
}

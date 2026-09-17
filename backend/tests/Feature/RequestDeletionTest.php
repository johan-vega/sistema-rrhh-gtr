<?php

namespace Tests\Feature;

use App\Models\{Area, LaborRequest, Position, RequestCategory, Role, User, Worker};
use App\Notifications\LaborRequestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RequestDeletionTest extends TestCase
{
    use RefreshDatabase;

    private User $hr;
    private Worker $worker;
    private RequestCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        $hrRole = Role::create(['code' => Role::HR, 'name' => 'RRHH']);
        $workerRole = Role::create(['code' => Role::WORKER, 'name' => 'Trabajador']);
        $this->hr = User::factory()->create(['role_id' => $hrRole->id]);
        $user = User::factory()->create(['role_id' => $workerRole->id]);
        $this->worker = Worker::create(['user_id' => $user->id, 'dni' => '12345678', 'first_name' => 'Ana', 'last_name' => 'Pérez',
            'area_id' => Area::create(['name' => 'Producción'])->id,
            'position_id' => Position::create(['name' => 'Operario'])->id]);
        $this->category = RequestCategory::create(['name' => 'Permiso']);
        Sanctum::actingAs($this->hr);
    }

    private function request(string $status = 'PENDIENTE'): LaborRequest
    {
        return LaborRequest::create(['worker_id' => $this->worker->id, 'category_id' => $this->category->id,
            'start_date' => today()->addDay(), 'end_date' => today()->addDays(2),
            'reason' => 'Prueba eliminación', 'status' => $status, 'requested_at' => now()]);
    }

    private function document(LaborRequest $request, ?string $path = null)
    {
        $path ??= "request-documents/{$request->id}/sustento.pdf";
        Storage::disk('s3')->put($path, 'PDF de prueba');
        return $request->documents()->create(['path' => $path, 'original_name' => 'Certificado.pdf',
            'stored_name' => 'sustento.pdf', 'mime_type' => 'application/pdf', 'size' => 13]);
    }

    public function test_hr_permanently_deletes_any_status_and_only_its_files_history_and_notifications(): void
    {
        $other = $this->request();
        $otherDocument = $this->document($other);
        $this->hr->notify(new LaborRequestNotification('NUEVA_SOLICITUD', $other->id, 'Conservar'));
        foreach (['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'] as $status) {
            $request = $this->request($status);
            $document = $this->document($request);
            $request->histories()->create(['user_id' => $this->hr->id, 'action' => 'CREADA']);
            $this->hr->notify(new LaborRequestNotification('NUEVA_SOLICITUD', $request->id, 'Eliminar'));
            $this->worker->user->notify(new LaborRequestNotification('SOLICITUD_CREADA', $request->id, 'Eliminar'));
            $this->deleteJson("/api/hr/requests/{$request->id}")->assertOk()->assertJsonPath('success', true);
            $this->assertDatabaseMissing('labor_requests', ['id' => $request->id]);
            $this->assertDatabaseMissing('request_documents', ['id' => $document->id]);
            $this->assertDatabaseMissing('request_histories', ['labor_request_id' => $request->id]);
            Storage::disk('s3')->assertMissing($document->path);
            $this->getJson("/api/hr/requests/{$request->id}")->assertNotFound();
            $this->getJson("/api/hr/requests/{$request->id}/documents/{$document->id}")->assertNotFound();
            $this->assertDatabaseCount('notifications', 1);
        }
        Storage::disk('s3')->assertExists($otherDocument->path);
        $this->assertDatabaseHas('labor_requests', ['id' => $other->id]);
        $this->assertDatabaseHas('workers', ['id' => $this->worker->id]);
        $this->getJson('/api/hr/reports/requests')->assertJsonPath('data.summary.total', 1);
        $this->getJson('/api/hr/dashboard')->assertJsonPath('data.approved', 0);
        $this->getJson('/api/hr/calendar')->assertJsonCount(0, 'data');
    }

    public function test_worker_cannot_delete_and_repeated_delete_returns_not_found(): void
    {
        $request = $this->request();
        Sanctum::actingAs($this->worker->user);
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertForbidden();
        $this->assertDatabaseHas('labor_requests', ['id' => $request->id]);
        Sanctum::actingAs($this->hr);
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertOk();
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertNotFound();
    }

    public function test_storage_failure_is_reported_and_records_remain_for_retry(): void
    {
        $request = $this->request();
        $document = $this->document($request);
        $fake = Storage::disk('s3');
        $disk = \Mockery::mock(\Illuminate\Filesystem\FilesystemAdapter::class);
        $disk->shouldReceive('delete')->once()->with($document->path)->andReturn(false);
        Storage::set('s3', $disk);
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertStatus(503)->assertJsonPath('success', false);
        $this->assertDatabaseHas('labor_requests', ['id' => $request->id]);
        $this->assertDatabaseHas('request_documents', ['id' => $document->id]);
        Storage::set('s3', $fake);
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertOk();
        $this->assertDatabaseMissing('labor_requests', ['id' => $request->id]);
    }

    public function test_missing_file_can_be_retried_but_out_of_scope_path_is_never_deleted(): void
    {
        $request = $this->request();
        $document = $this->document($request);
        Storage::disk('s3')->delete($document->path);
        $this->deleteJson("/api/hr/requests/{$request->id}")->assertOk();
        $unsafe = $this->request();
        $photo = $this->document($unsafe, 'worker-photos/protected.png');
        $this->deleteJson("/api/hr/requests/{$unsafe->id}")->assertStatus(503);
        Storage::disk('s3')->assertExists($photo->path);
        $this->assertDatabaseHas('labor_requests', ['id' => $unsafe->id]);
    }

    public function test_trash_and_restore_endpoints_are_not_available(): void
    {
        $request = $this->request();
        $this->getJson('/api/hr/requests/trash')->assertNotFound();
        $this->postJson("/api/hr/requests/trash/{$request->id}/restore")->assertNotFound();
    }
}

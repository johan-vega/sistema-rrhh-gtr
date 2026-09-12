<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Area;
use App\Models\LaborRequest;
use App\Models\Position;
use App\Models\RequestCategory;
use App\Models\Role;
use App\Models\User;
use App\Models\Worker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LaborRequestApiTest extends TestCase
{
    use RefreshDatabase;

    private function roles(): array
    {
        return [Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']), Role::firstOrCreate(['code' => Role::WORKER], ['name' => 'Trabajador'])];
    }

    private function worker(string $email = 'worker@test.com'): User
    {
        [, $workerRole] = $this->roles();
        $area = Area::firstOrCreate(['name' => 'TI']);
        $position = Position::firstOrCreate(['name' => 'Analista']);
        $user = User::factory()->create(['email' => $email, 'role_id' => $workerRole->id]);
        Worker::create(['user_id' => $user->id, 'dni' => fake()->unique()->numerify('########'), 'first_name' => 'Ana', 'last_name' => 'Pérez', 'area_id' => $area->id, 'position_id' => $position->id]);

        return $user->fresh('worker');
    }

    private function category(array $overrides = []): RequestCategory
    {
        return RequestCategory::create(array_merge(['name' => fake()->unique()->word(), 'requires_document' => false, 'minimum_notice_days' => 0, 'active' => true], $overrides));
    }

    private function payload(RequestCategory $category, array $extra = []): array
    {
        return array_merge(['category_id' => $category->id, 'start_date' => today()->addDays(3)->toDateString(), 'end_date' => today()->addDays(4)->toDateString(), 'reason' => 'Motivo de prueba'], $extra);
    }

    public function test_login_returns_sanctum_token(): void
    {
        [$hr] = $this->roles();
        User::factory()->create(['email' => 'hr@test.com', 'password' => 'password', 'role_id' => $hr->id]);
        $this->postJson('/api/login', ['email' => 'hr@test.com', 'password' => 'password'])->assertOk()->assertJsonPath('success', true)->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_worker_can_create_request_without_required_document(): void
    {
        $user = $this->worker();
        $category = $this->category();
        Sanctum::actingAs($user);
        $this->postJson('/api/requests', $this->payload($category))->assertCreated()->assertJsonPath('data.status', 'PENDIENTE');
        $this->assertDatabaseHas('labor_requests', ['worker_id' => $user->worker->id, 'status' => 'PENDIENTE']);
    }

    public function test_document_is_required_when_category_requires_it(): void
    {
        $user = $this->worker();
        $category = $this->category(['requires_document' => true]);
        Sanctum::actingAs($user);
        $this->postJson('/api/requests', $this->payload($category))->assertUnprocessable()->assertJsonPath('success', false);
    }

    public function test_document_category_accepts_valid_file(): void
    {
        $user = $this->worker();
        $category = $this->category(['requires_document' => true]);
        Sanctum::actingAs($user);
        $this->post('/api/requests', array_merge($this->payload($category), ['documents' => [UploadedFile::fake()->create('certificado.pdf', 100, 'application/pdf')]]), ['Accept' => 'application/json'])->assertCreated();
        $this->assertDatabaseCount('request_documents', 1);
    }

    public function test_minimum_notice_is_enforced(): void
    {
        $user = $this->worker();
        $category = $this->category(['minimum_notice_days' => 15]);
        Sanctum::actingAs($user);
        $this->postJson('/api/requests', $this->payload($category, ['start_date' => today()->addDays(14)->toDateString()]))->assertUnprocessable();
    }

    public function test_worker_cannot_view_another_workers_request(): void
    {
        $first = $this->worker();
        $category = $this->category();
        $request = LaborRequest::create(['worker_id' => $first->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'x', 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
        $second = $this->worker('other@test.com');
        Sanctum::actingAs($second);
        $this->getJson("/api/requests/{$request->id}")->assertForbidden();
    }

    public function test_worker_can_cancel_pending_request(): void
    {
        $user = $this->worker();
        $category = $this->category();
        $request = LaborRequest::create(['worker_id' => $user->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'x', 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
        Sanctum::actingAs($user);
        $this->postJson("/api/requests/{$request->id}/cancel")->assertOk();
        $this->assertDatabaseHas('labor_requests', ['id' => $request->id, 'status' => 'CANCELADA']);
    }

    public function test_worker_cannot_access_hr_endpoints(): void
    {
        $user = $this->worker();
        Sanctum::actingAs($user);
        $this->getJson('/api/hr/dashboard')->assertForbidden();
    }

    public function test_hr_can_approve_and_worker_cannot_approve(): void
    {
        $worker = $this->worker();
        $category = $this->category();
        $request = LaborRequest::create(['worker_id' => $worker->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'x', 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
        Sanctum::actingAs($worker);
        $this->postJson("/api/hr/requests/{$request->id}/approve", ['observation' => 'OK'])->assertForbidden();
        [$hr] = $this->roles();
        $hrUser = User::factory()->create(['role_id' => $hr->id]);
        Sanctum::actingAs($hrUser);
        $this->postJson("/api/hr/requests/{$request->id}/approve", ['observation' => 'OK'])->assertOk();
        $this->assertDatabaseHas('labor_requests', ['id' => $request->id, 'status' => 'APROBADA']);
    }

    public function test_calendar_returns_only_own_approved_requests(): void
    {
        $user = $this->worker();
        $category = $this->category();
        LaborRequest::create(['worker_id' => $user->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'own', 'status' => RequestStatus::APPROVED, 'requested_at' => now()]);
        $other = $this->worker('cal-other@test.com');
        LaborRequest::create(['worker_id' => $other->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'other', 'status' => RequestStatus::APPROVED, 'requested_at' => now()]);
        Sanctum::actingAs($user);
        $this->getJson('/api/calendar')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_submitted_request_has_no_update_endpoint(): void
    {
        $user = $this->worker();
        $category = $this->category();
        $item = LaborRequest::create(['worker_id' => $user->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'original', 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
        Sanctum::actingAs($user);

        $this->putJson("/api/requests/{$item->id}", ['reason' => 'modificado'])->assertMethodNotAllowed();
        $this->assertDatabaseHas('labor_requests', ['id' => $item->id, 'reason' => 'original']);
    }

    public function test_hr_can_list_requests_from_all_workers(): void
    {
        $first = $this->worker();
        $second = $this->worker('second@test.com');
        $category = $this->category();
        foreach ([$first, $second] as $user) {
            LaborRequest::create(['worker_id' => $user->worker->id, 'category_id' => $category->id, 'start_date' => today(), 'end_date' => today(), 'reason' => 'x', 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
        }
        [$hr] = $this->roles();
        Sanctum::actingAs(User::factory()->create(['role_id' => $hr->id]));

        $this->getJson('/api/hr/requests')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_hr_can_filter_and_export_request_report(): void
    {
        $worker = $this->worker();
        $category = $this->category(['name' => 'Vacaciones']);
        $matching = LaborRequest::create([
            'worker_id' => $worker->worker->id,
            'category_id' => $category->id,
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-12',
            'reason' => 'Descanso anual',
            'status' => RequestStatus::APPROVED,
            'requested_at' => '2026-09-01 08:00:00',
        ]);
        LaborRequest::create([
            'worker_id' => $worker->worker->id,
            'category_id' => $category->id,
            'start_date' => '2026-10-10',
            'end_date' => '2026-10-11',
            'reason' => 'Otro periodo',
            'status' => RequestStatus::PENDING,
            'requested_at' => '2026-10-01 08:00:00',
        ]);
        [$hr] = $this->roles();
        Sanctum::actingAs(User::factory()->create(['role_id' => $hr->id]));

        $query = '?from=2026-09-01&to=2026-09-30&worker_id='.$worker->worker->id.'&category_id='.$category->id.'&status=APROBADA';
        $this->getJson('/api/hr/reports/requests'.$query)
            ->assertOk()
            ->assertJsonPath('data.summary.total', 1)
            ->assertJsonPath('data.summary.approved', 1)
            ->assertJsonPath('data.items.0.id', $matching->id);

        $response = $this->get('/api/hr/reports/requests/export'.$query);
        $response->assertOk()->assertDownload();
        $file = $response->baseResponse->getFile()->getPathname();
        $this->assertSame('PK', file_get_contents($file, false, null, 0, 2));
        $zip = new \ZipArchive;
        $zip->open($file);
        $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();
        $this->assertStringContainsString('Trabajador', $sheet);
        $this->assertStringContainsString('Periodo', $sheet);
        $this->assertStringContainsString('Solicitada', $sheet);
        $this->assertStringContainsString('width="34"', $sheet);
    }

    public function test_monthly_worker_and_area_limits_block_new_permission_requests(): void
    {
        $first = $this->worker();
        $category = $this->category();
        $first->worker->update(['monthly_permission_limit' => 1]);
        Sanctum::actingAs($first);
        $this->postJson('/api/requests', $this->payload($category))->assertCreated();
        $this->postJson('/api/requests', $this->payload($category, ['end_date' => today()->addDays(5)->toDateString()]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('start_date');

        $first->worker->update(['monthly_permission_limit' => null]);
        $first->worker->area->update(['monthly_permission_limit' => 1]);
        $second = $this->worker('area-limit@test.com');
        Sanctum::actingAs($second);
        $this->postJson('/api/requests', $this->payload($category))->assertUnprocessable()->assertJsonValidationErrors('start_date');
    }

    public function test_hr_can_get_approved_and_rejected_request_analytics(): void
    {
        $worker = $this->worker();
        $categories = [$this->category(['name' => 'Permiso']), $this->category(['name' => 'Justificación'])];
        foreach ($categories as $index => $category) {
            LaborRequest::create([
                'worker_id' => $worker->worker->id,
                'category_id' => $category->id,
                'start_date' => '2026-09-10',
                'end_date' => '2026-09-10',
                'reason' => 'Prueba',
                'status' => $index === 0 ? RequestStatus::APPROVED : RequestStatus::REJECTED,
                'requested_at' => '2026-09-01 08:00:00',
            ]);
        }
        [$hr] = $this->roles();
        Sanctum::actingAs(User::factory()->create(['role_id' => $hr->id]));

        $this->getJson('/api/hr/analytics/requests?from=2026-09-01&to=2026-09-30&worker_id='.$worker->worker->id)
            ->assertOk()
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.approved', 1)
            ->assertJsonPath('data.rejected', 1);

        $this->getJson('/api/hr/analytics/requests?from=2026-08-01&to=2026-08-31&worker_id='.$worker->worker->id)
            ->assertOk()
            ->assertJsonPath('data.total', 0);

        $this->getJson('/api/hr/analytics/requests?from=2026-09-10&to=2026-09-10&worker_id='.$worker->worker->id)
            ->assertOk()
            ->assertJsonPath('data.total', 2);
    }
}

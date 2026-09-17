<?php
namespace Tests\Feature;
use App\Models\{Area, LaborRequest, Position, RequestCategory, Role, User, Worker};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AreaAvailabilityTest extends TestCase {
    use RefreshDatabase;
    private Area $area;
    private RequestCategory $category;
    private string $date;

    protected function setUp(): void {
        parent::setUp();
        $this->area = Area::create(['name' => 'Producción', 'max_simultaneous_permissions' => 2]);
        $this->category = RequestCategory::create(['name' => 'Permiso', 'minimum_notice_days' => 0, 'requires_document' => false]);
        $this->date = today()->addDays(5)->toDateString();
        Sanctum::actingAs($this->worker()->user);
    }
    private function worker(?Area $area = null): Worker {
        $role = Role::firstOrCreate(['code' => Role::WORKER], ['name' => 'Trabajador']);
        $user = User::factory()->create(['role_id' => $role->id]);
        return Worker::create(['user_id' => $user->id, 'dni' => fake()->unique()->numerify('########'), 'first_name' => 'Privado', 'last_name' => 'Privado', 'area_id' => ($area ?? $this->area)->id, 'position_id' => Position::firstOrCreate(['name' => 'Operario'])->id]);
    }
    private function approved(string $status = 'APROBADA', ?Worker $worker = null, ?RequestCategory $category = null): LaborRequest {
        return LaborRequest::create(['worker_id' => ($worker ?? $this->worker())->id, 'category_id' => ($category ?? $this->category)->id, 'start_date' => $this->date, 'end_date' => $this->date, 'reason' => 'Privado', 'status' => $status, 'requested_at' => now()]);
    }
    private function payload(?RequestCategory $category = null): array {
        return ['category_id' => ($category ?? $this->category)->id, 'start_date' => $this->date, 'end_date' => $this->date, 'reason' => 'Permiso de prueba'];
    }
    private function dates() {
        return $this->getJson("/api/requests/availability?from={$this->date}&to={$this->date}");
    }
    public function test_two_approved_workers_block_dates_and_creation_even_inside_a_range(): void {
        $this->approved(); $this->approved();
        $this->dates()->assertOk()->assertExactJson(['success' => true, 'message' => 'Operación realizada correctamente', 'data' => ['blocked_dates' => [$this->date]]]);
        $this->postJson('/api/requests', [...$this->payload(), 'start_date' => today()->addDays(4)->toDateString(), 'end_date' => today()->addDays(6)->toDateString()])
            ->assertUnprocessable()->assertJsonValidationErrors('start_date');
        $this->assertDatabaseCount('labor_requests', 2);
    }
    public function test_pending_rejected_cancelled_and_other_area_do_not_occupy_capacity(): void {
        foreach (['PENDIENTE', 'RECHAZADA', 'CANCELADA'] as $status) { $this->approved($status); $this->approved($status); }
        $other = Area::create(['name' => 'Otra']);
        $this->approved('APROBADA', $this->worker($other));
        $this->approved('APROBADA', $this->worker($other));
        $this->dates()->assertOk()->assertJsonPath('data.blocked_dates', []);
        $this->postJson('/api/requests', $this->payload())->assertCreated();
    }
    public function test_overlapping_permissions_of_same_worker_count_once(): void {
        $worker = $this->worker();
        $this->approved('APROBADA', $worker); $this->approved('APROBADA', $worker);
        $this->dates()->assertOk()->assertJsonPath('data.blocked_dates', []);
        $this->postJson('/api/requests', $this->payload())->assertCreated();
    }
    public function test_absence_ignores_capacity_and_keeps_retroactive_window_including_today(): void {
        $absence = RequestCategory::create(['name' => 'Justificación', 'is_absence' => true, 'maximum_past_days' => 7, 'minimum_notice_days' => 3, 'requires_document' => false]);
        foreach ([today(), today()->subDays(7)] as $date) {
            $this->date = $date->toDateString();
            $this->approved(); $this->approved();
            $this->postJson('/api/requests', [...$this->payload($absence), 'end_date' => today()->toDateString()])->assertCreated();
        }
        $this->date = today()->subDays(8)->toDateString();
        $this->postJson('/api/requests', $this->payload($absence))->assertUnprocessable()->assertJsonValidationErrors('start_date');
    }
    public function test_approved_absences_do_not_reserve_permission_capacity(): void {
        $absence = RequestCategory::create(['name' => 'Falta', 'is_absence' => true]);
        $this->approved('APROBADA', null, $absence); $this->approved('APROBADA', null, $absence);
        $this->dates()->assertOk()->assertJsonPath('data.blocked_dates', []);
    }
    public function test_approval_rechecks_capacity_for_previously_pending_requests(): void {
        $first = $this->approved();
        $second = $this->approved('PENDIENTE');
        $third = $this->approved('PENDIENTE');
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->postJson("/api/hr/requests/{$second->id}/approve")->assertOk();
        $this->postJson("/api/hr/requests/{$third->id}/approve")->assertUnprocessable();
        $this->assertDatabaseHas('labor_requests', ['id' => $third->id, 'status' => 'PENDIENTE']);
        $this->postJson("/api/hr/requests/{$second->id}/approve")->assertUnprocessable();
    }
    public function test_null_limit_and_bounded_date_query(): void {
        $this->area->update(['max_simultaneous_permissions' => null]);
        $this->approved(); $this->approved(); $this->approved();
        $this->dates()->assertOk()->assertJsonPath('data.blocked_dates', []);
        $this->getJson('/api/requests/availability?from=2026-01-01&to=2028-01-01')->assertUnprocessable();
        $this->getJson('/api/requests/availability?from=bad&to=bad')->assertUnprocessable();
    }
    public function test_hr_manages_limit_and_status_without_losing_limit(): void {
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->postJson('/api/hr/areas', ['name' => 'Nueva', 'max_simultaneous_permissions' => 2])->assertCreated()->assertJsonPath('data.max_simultaneous_permissions', 2);
        $this->putJson("/api/hr/areas/{$this->area->id}", ['name' => 'Producción', 'max_simultaneous_permissions' => 0])->assertUnprocessable();
        foreach ([false, true] as $active) {
            $this->patchJson("/api/hr/areas/{$this->area->id}/status", ['active' => $active])->assertOk()->assertJsonPath('data.active', $active)->assertJsonPath('data.max_simultaneous_permissions', 2);
        }
    }

    public function test_hr_summary_counts_only_other_distinct_approved_workers_per_day_without_private_data(): void {
        $day = \Carbon\CarbonImmutable::parse($this->date);
        $next = $day->addDay()->toDateString();
        $last = $day->addDays(2)->toDateString();
        $requester = $this->worker();
        $request = $this->approved('PENDIENTE', $requester);
        $request->update(['end_date' => $last]);
        $other = $this->worker();
        $this->approved('APROBADA', $other)->update(['start_date' => $day->subDay()->toDateString(), 'end_date' => $next]);
        $this->approved('APROBADA', $other); // Solapamiento: no duplica a la persona.
        $this->approved()->update(['start_date' => $next, 'end_date' => $next]);
        $this->approved('APROBADA', $requester); // El solicitante no ocupa otro cupo.
        foreach (['PENDIENTE', 'RECHAZADA', 'CANCELADA'] as $status) $this->approved($status);
        $this->approved('APROBADA', $this->worker(Area::create(['name' => 'Otra'])));
        $absence = RequestCategory::create(['name' => 'Falta', 'is_absence' => true]);
        $this->approved('APROBADA', null, $absence);

        Sanctum::actingAs($requester->user);
        $blocked = $this->getJson("/api/requests/availability?from={$this->date}&to={$last}")
            ->assertOk()->json('data.blocked_dates');
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $response = $this->getJson("/api/hr/requests/{$request->id}/availability?from={$this->date}&to={$last}")
            ->assertOk()->assertExactJson([
                'success' => true, 'message' => 'Operación realizada correctamente',
                'data' => ['blocked_dates' => [$next], 'is_exempt' => false, 'dates' => [
                    ['date' => $this->date, 'approved_count' => 1, 'limit' => 2, 'available' => true],
                    ['date' => $next, 'approved_count' => 2, 'limit' => 2, 'available' => false],
                    ['date' => $last, 'approved_count' => 0, 'limit' => 2, 'available' => true],
                ]],
            ]);
        $this->assertSame($blocked, $response->json('data.blocked_dates'));
        $response->assertHeader('Cache-Control', 'no-store, private');
        $this->assertDatabaseHas('labor_requests', ['id' => $request->id, 'status' => 'PENDIENTE']);
        // Consultar un tramo del rango conserva los permisos iniciados antes del tramo.
        $this->getJson("/api/hr/requests/{$request->id}/availability?from={$next}&to={$next}")
            ->assertOk()->assertJsonPath('data.dates.0.approved_count', 2);
    }

    public function test_hr_absence_summary_is_informational_even_when_capacity_is_full(): void {
        $this->date = today()->subDay()->toDateString();
        $this->approved(); $this->approved();
        $absence = RequestCategory::create(['name' => 'Justificación', 'is_absence' => true, 'maximum_past_days' => 7]);
        $request = $this->approved('PENDIENTE', null, $absence);
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->getJson("/api/hr/requests/{$request->id}/availability?from={$this->date}&to={$this->date}")
            ->assertOk()->assertJsonPath('data', [
                'blocked_dates' => [], 'dates' => [
                    ['date' => $this->date, 'approved_count' => 2, 'limit' => 2, 'available' => true],
                ], 'is_exempt' => true,
            ]);
    }

    public function test_hr_summary_reports_actual_counts_when_area_has_no_limit(): void {
        $this->area->update(['max_simultaneous_permissions' => null]);
        $this->approved(); $this->approved();
        $request = $this->approved('PENDIENTE');
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->getJson("/api/hr/requests/{$request->id}/availability?from={$this->date}&to={$this->date}")
            ->assertOk()->assertJsonPath('data.dates.0', [
                'date' => $this->date, 'approved_count' => 2, 'limit' => null, 'available' => true,
            ])->assertJsonPath('data.blocked_dates', []);
    }

    public function test_hr_summary_requires_hr_role_and_valid_dates_within_the_request(): void {
        $request = $this->approved('PENDIENTE');
        $url = "/api/hr/requests/{$request->id}/availability";
        $this->getJson("{$url}?from={$this->date}&to={$this->date}")->assertForbidden();
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->getJson($url)->assertUnprocessable()->assertJsonValidationErrors(['from', 'to']);
        $this->getJson("{$url}?from=bad&to=bad")->assertUnprocessable();
        $outside = today()->addDays(6)->toDateString();
        $this->getJson("{$url}?from={$this->date}&to={$outside}")->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->getJson("{$url}?from={$outside}&to={$this->date}")->assertUnprocessable()->assertJsonValidationErrors('to');
        $this->getJson("/api/hr/requests/999999/availability?from={$this->date}&to={$this->date}")->assertNotFound();
    }
}

<?php
namespace Tests\Feature;
use App\Models\{Area, Position, Role, User, Worker};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkerDetailsTest extends TestCase {
    use RefreshDatabase;
    protected function setUp(): void {
        parent::setUp();
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        $hr = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);
        Role::firstOrCreate(['code' => Role::WORKER], ['name' => 'Trabajador']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $hr->id]));
    }
    private function payload(): array {
        return [
            'first_name' => 'Ana', 'last_name' => 'Pérez', 'dni' => fake()->unique()->numerify('########'),
            'email' => fake()->unique()->safeEmail(), 'password' => 'Password123!', 'password_confirmation' => 'Password123!',
            'area_id' => Area::firstOrCreate(['name' => 'Producción'])->id,
            'position_id' => Position::firstOrCreate(['name' => 'Operario'])->id,
            'address' => 'Residencia 123', 'dni_address' => 'Dirección DNI 456', 'phone' => '987654321',
            'emergency_phone' => '912345678', 'worker_type' => 'OBRERO', 'birth_date' => '1990-05-20',
        ];
    }
    private function photo(): UploadedFile {
        return UploadedFile::fake()->createWithContent('foto.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
    }
    public function test_hr_can_reset_worker_password_with_six_digits_json_and_photo(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        $user = Worker::findOrFail($id)->user;
        $user->createToken('sesion-anterior');
        $this->putJson("/api/hr/workers/$id", [...$data, 'password' => '010190', 'password_confirmation' => '010190'])
            ->assertOk()->assertJsonMissingPath('data.password')->assertJsonMissingPath('data.password_confirmation');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('010190', $user->fresh()->password));
        $this->assertFalse(\Illuminate\Support\Facades\Hash::check($data['password'], $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/login', ['email' => $data['email'], 'password' => '010190'])->assertOk();
        $this->postJson('/api/login', ['email' => $data['email'], 'password' => $data['password']])->assertUnauthorized();
        $this->post("/api/hr/workers/$id", [...$data, '_method' => 'PUT', 'password' => '020290',
            'password_confirmation' => '020290', 'photo' => $this->photo()], ['Accept' => 'application/json'])->assertOk();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('020290', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }
    public function test_omitted_or_empty_password_keeps_hash_and_tokens_on_edit(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        $user = Worker::findOrFail($id)->user;
        $hash = $user->password;
        $user->createToken('conservar');
        unset($data['password'], $data['password_confirmation']);
        foreach ([$data, [...$data, 'password' => '', 'password_confirmation' => ''], [...$data, 'password' => null]] as $edit) {
            $this->putJson("/api/hr/workers/$id", $edit)->assertOk();
            $this->assertSame($hash, $user->fresh()->password);
            $this->assertSame(1, $user->tokens()->count());
        }
    }
    public function test_invalid_password_reset_is_rejected_and_worker_cannot_reset_via_hr(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        $user = Worker::findOrFail($id)->user;
        $hash = $user->password;
        foreach ([['12345', '12345'], ['010190', '020290'], ['010190', null], [101990, 101990]] as [$password, $confirmation]) {
            $this->putJson("/api/hr/workers/$id", [...$data, 'password' => $password, 'password_confirmation' => $confirmation])
                ->assertUnprocessable()->assertJsonValidationErrors('password');
        }
        $this->assertSame($hash, $user->fresh()->password);
        Sanctum::actingAs($user);
        $this->putJson("/api/hr/workers/$id", [...$data, 'password' => '010190', 'password_confirmation' => '010190'])->assertForbidden();
        $this->assertSame($hash, $user->fresh()->password);
    }
    public function test_worker_list_paginates_all_39_records_and_searches_beyond_first_page(): void {
        $ids = [];
        for ($i = 1; $i <= 39; $i++) {
            $data = $this->payload();
            $worker = Worker::create([...$data, 'user_id' => User::factory()->create()->id,
                'first_name' => $i === 39 ? 'Zulma' : 'Ana', 'last_name' => 'Pérez', 'active' => true]);
            $ids[] = $worker->id;
        }
        $first = $this->getJson('/api/hr/workers')->assertOk()->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 39)->assertJsonPath('meta.page', 1)->assertJsonPath('meta.per_page', 20)->json('data');
        $second = $this->getJson('/api/hr/workers?page=2')->assertOk()->assertJsonCount(19, 'data')
            ->assertJsonPath('meta.total', 39)->assertJsonPath('meta.page', 2)->json('data');
        $this->assertSame($ids, array_column([...$first, ...$second], 'id'));
        foreach (['Zulma Pérez', Worker::findOrFail($ids[38])->dni] as $search) {
            $this->getJson('/api/hr/workers?'.http_build_query(['search' => $search]))->assertOk()
                ->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $ids[38]);
        }
        $this->getJson('/api/hr/workers?'.http_build_query(['search' => 'Producción', 'page' => 2]))
            ->assertOk()->assertJsonCount(19, 'data')->assertJsonPath('meta.total', 39);
        $this->getJson('/api/hr/workers?search=NoExiste')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }
    public function test_worker_search_keeps_active_filter_and_validates_pagination(): void {
        $data = $this->payload();
        Worker::create([...$data, 'user_id' => User::factory()->create()->id, 'active' => false]);
        $this->getJson('/api/hr/workers?'.http_build_query(['search' => 'Producción', 'active' => 'true']))
            ->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/hr/workers?'.http_build_query(['search' => 'Producción', 'active' => 'false']))
            ->assertOk()->assertJsonPath('meta.total', 1);
        foreach (['0', '-1', 'abc'] as $page) {
            $this->getJson('/api/hr/workers?page='.$page)->assertUnprocessable()->assertJsonValidationErrors('page');
        }
    }
    public function test_hr_can_create_and_edit_hire_date_with_or_without_photo(): void {
        $data = [...$this->payload(), 'hire_date' => '2020-02-29'];
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->assertJsonPath('data.hire_date', '2020-02-29')->json('data.id');
        $this->assertSame('2020-02-29', Worker::findOrFail($id)->hire_date->toDateString());
        $this->getJson("/api/hr/workers/$id")->assertOk()->assertJsonPath('data.hire_date', '2020-02-29');
        $this->post("/api/hr/workers/$id", [...$data, '_method' => 'PUT', 'hire_date' => '2021-07-15', 'photo' => $this->photo()], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.hire_date', '2021-07-15')->assertJsonPath('data.has_photo', true);
        $this->assertSame('2021-07-15', Worker::findOrFail($id)->hire_date->toDateString());
        $this->post('/api/hr/workers', [...$this->payload(), 'hire_date' => '2022-08-01', 'photo' => $this->photo()], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.hire_date', '2022-08-01');
    }
    public function test_worker_without_hire_date_can_be_completed_later_and_omission_does_not_erase_it(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->assertJsonPath('data.hire_date', null)->json('data.id');
        $this->getJson("/api/hr/workers/$id")->assertOk()->assertJsonPath('data.hire_date', null);
        $this->putJson("/api/hr/workers/$id", [...$data, 'hire_date' => '2018-03-04'])->assertOk()->assertJsonPath('data.hire_date', '2018-03-04');
        $this->putJson("/api/hr/workers/$id", $data)->assertOk()->assertJsonPath('data.hire_date', '2018-03-04');
        $this->putJson("/api/hr/workers/$id", [...$data, 'hire_date' => ''])->assertOk()->assertJsonPath('data.hire_date', null);
        $this->assertNull(Worker::findOrFail($id)->hire_date);
    }
    public function test_invalid_hire_dates_are_rejected_on_create_and_update(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        foreach (['no-es-fecha', '2025-02-29', '2026-13-01', '01/09/2026'] as $date) {
            $this->postJson('/api/hr/workers', [...$this->payload(), 'hire_date' => $date])->assertUnprocessable()->assertJsonValidationErrors('hire_date');
            $this->putJson("/api/hr/workers/$id", [...$data, 'hire_date' => $date])->assertUnprocessable()->assertJsonValidationErrors('hire_date');
        }
        $this->assertNull(Worker::findOrFail($id)->hire_date);
    }
    public function test_worker_cannot_change_hire_date_from_own_profile(): void {
        $data = [...$this->payload(), 'hire_date' => '2020-01-02'];
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        Sanctum::actingAs(Worker::findOrFail($id)->user);
        $this->putJson('/api/profile', ['hire_date' => '2000-01-01', 'phone' => '900000001'])->assertOk();
        $this->assertSame('2020-01-02', Worker::findOrFail($id)->hire_date->toDateString());
    }
    public function test_hr_can_create_worker_with_six_digit_password_preserving_leading_zero(): void {
        $data = [...$this->payload(), 'password' => '010190', 'password_confirmation' => '010190'];
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        $worker = Worker::findOrFail($id);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('010190', $worker->user->password));
        $this->assertFalse(\Illuminate\Support\Facades\Hash::check('10190', $worker->user->password));
        $this->postJson('/api/login', ['email' => $data['email'], 'password' => '010190'])
            ->assertOk()->assertJsonStructure(['data' => ['token']]);
    }
    public function test_worker_password_still_requires_six_characters_and_confirmation(): void {
        foreach ([['12345', '12345'], ['010190', '010191'], ['', '']] as [$password, $confirmation]) {
            $this->postJson('/api/hr/workers', [...$this->payload(), 'password' => $password, 'password_confirmation' => $confirmation])
                ->assertUnprocessable()->assertJsonValidationErrors('password');
        }
        $this->assertDatabaseCount('workers', 0);
    }
    public function test_hr_creates_and_updates_new_fields_and_private_photo(): void {
        $data = $this->payload();
        $id = $this->post('/api/hr/workers', [...$data, 'photo' => $this->photo()], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.worker_type', 'OBRERO')->assertJsonPath('data.birth_date', '1990-05-20')
            ->assertJsonPath('data.dni_address', 'Dirección DNI 456')->assertJsonPath('data.has_photo', true)->assertJsonMissingPath('data.photo_path')->json('data.id');
        $old = Worker::findOrFail($id)->photo_path;
        Storage::disk('s3')->assertExists($old);
        $this->get("/api/workers/$id/photo")->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $data['worker_type'] = 'EMPLEADO';
        $data['emergency_phone'] = '900000000';
        $this->post("/api/hr/workers/$id", [...$data, '_method' => 'PUT', 'photo' => $this->photo()], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.worker_type', 'EMPLEADO')->assertJsonPath('data.emergency_phone', '900000000');
        $new = Worker::findOrFail($id)->photo_path;
        $this->assertNotSame($old, $new);
        Storage::disk('s3')->assertMissing($old);
        Storage::disk('s3')->assertExists($new);
        $this->putJson("/api/hr/workers/$id", $data)->assertOk()->assertJsonPath('data.has_photo', true);
        $this->assertSame($new, Worker::findOrFail($id)->photo_path);
    }
    public function test_invalid_type_birth_date_and_photo_are_rejected(): void {
        $data = $this->payload();
        foreach (['CONTRATISTA', '', 'empleado'] as $type) {
            $this->postJson('/api/hr/workers', [...$data, 'worker_type' => $type])->assertUnprocessable()->assertJsonValidationErrors('worker_type');
        }
        foreach ([today()->toDateString(), today()->addDay()->toDateString(), ''] as $date) {
            $this->postJson('/api/hr/workers', [...$data, 'birth_date' => $date])->assertUnprocessable()->assertJsonValidationErrors('birth_date');
        }
        foreach ([$this->photo()->size(20481), UploadedFile::fake()->create('archivo.pdf', 10, 'application/pdf')] as $photo) {
            $this->post('/api/hr/workers', [...$data, 'photo' => $photo], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('photo');
        }
        $this->assertDatabaseCount('workers', 0);
    }
    public function test_legacy_worker_requires_actual_birth_date_and_type_when_editing(): void {
        $data = $this->payload();
        $user = User::factory()->create(['role_id' => Role::where('code', Role::WORKER)->firstOrFail()->id]);
        $worker = Worker::create(collect($data)->except(['password', 'password_confirmation', 'email', 'worker_type', 'birth_date'])->all() + ['user_id' => $user->id]);
        $this->getJson("/api/hr/workers/{$worker->id}")->assertOk()->assertJsonPath('data.birth_date', null)->assertJsonPath('data.worker_type', null);
        $this->putJson("/api/hr/workers/{$worker->id}", [...$data, 'worker_type' => null, 'birth_date' => null])
            ->assertUnprocessable()->assertJsonValidationErrors(['birth_date', 'worker_type']);
        $this->putJson("/api/hr/workers/{$worker->id}", $data)->assertOk();
    }
    public function test_worker_photo_accepts_20_mb_and_rejects_larger_on_create_and_edit(): void {
        $data = $this->payload();
        $id = $this->post('/api/hr/workers', [...$data, 'photo' => $this->photo()->size(20480)], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.has_photo', true)->json('data.id');
        $this->post("/api/hr/workers/$id", [...$data, '_method' => 'PUT', 'photo' => $this->photo()->size(20480)], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.has_photo', true);
        $path = Worker::findOrFail($id)->photo_path;
        $this->post('/api/hr/workers', [...$this->payload(), 'photo' => $this->photo()->size(20481)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonPath('errors.photo.0', 'La fotografía no debe superar los 20 MB.');
        $this->post("/api/hr/workers/$id", [...$data, '_method' => 'PUT', 'photo' => $this->photo()->size(20481)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonPath('errors.photo.0', 'La fotografía no debe superar los 20 MB.');
        $this->assertSame($path, Worker::findOrFail($id)->photo_path);
        Storage::disk('s3')->assertExists($path);
        $this->assertDatabaseCount('workers', 1);
    }
    public function test_worker_only_views_own_photo_and_cannot_edit_hr_only_fields(): void {
        $data = $this->payload();
        $id = $this->post('/api/hr/workers', [...$data, 'photo' => $this->photo()], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
        $other = $this->postJson('/api/hr/workers', $this->payload())->assertCreated()->json('data.id');
        Sanctum::actingAs(Worker::findOrFail($id)->user);
        $this->get("/api/workers/$id/photo")->assertOk();
        $this->getJson("/api/workers/$other/photo")->assertForbidden();
        $this->putJson('/api/profile', ['address' => 'Nueva casa', 'phone' => '900000001', 'dni_address' => 'Nueva dirección DNI', 'birth_date' => '2000-01-01', 'worker_type' => 'EMPLEADO', 'first_name' => 'NO', 'dni' => 'NO', 'area_id' => 999, 'position_id' => 999, 'emergency_phone' => '900000002'])
            ->assertOk()->assertJsonPath('data.address', 'Nueva casa')->assertJsonPath('data.dni_address', 'Nueva dirección DNI')
            ->assertJsonPath('data.emergency_phone', '900000002')->assertJsonPath('data.birth_date', $data['birth_date'])->assertJsonPath('data.worker_type', 'OBRERO')
            ->assertJsonPath('data.first_name', $data['first_name'])->assertJsonPath('data.dni', $data['dni'])
            ->assertJsonPath('data.area.id', $data['area_id'])->assertJsonPath('data.position.id', $data['position_id']);
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.dni_address', 'Nueva dirección DNI')->assertJsonPath('data.emergency_phone', '900000002');
        $this->assertSame($data['dni_address'], Worker::findOrFail($other)->dni_address);
        $this->assertSame($data['emergency_phone'], Worker::findOrFail($other)->emergency_phone);
    }
    public function test_worker_contact_fields_validate_lengths_and_can_be_cleared(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        Sanctum::actingAs(Worker::findOrFail($id)->user);
        foreach ([['dni_address' => str_repeat('a', 256), 'emergency_phone' => str_repeat('1', 31)],
            ['dni_address' => ['incorrecto'], 'emergency_phone' => ['incorrecto']]] as $invalid) {
            $this->putJson('/api/profile', $invalid)->assertUnprocessable()->assertJsonValidationErrors(['dni_address', 'emergency_phone']);
        }
        $this->putJson('/api/profile', ['phone' => '900000001'])->assertOk()
            ->assertJsonPath('data.dni_address', $data['dni_address'])->assertJsonPath('data.emergency_phone', $data['emergency_phone']);
        $this->putJson('/api/profile', ['dni_address' => str_repeat('a', 255), 'emergency_phone' => str_repeat('1', 30)])->assertOk();
        $this->putJson('/api/profile', ['dni_address' => '', 'emergency_phone' => null])->assertOk()
            ->assertJsonPath('data.dni_address', null)->assertJsonPath('data.emergency_phone', null);
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.dni_address', null)->assertJsonPath('data.emergency_phone', null);
    }
    public function test_inactive_area_and_position_cannot_be_assigned_but_current_references_are_kept(): void {
        $data = $this->payload();
        $id = $this->postJson('/api/hr/workers', $data)->assertCreated()->json('data.id');
        Area::findOrFail($data['area_id'])->update(['active' => false]);
        Position::findOrFail($data['position_id'])->update(['active' => false]);
        $this->postJson('/api/hr/workers', $this->payload())->assertUnprocessable()->assertJsonValidationErrors(['area_id', 'position_id']);
        $this->putJson("/api/hr/workers/$id", $data)->assertOk()->assertJsonPath('data.area.active', false);
    }
}

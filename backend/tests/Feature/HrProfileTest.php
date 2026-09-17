<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HrProfileTest extends TestCase
{
    use RefreshDatabase;

    private function hr(): User
    {
        $role = Role::firstOrCreate(['code' => Role::HR], ['name' => 'RRHH']);

        return User::factory()->create(['name' => 'Cuenta RRHH', 'email' => 'rrhh@test.com', 'password' => 'password', 'role_id' => $role->id]);
    }

    public function test_hr_can_update_own_profile_and_password(): void
    {
        $hr = $this->hr();
        Sanctum::actingAs($hr);

        $this->putJson('/api/hr/profile', [
            'name' => 'Nueva Cuenta RRHH',
            'email' => 'nueva-rrhh@test.com',
            'current_password' => 'password',
            'password' => 'nueva-clave-segura',
            'password_confirmation' => 'nueva-clave-segura',
        ])->assertOk()->assertJsonPath('data.email', 'nueva-rrhh@test.com');

        $updated = User::where('email', 'nueva-rrhh@test.com')->firstOrFail();
        $this->assertTrue(Hash::check('nueva-clave-segura', $updated->password));
    }

    public function test_hr_cannot_change_password_without_current_password(): void
    {
        $hr = $this->hr();
        Sanctum::actingAs($hr);

        $this->putJson('/api/hr/profile', [
            'name' => $hr->name,
            'email' => $hr->email,
            'password' => 'nueva-clave-segura',
            'password_confirmation' => 'nueva-clave-segura',
        ])->assertUnprocessable();
    }

    public function test_hr_password_keeps_eight_character_minimum(): void
    {
        $hr = $this->hr();
        Sanctum::actingAs($hr);
        $this->putJson('/api/hr/profile', [
            'name' => $hr->name, 'email' => $hr->email, 'current_password' => 'password',
            'password' => '010190', 'password_confirmation' => '010190',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('password', $hr->fresh()->password));
    }
}

<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Position;
use App\Models\RequestCategory;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::firstOrCreate(['code' => Role::HR], ['name' => 'Recursos Humanos']);
        Role::firstOrCreate(['code' => Role::WORKER], ['name' => 'Trabajador']);
        foreach (['Administración', 'Operaciones', 'Tecnología'] as $name) {
            Area::firstOrCreate(['name' => $name]);
        }
        foreach (['Asistente', 'Analista', 'Coordinador'] as $name) {
            Position::firstOrCreate(['name' => $name]);
        }
        foreach ([
            ['name' => 'Vacaciones', 'description' => 'Solicitud de vacaciones', 'requires_document' => true, 'minimum_notice_days' => 15, 'allow_approved_cancellation' => false],
            ['name' => 'Salud', 'description' => 'Permiso por salud', 'requires_document' => true, 'minimum_notice_days' => 0, 'allow_approved_cancellation' => true],
            ['name' => 'Motivo personal', 'description' => 'Permiso por motivo personal', 'requires_document' => false, 'minimum_notice_days' => 2, 'allow_approved_cancellation' => false],
            ['name' => 'Justificación de falta', 'description' => 'Sustento de una falta', 'requires_document' => true, 'minimum_notice_days' => 0, 'allow_approved_cancellation' => false],
        ] as $category) {
            RequestCategory::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // $superAdmin = User::create([
        //     'name' => 'Super Admin',
        //     'email' => 'info@adsvizion.net',
        //     'password' => bcrypt('password')
        // ]);

        // $superAdminRole = Role::create([
        //     'name' => 'super-admin',
        //     'display_name' => 'Super Admin',
        // ]);

        // $superAdmin->addRole($superAdminRole);
        $this->call(LaratrustSeeder::class);
    }
}

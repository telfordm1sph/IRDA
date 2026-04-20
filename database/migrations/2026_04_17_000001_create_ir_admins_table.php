<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ir_admins', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('emp_no')->unique();
            $table->enum('role', ['hr', 'hr_mngr'])->comment('hr = HR Personnel, hr_mngr = HR Manager');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ir_admins');
    }
};

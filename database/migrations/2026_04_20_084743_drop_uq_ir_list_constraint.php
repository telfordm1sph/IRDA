<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ir_list', function (Blueprint $table) {
            // MySQL won't drop a unique index that a foreign key depends on.
            // Drop FK first, swap unique → regular index, then restore FK.
            $table->dropForeign('ir_list_ibfk_1');
            $table->dropUnique('uq_ir_list');
            $table->index('ir_no', 'idx_ir_list_ir_no');
            $table->foreign('ir_no', 'ir_list_ibfk_1')
                  ->references('ir_no')->on('ir_requests')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('ir_list', function (Blueprint $table) {
            $table->dropForeign('ir_list_ibfk_1');
            $table->dropIndex('idx_ir_list_ir_no');
            $table->unique('ir_no', 'uq_ir_list');
            $table->foreign('ir_no', 'ir_list_ibfk_1')
                  ->references('ir_no')->on('ir_requests')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }
};

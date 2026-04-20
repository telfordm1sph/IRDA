<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrAdmin extends Model
{
    protected $table = 'ir_admins';

    protected $fillable = [
        'emp_no',
        'role',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Resolve the IR admin role for a given emp_no.
     * Returns 'hr', 'hr_mngr', or null.
     */
    public static function roleFor(int $empNo): ?string
    {
        return self::where('emp_no', $empNo)
            ->where('is_active', true)
            ->value('role');
    }
}

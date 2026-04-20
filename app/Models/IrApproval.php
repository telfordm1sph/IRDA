<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrApproval extends Model
{
    protected $table = 'ir_approvals';

    protected $fillable = [
        'ir_no',
        'role',
        'approver_emp_no',
        'status',
        'sign_date',
        'da_sign_date',
        'remarks',
    ];

    protected $casts = [
        'sign_date'    => 'datetime',
        'da_sign_date' => 'datetime',
    ];

    public $timestamps = false;

    const ROLES = ['sv', 'dh', 'od', 'hr', 'hr_mngr', 'dm', 'da'];

    public function irRequest()
    {
        return $this->belongsTo(IrRequest::class, 'ir_no', 'ir_no');
    }
}

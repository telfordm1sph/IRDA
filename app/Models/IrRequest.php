<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IrRequest extends Model
{
    protected $table = 'ir_requests';

    protected $fillable = [
        'ir_no',
        'emp_no',
        'requestor_id',
        'quality_violation',
        'reference',
        'what',
        'when_date',
        'where_loc',
        'how',
        'suspension',
        'assessment',
        'recommendation',
        'sign',
        'da_sign',
        'sign_date',
        'ir_status',
        'sv_no',
        'disapprove_remarks',
        'read_status',
        'read_date',
        'is_inactive',
        'date_created',
        'date_updated',
    ];

    protected $casts = [
        'when_date'    => 'date',
        'sign_date'    => 'date',
        'read_date'    => 'datetime',
        'date_created' => 'datetime',
        'date_updated' => 'datetime',
        'is_inactive'  => 'boolean',
    ];

    public $timestamps = false;

    public function reasons()
    {
        return $this->hasMany(IrReason::class, 'ir_no', 'ir_no');
    }

    public function irList()
    {
        return $this->hasMany(IrList::class, 'ir_no', 'ir_no');
    }

    public function approvals()
    {
        return $this->hasMany(IrApproval::class, 'ir_no', 'ir_no');
    }

    public function daRequest()
    {
        return $this->hasOne(IrDaRequest::class, 'ir_no', 'ir_no');
    }

    public function appeal()
    {
        return $this->hasOne(IrAppeal::class, 'ir_no', 'ir_no');
    }
}

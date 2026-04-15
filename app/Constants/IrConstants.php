<?php

namespace App\Constants;

class IrConstants
{
    // ── DA / Disciplinary Action Types ────────────────────────────────────────
    const DA_VERBAL_WARNING   = 1;
    const DA_WRITTEN_WARNING  = 2;
    const DA_3_DAY_SUSPENSION = 3;
    const DA_7_DAY_SUSPENSION = 4;
    const DA_DISMISSAL        = 5;

    const DA_TYPES = [
        self::DA_VERBAL_WARNING   => 'Verbal Warning',
        self::DA_WRITTEN_WARNING  => 'Written Warning',
        self::DA_3_DAY_SUSPENSION => '3-Day Suspension',
        self::DA_7_DAY_SUSPENSION => '7-Day Suspension',
        self::DA_DISMISSAL        => 'Dismissal',
    ];

    // ── IR Status ─────────────────────────────────────────────────────────────
    const IR_STATUS_PENDING   = 0;
    const IR_STATUS_APPROVED  = 1;
    const IR_STATUS_REJECTED  = 2;
    const IR_STATUS_CANCELLED = 3;

    const IR_STATUSES = [
        self::IR_STATUS_PENDING   => 'Pending',
        self::IR_STATUS_APPROVED  => 'Approved',
        self::IR_STATUS_REJECTED  => 'Rejected',
        self::IR_STATUS_CANCELLED => 'Cancelled',
    ];

    // ── Read Status ───────────────────────────────────────────────────────────
    const READ_UNREAD = 0;
    const READ_READ   = 1;

    // ── Violation Type ────────────────────────────────────────────────────────
    const VIOLATION_ADMINISTRATIVE = 0;
    const VIOLATION_QUALITY        = 1;

    // ── Approval Roles ────────────────────────────────────────────────────────
    const APPROVAL_ROLES = ['sv', 'dh', 'od', 'hr', 'hr_mngr', 'dm', 'da'];

    // ── Helpers ───────────────────────────────────────────────────────────────

    public static function daLabel(int $value): string
    {
        return self::DA_TYPES[$value] ?? '—';
    }

    public static function irStatusLabel(int $value): string
    {
        return self::IR_STATUSES[$value] ?? '—';
    }
}

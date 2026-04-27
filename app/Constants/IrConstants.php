<?php

namespace App\Constants;

class IrConstants
{
    // ── IR Status (ir_requests.ir_status) ────────────────────────────────────
    const IR_PENDING   = 0;  // just created, awaiting HR action
    const IR_VALIDATED = 1;  // HR actioned — now in LOE/assessment/hearing flow
    const IR_APPROVED  = 2;  // disposition valid — DA phase
    const IR_INVALID   = 3;  // disposition invalid
    const IR_CANCELLED = 4;

    const IR_STATUS_LABELS = [
        self::IR_PENDING   => 'Pending',
        self::IR_VALIDATED => 'In Progress',
        self::IR_APPROVED  => 'Approved',
        self::IR_INVALID   => 'Invalid',
        self::IR_CANCELLED => 'Cancelled',
    ];

    // ── Approval Status (ir_approvals.status) ────────────────────────────────
    const APPROVAL_PENDING    = 0;
    const APPROVAL_APPROVED   = 1;
    const APPROVAL_DISAPPROVED = 2;

    // ── Approval Roles (ir_approvals.role) ───────────────────────────────────
    const ROLE_SV       = 'sv';        // Immediate Supervisor (requestor/reporter)
    const ROLE_HR       = 'hr';        // HR Personnel — validates IR
    const ROLE_DH       = 'dh';        // Department Head/Manager — approves IR
    const ROLE_OD       = 'od';        // Operations Director
    const ROLE_HR_MNGR  = 'hr_mngr';  // HR Manager — signs DA
    const ROLE_DM       = 'dm';        // Division Manager
    const ROLE_DA       = 'da';        // DA officer

    const APPROVAL_ROLES = [
        self::ROLE_SV,
        self::ROLE_HR,
        self::ROLE_DH,
        self::ROLE_OD,
        self::ROLE_HR_MNGR,
        self::ROLE_DM,
        self::ROLE_DA,
    ];

    // ── DA Status (ir_da_requests.da_status) ─────────────────────────────────
    // Mirrors old system da_status — kept identical so migrated records align
    const DA_CREATED              = 0;  // DA record created by HR
    const DA_FOR_HR_MANAGER       = 1;  // waiting HR Manager signature
    const DA_FOR_SUPERVISOR       = 2;  // waiting Dept Supervisor signature
    const DA_FOR_DEPT_MANAGER     = 3;  // waiting Dept Manager/Head signature
    const DA_FOR_ACKNOWLEDGEMENT  = 4;  // waiting Person Involved to acknowledge
    const DA_ACKNOWLEDGED         = 5;  // fully signed and acknowledged

    const DA_STATUS_LABELS = [
        self::DA_CREATED              => 'For DA',
        self::DA_FOR_HR_MANAGER       => 'For HR Manager',
        self::DA_FOR_SUPERVISOR       => 'DA: For Supervisor',
        self::DA_FOR_DEPT_MANAGER     => 'DA: For Dept Manager',
        self::DA_FOR_ACKNOWLEDGEMENT  => 'For Acknowledgement',
        self::DA_ACKNOWLEDGED         => 'Acknowledged',
    ];

    // ── IR-only companies — these skip the DA phase entirely ─────────────────
    // Employees whose company_id is in this list go through IR but never receive a DA.
    const IR_ONLY_COMPANY_IDS = [5];

    // ── Violation Type (ir_requests.quality_violation) ───────────────────────
    const VIOLATION_ADMINISTRATIVE = 1;
    const VIOLATION_QUALITY        = 2;

    // ── Read Status (ir_requests.read_status) ────────────────────────────────
    const READ_UNREAD = 0;
    const READ_READ   = 1;

    // ── DA Types (ir_list.da_type) ────────────────────────────────────────────
    const DA_VERBAL_WARNING    = 1;
    const DA_WRITTEN_WARNING   = 2;
    const DA_3_DAY_SUSPENSION  = 3;
    const DA_7_DAY_SUSPENSION  = 4;
    const DA_DISMISSAL         = 5;

    const DA_TYPES = [
        self::DA_VERBAL_WARNING    => 'Verbal Warning',
        self::DA_WRITTEN_WARNING   => 'Written Warning',
        self::DA_3_DAY_SUSPENSION  => '3-Day Suspension',
        self::DA_7_DAY_SUSPENSION  => '7-Day Suspension',
        self::DA_DISMISSAL         => 'Dismissal',
    ];

    // ── Display Status list for frontend filter dropdown ─────────────────────
    const IR_DISPLAY_STATUSES = [
        // IR Phase
        'Pending',
        'Disapproved',
        'Letter of Explanation',
        'For Assessment',
        'For Validation',
        'IR: For Dept Approval',
        // DA Phase
        'For DA',
        'For HR Manager',
        'DA: For Supervisor',
        'DA: For Dept Manager',
        'For Acknowledgement',
        'Acknowledged',
        // Closed
        'Invalid',
        'Cancelled',
        'Inactive',
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    public static function irStatusLabel(int $value): string
    {
        return self::IR_STATUS_LABELS[$value] ?? '—';
    }

    public static function daStatusLabel(int $value): string
    {
        return self::DA_STATUS_LABELS[$value] ?? '—';
    }

    public static function daTypeLabel(int $value): string
    {
        return self::DA_TYPES[$value] ?? '—';
    }

    /**
     * Compute the human-readable status label from the new normalized schema.
     * Pass in the ir_request row + eager-loaded relationships.
     *
     * @param  object  $ir          ir_requests row
     * @param  object|null  $hrApproval  ir_approvals row where role='hr'
     * @param  object|null  $svApproval  ir_approvals row where role='sv'
     * @param  object|null  $dhApproval  ir_approvals row where role='dh'
     * @param  object|null  $da          ir_da_requests row (if exists)
     * @param  bool    $hasLoe      whether ir_reasons has a row for this ir_no
     */
    /**
     * Compute the human-readable status label.
     *
     * IR Phase order (matches legacy searchResult.php logic):
     *   Pending → HR validates → Letter of Explanation → For Assessment (SV)
     *   → For Validation (HR re-validates, tracked by hr approval da_sign_date)
     *   → IR: For Dept Approval (DH signs off → sets ir_status=2)
     *
     * DA Phase:
     *   For DA → For HR Manager → DA: For Supervisor → DA: For Dept Manager
     *   → For Acknowledgement (employee) → Acknowledged
     */
    public static function resolveDisplayStatus(
        object $ir,
        ?object $hrApproval,
        ?object $svApproval,
        ?object $dhApproval,
        ?object $da,
        bool $hasLoe
    ): string {
        if ($ir->is_inactive) return 'Inactive';

        switch ($ir->ir_status) {
            case self::IR_PENDING:
                if ($hrApproval?->status === self::APPROVAL_DISAPPROVED) return 'Disapproved';
                return 'Pending';

            case self::IR_VALIDATED:
                if (!$hasLoe) return 'Letter of Explanation';

                // SV hasn't assessed yet
                if (!$svApproval || $svApproval->status === self::APPROVAL_PENDING) return 'For Assessment';

                // SV done — HR needs to re-validate (da_sign_date marks re-validation, not initial validation)
                if (!$hrApproval?->da_sign_date) return 'For Validation';

                // HR re-validated — DH needs to sign off the IR
                if (!$dhApproval || $dhApproval->status === self::APPROVAL_PENDING) return 'IR: For Dept Approval';

                return 'In Progress';

            case self::IR_APPROVED:
                if (!$da) return 'For DA';
                return self::daStatusLabel($da->da_status);

            case self::IR_INVALID:
                return 'Invalid';
            case self::IR_CANCELLED:
                return 'Cancelled';
        }

        return '—';
    }
}

<?php

namespace App\Repositories;

use App\Constants\IrConstants;
use App\Models\IrApproval;
use App\Models\IrCodeNo;
use App\Models\IrDaRequest;
use App\Models\IrList;
use App\Models\IrRequest;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class IrRequestRepository
{
    public function generateIrNo(): string
    {
        $year   = Carbon::now()->year;
        $prefix = $year . '-';

        $last = IrRequest::where('ir_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(ir_no, ' . (strlen($prefix) + 1) . ') AS UNSIGNED) DESC')
            ->lockForUpdate()
            ->value('ir_no');

        $seq = $last ? ((int) substr($last, strlen($prefix)) + 1) : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    public function getActiveCodeNumbers(): \Illuminate\Support\Collection
    {
        return IrCodeNo::where('status', 1)
            ->orderBy('code_number')
            ->get([
                'id',
                'code_number',
                'violation',
                'category',
                'first_offense',
                'second_offense',
                'third_offense',
                'fourth_offense',
                'fifth_offense'
            ]);
    }

    public function getActiveCodeNumbersPaginated(int $page = 1, int $perPage = 15): array
    {
        $query = IrCodeNo::where('status', 1)
            ->orderBy('code_number')
            ->select('id', 'code_number', 'violation', 'category', 'first_offense', 'second_offense', 'third_offense', 'fourth_offense', 'fifth_offense');

        $total = $query->count();
        $items = $query->forPage($page, $perPage)->get();

        return [
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
        ];
    }

    /**
     * @param int   $empId        Logged-in employee ID
     * @param array $filters      Search/filter parameters
     * @param array $staffEmpIds  Direct-report emp_ids from HRIS (empty = regular employee view)
     */
    public function findById(int $id): ?IrRequest
    {
        return IrRequest::with([
            'approvals' => fn ($q) => $q->orderBy('role'),
            'daRequest',
            'irList'    => fn ($q) => $q->orderBy('id'),
            'reasons'   => fn ($q) => $q->orderBy('seq'),
            'appeal',
        ])->find($id);
    }

    public function listPaginated(int $empId, array $filters, array $staffEmpIds = []): LengthAwarePaginator
    {
        $query = IrRequest::with([
            'approvals',
            'daRequest',
            'irList' => fn ($q) => $q->select('ir_no', 'code_no', 'violation', 'da_type', 'offense_no'),
            'reasons' => fn ($q) => $q->limit(1),
        ]);

        // Scope: supervisor sees their direct reports' IRs; regular employee sees only their own
        if (!empty($staffEmpIds)) {
            // If supervisor has selected a specific employee, narrow to that one
            $selectedEmp = !empty($filters['empId']) ? (int) $filters['empId'] : null;
            if ($selectedEmp && in_array($selectedEmp, $staffEmpIds)) {
                $query->where('emp_no', $selectedEmp);
            } else {
                $query->whereIn('emp_no', $staffEmpIds);
            }
        } else {
            $query->where('emp_no', $empId);
        }

        // Active vs History tab
        $tab = $filters['tab'] ?? 'active';
        if ($tab === 'history') {
            // Done: acknowledged, served, invalid, cancelled, inactive
            $query->where(function (Builder $q) {
                $q->where('is_inactive', 1)
                  ->orWhere('ir_status', IrConstants::IR_INVALID)
                  ->orWhere('ir_status', IrConstants::IR_CANCELLED)
                  ->orWhere(fn ($q2) => $q2
                      ->where('ir_status', IrConstants::IR_APPROVED)
                      ->whereHas('daRequest', fn ($d) => $d->where('da_status', IrConstants::DA_ACKNOWLEDGED))
                  );
            });
        } else {
            // Active: still in progress
            $query->where('is_inactive', 0)
                  ->where(function (Builder $q) {
                      $q->whereIn('ir_status', [IrConstants::IR_PENDING, IrConstants::IR_VALIDATED])
                        ->orWhere(fn ($q2) => $q2
                            ->where('ir_status', IrConstants::IR_APPROVED)
                            ->where(fn ($q3) => $q3
                                ->doesntHave('daRequest')
                                ->orWhereHas('daRequest', fn ($d) => $d->where('da_status', '<', IrConstants::DA_ACKNOWLEDGED))
                            )
                        );
                  });
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn (Builder $q) => $q
                ->where('ir_no', 'like', "%{$s}%")
                ->orWhere('emp_no', 'like', "%{$s}%")
                ->orWhereHas('irList', fn ($l) => $l->where('code_no', 'like', "%{$s}%")
                    ->orWhere('violation', 'like', "%{$s}%"))
            );
        }

        if (!empty($filters['status'])) {
            $query = $this->applyStatusFilter($query, $filters['status']);
        }

        if (!empty($filters['start']) && !empty($filters['end'])) {
            $query->whereBetween('date_created', [
                $filters['start'] . ' 00:00:00',
                $filters['end']   . ' 23:59:59',
            ]);
        }

        return $query
            ->orderBy('date_created', 'desc')
            ->paginate((int) ($filters['perPage'] ?? 15))
            ->withQueryString();
    }

    private function applyStatusFilter(Builder $query, string $status): Builder
    {
        return match ($status) {
            'Inactive' => $query->where('is_inactive', 1),

            'Pending' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_PENDING)
                ->whereDoesntHave('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_DISAPPROVED)),

            'Disapproved' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_PENDING)
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->where('status', IrConstants::APPROVAL_DISAPPROVED)),

            'Letter of Explanation' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereDoesntHave('reasons'),

            // SV hasn't approved yet (no row or row is pending)
            'For Assessment' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('reasons')
                ->where(fn (Builder $q) => $q
                    ->doesntHave('approvals', 'and', fn ($a) => $a->where('role', IrConstants::ROLE_SV))
                    ->orWhereHas('approvals', fn ($a) => $a->where('role', IrConstants::ROLE_SV)
                        ->where('status', IrConstants::APPROVAL_PENDING))
                ),

            // SV done, HR hasn't re-validated yet (da_sign_date null on hr approval row)
            'For Validation' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('reasons')
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_SV)
                    ->where('status', IrConstants::APPROVAL_APPROVED))
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->whereNull('da_sign_date')),

            // SV done + HR re-validated (da_sign_date set), DH hasn't signed yet
            'IR: For Dept Approval' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_VALIDATED)
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_SV)
                    ->where('status', IrConstants::APPROVAL_APPROVED))
                ->whereHas('approvals', fn ($q) => $q->where('role', IrConstants::ROLE_HR)
                    ->whereNotNull('da_sign_date'))
                ->where(fn (Builder $q) => $q
                    ->doesntHave('approvals', 'and', fn ($a) => $a->where('role', IrConstants::ROLE_DH))
                    ->orWhereHas('approvals', fn ($a) => $a->where('role', IrConstants::ROLE_DH)
                        ->where('status', IrConstants::APPROVAL_PENDING))
                ),

            'For DA' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->doesntHave('daRequest'),

            'For HR Manager' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_HR_MANAGER)),

            'DA: For Supervisor' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_SUPERVISOR)),

            'DA: For Dept Manager' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_DEPT_MANAGER)),

            'For Acknowledgement' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_FOR_ACKNOWLEDGEMENT)),

            'Acknowledged' => $query->where('is_inactive', 0)
                ->where('ir_status', IrConstants::IR_APPROVED)
                ->whereHas('daRequest', fn ($q) => $q->where('da_status', IrConstants::DA_ACKNOWLEDGED)),

            'Invalid'   => $query->where('is_inactive', 0)->where('ir_status', IrConstants::IR_INVALID),
            'Cancelled' => $query->where('is_inactive', 0)->where('ir_status', IrConstants::IR_CANCELLED),

            default => $query,
        };
    }

    /**
     * List IRs for the given admin role (hr / hr_mngr).
     *
     * $filters['tab'] = 'action'  → only records needing the role's action (default)
     * $filters['tab'] = 'all'     → every IR in the system (history view)
     */
    public function listAdminPaginated(string $adminRole, array $filters): LengthAwarePaginator
    {
        $tab = $filters['tab'] ?? 'action';

        $query = IrRequest::with([
            'approvals',
            'daRequest',
            'irList' => fn ($q) => $q->select('ir_no', 'code_no', 'violation', 'da_type', 'offense_no'),
            'reasons' => fn ($q) => $q->limit(1),
        ]);

        if ($tab === 'all') {
            // No role-based restriction — show the complete record set
            if ($adminRole === 'unknown') {
                $query->whereRaw('0 = 1');
            }
            // Optional status filter (reuse the same applyStatusFilter logic)
            if (!empty($filters['status'])) {
                $query = $this->applyStatusFilter($query, $filters['status']);
            }
        } else {
            // "action" tab — show only what needs this role's attention
            if ($adminRole === 'hr') {
                $query->where('is_inactive', 0)
                    ->where(function (Builder $q) {
                        $q->where('ir_status', IrConstants::IR_PENDING)
                            ->whereDoesntHave('approvals', fn ($a) => $a->where('role', IrConstants::ROLE_HR)
                                ->where('status', IrConstants::APPROVAL_DISAPPROVED))
                          ->orWhere(fn (Builder $q2) => $q2
                              ->where('ir_status', IrConstants::IR_VALIDATED)
                              ->whereHas('reasons')
                              ->whereHas('approvals', fn ($a) => $a->where('role', IrConstants::ROLE_SV)
                                  ->where('status', IrConstants::APPROVAL_APPROVED))
                              ->whereHas('approvals', fn ($a) => $a->where('role', IrConstants::ROLE_HR)
                                  ->whereNull('da_sign_date'))
                          )
                          ->orWhere(fn (Builder $q3) => $q3
                              ->where('ir_status', IrConstants::IR_APPROVED)
                              ->doesntHave('daRequest')
                          );
                    });
            } elseif ($adminRole === 'hr_mngr') {
                $query->where('is_inactive', 0)
                    ->where('ir_status', IrConstants::IR_APPROVED)
                    ->whereHas('daRequest', fn ($d) => $d->where('da_status', IrConstants::DA_FOR_HR_MANAGER));
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn (Builder $q) => $q
                ->where('ir_no', 'like', "%{$s}%")
                ->orWhere('emp_no', 'like', "%{$s}%")
                ->orWhereHas('irList', fn ($l) => $l->where('code_no', 'like', "%{$s}%")
                    ->orWhere('violation', 'like', "%{$s}%"))
            );
        }

        // Status filter works on both tabs
        if ($tab === 'action' && !empty($filters['status'])) {
            $query = $this->applyStatusFilter($query, $filters['status']);
        }

        // Date range filter
        if (!empty($filters['start']) && !empty($filters['end'])) {
            $query->whereBetween('date_created', [
                $filters['start'] . ' 00:00:00',
                $filters['end']   . ' 23:59:59',
            ]);
        }

        return $query
            ->orderBy('date_created', 'desc')
            ->paginate((int) ($filters['perPage'] ?? 15))
            ->withQueryString();
    }

    // ── Process action helpers ────────────────────────────────────────────────

    /**
     * Upsert an approval row's status + optional remarks + sign_date.
     */
    public function updateApprovalStatus(
        string $irNo,
        string $role,
        int $status,
        ?string $remarks = null,
        ?string $signDate = null
    ): void {
        IrApproval::where('ir_no', $irNo)
            ->where('role', $role)
            ->update(array_filter([
                'status'    => $status,
                'remarks'   => $remarks,
                'sign_date' => $signDate,
            ], fn($v) => !is_null($v)));
    }

    /**
     * Ensure an approval row exists for the given role (upsert by ir_no + role).
     */
    public function ensureApproval(string $irNo, string $role, int $approverEmpNo): void
    {
        IrApproval::firstOrCreate(
            ['ir_no' => $irNo, 'role' => $role],
            ['approver_emp_no' => $approverEmpNo, 'status' => IrConstants::APPROVAL_PENDING]
        );
    }

    public function updateIrStatus(IrRequest $ir, int $status, array $extra = []): void
    {
        $ir->update(array_merge(['ir_status' => $status, 'date_updated' => now()], $extra));
    }

    public function replaceLoe(string $irNo, array $reasons): void
    {
        DB::transaction(function () use ($irNo, $reasons) {
            \App\Models\IrReason::where('ir_no', $irNo)->delete();
            foreach ($reasons as $seq => $text) {
                if (trim($text) === '') continue;
                \App\Models\IrReason::create([
                    'ir_no'       => $irNo,
                    'seq'         => $seq + 1,
                    'reason_text' => trim($text),
                ]);
            }
        });
    }

    public function createDaRequest(string $irNo, int $hrEmpNo): IrDaRequest
    {
        return IrDaRequest::create([
            'ir_no'               => $irNo,
            'da_requestor_emp_no' => $hrEmpNo,
            'da_requested_date'   => now()->toDateString(),
            'da_status'           => IrConstants::DA_FOR_HR_MANAGER,
        ]);
    }

    public function updateDaStatus(string $irNo, int $status, array $extra = []): void
    {
        IrDaRequest::where('ir_no', $irNo)
            ->update(array_merge(['da_status' => $status], $extra));
    }

    /**
     * Set da_sign_date on an approval row — used to record HR re-validation
     * without changing the approval status (which was already set at initial validation).
     */
    public function setApprovalDaSignDate(string $irNo, string $role, string $date): void
    {
        IrApproval::where('ir_no', $irNo)->where('role', $role)->update(['da_sign_date' => $date]);
    }

    /**
     * Update IR fields + replace ir_list items after a disapproval edit.
     * Clears the HR disapproval row so it can be re-validated.
     */
    public function resubmitIr(IrRequest $ir, array $data): void
    {
        DB::transaction(function () use ($ir, $data) {
            $ir->update([
                'reference'    => $data['reference'] ?? null,
                'what'         => $data['what'],
                'when_date'    => $data['when_date'],
                'where_loc'    => $data['where_loc'],
                'how'          => $data['how'],
                'date_updated' => now(),
            ]);

            // Replace violation rows
            IrList::where('ir_no', $ir->ir_no)->delete();
            foreach ($data['items'] as $item) {
                $dates = array_filter((array) ($item['date_committed'] ?? []), fn($d) => $d !== '');
                IrList::create([
                    'ir_no'          => $ir->ir_no,
                    'emp_no'         => $ir->emp_no,
                    'code_no'        => $item['code_no'],
                    'violation'      => $item['violation'],
                    'da_type'        => $item['da_type'],
                    'date_committed' => implode(' + ', $dates),
                    'offense_no'     => $item['offense_no'] ?? null,
                    'valid'          => 1,
                    'cleansed'       => 0,
                ]);
            }

            // Remove HR disapproval so HR can re-validate cleanly
            IrApproval::where('ir_no', $ir->ir_no)->where('role', IrConstants::ROLE_HR)->delete();
        });
    }

    public function store(array $data): IrRequest
    {
        return DB::transaction(function () use ($data) {
            $irNo = $this->generateIrNo();

            $ir = IrRequest::create([
                'ir_no'             => $irNo,
                'emp_no'            => $data['emp_no'],
                'requestor_id'      => $data['requestor_id'],
                'quality_violation' => (int) $data['quality_violation'],
                'reference'         => $data['reference'] ?? null,
                'what'              => $data['what'],
                'when_date'         => $data['when_date'],
                'where_loc'         => $data['where_loc'],
                'how'               => $data['how'],
                'ir_status'         => IrConstants::IR_PENDING,
                'read_status'       => IrConstants::READ_UNREAD,
                'is_inactive'       => 0,
                'date_created'      => now(),
                'date_updated'      => now(),
            ]);

            foreach ($data['items'] as $item) {
                // date_committed is an array — join with ' + ' into one column value
                $dates = array_filter((array) ($item['date_committed'] ?? []), fn($d) => $d !== '');
                IrList::create([
                    'ir_no'          => $irNo,
                    'emp_no'         => $data['emp_no'],
                    'code_no'        => $item['code_no'],
                    'violation'      => $item['violation'],
                    'da_type'        => $item['da_type'],
                    'date_committed' => implode(' + ', $dates),
                    'offense_no'     => $item['offense_no'] ?? null,
                    'valid'          => 1,
                    'cleansed'       => 0,
                ]);
            }

            foreach ($data['approvals'] ?? [] as $approval) {
                if (empty($approval['approver_emp_no'])) {
                    continue;
                }
                IrApproval::create([
                    'ir_no'           => $irNo,
                    'role'            => $approval['role'],
                    'approver_emp_no' => $approval['approver_emp_no'],
                    'status'          => 0,
                ]);
            }

            return $ir;
        });
    }
}

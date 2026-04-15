<?php

namespace App\Http\Controllers;

use App\Constants\IrConstants;
use App\Services\IrRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IrController extends Controller
{
    public function __construct(
        protected IrRequestService $service
    ) {}

    public function index(Request $request): Response
    {
        $empId = (int) session('emp_data.emp_id');

        return Inertia::render('IR/IndexIR', [
            'irList'        => fn () => $this->service->getIrList($request, $empId),
            'filters'       => $request->only(['search', 'status', 'tab', 'start', 'end', 'perPage', 'empId']),
            'statusOptions' => IrConstants::IR_DISPLAY_STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('IR/CreateIR', [
            'daTypes'   => IrConstants::DA_TYPES,
            'irStatuses' => IrConstants::IR_STATUS_LABELS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'emp_no'                      => 'required|integer',
            'quality_violation'           => 'required|boolean',
            'reference'                   => 'nullable|string|max:500',
            'what'                        => 'required|string|max:5000',
            'when_date'                   => 'required|date',
            'where_loc'                   => 'required|string|max:500',
            'how'                         => 'required|string|max:5000',
            'items'                       => 'required|array|min:1',
            'items.*.code_no'             => 'required|string|max:250',
            'items.*.violation'           => 'required|string|max:1000',
            'items.*.da_type'             => 'required|integer|min:1',
            'items.*.date_committed'      => 'required|date',
            'items.*.offense_no'          => 'nullable|string|max:250',
            'approvals'                   => 'nullable|array',
            'approvals.*.role'            => 'required|string|in:' . implode(',', IrConstants::APPROVAL_ROLES),
            'approvals.*.approver_name'   => 'nullable|string|max:255',
            'approvals.*.approver_emp_no' => 'nullable|integer',
        ]);

        $requestorId = (int) session('emp_data.emp_id');

        $ir = $this->service->store($validated, $requestorId);

        return redirect()
            ->route('ir.create')
            ->with('success', "Incident Report {$ir->ir_no} submitted successfully.");
    }

    public function searchEmployees(Request $request): JsonResponse
    {
        $query   = trim($request->get('q', ''));
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        return response()->json(
            $this->service->fetchActiveEmployees($query, $page, $perPage)
        );
    }

    public function employeeWorkDetails(int $employid): JsonResponse
    {
        return response()->json($this->service->fetchWorkDetails($employid));
    }

    public function codeNumbers(Request $request): JsonResponse
    {
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 15)));

        return response()->json(
            $this->service->getCodeNumbersPaginated($page, $perPage)
        );
    }
}

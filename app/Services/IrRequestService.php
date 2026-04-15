<?php

namespace App\Services;

use App\Models\IrRequest;
use App\Repositories\IrRequestRepository;

class IrRequestService
{
    public function __construct(
        protected IrRequestRepository $repo,
        protected HrisApiService      $hris,
    ) {}

    public function getFormData(): array
    {
        return [];
    }

    public function getCodeNumbersPaginated(int $page = 1, int $perPage = 15): array
    {
        return $this->repo->getActiveCodeNumbersPaginated($page, $perPage);
    }

    public function store(array $validated, int $requestorId): IrRequest
    {
        $validated['requestor_id'] = $requestorId;

        return $this->repo->store($validated);
    }

    /**
     * Delegate active-employee lookup entirely to HrisApiService.
     * Returns { data: [], hasMore: bool }
     */
    public function fetchActiveEmployees(string $search = '', int $page = 1, int $perPage = 20): array
    {
        return $this->hris->fetchActiveEmployees($search, $page, $perPage);
    }

    public function fetchWorkDetails(int $employid): ?array
    {
        return $this->hris->fetchWorkDetails($employid);
    }
}

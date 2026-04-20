import { useEffect } from "react";
import { createFilterStore } from "@/stores/createFilterStore";

const DEFAULTS = {
    search:  "",
    status:  "",
    tab:     "active",
    start:   "",
    end:     "",
    perPage: 15,
    empId:   "",
};

// One store for the ir.staff route — created once at module level.
const useStore = createFilterStore("ir.staff", ["irList", "filters"], DEFAULTS);

/**
 * Filter state for StaffIR (Supervisor / manager view of direct-report IRs).
 * Hydrates from server-provided initialFilters on every navigation.
 */
export function useStaffFilters(initialFilters = {}) {
    const { filters, hydrate, apply, goToPage } = useStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { hydrate(initialFilters); }, [JSON.stringify(initialFilters)]);

    return {
        filters,
        applyFilters: apply,
        clearFilters: () => apply({ search: "", status: "", start: "", end: "", empId: "" }),
        switchTab:    (tab) => apply({ tab, status: "", search: "", empId: "" }),
        goToPage,
    };
}

import { useEffect } from "react";
import { createFilterStore } from "@/stores/createFilterStore";

const DEFAULTS = {
    search:  "",
    status:  "",
    tab:     "action",
    perPage: 15,
};

// One store for the ir.admin route — created once at module level.
const useStore = createFilterStore("ir.admin", ["irList", "filters"], DEFAULTS);

/**
 * Filter state for AdminIR (HR / HR Manager action inbox + all-records view).
 * Hydrates from server-provided initialFilters on every navigation.
 */
export function useAdminFilters(initialFilters = {}) {
    const { filters, hydrate, apply, goToPage } = useStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { hydrate(initialFilters); }, [JSON.stringify(initialFilters)]);

    return {
        filters,
        applyFilters: apply,
        clearFilters: () => apply({ search: "", status: "" }),
        switchTab:    (tab) => apply({ tab, status: "", search: "" }),
        goToPage,
    };
}

import { create } from "zustand";
import { router } from "@inertiajs/react";

/**
 * Factory that creates a Zustand-backed filter store for a server-paginated list.
 *
 * Usage (one store per page, created at module level in the hook file):
 *   const useStore = createFilterStore("ir.index", ["irList", "filters"], defaults);
 *
 * @param {string}   routeName  - Named Ziggy route, e.g. "ir.index"
 * @param {string[]} onlyProps  - Inertia partial-reload keys, e.g. ["irList","filters"]
 * @param {object}   defaults   - Default filter values (used for hydration fallback)
 */
export function createFilterStore(routeName, onlyProps, defaults = {}) {
    return create((set, get) => ({
        filters: { ...defaults },

        /**
         * Sync the store with server-provided initialFilters.
         * Call once per page mount via useEffect.
         */
        hydrate(initial) {
            set({ filters: { ...defaults, ...initial } });
        },

        /**
         * Merge `changed` into current filters and navigate.
         * Page is NOT included — it always resets to 1 on a filter change.
         */
        apply(changed) {
            const next = { ...get().filters, ...changed };
            set({ filters: next });

            const params = Object.fromEntries(
                Object.entries(next).filter(([, v]) => v !== "" && v !== null && v !== undefined)
            );

            router.get(route(routeName), params, {
                preserveState:  true,
                preserveScroll: true,
                only:           onlyProps,
            });
        },

        /**
         * Navigate to a specific page while keeping current filters.
         */
        goToPage(page) {
            const params = Object.fromEntries(
                Object.entries(get().filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
            );
            router.get(route(routeName), { ...params, page }, {
                preserveState:  true,
                preserveScroll: true,
                only:           onlyProps,
            });
        },
    }));
}

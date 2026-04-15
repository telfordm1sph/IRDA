import { useState } from "react";
import { router } from "@inertiajs/react";

export function useIrFilters(initialFilters = {}) {
    const [filters, setFilters] = useState({
        search:  initialFilters.search  ?? "",
        status:  initialFilters.status  ?? "",
        tab:     initialFilters.tab     ?? "active",
        start:   initialFilters.start   ?? "",
        end:     initialFilters.end     ?? "",
        perPage: initialFilters.perPage ?? 15,
        empId:   initialFilters.empId   ?? "",
    });

    const applyFilters = (changed) => {
        const next = { ...filters, ...changed };
        setFilters(next);

        const params = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        );

        router.get(route("ir.index"), params, {
            preserveState:  true,
            preserveScroll: true,
            only:           ["irList", "filters"],
        });
    };

    const clearFilters = () => applyFilters({ search: "", status: "", start: "", end: "", empId: "" });

    return { filters, applyFilters, clearFilters };
}

import { useState, useEffect } from "react";
import axios from "axios";

export function useEmployee(empNo) {
    const [empMap, setEmpMap] = useState({});
    const [empWorkDetails, setEmpWorkDetails] = useState({});

    useEffect(() => {
        if (empNo) fetchWorkDetails(empNo);
    }, [empNo]);

    const loadEmployees = async (search, page) => {
        const res = await axios.get(route("ir.searchEmployees"), {
            params: { q: search, page, per_page: 20 },
        });

        const employees = res.data?.data ?? [];
        const hasMore = res.data?.hasMore ?? false;

        const patch = {};
        employees.forEach((e) => { patch[String(e.employid)] = e; });
        setEmpMap((prev) => ({ ...prev, ...patch }));

        return {
            options: employees.map((e) => ({
                value: String(e.employid),
                label: `${e.employid} — ${e.emp_name}`,
            })),
            hasMore,
        };
    };

    const fetchWorkDetails = async (employid) => {
        if (!employid) return null;
        const key = String(employid);
        if (empWorkDetails[key]) return empWorkDetails[key];

        try {
            const res = await axios.get(route("ir.employeeWorkDetails", { employid }));
            const details = res.data ?? null;
            setEmpWorkDetails((prev) => ({ ...prev, [key]: details }));
            return details;
        } catch {
            return null;
        }
    };

    const selectedEmp = empNo ? empMap[String(empNo)] : null;
    const selectedWorkDetails = empNo ? empWorkDetails[String(empNo)] : null;

    return { loadEmployees, selectedEmp, selectedWorkDetails, setEmpMap };
}

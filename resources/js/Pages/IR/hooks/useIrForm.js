import { useForm, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { EMPTY_ITEM } from "../components/IrConstants";

export function useIrForm() {
    const { emp_data } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        emp_no: "",
        quality_violation: false,
        reference: "",
        what: "",
        when_date: "",
        where_loc: "",
        how: "",
        items: [{ ...EMPTY_ITEM }],
        approvals: [
            {
                role: "sv",
                approver_name: emp_data?.emp_name ?? "",
                approver_emp_no: emp_data?.emp_id ?? null,
            },
            { role: "hr", approver_name: "", approver_emp_no: null },
            { role: "dh", approver_name: "", approver_emp_no: null },
            { role: "od", approver_name: "", approver_emp_no: null },
        ],
    });

    // ── Items ────────────────────────────────────────────────────────────────
    const addItem = () => setData("items", [...data.items, { ...EMPTY_ITEM }]);

    const removeItem = (i) => {
        if (data.items.length === 1) return;
        setData("items", data.items.filter((_, idx) => idx !== i));
    };

    const updateItem = (i, field, value, codeNumbers = []) => {
        setData(
            "items",
            data.items.map((item, idx) => {
                if (idx !== i) return item;
                const next = { ...item, [field]: value };
                if (field === "code_no") {
                    const code = codeNumbers.find((c) => c.code_number === value);
                    if (code) next.violation = code.violation ?? "";
                }
                return next;
            }),
        );
    };

    // ── Per-item date helpers (date_committed is an array) ────────────────────
    const addDate = (itemIdx) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: [...(item.date_committed ?? [""]), ""] }
        ));

    const removeDate = (itemIdx, dateIdx) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: item.date_committed.filter((_, di) => di !== dateIdx) }
        ));

    const updateDate = (itemIdx, dateIdx, value) =>
        setData("items", data.items.map((item, idx) =>
            idx !== itemIdx ? item
                : { ...item, date_committed: item.date_committed.map((d, di) => di === dateIdx ? value : d) }
        ));

    // ── Approvals ────────────────────────────────────────────────────────────
    const updateApproval = (i, field, value) =>
        setData(
            "approvals",
            data.approvals.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
        );

    // ── Submit ───────────────────────────────────────────────────────────────
    const submit = (e, onSuccess) => {
        e.preventDefault();
        post(route("ir.store"), {
            onSuccess: () => {
                toast.success("Incident Report submitted successfully.");
                reset();
                onSuccess?.();
            },
            onError: () => toast.error("Please fix the highlighted errors before submitting."),
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        addItem,
        removeItem,
        updateItem,
        addDate,
        removeDate,
        updateDate,
        updateApproval,
        submit,
    };
}

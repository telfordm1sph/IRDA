import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import { DatePicker } from "@/Components/ui/date-picker";
import { Combobox } from "@/Components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/Components/ui/dialog";
import {
    AlertCircle,
    Calendar,
    ClipboardCheck,
    FileWarning,
    MapPin,
    Plus,
    Send,
    Trash2,
    User,
    BookOpen,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ── Constants ─────────────────────────────────────────────────────────────────

const DA_TYPES = [
    { value: "1", label: "Verbal Warning",    badgeClass: "bg-green-100 text-green-700 border-green-200" },
    { value: "2", label: "Written Warning",   badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "3", label: "3-Day Suspension",  badgeClass: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "4", label: "7-Day Suspension",  badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: "5", label: "Dismissal",         badgeClass: "bg-red-100 text-red-700 border-red-200" },
];

function OffenseBadge({ value }) {
    const da = DA_TYPES.find((d) => d.value === String(value));
    if (!da) return <span className="text-muted-foreground">—</span>;
    return <Badge className={cn("whitespace-nowrap", da.badgeClass)}>{da.label}</Badge>;
}

const EMPTY_ITEM = {
    code_no: "",
    violation: "",
    da_type: "",
    date_committed: "",
    offense_no: "",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function FieldError({ message }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {message}
        </p>
    );
}

function SectionCard({ icon: Icon, title, children, className }) {
    return (
        <Card className={cn("shadow-sm", className)}>
            <CardHeader className="px-6 py-4 border-b bg-muted/30 rounded-t-xl">
                <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                    </span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">{children}</CardContent>
        </Card>
    );
}

function ReadOnlyField({
    label,
    value,
    placeholder = "Auto-filled on selection",
}) {
    return (
        <div>
            <Label className="mb-1.5 block text-muted-foreground text-xs uppercase tracking-wide">
                {label}
            </Label>
            <Input
                readOnly
                value={value ?? ""}
                placeholder={placeholder}
                className="bg-muted/40 text-sm"
            />
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CreateIR() {
    const { emp_data, flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Cache raw HRIS employee objects by employid for auto-fill
    const [empMap, setEmpMap] = useState({});
    const [empWorkDetails, setEmpWorkDetails] = useState({});
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [codeNumbers, setCodeNumbers] = useState([]);
    const [codeLoading, setCodeLoading] = useState(false);
    const [codePage, setCodePage] = useState(1);
    const [codeTotalPages, setCodeTotalPages] = useState(1);
    const [codePerPage] = useState(15);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);

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

    const handleSelectCode = (codeNo) => {
        const code = codeNumbers.find((c) => c.code_number === codeNo);
        if (code && selectedItemIndex !== null) {
            setData(
                "items",
                data.items.map((item, idx) => {
                    if (idx === selectedItemIndex) {
                        return {
                            ...item,
                            code_no: code.code_number,
                            violation: code.violation ?? "",
                        };
                    }
                    return item;
                }),
            );
            setCodeModalOpen(false);
            setSelectedItemIndex(null);
        }
    };

    // ── Employee loader ─────────────────────────────────────────────────────
    // Uses HrisApiService::fetchActiveEmployees via ir.searchEmployees endpoint.
    // Combobox handles debounce + scroll-based pagination automatically.
    useEffect(() => {
        if (data.emp_no) {
            fetchEmployeeWorkDetails(data.emp_no);
        }
    }, [data.emp_no]);

    const loadEmployees = async (search, page) => {
        const res = await axios.get(route("ir.searchEmployees"), {
            params: { q: search, page, per_page: 20 },
        });

        const employees = res.data?.data ?? [];
        const hasMore = res.data?.hasMore ?? false;

        // Cache raw objects so auto-fill works after selection
        const patch = {};
        employees.forEach((e) => {
            patch[String(e.employid)] = e;
        });
        setEmpMap((prev) => ({ ...prev, ...patch }));

        return {
            options: employees.map((e) => ({
                value: String(e.employid),
                label: `${e.employid} — ${e.emp_name}`,
            })),
            hasMore,
        };
    };

    const fetchEmployeeWorkDetails = async (employid) => {
        if (!employid) {
            return null;
        }

        const key = String(employid);
        if (empWorkDetails[key]) {
            return empWorkDetails[key];
        }

        try {
            const res = await axios.get(
                route("ir.employeeWorkDetails", { employid }),
            );
            const details = res.data ?? null;
            setEmpWorkDetails((prev) => ({ ...prev, [key]: details }));
            return details;
        } catch (error) {
            return null;
        }
    };

    const selectedEmp = data.emp_no ? empMap[String(data.emp_no)] : null;
    const selectedWorkDetails = data.emp_no
        ? empWorkDetails[String(data.emp_no)]
        : null;

    const fetchCodeNumbers = async (page = 1) => {
        setCodeLoading(true);
        try {
            const res = await axios.get(route("ir.codeNumbers"), {
                params: { page, per_page: codePerPage },
            });
            if (page === 1) {
                setCodeNumbers(res.data?.data ?? []);
            } else {
                setCodeNumbers((prev) => [...prev, ...(res.data?.data ?? [])]);
            }
            setCodePage(res.data?.current_page ?? 1);
            setCodeTotalPages(res.data?.last_page ?? 1);
        } catch (error) {
            toast.error("Failed to load code numbers");
        } finally {
            setCodeLoading(false);
        }
    };

    const loadCodeOptions = async (search, page) => {
        if (codeNumbers.length === 0) {
            await fetchCodeNumbers(1);
        }

        const filtered = codeNumbers.filter(
            (c) =>
                c.code_number.includes(search) ||
                (c.violation ?? "")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
        );

        return {
            options: filtered.map((c) => ({
                value: c.code_number,
                label: `${c.code_number}`,
            })),
            hasMore: false,
        };
    };

    const addItem = () => setData("items", [...data.items, { ...EMPTY_ITEM }]);
    const removeItem = (i) => {
        if (data.items.length === 1) return;
        setData(
            "items",
            data.items.filter((_, idx) => idx !== i),
        );
    };
    const updateItem = (i, field, value) => {
        setData(
            "items",
            data.items.map((item, idx) => {
                if (idx !== i) return item;
                const next = { ...item, [field]: value };
                if (field === "code_no") {
                    const code = codeNumbers.find(
                        (c) => c.code_number === value,
                    );
                    if (code) next.violation = code.violation ?? "";
                }
                return next;
            }),
        );
    };

    // ── Approvals ───────────────────────────────────────────────────────────
    const updateApproval = (i, field, value) =>
        setData(
            "approvals",
            data.approvals.map((a, idx) =>
                idx === i ? { ...a, [field]: value } : a,
            ),
        );

    // ── Submit ──────────────────────────────────────────────────────────────
    const submit = (e) => {
        e.preventDefault();
        post(route("ir.store"), {
            onSuccess: () => {
                reset();
                setEmpMap({});
            },
            onError: () => toast.error("Please fix the highlighted errors."),
        });
    };

    const approvalMeta = [
        { label: "Reported by", sublabel: "Name", readOnly: true },
        { label: "For Validation", sublabel: "HR Personnel", readOnly: false },
        { label: "For Approval", sublabel: "Approver 1", readOnly: false },
        { label: "For Approval", sublabel: "Approver 2", readOnly: false },
    ];

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <AuthenticatedLayout>
            <Head title="Create Incident Report" />

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <FileWarning className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            I. Incident Report
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Fill in all required fields and submit to initiate
                            the IR process.
                        </p>
                    </div>
                </div>

                {/* Only date shown — IR No is assigned on submit to prevent conflicts */}
                <Badge
                    variant="secondary"
                    className="text-xs gap-1.5 px-3 py-1.5 self-start sm:self-auto"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(), "MMM d, yyyy")}
                </Badge>
            </div>

            <form onSubmit={submit} className="space-y-5 w-full">
                {/* ── 1. Person Involved ── */}
                <SectionCard icon={User} title="Details of Person Involved">
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-1.5 block">
                                Employee No.{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div
                                className={cn(
                                    errors.emp_no &&
                                        "[&_button]:border-destructive [&_button]:ring-1 [&_button]:ring-destructive",
                                )}
                            >
                                <Combobox
                                    value={data.emp_no}
                                    onChange={(val) =>
                                        setData("emp_no", val ?? "")
                                    }
                                    loadOptions={loadEmployees}
                                    placeholder="Search by employee no. or name…"
                                    className="h-9"
                                />
                            </div>
                            <FieldError message={errors.emp_no} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ReadOnlyField
                                label="Employee Name"
                                value={selectedEmp?.emp_name}
                            />
                            <ReadOnlyField
                                label="Shift / Team"
                                value={
                                    selectedWorkDetails
                                        ? [
                                              selectedWorkDetails.shift_type,
                                              selectedWorkDetails.team,
                                          ]
                                              .filter(Boolean)
                                              .join(" / ")
                                        : ""
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ReadOnlyField
                                label="Department"
                                value={
                                    selectedWorkDetails?.emp_dept ??
                                    selectedWorkDetails?.emp_dept_id ??
                                    ""
                                }
                            />
                            <ReadOnlyField
                                label="Station"
                                value={
                                    selectedWorkDetails?.emp_station ??
                                    selectedWorkDetails?.emp_station_id ??
                                    ""
                                }
                            />
                            <ReadOnlyField
                                label="Product Line"
                                value={
                                    selectedWorkDetails?.emp_prodline ??
                                    selectedWorkDetails?.emp_prodline_id ??
                                    ""
                                }
                            />
                        </div>

                        <div className="sm:max-w-xs">
                            <ReadOnlyField
                                label="Position"
                                value={
                                    selectedWorkDetails?.emp_position ??
                                    selectedWorkDetails?.emp_position_id ??
                                    ""
                                }
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ── 2. Statement of Facts ── */}
                <SectionCard
                    icon={MapPin}
                    title="Statement of Facts / Incident Details"
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="what" className="mb-1.5 block">
                                What <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="what"
                                placeholder="Describe what happened…"
                                value={data.what}
                                onChange={(e) =>
                                    setData("what", e.target.value)
                                }
                                className={cn(
                                    "min-h-[96px] resize-none text-sm",
                                    errors.what && "border-destructive",
                                )}
                            />
                            <FieldError message={errors.what} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1.5 block">
                                    When{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <DatePicker
                                    value={data.when_date}
                                    onChange={(v) =>
                                        setData("when_date", v ?? "")
                                    }
                                    placeholder="Select date…"
                                    clearable={false}
                                    className="h-9 w-full"
                                />
                                <FieldError message={errors.when_date} />
                            </div>
                            <div>
                                <Label
                                    htmlFor="where_loc"
                                    className="mb-1.5 block"
                                >
                                    Where{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="where_loc"
                                    placeholder="Location of the incident…"
                                    value={data.where_loc}
                                    onChange={(e) =>
                                        setData("where_loc", e.target.value)
                                    }
                                    className={cn(
                                        "text-sm",
                                        errors.where_loc &&
                                            "border-destructive",
                                    )}
                                />
                                <FieldError message={errors.where_loc} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="how" className="mb-1.5 block">
                                How / Other Information{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="how"
                                placeholder="Describe how it happened and other relevant information…"
                                value={data.how}
                                onChange={(e) => setData("how", e.target.value)}
                                className={cn(
                                    "min-h-[96px] resize-none text-sm",
                                    errors.how && "border-destructive",
                                )}
                            />
                            <FieldError message={errors.how} />
                        </div>
                    </div>
                </SectionCard>

                {/* ── 3. Violation Details ── */}
                <SectionCard icon={AlertCircle} title="Violation Details">
                    <div className="space-y-5">
                        {/* Admin / Quality radio */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                Please check the appropriate box and indicate
                                the reference no. for quality violation:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { value: false, label: "Administrative" },
                                    { value: true, label: "Quality" },
                                ].map(({ value, label }) => {
                                    const active =
                                        data.quality_violation === value;
                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "quality_violation",
                                                    value,
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left",
                                                active
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-input bg-background text-foreground hover:border-muted-foreground",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                                                    active
                                                        ? "border-primary bg-primary/10"
                                                        : "border-input",
                                                )}
                                            >
                                                {active && (
                                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                                )}
                                            </span>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reference doc (Quality only) */}
                        {data.quality_violation && (
                            <div className="max-w-md animate-in fade-in slide-in-from-top-1 duration-150">
                                <Label
                                    htmlFor="reference"
                                    className="mb-1.5 block"
                                >
                                    Reference Document (IPN / QDN / SQS){" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="reference"
                                    placeholder="Enter reference document number…"
                                    value={data.reference}
                                    onChange={(e) =>
                                        setData("reference", e.target.value)
                                    }
                                    className={cn(
                                        "text-sm",
                                        errors.reference &&
                                            "border-destructive",
                                    )}
                                />
                                <FieldError message={errors.reference} />
                            </div>
                        )}

                        <Separator />

                        {/* Violations table */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label>
                                    Violations{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="h-7 text-xs gap-1.5 border-dashed"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </Button>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[700px]">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                {[
                                                    ["Code No.", "w-36"],
                                                    [
                                                        "Violation / Nature of Offense",
                                                        "",
                                                    ],
                                                    ["D.A.", "w-44"],
                                                    ["Date Committed", "w-40"],
                                                    ["No. of Offense", "w-28"],
                                                    ["", "w-10"],
                                                ].map(([h, w], i) => (
                                                    <th
                                                        key={i}
                                                        className={cn(
                                                            "text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                                                            w,
                                                        )}
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((item, idx) => (
                                                <tr
                                                    key={idx}
                                                    className={cn(
                                                        "border-b last:border-0",
                                                        idx % 2 !== 0 &&
                                                            "bg-muted/20",
                                                    )}
                                                >
                                                    <td className="px-2 py-2">
                                                        <div className="flex gap-1">
                                                            <Combobox
                                                                loadOptions={
                                                                    loadCodeOptions
                                                                }
                                                                value={
                                                                    item.code_no
                                                                }
                                                                onChange={(v) =>
                                                                    updateItem(
                                                                        idx,
                                                                        "code_no",
                                                                        v ?? "",
                                                                    )
                                                                }
                                                                placeholder="---"
                                                                clearable={
                                                                    false
                                                                }
                                                                allowCustomValue={
                                                                    false
                                                                }
                                                                className="h-8 text-xs flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedItemIndex(
                                                                        idx,
                                                                    );
                                                                    setCodeModalOpen(
                                                                        true,
                                                                    );
                                                                    if (
                                                                        codeNumbers.length ===
                                                                        0
                                                                    ) {
                                                                        fetchCodeNumbers(
                                                                            1,
                                                                        );
                                                                    }
                                                                }}
                                                                className="h-8 px-2 text-xs"
                                                            >
                                                                <BookOpen className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Input
                                                            readOnly
                                                            value={
                                                                item.violation
                                                            }
                                                            placeholder="Auto-filled on code selection"
                                                            className="h-8 text-xs bg-muted/40"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Combobox
                                                            options={DA_TYPES}
                                                            value={item.da_type}
                                                            onChange={(v) =>
                                                                updateItem(
                                                                    idx,
                                                                    "da_type",
                                                                    v ?? "",
                                                                )
                                                            }
                                                            placeholder="— Select DA —"
                                                            clearable={false}
                                                            allowCustomValue={
                                                                false
                                                            }
                                                            className="h-8 text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <DatePicker
                                                            value={
                                                                item.date_committed
                                                            }
                                                            onChange={(v) =>
                                                                updateItem(
                                                                    idx,
                                                                    "date_committed",
                                                                    v ?? "",
                                                                )
                                                            }
                                                            placeholder="Pick date…"
                                                            clearable={false}
                                                            className="h-8 w-full"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Input
                                                            placeholder="e.g. 1st"
                                                            value={
                                                                item.offense_no
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    idx,
                                                                    "offense_no",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-8 text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                removeItem(idx)
                                                            }
                                                            disabled={
                                                                data.items
                                                                    .length ===
                                                                1
                                                            }
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <FieldError message={errors.items} />
                        </div>
                    </div>
                </SectionCard>

                {/* ── 4. Approval & Validation ── */}
                <SectionCard
                    icon={ClipboardCheck}
                    title="Approval & Validation"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        {approvalMeta.map(
                            ({ label, sublabel, readOnly }, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-[minmax(0,1fr)_14rem] gap-3 items-start"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                            {label}
                                        </p>
                                        <Input
                                            value={
                                                data.approvals[idx]
                                                    ?.approver_name ?? ""
                                            }
                                            onChange={(e) =>
                                                !readOnly &&
                                                updateApproval(
                                                    idx,
                                                    "approver_name",
                                                    e.target.value,
                                                )
                                            }
                                            readOnly={
                                                readOnly ||
                                                !data.approvals[idx]
                                                    ?.approver_name
                                            }
                                            disabled={
                                                readOnly ||
                                                !data.approvals[idx]
                                                    ?.approver_name
                                            }
                                            placeholder={
                                                readOnly
                                                    ? ""
                                                    : `Enter ${sublabel} name…`
                                            }
                                            className={cn(
                                                "text-sm",
                                                readOnly ||
                                                    !data.approvals[idx]
                                                        ?.approver_name
                                                    ? "bg-muted/40"
                                                    : "",
                                            )}
                                        />
                                        <p className="text-[11px] text-left text-muted-foreground mt-1.5">
                                            {sublabel}
                                        </p>
                                    </div>
                                    <div className="w-full min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                            Date
                                        </p>
                                        {readOnly ? (
                                            <Input
                                                readOnly
                                                value={format(
                                                    new Date(),
                                                    "MMM d, yyyy",
                                                )}
                                                className="h-9 w-full text-sm bg-muted/40"
                                            />
                                        ) : (
                                            <DatePicker
                                                value={
                                                    data.approvals[idx]
                                                        ?.sign_date ?? ""
                                                }
                                                onChange={(v) =>
                                                    updateApproval(
                                                        idx,
                                                        "sign_date",
                                                        v ?? "",
                                                    )
                                                }
                                                placeholder="Pick date…"
                                                className="h-9 w-full"
                                                disabled={
                                                    !data.approvals[idx]
                                                        ?.approver_name
                                                }
                                                clearable={false}
                                            />
                                        )}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </SectionCard>

                {/* ── Submit ── */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                        disabled={processing}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="min-w-[130px] gap-2 px-6"
                    >
                        {processing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* ── Code Numbers Modal ── */}
            <Dialog
                open={codeModalOpen}
                onOpenChange={(open) => {
                    setCodeModalOpen(open);
                    if (!open) setSelectedItemIndex(null);
                }}
            >
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogTitle>
                        Browse Code Numbers{" "}
                        {selectedItemIndex !== null
                            ? `for Violation ${selectedItemIndex + 1}`
                            : ""}
                    </DialogTitle>
                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                Code No.
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                Violation
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                1st Offense
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                2nd Offense
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                3rd Offense
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                4th Offense
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                                                5th Offense
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase w-20">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {codeNumbers.map((code) => (
                                            <tr
                                                key={code.id}
                                                className="border-b last:border-0 hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-2">
                                                    {code.code_number}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {code.violation || "—"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <OffenseBadge value={code.first_offense} />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <OffenseBadge value={code.second_offense} />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <OffenseBadge value={code.third_offense} />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <OffenseBadge value={code.fourth_offense} />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <OffenseBadge value={code.fifth_offense} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSelectCode(
                                                                code.code_number,
                                                            )
                                                        }
                                                        className="px-3 py-1 text-xs font-semibold shadow-sm"
                                                    >
                                                        Select
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {codeLoading && (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                Loading...
                            </div>
                        )}

                        {codePage < codeTotalPages && !codeLoading && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fetchCodeNumbers(codePage + 1)}
                                className="w-full"
                            >
                                Load More
                            </Button>
                        )}

                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                Close
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

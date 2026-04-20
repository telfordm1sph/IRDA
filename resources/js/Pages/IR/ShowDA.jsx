import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    FileWarning,
    ArrowLeft,
    User,
    ShieldCheck,
    ClipboardList,
    FileCheck,
    CheckCircle,
    Printer,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { SectionCard, OffenseBadge } from "./components/IrShared";
import { IrStatusBadge } from "./components/IrStatusBadge";
import { PrintableDA } from "./components/PrintableDA";
import {
    safeFormat,
    safeFormatDT,
    formatMultiDates,
    firstDate,
} from "@/utils/dateFormat";

function ReadField({ label, value, mono = false }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {label}
            </p>
            <p
                className={`text-sm font-medium ${mono ? "font-mono" : ""} ${!value ? "text-muted-foreground" : ""}`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

// ── Cleansing date logic (matches legacy PHP) ─────────────────────────────────
const CLEANSING_MONTHS = { A: 6, B: 9, C: 12, D: 18 };

function cleansingDate(codeNo, dateCommitted) {
    const letter = codeNo?.match(/[a-zA-Z]/)?.[0]?.toUpperCase();
    const months = CLEANSING_MONTHS[letter];
    if (!months || !dateCommitted) return null;
    const d = new Date(dateCommitted);
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + months);
    return safeFormat(d.toISOString(), "MM-dd-yyyy");
}

function cleansingLabel(codeNo) {
    const letter = codeNo?.match(/[a-zA-Z]/)?.[0]?.toUpperCase();
    if (!letter || letter === "E") return "Dismissal";
    const months = CLEANSING_MONTHS[letter];
    return months ? `${months} months` : "—";
}

// ── Signature block for DA form ───────────────────────────────────────────────
function DaSignatureBlock({
    label,
    name,
    date,
    pending = false,
    center = false,
}) {
    return (
        <div className={`space-y-1.5 ${center ? "text-center" : ""}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {label}
            </p>
            <div className="border-b pb-1 min-h-[40px] flex items-end justify-center">
                {name ? (
                    <span className="text-sm font-medium">{name}</span>
                ) : (
                    <span className="text-xs text-muted-foreground italic">
                        {pending ? "Pending" : "—"}
                    </span>
                )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
                {date || "—"}
            </p>
        </div>
    );
}

const DA_TYPE_LABELS = {
    1: "Verbal Warning",
    2: "Written Warning",
    3: "3 Days Suspension",
    4: "7 Days Suspension",
    5: "Dismissal",
};

function FlashBanner() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    const isSuccess = !!flash.success;
    return (
        <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-4 ${
                isSuccess
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-800"
            }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">
                {flash.success ?? flash.error}
            </p>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShowDA({ ir, hash, currentUserRole, currentEmpId }) {
    const byRole = Object.fromEntries(
        (ir.approvals ?? []).map((a) => [a.role, a]),
    );
    const hrApproval = byRole["hr"];
    const svApproval = byRole["sv"];
    const dhApproval = byRole["dh"];
    const hrMngrApproval = byRole["hr_mngr"];

    const da = ir.da_request ?? {};

    // Total suspension days (da_type 3 = 3 days, 4 = 7 days)
    const totalDays = (ir.violations ?? []).reduce((sum, v) => {
        return sum + (Number(v.days_no) || 0);
    }, 0);

    const isAcknowledged = !!da.acknowledge_da;

    return (
        <AuthenticatedLayout>
            <Head title={`DA — ${ir.ir_no}`} />

            {/* Hidden printable layout — shown only when window.print() is called */}
            <PrintableDA ir={ir} />

            <FlashBanner />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <FileCheck className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight">
                                Notice of Disciplinary Action
                            </h1>
                            <span className="font-mono text-muted-foreground text-sm">
                                {ir.ir_no}
                            </span>
                            <IrStatusBadge status={ir.display_status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Issued{" "}
                            {safeFormat(da.da_requested_date, "MMMM d, yyyy") ??
                                "—"}
                            {da.da_requestor_name &&
                                ` by ${da.da_requestor_name}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                    {isAcknowledged && currentUserRole === "hr" && (
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-3.5 h-3.5" /> Print DA
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.get(route("ir.show", hash))}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> View IR
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.get(route("ir.index"))}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                </div>
            </div>

            <div className="space-y-4 print:hidden">
                {/* I. Employee Details */}
                <SectionCard icon={User} title="I. Details of Person Involved">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                        <ReadField
                            label="Employee No."
                            value={ir.emp_no}
                            mono
                        />
                        <ReadField
                            label="Shift / Team"
                            value={
                                [ir.shift, ir.team]
                                    .filter(Boolean)
                                    .join(" / ") || null
                            }
                        />
                        <ReadField label="Employee Name" value={ir.emp_name} />
                        <ReadField label="Station" value={ir.station} />
                        <ReadField label="Position" value={ir.position} />
                        <ReadField label="Department" value={ir.department} />
                        <ReadField label="Product Line" value={ir.prodline} />
                    </div>
                </SectionCard>

                {/* II. Cleansing Period */}
                <SectionCard icon={ShieldCheck} title="II. Cleansing Period">
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            {
                                label: "Verbal Warning",
                                months: "6 Months",
                                border: "border-l-4 border-l-gray-400",
                            },
                            {
                                label: "Written Warning",
                                months: "9 Months",
                                border: "border-l-4 border-l-green-600",
                            },
                            {
                                label: "3 Days Suspension",
                                months: "12 Months",
                                border: "border-l-4 border-l-teal-600",
                            },
                            {
                                label: "7 Days Suspension",
                                months: "18 Months",
                                border: "border-l-4 border-l-yellow-500",
                            },
                            {
                                label: "Dismissal",
                                months: "--",
                                border: "border-l-4 border-l-red-600",
                            },
                        ].map(({ label, months, border }) => (
                            <div
                                key={label}
                                className={`rounded-md border bg-muted/30 px-3 py-3 text-center ${border}`}
                            >
                                <p className="text-xs font-semibold text-foreground">
                                    {label}
                                </p>
                                <p className="text-xs italic text-muted-foreground mt-1">
                                    {months}
                                </p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* III. DA Violations Table */}
                <SectionCard
                    icon={ClipboardList}
                    title="III. Disciplinary Action Details"
                >
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="bg-muted/40 border-b">
                                    {[
                                        "Code No.",
                                        "Violation / Nature of Offense",
                                        "D.A. Type",
                                        "Date Committed",
                                        "Offense No.",
                                        "Schedule of Suspension",
                                        "Cleansing Date",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(ir.violations ?? []).map((v, i) => (
                                    <tr
                                        key={i}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                                            {v.code_no}
                                        </td>
                                        <td className="px-4 py-3 text-sm max-w-[220px]">
                                            {v.violation}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <OffenseBadge value={v.da_type} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {formatMultiDates(v.date_committed)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {v.offense_no ? (
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-xs"
                                                >
                                                    {v.offense_no}
                                                </Badge>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            {v.date_of_suspension ? (
                                                safeFormat(
                                                    v.date_of_suspension,
                                                    "MM-dd-yyyy",
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                            {v.days_no ? (
                                                <span className="ml-1 text-muted-foreground">
                                                    ({v.days_no}d)
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            {cleansingDate(
                                                v.code_no,
                                                firstDate(v.date_committed),
                                            ) ?? (
                                                <span className="text-muted-foreground">
                                                    {Number(v.da_type) === 5
                                                        ? "Dismissal"
                                                        : "—"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!ir.violations?.length && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            No violations recorded.
                                        </td>
                                    </tr>
                                )}
                                {/* Total days row */}
                                {totalDays > 0 && (
                                    <tr className="bg-muted/20 font-medium">
                                        <td
                                            colSpan={5}
                                            className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase tracking-wide"
                                        >
                                            Total No. of Days:
                                        </td>
                                        <td className="px-4 py-2.5 text-xs font-semibold">
                                            {totalDays} day
                                            {totalDays !== 1 ? "s" : ""}
                                        </td>
                                        <td />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>

                {/* IV. Commitment Letter */}
                <SectionCard icon={FileWarning} title="IV. Commitment Letter">
                    <div className="rounded-md border bg-muted/20 px-5 py-5 text-sm leading-relaxed space-y-3">
                        <p>
                            I,{" "}
                            <span className="font-semibold">
                                {ir.emp_name || "___________________"}
                            </span>
                            , fully understand the disciplinary action imposed
                            upon me. I commit to strictly adhere to the company
                            rules, regulations, and policies. I understand that
                            any repetition of the same or similar infraction
                            will result in a more severe disciplinary action.
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                            (Employee signature of acknowledgement appears
                            below)
                        </p>
                    </div>
                </SectionCard>

                {/* V. Employee Acknowledgement */}
                <SectionCard
                    icon={isAcknowledged ? CheckCircle : FileCheck}
                    title="V. Employee Acknowledgement"
                >
                    {isAcknowledged ? (
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-700">
                                    Acknowledged by {ir.emp_name}
                                </p>
                                {da.acknowledge_date && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {safeFormat(
                                            da.acknowledge_date,
                                            "MMMM d, yyyy",
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            Awaiting employee acknowledgement.
                        </p>
                    )}
                </SectionCard>

                {/* VI. DA Approval Signatures */}
                <SectionCard icon={ShieldCheck} title="VI. Approval Signatures">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                        {/* Issued to — employee */}
                        <DaSignatureBlock
                            label="Issued to"
                            name={ir.emp_name}
                            date={safeFormatDT(da.acknowledge_date)}
                            pending={!da.acknowledge_da}
                        />
                        {/* Issued by — HR (uses hr approval, falls back to da requestor) */}
                        <DaSignatureBlock
                            label="Issued by (HR)"
                            name={
                                hrApproval?.approver_name ??
                                da.da_requestor_name
                            }
                            date={safeFormatDT(
                                hrApproval?.sign_date ?? da.da_requested_date,
                            )}
                        />
                        {/* HR Manager — da_status=2 signer (hr_mngr role) */}
                        <DaSignatureBlock
                            label="Acknowledged by (HR Manager)"
                            name={hrMngrApproval?.approver_name ?? null}
                            date={safeFormatDT(hrMngrApproval?.sign_date)}
                            pending={!hrMngrApproval?.sign_date}
                        />
                        {/* Supervisor — da_sign_date from sv approval */}
                        <DaSignatureBlock
                            label="Acknowledged by (Supervisor)"
                            name={
                                svApproval?.da_sign_date
                                    ? svApproval?.approver_name
                                    : null
                            }
                            date={safeFormatDT(svApproval?.da_sign_date)}
                            pending={!svApproval?.da_sign_date}
                        />
                        {/* Dept Head / Manager — da_sign_date from dh approval */}
                        <DaSignatureBlock
                            label="Acknowledged by (Dept Manager)"
                            name={
                                dhApproval?.da_sign_date
                                    ? dhApproval?.approver_name
                                    : null
                            }
                            date={safeFormatDT(dhApproval?.da_sign_date)}
                            pending={!dhApproval?.da_sign_date}
                        />
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}

import { format } from "date-fns";
import {
    safeFormat,
    safeFormatDT,
    formatMultiDates,
    firstDate,
} from "@/utils/dateFormat";

// ── helpers ───────────────────────────────────────────────────────────────────
const CLEANSING_MONTHS = { A: 6, B: 9, C: 12, D: 18 };

function cleansingDate(codeNo, dateCommitted) {
    const letter = codeNo?.match(/[a-zA-Z]/)?.[0]?.toUpperCase();
    const months = CLEANSING_MONTHS[letter];
    if (!months || !dateCommitted) return null;
    const d = new Date(dateCommitted);
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + months);
    return format(d, "MM-dd-yyyy");
}

// Print-specific: date only (returns "—" for null, unlike safeFormat which returns null)
const fmtDate = (dateStr, f = "MM/dd/yyyy") => safeFormat(dateStr, f) ?? "—";

// Print-specific: date + time, lowercase am/pm
const fmtDT = (dateStr) => safeFormatDT(dateStr, "MM/dd/yyyy", true) ?? "—";

const DA_TYPE_LABELS = {
    1: "Verbal Warning",
    2: "Written Warning",
    3: "3 Days Suspension",
    4: "7 Days Suspension",
    5: "Dismissal",
};

// Build Day1=date(Day), Day2=date(Day), ... skipping Sundays
function buildSchedule(dateOfSuspension, daysNo) {
    const days = Number(daysNo);
    if (!dateOfSuspension || days <= 0) return "—";
    const lines = [];
    let d = new Date(dateOfSuspension);
    let count = 0;
    let safety = 0;
    while (count < days && safety < 60) {
        if (d.getDay() !== 0) {
            // skip Sunday
            lines.push(
                `Day${count + 1} = ${format(d, "MM/dd/yyyy")} (${format(d, "EEE")})`,
            );
            count++;
        }
        d.setDate(d.getDate() + 1);
        safety++;
    }
    return lines.join("\n");
}

// ── Cell / Row primitives ─────────────────────────────────────────────────────
const border = "1px solid #000";
const cellBase = { border, padding: "3px 6px", fontSize: 11 };
const headerCell = {
    ...cellBase,
    fontWeight: 700,
    textAlign: "center",
    backgroundColor: "#f8f8f8",
};
const blueLabel = { fontSize: 10, fontWeight: 700, color: "#1565c0" };

// ── PrintableDA ───────────────────────────────────────────────────────────────
export function PrintableDA({ ir }) {
    const da = ir.da_request ?? {};
    const byRole = Object.fromEntries(
        (ir.approvals ?? []).map((a) => [a.role, a]),
    );
    const hrApproval = byRole["hr"];
    const svApproval = byRole["sv"];
    const dhApproval = byRole["dh"];
    const hrMngrApproval = byRole["hr_mngr"];

    const totalDays = (ir.violations ?? []).reduce(
        (s, v) => s + (Number(v.days_no) || 0),
        0,
    );

    const sigRows = [
        {
            label: "Issued to:",
            name: ir.emp_name,
            role: "Name",
            date: fmtDT(da.acknowledge_date),
            dateLabel: "Date",
        },
        {
            label: "Issued by :",
            name: hrApproval?.approver_name ?? da.da_requestor_name,
            role: "HR Personnel",
            date: fmtDT(hrApproval?.sign_date ?? da.da_requested_date),
            dateLabel: "Date:",
        },
        {
            label: "Acknowledge by :",
            name: hrMngrApproval?.approver_name ?? null,
            role: "HR Manager",
            date: fmtDT(hrMngrApproval?.sign_date),
            dateLabel: "Date:",
        },
        {
            label: "Acknowledge by :",
            name: svApproval?.approver_name ?? null,
            role: "Approver 1",
            date: fmtDT(svApproval?.da_sign_date),
            dateLabel: "Date:",
        },
        {
            label: "Acknowledge by :",
            name: dhApproval?.approver_name ?? null,
            role: "Approver 2",
            date: fmtDT(dhApproval?.da_sign_date),
            dateLabel: "Date:",
        },
    ];

    return (
        <>
            {/* ── Print-scoped styles ── */}
            <style>{`
        @media print {
            @page { margin: 12mm 14mm; size: A4 portrait; }
            body * { visibility: hidden !important; }
            .irda-print-root,
            .irda-print-root * { 
                visibility: visible !important;
                font-family: Arial, Helvetica, sans-serif !important; /* Force font */
            }
            .irda-print-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
            }
        }
    `}</style>

            <div
                className="irda-print-root hidden print:block"
                style={{
                    fontFamily: "'Helvetica', 'Arial', 'Segoe UI', sans-serif",
                    color: "#000",
                    lineHeight: 1.4,
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                    }}
                >
                    <img
                        src="/Telford.png"
                        alt="Telford"
                        style={{ height: 44 }}
                    />
                    <div>
                        <div
                            style={{
                                fontWeight: 800,
                                fontSize: 13,
                                letterSpacing: 3,
                            }}
                        >
                            TELFORD
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>
                            TELFORD SVC. PHILS., INC.
                        </div>
                    </div>
                </div>

                <h2
                    style={{
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: 15,
                        margin: "0 0 8px",
                    }}
                >
                    NOTICE OF DISCIPLINARY ACTION
                </h2>

                {/* ── IR No + Date ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: 8,
                    }}
                >
                    <tbody>
                        <tr>
                            <td style={{ width: "58%", border: "none" }} />
                            <td
                                style={{
                                    ...cellBase,
                                    fontWeight: 700,
                                    width: "10%",
                                }}
                            >
                                IR No.
                            </td>
                            <td style={{ ...cellBase, width: "32%" }}>
                                {ir.ir_no}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: "none" }} />
                            <td style={{ ...cellBase, fontWeight: 700 }}>
                                Date
                            </td>
                            <td style={cellBase}>
                                {fmtDate(
                                    da.da_requested_date ?? ir.date_created,
                                    "MM/dd/yyyy",
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── Employee info ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: 8,
                    }}
                >
                    <tbody>
                        <tr>
                            <td
                                colSpan={2}
                                style={{ ...cellBase, ...blueLabel }}
                            >
                                Employee no
                            </td>
                            <td
                                colSpan={4}
                                style={{ ...cellBase, ...blueLabel }}
                            >
                                Shift/Team
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan={2}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {ir.emp_no}
                            </td>
                            <td
                                colSpan={4}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {[ir.shift, ir.team]
                                    .filter(Boolean)
                                    .join(" / ") || "—"}
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan={2}
                                style={{ ...cellBase, ...blueLabel }}
                            >
                                Employee name
                            </td>
                            <td
                                colSpan={4}
                                style={{ ...cellBase, ...blueLabel }}
                            >
                                Position
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan={2}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {ir.emp_name}
                            </td>
                            <td
                                colSpan={4}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {ir.position}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    ...cellBase,
                                    ...blueLabel,
                                    width: "34%",
                                }}
                            >
                                Department
                            </td>
                            <td
                                colSpan={2}
                                style={{
                                    ...cellBase,
                                    ...blueLabel,
                                    width: "33%",
                                }}
                            >
                                Station
                            </td>
                            <td
                                colSpan={3}
                                style={{
                                    ...cellBase,
                                    ...blueLabel,
                                    width: "33%",
                                }}
                            >
                                Product line
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...cellBase, fontSize: 12 }}>
                                {ir.department}
                            </td>
                            <td
                                colSpan={2}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {ir.station}
                            </td>
                            <td
                                colSpan={3}
                                style={{ ...cellBase, fontSize: 12 }}
                            >
                                {ir.prodline}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p
                    style={{
                        fontStyle: "italic",
                        fontWeight: 600,
                        fontSize: 12,
                        marginBottom: 4,
                    }}
                >
                    Violations based on company code of conduct
                </p>

                {/* ── Violations table ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: 10,
                    }}
                >
                    <thead>
                        <tr>
                            {[
                                ["Code\nno.", "8%"],
                                ["Violation/Nature of\noffenses", "22%"],
                                ["D.A", "12%"],
                                ["Date\ncommitted", "11%"],
                                ["No. of\noffense", "7%"],
                                ["Schedule of\nsuspension", "26%"],
                                ["Cleansing\nDate", "14%"],
                            ].map(([h, w]) => (
                                <th
                                    key={h}
                                    style={{
                                        ...headerCell,
                                        width: w,
                                        whiteSpace: "pre-line",
                                        verticalAlign: "bottom",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(ir.violations ?? []).map((v, i) => (
                            <tr key={i}>
                                <td
                                    style={{
                                        ...cellBase,
                                        textAlign: "center",
                                        fontWeight: 700,
                                    }}
                                >
                                    {v.code_no}
                                </td>
                                <td style={cellBase}>{v.violation}</td>
                                <td
                                    style={{ ...cellBase, textAlign: "center" }}
                                >
                                    <span
                                        style={{
                                            border: "1px solid #444",
                                            borderRadius: 10,
                                            padding: "1px 7px",
                                            fontSize: 10,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {DA_TYPE_LABELS[String(v.da_type)] ??
                                            v.da_type}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        ...cellBase,
                                        whiteSpace: "pre-line",
                                        fontSize: 10,
                                    }}
                                >
                                    {formatMultiDates(
                                        v.date_committed,
                                        "yyyy-MM-dd",
                                    )}
                                </td>
                                <td
                                    style={{ ...cellBase, textAlign: "center" }}
                                >
                                    {v.offense_no ?? "—"}
                                </td>
                                <td
                                    style={{
                                        ...cellBase,
                                        whiteSpace: "pre-line",
                                        fontSize: 10,
                                    }}
                                >
                                    {buildSchedule(
                                        v.date_of_suspension,
                                        v.days_no,
                                    )}
                                </td>
                                <td
                                    style={{ ...cellBase, textAlign: "center" }}
                                >
                                    {cleansingDate(
                                        v.code_no,
                                        firstDate(v.date_committed),
                                    ) ??
                                        (Number(v.da_type) === 5
                                            ? "Dismissal"
                                            : "—")}
                                </td>
                            </tr>
                        ))}
                        {!ir.violations?.length && (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{
                                        ...cellBase,
                                        textAlign: "center",
                                        color: "#666",
                                    }}
                                >
                                    No violations recorded.
                                </td>
                            </tr>
                        )}
                        {totalDays > 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        ...cellBase,
                                        textAlign: "right",
                                        fontWeight: 700,
                                    }}
                                >
                                    TOTAL NO. OF DAYS(if suspension):
                                </td>
                                <td
                                    colSpan={2}
                                    style={{
                                        ...cellBase,
                                        textAlign: "center",
                                        fontWeight: 700,
                                    }}
                                >
                                    {totalDays}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ── Commitment Letter ── */}
                <h3
                    style={{
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: 14,
                        margin: "0 0 6px",
                    }}
                >
                    COMMITMENT LETTER
                </h3>
                <p style={{ fontSize: 11, lineHeight: 1.65, marginBottom: 6 }}>
                    I, <u style={{ fontStyle: "italic" }}>{ir.emp_name}</u>,
                    understand the seriousness of my actions and the potential
                    consequences that may arise from such violations. I want to
                    assure you that I take full responsibility for my behavior
                    and am committed to rectifying the situation. Moving
                    forward, I pledge to adhere to all rules, policies, and
                    guidelines set forth the company (Telford Svc. Phils. Inc).
                </p>
                <p
                    style={{
                        fontSize: 10,
                        fontStyle: "italic",
                        lineHeight: 1.55,
                        marginBottom: 20,
                        color: "#333",
                    }}
                >
                    (Ako {ir.emp_name}, ay nauunawaan ang kahalagahan ng aking
                    mga kilos at ang posibleng mga kahihinatnan na maaaring
                    maging bunga ng aking mga paglabag. Nais kong tiyakin sa
                    inyo na ako'y lubos na nagmamalasakit sa aking pag-uugali at
                    determinadong ituwid ang sitwasyon. Sa paglipas ng panahon,
                    ako'y sumusumpang sumunod sa lahat ng mga alituntunin,
                    patakaran, at mga patnubay na itinakda ng kumpanya (Telford
                    Svc. Phils. Inc). )
                </p>

                {/* ── Employee acknowledgment signature ── */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div
                        style={{
                            display: "inline-block",
                            borderBottom: "1px solid #000",
                            minWidth: 280,
                            paddingBottom: 2,
                            fontSize: 12,
                        }}
                    >
                        {ir.emp_name}
                        {da.acknowledge_date
                            ? ` / ${fmtDate(da.acknowledge_date)}`
                            : ""}
                    </div>
                    <div
                        style={{
                            ...blueLabel,
                            textAlign: "center",
                            marginTop: 3,
                        }}
                    >
                        Employee's name / date
                    </div>
                </div>

                {/* ── Signature rows ── */}
                {sigRows.map(({ label, name, role, date, dateLabel }, i) => (
                    <div
                        key={i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0 28px",
                            marginBottom: 14,
                        }}
                    >
                        {/* Left: name */}
                        <div>
                            <div style={{ ...blueLabel, marginBottom: 3 }}>
                                {label}
                            </div>
                            <div
                                style={{
                                    borderBottom: "1px solid #000",
                                    minHeight: 22,
                                    fontSize: 12,
                                    paddingBottom: 2,
                                }}
                            >
                                {name ?? ""}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    fontStyle: "italic",
                                    color: "#1565c0",
                                    marginTop: 2,
                                    textAlign: "center",
                                }}
                            >
                                {role}
                            </div>
                        </div>

                        {/* Right: date */}
                        <div>
                            <div style={{ ...blueLabel, marginBottom: 3 }}>
                                {dateLabel}
                            </div>
                            <div
                                style={{
                                    border,
                                    padding: "2px 6px",
                                    minHeight: 22,
                                    fontSize: 12,
                                }}
                            >
                                {date}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

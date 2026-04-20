import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Calendar, FileWarning, Send } from "lucide-react";
import { format } from "date-fns";

import { useIrForm }      from "./hooks/useIrForm";
import { useEmployee }    from "./hooks/useEmployee";
import { useCodeNumbers } from "./hooks/useCodeNumbers";

import { EmployeeSection }       from "./components/EmployeeSection";
import { IncidentDetailsSection } from "./components/IncidentDetailsSection";
import { ViolationSection }       from "./components/ViolationSection";
import { ApprovalSection }        from "./components/ApprovalSection";
import { CodeNumberModal }        from "./components/CodeNumberModal";

export default function CreateIR() {

    const {
        data, setData, errors, processing,
        addItem, removeItem, updateItem,
        addDate, removeDate, updateDate,
        updateApproval, submit,
    } = useIrForm();

    const { loadEmployees, selectedEmp, selectedWorkDetails, setEmpMap } = useEmployee(data.emp_no);

    const {
        codeNumbers, codeLoading, codePage, codeTotalPages,
        codeModalOpen, selectedItemIndex,
        fetchCodeNumbers, loadCodeOptions, openModal, closeModal,
    } = useCodeNumbers();

    const handleSelectCode = (codeNo) => {
        const code = codeNumbers.find((c) => c.code_number === codeNo);
        if (code && selectedItemIndex !== null) {
            updateItem(selectedItemIndex, "code_no", code.code_number, codeNumbers);
            closeModal();
        }
    };

    const handleSubmit = (e) => {
        submit(e, () => setEmpMap({}));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Incident Report" />

            {/* Page header */}
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
                            Fill in all required fields and submit to initiate the IR process.
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="text-xs gap-1.5 px-3 py-1.5 self-start sm:self-auto">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(), "MMM d, yyyy")}
                </Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 w-full">
                <EmployeeSection
                    empNo={data.emp_no}
                    setEmpNo={(val) => setData("emp_no", val)}
                    errors={errors}
                    loadEmployees={loadEmployees}
                    selectedEmp={selectedEmp}
                    selectedWorkDetails={selectedWorkDetails}
                />

                <IncidentDetailsSection
                    data={data}
                    setData={setData}
                    errors={errors}
                />

                <ViolationSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    updateItem={(idx, field, value) => updateItem(idx, field, value, codeNumbers)}
                    addItem={addItem}
                    removeItem={removeItem}
                    addDate={addDate}
                    removeDate={removeDate}
                    updateDate={updateDate}
                    loadCodeOptions={loadCodeOptions}
                    openModal={openModal}
                />

                <ApprovalSection
                    approvals={data.approvals}
                    updateApproval={updateApproval}
                />

                {/* Submit */}
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
                    <Button type="submit" disabled={processing} className="min-w-[130px] gap-2 px-6">
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

            <CodeNumberModal
                open={codeModalOpen}
                onOpenChange={(open) => { if (!open) closeModal(); }}
                selectedItemIndex={selectedItemIndex}
                codeNumbers={codeNumbers}
                codeLoading={codeLoading}
                codePage={codePage}
                codeTotalPages={codeTotalPages}
                onSelect={handleSelectCode}
                onLoadMore={() => fetchCodeNumbers(codePage + 1)}
            />
        </AuthenticatedLayout>
    );
}

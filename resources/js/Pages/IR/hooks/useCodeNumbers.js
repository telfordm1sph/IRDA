import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useCodeNumbers() {
    const [codeNumbers, setCodeNumbers] = useState([]);
    const [codeLoading, setCodeLoading] = useState(false);
    const [codePage, setCodePage] = useState(1);
    const [codeTotalPages, setCodeTotalPages] = useState(1);
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);

    const PER_PAGE = 15;

    const fetchCodeNumbers = async (page = 1) => {
        setCodeLoading(true);
        try {
            const res = await axios.get(route("ir.codeNumbers"), {
                params: { page, per_page: PER_PAGE },
            });
            if (page === 1) {
                setCodeNumbers(res.data?.data ?? []);
            } else {
                setCodeNumbers((prev) => [...prev, ...(res.data?.data ?? [])]);
            }
            setCodePage(res.data?.current_page ?? 1);
            setCodeTotalPages(res.data?.last_page ?? 1);
        } catch {
            toast.error("Failed to load code numbers");
        } finally {
            setCodeLoading(false);
        }
    };

    const loadCodeOptions = async (search) => {
        if (codeNumbers.length === 0) await fetchCodeNumbers(1);

        const filtered = codeNumbers.filter(
            (c) =>
                c.code_number.includes(search) ||
                (c.violation ?? "").toLowerCase().includes(search.toLowerCase()),
        );

        return {
            options: filtered.map((c) => ({ value: c.code_number, label: c.code_number })),
            hasMore: false,
        };
    };

    const openModal = (itemIndex) => {
        setSelectedItemIndex(itemIndex);
        setCodeModalOpen(true);
        if (codeNumbers.length === 0) fetchCodeNumbers(1);
    };

    const closeModal = () => {
        setCodeModalOpen(false);
        setSelectedItemIndex(null);
    };

    return {
        codeNumbers,
        codeLoading,
        codePage,
        codeTotalPages,
        codeModalOpen,
        selectedItemIndex,
        fetchCodeNumbers,
        loadCodeOptions,
        openModal,
        closeModal,
    };
}

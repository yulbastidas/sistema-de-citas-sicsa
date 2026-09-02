"use client";

import {
    type FormEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useState,
    useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    AlertCircle,
    BarChart3,
    CalendarCheck2,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileDown,
    FileSpreadsheet,
    FileText,
    Filter,
    LoaderCircle,
    Printer,
    RefreshCcw,
    ShieldCheck,
    UserRoundX,
    UsersRound,
    XCircle,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import AdminSidebar from "@/app/components/AdminSidebar";
import {
    getToken,
    getUser,
    type SessionUser,
} from "@/service/session";
import {
    getDashboardReport,
    getNoShowsReport,
    type DashboardReportResponse,
    type NoShowRecord,
    type ReportFilters,
} from "@/service/reports";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://74.161.42.39:3000";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type AppointmentRecord = {
    appointmentId: number;
    date: string;
    time: string;
    status: string;
    priority: string;
    reason: string | null;
    observations: string | null;
    eps: string | null;
    municipality: string | null;
    department: string | null;

    patientId: number;
    patientName: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    email: string;

    doctorId: number | null;
    doctorName: string;

    specialtyId: number | null;
    specialtyName: string;
};

type AppointmentsResponse = {
    total: number;
    filters: ReportFilters;
    data: AppointmentRecord[];
};

type TableView = "appointments" | "no-shows";

const EMPTY_FILTERS: ReportFilters = {
    startDate: "",
    endDate: "",
    status: "",
    priority: "",
    eps: "",
    municipality: "",
};

const REPORT_ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<string, string> = {
    confirmada: "#2563eb",
    confirmado: "#2563eb",
    atendida: "#16a34a",
    atendido: "#16a34a",
    completada: "#16a34a",
    completado: "#16a34a",
    cancelada: "#dc2626",
    cancelado: "#dc2626",
    lista_espera: "#7c3aed",
    pendiente: "#f59e0b",
    solicitada: "#8b5cf6",
    solicitado: "#8b5cf6",
    "no asistida": "#ea580c",
    "no asistió": "#ea580c",
    "no asistio": "#ea580c",
    inasistencia: "#ea580c",
};

function buildQueryParams(filters: ReportFilters): string {
    const params = new URLSearchParams();

    if (filters.startDate) {
        params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
        params.set("endDate", filters.endDate);
    }

    if (filters.specialtyId) {
        params.set(
            "specialtyId",
            String(filters.specialtyId),
        );
    }

    if (filters.doctorId) {
        params.set("doctorId", String(filters.doctorId));
    }

    if (filters.patientId) {
        params.set("patientId", String(filters.patientId));
    }

    if (filters.status) {
        params.set("status", filters.status);
    }

    if (filters.priority) {
        params.set("priority", filters.priority);
    }

    if (filters.eps) {
        params.set("eps", filters.eps);
    }

    if (filters.municipality) {
        params.set(
            "municipality",
            filters.municipality,
        );
    }

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "";
}

async function getAppointmentsReport(
    filters: ReportFilters,
): Promise<AppointmentsResponse> {
    const token = getToken();

    if (!token) {
        throw new Error(
            "No existe una sesión activa. Inicia sesión nuevamente.",
        );
    }

    const queryParams = buildQueryParams(filters);

    const response = await fetch(
        `${API_URL}/reports/appointments${queryParams}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        },
    );

    if (response.status === 401) {
        throw new Error(
            "La sesión expiró. Inicia sesión nuevamente.",
        );
    }

    if (response.status === 403) {
        throw new Error(
            "No tienes permiso para consultar los reportes.",
        );
    }

    if (!response.ok) {
        let message =
            "No fue posible consultar el detalle de citas.";

        try {
            const result = await response.json();

            if (typeof result?.message === "string") {
                message = result.message;
            }

            if (Array.isArray(result?.message)) {
                message = result.message.join(", ");
            }
        } catch { }

        throw new Error(message);
    }

    return response.json() as Promise<AppointmentsResponse>;
}

function getStatusColor(status: string): string {
    return (
        STATUS_COLORS[status?.toLowerCase().trim()] ||
        "#64748b"
    );
}

function formatStatus(status: string): string {
    if (!status) {
        return "Sin estado";
    }

    return status
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}

function formatMonth(month: string): string {
    if (!month) {
        return "";
    }

    const [year, monthNumber] = month.split("-");

    if (!year || !monthNumber) {
        return month;
    }

    const date = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1,
    );

    return new Intl.DateTimeFormat("es-CO", {
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatDate(date: string): string {
    if (!date) {
        return "Sin fecha";
    }

    const normalizedDate = date.includes("T")
        ? date.split("T")[0]
        : date;

    const parsedDate = new Date(
        `${normalizedDate}T00:00:00`,
    );

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(parsedDate);
}

function formatTime(time: string): string {
    if (!time) {
        return "Sin hora";
    }

    return time.slice(0, 5);
}

function formatGenerationDate(): string {
    return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date());
}

function getAppliedRange(
    filters: ReportFilters,
): string {
    if (filters.startDate && filters.endDate) {
        return `${formatDate(filters.startDate)} al ${formatDate(
            filters.endDate,
        )}`;
    }

    if (filters.startDate) {
        return `Desde ${formatDate(filters.startDate)}`;
    }

    if (filters.endDate) {
        return `Hasta ${formatDate(filters.endDate)}`;
    }

    return "Todo el periodo disponible";
}

function getFilterDescription(
    filters: ReportFilters,
): string[] {
    return [
        `Periodo: ${getAppliedRange(filters)}`,
        `Estado: ${filters.status
            ? formatStatus(filters.status)
            : "Todos los estados"
        }`,
        `Prioridad: ${filters.priority
            ? formatStatus(filters.priority)
            : "Todas las prioridades"
        }`,
        `EPS: ${filters.eps || "Todas las EPS"}`,
        `Municipio: ${filters.municipality ||
        "Todos los municipios"
        }`,
    ];
}

function escapeCsvValue(value: unknown): string {
    const text =
        value === null || value === undefined
            ? ""
            : String(value);

    return `"${text.replaceAll('"', '""')}"`;
}

function downloadBlob(
    blob: Blob,
    filename: string,
) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const isClient = useSyncExternalStore(
        subscribeToClient,
        getClientSnapshot,
        getServerSnapshot,
    );
    const currentUser = isClient
        ? (getUser() as SessionUser | null)
        : null;
    const router = useRouter();

    const [checkingAuth, setCheckingAuth] =
        useState(true);

    const [loading, setLoading] = useState(true);

    const [exporting, setExporting] =
        useState<string>("");

    const [dashboard, setDashboard] =
        useState<DashboardReportResponse | null>(null);

    const [appointments, setAppointments] = useState<
        AppointmentRecord[]
    >([]);

    const [noShows, setNoShows] = useState<
        NoShowRecord[]
    >([]);

    const [filters, setFilters] =
        useState<ReportFilters>(EMPTY_FILTERS);

    const [appliedFilters, setAppliedFilters] =
        useState<ReportFilters>({});

    const [activeTable, setActiveTable] =
        useState<TableView>("appointments");

    const [tablePage, setTablePage] = useState(1);

    const [error, setError] = useState("");

    useEffect(() => {
        const token = getToken();
        const user = getUser() as SessionUser | null;

        if (!token || !user) {
            router.replace("/login?role=admin");
            return;
        }

        const isAdmin =
            user.role === "admin" ||
            user.role === 1 ||
            user.role === "1";

        if (
            !isAdmin ||
            user.canViewReports !== true
        ) {
            router.replace("/dashboard/admin");
            return;
        }

        setCheckingAuth(false);
    }, [router]);

    const loadReports = useCallback(
        async (selectedFilters: ReportFilters) => {
            try {
                setLoading(true);
                setError("");

                const [
                    dashboardResponse,
                    appointmentsResponse,
                    noShowsResponse,
                ] = await Promise.all([
                    getDashboardReport(selectedFilters),
                    getAppointmentsReport(selectedFilters),
                    getNoShowsReport(selectedFilters),
                ]);

                setDashboard(dashboardResponse);
                setAppointments(
                    appointmentsResponse.data ?? [],
                );
                setNoShows(noShowsResponse.data ?? []);
            } catch (requestError: unknown) {
                const message =
                    requestError instanceof Error
                        ? requestError.message
                        : "Ocurrió un error consultando los reportes.";

                setError(message);
                setDashboard(null);
                setAppointments([]);
                setNoShows([]);

                if (
                    message.toLowerCase().includes("sesión") ||
                    message.toLowerCase().includes("sesion")
                ) {
                    router.replace("/login?role=admin");
                }
            } finally {
                setLoading(false);
            }
        },
        [router],
    );

    useEffect(() => {
        if (checkingAuth) {
            return;
        }

        void loadReports(appliedFilters);
    }, [
        checkingAuth,
        appliedFilters,
        loadReports,
    ]);

    function handleFilterChange(
        field: keyof ReportFilters,
        value: string,
    ) {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [field]: value,
        }));
    }

    function applyFilters(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (
            filters.startDate &&
            filters.endDate &&
            filters.startDate > filters.endDate
        ) {
            setError(
                "La fecha inicial no puede ser mayor que la fecha final.",
            );
            return;
        }

        setTablePage(1);
        setAppliedFilters({
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            status: filters.status || undefined,
            priority: filters.priority || undefined,
            eps: filters.eps?.trim() || undefined,
            municipality:
                filters.municipality?.trim() || undefined,
        });
    }

    function clearFilters() {
        setTablePage(1);
        setFilters(EMPTY_FILTERS);
        setAppliedFilters({});
        setError("");
    }

    function reloadReports() {
        void loadReports(appliedFilters);
    }

    async function exportToExcel() {
        if (!dashboard) {
            setError(
                "No hay citas disponibles para exportar.",
            );
            return;
        }

        try {
            setExporting("excel");
            setError("");

            const exportAppointments = (
                await getAppointmentsReport({ ...appliedFilters, exportMode: "all" })
            ).data ?? [];
            if (exportAppointments.length === 0) throw new Error("No hay citas disponibles para exportar.");

            const XLSX = await import("xlsx");

            const summary = dashboard.summary;

            const summaryRows = [
                ["E.S.E. Hospital Clarita Santos"],
                ["SICSA - Reporte de control de citas"],
                [],
                ["Fecha de generación", formatGenerationDate()],
                [
                    "Generado por",
                    currentUser?.email || "Usuario autorizado",
                ],
                [],
                ["FILTROS APLICADOS"],
                ["Periodo", getAppliedRange(appliedFilters)],
                [
                    "Estado",
                    appliedFilters.status
                        ? formatStatus(appliedFilters.status)
                        : "Todos los estados",
                ],
                [
                    "Prioridad",
                    appliedFilters.priority
                        ? formatStatus(appliedFilters.priority)
                        : "Todas las prioridades",
                ],
                ["EPS", appliedFilters.eps || "Todas las EPS"],
                [
                    "Municipio",
                    appliedFilters.municipality || "Todos los municipios",
                ],
                [],
                ["RESUMEN DEL REPORTE"],
                ["Indicador", "Valor"],
                ["Total de citas", summary.totalAppointments],
                ["Pacientes", summary.totalPatients],
                ["Atendidas", summary.attended],
                ["Confirmadas", summary.confirmed],
                ["Canceladas", summary.cancelled],
                ["Pendientes", summary.pending],
                ["Inasistencias", summary.noShow],
                [
                    "Tasa de inasistencia",
                    `${summary.noShowRate}%`,
                ],
                [
                    "Citas del mes",
                    summary.appointmentsThisMonth,
                ],
            ];

            const appointmentRows = exportAppointments.map(
                (item) => ({
                    Fecha: formatDate(item.date),
                    Hora: formatTime(item.time),
                    Estado: formatStatus(item.status),
                    Prioridad: formatStatus(item.priority),
                    Paciente: item.patientName,
                    "Tipo documento": item.documentType,
                    Documento: item.documentNumber,
                    Teléfono: item.phone,
                    Correo: item.email,
                    Especialidad: item.specialtyName,
                    Médico: item.doctorName,
                    EPS: item.eps || "Sin EPS",
                    Departamento:
                        item.department || "Sin departamento",
                    Municipio:
                        item.municipality || "Sin municipio",
                    "Motivo de consulta":
                        item.reason || "Sin información",
                    Observaciones:
                        item.observations || "Sin observaciones",
                }),
            );

            const noShowRows = noShows.map((item) => ({
                Fecha: formatDate(item.date),
                Hora: formatTime(item.time),
                Paciente: item.patientName,
                Documento: item.documentNumber,
                Teléfono: item.phone,
                Correo: item.email,
                Especialidad: item.specialtyName,
                Médico: item.doctorName,
                EPS: item.eps || "Sin EPS",
                Municipio:
                    item.municipality || "Sin municipio",
                Estado: formatStatus(item.status),
            }));

            const statusRows =
                dashboard.charts.appointmentsByStatus.map(
                    (item) => ({
                        Estado: formatStatus(item.status),
                        Total: item.total,
                    }),
                );

            const specialtyRows =
                dashboard.charts.appointmentsBySpecialty.map(
                    (item) => ({
                        Especialidad: item.specialty,
                        Total: item.total,
                    }),
                );

            const workbook = XLSX.utils.book_new();

            const summarySheet =
                XLSX.utils.aoa_to_sheet(summaryRows);

            const createInstitutionalSheet = (
                title: string,
                rows: Record<string, unknown>[],
            ) => {
                const sheet = XLSX.utils.aoa_to_sheet([
                    ["E.S.E. Hospital Clarita Santos"],
                    [`SICSA - ${title}`],
                    [
                        "Generado",
                        formatGenerationDate(),
                    ],
                    [],
                ]);

                XLSX.utils.sheet_add_json(sheet, rows, {
                    origin: "A5",
                });

                const columnCount = Math.max(
                    Object.keys(rows[0] || {}).length,
                    2,
                );
                const lastColumn = XLSX.utils.encode_col(
                    columnCount - 1,
                );

                sheet["!merges"] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
                ];
                sheet["!rows"] = [
                    { hpt: 24 },
                    { hpt: 21 },
                    { hpt: 18 },
                    { hpt: 8 },
                    { hpt: 24 },
                ];

                if (rows.length > 0) {
                    sheet["!autofilter"] = {
                        ref: `A5:${lastColumn}${rows.length + 5}`,
                    };
                }

                return sheet;
            };

            const appointmentsSheet = createInstitutionalSheet(
                "Todas las citas",
                appointmentRows,
            );

            const noShowsSheet = createInstitutionalSheet(
                "Inasistencias",
                noShowRows,
            );

            const statusSheet = createInstitutionalSheet(
                "Citas por estado",
                statusRows,
            );

            const specialtySheet = createInstitutionalSheet(
                "Citas por especialidad",
                specialtyRows,
            );

            summarySheet["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
                { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
                { s: { r: 13, c: 0 }, e: { r: 13, c: 1 } },
            ];
            summarySheet["!rows"] = [
                { hpt: 26 },
                { hpt: 22 },
                { hpt: 8 },
                { hpt: 19 },
                { hpt: 19 },
                { hpt: 8 },
                { hpt: 22 },
            ];

            summarySheet["!cols"] = [
                { wch: 35 },
                { wch: 30 },
            ];

            appointmentsSheet["!cols"] = [
                { wch: 13 },
                { wch: 9 },
                { wch: 15 },
                { wch: 12 },
                { wch: 30 },
                { wch: 15 },
                { wch: 18 },
                { wch: 16 },
                { wch: 28 },
                { wch: 25 },
                { wch: 25 },
                { wch: 22 },
                { wch: 18 },
                { wch: 18 },
                { wch: 38 },
                { wch: 38 },
            ];

            noShowsSheet["!cols"] = [
                { wch: 13 },
                { wch: 9 },
                { wch: 30 },
                { wch: 18 },
                { wch: 16 },
                { wch: 28 },
                { wch: 25 },
                { wch: 25 },
                { wch: 22 },
                { wch: 18 },
                { wch: 16 },
            ];

            statusSheet["!cols"] = [
                { wch: 28 },
                { wch: 14 },
            ];

            specialtySheet["!cols"] = [
                { wch: 38 },
                { wch: 14 },
            ];

            XLSX.utils.book_append_sheet(
                workbook,
                summarySheet,
                "Resumen",
            );

            XLSX.utils.book_append_sheet(
                workbook,
                appointmentsSheet,
                "Todas las citas",
            );

            XLSX.utils.book_append_sheet(
                workbook,
                noShowsSheet,
                "Inasistencias",
            );

            XLSX.utils.book_append_sheet(
                workbook,
                statusSheet,
                "Citas por estado",
            );

            XLSX.utils.book_append_sheet(
                workbook,
                specialtySheet,
                "Por especialidad",
            );

            const today = new Date()
                .toISOString()
                .split("T")[0];

            XLSX.writeFile(
                workbook,
                `reporte-citas-sicsa-${today}.xlsx`,
            );
        } catch {
            setError(
                "No fue posible generar el archivo Excel.",
            );
        } finally {
            setExporting("");
        }
    }

    function exportToCsv() {
        void (async () => { try {
            setExporting("csv");
            setError("");

            const exportAppointments = (
                await getAppointmentsReport({ ...appliedFilters, exportMode: "all" })
            ).data ?? [];
            if (exportAppointments.length === 0) throw new Error("No hay citas disponibles para exportar.");

            const headers = [
                "Fecha",
                "Hora",
                "Estado",
                "Prioridad",
                "Paciente",
                "Tipo documento",
                "Documento",
                "Telefono",
                "Correo",
                "Especialidad",
                "Medico",
                "EPS",
                "Departamento",
                "Municipio",
                "Motivo de consulta",
                "Observaciones",
            ];

            const rows = exportAppointments.map((item) => [
                formatDate(item.date),
                formatTime(item.time),
                formatStatus(item.status),
                formatStatus(item.priority),
                item.patientName,
                item.documentType,
                item.documentNumber,
                item.phone,
                item.email,
                item.specialtyName,
                item.doctorName,
                item.eps || "Sin EPS",
                item.department || "Sin departamento",
                item.municipality || "Sin municipio",
                item.reason || "",
                item.observations || "",
            ]);

            const csvContent = [
                headers.map(escapeCsvValue).join(","),
                ...rows.map((row) =>
                    row.map(escapeCsvValue).join(","),
                ),
            ].join("\n");

            const blob = new Blob(
                [`\uFEFF${csvContent}`],
                {
                    type: "text/csv;charset=utf-8;",
                },
            );

            const today = new Date()
                .toISOString()
                .split("T")[0];

            downloadBlob(
                blob,
                `reporte-citas-sicsa-${today}.csv`,
            );
        } catch {
            setError(
                "No fue posible generar el archivo CSV.",
            );
        } finally {
            setExporting("");
        } })();
    }

    async function exportToPdf() {
        if (!dashboard) {
            setError(
                "No hay citas disponibles para exportar.",
            );
            return;
        }

        try {
            setExporting("pdf");
            setError("");

            const exportAppointments = (
                await getAppointmentsReport({ ...appliedFilters, exportMode: "all" })
            ).data ?? [];
            if (exportAppointments.length === 0) throw new Error("No hay citas disponibles para exportar.");

            const { jsPDF } = await import("jspdf");
            const autoTableModule = await import(
                "jspdf-autotable"
            );

            const autoTable = autoTableModule.default;

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const summary = dashboard.summary;

            doc.setFontSize(18);
            doc.text(
                "E.S.E. Hospital Clarita Santos",
                14,
                15,
            );

            doc.setFontSize(14);
            doc.text(
                "SICSA - Reporte de control de citas",
                14,
                23,
            );

            doc.setFontSize(9);
            doc.text(
                `Generado: ${formatGenerationDate()}`,
                14,
                31,
            );

            doc.text(
                `Usuario: ${currentUser?.email || "Usuario autorizado"
                }`,
                14,
                37,
            );

            const filterLines =
                getFilterDescription(appliedFilters);

            filterLines.forEach((line, index) => {
                doc.text(line, 150, 15 + index * 6);
            });

            autoTable(doc, {
                startY: 45,
                head: [
                    [
                        "Total",
                        "Pacientes",
                        "Atendidas",
                        "Confirmadas",
                        "Canceladas",
                        "Inasistencias",
                        "Tasa",
                    ],
                ],
                body: [
                    [
                        summary.totalAppointments,
                        summary.totalPatients,
                        summary.attended,
                        summary.confirmed,
                        summary.cancelled,
                        summary.noShow,
                        `${summary.noShowRate}%`,
                    ],
                ],
                styles: {
                    fontSize: 9,
                    halign: "center",
                },
            });

            autoTable(doc, {
                startY: 70,
                head: [
                    [
                        "Fecha",
                        "Hora",
                        "Paciente",
                        "Documento",
                        "Especialidad",
                        "Médico",
                        "Estado",
                        "EPS",
                        "Municipio",
                    ],
                ],
                body: exportAppointments.map((item) => [
                    formatDate(item.date),
                    formatTime(item.time),
                    item.patientName,
                    `${item.documentType || ""} ${item.documentNumber || ""
                        }`.trim(),
                    item.specialtyName,
                    item.doctorName,
                    formatStatus(item.status),
                    item.eps || "Sin EPS",
                    item.municipality || "Sin municipio",
                ]),
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    overflow: "linebreak",
                },
                headStyles: {
                    fillColor: [30, 64, 175],
                },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 14 },
                    2: { cellWidth: 38 },
                    3: { cellWidth: 28 },
                    4: { cellWidth: 33 },
                    5: { cellWidth: 33 },
                    6: { cellWidth: 24 },
                    7: { cellWidth: 30 },
                    8: { cellWidth: 28 },
                },
                didDrawPage: (data) => {
                    const pageNumber =
                        doc.getNumberOfPages();

                    doc.setFontSize(8);
                    doc.text(
                        `Página ${pageNumber}`,
                        270,
                        200,
                    );

                    if (data.pageNumber > 1) {
                        doc.setFontSize(11);
                        doc.text(
                            "SICSA - Reporte de citas",
                            14,
                            10,
                        );
                    }
                },
            });

            const today = new Date()
                .toISOString()
                .split("T")[0];

            doc.save(
                `reporte-citas-sicsa-${today}.pdf`,
            );
        } catch {
            setError(
                "No fue posible generar el archivo PDF.",
            );
        } finally {
            setExporting("");
        }
    }

    function printReport() {
        window.print();
    }

    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <section className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
                    <LoaderCircle className="animate-spin text-blue-700" />

                    <p className="font-semibold text-slate-600">
                        Verificando permisos...
                    </p>
                </section>
            </main>
        );
    }

    const summary = dashboard?.summary;

    const appointmentsByStatus =
        dashboard?.charts?.appointmentsByStatus ?? [];

    const appointmentsBySpecialty =
        dashboard?.charts?.appointmentsBySpecialty ??
        [];

    const appointmentsByMonth =
        dashboard?.charts?.appointmentsByMonth?.map(
            (item) => ({
                ...item,
                monthLabel: formatMonth(item.month),
            }),
        ) ?? [];

    const noShowsBySpecialty =
        dashboard?.charts?.noShowsBySpecialty ?? [];

    const hasExportData =
        !loading && appointments.length > 0;

    const activeTableTotal =
        activeTable === "appointments"
            ? appointments.length
            : noShows.length;
    const tableTotalPages = Math.max(
        1,
        Math.ceil(activeTableTotal / REPORT_ROWS_PER_PAGE),
    );
    const visibleTablePage = Math.min(tablePage, tableTotalPages);
    const tableStartIndex =
        (visibleTablePage - 1) * REPORT_ROWS_PER_PAGE;
    const visibleAppointments = appointments.slice(
        tableStartIndex,
        tableStartIndex + REPORT_ROWS_PER_PAGE,
    );
    const visibleNoShows = noShows.slice(
        tableStartIndex,
        tableStartIndex + REPORT_ROWS_PER_PAGE,
    );
    const firstVisibleReportRow =
        activeTableTotal === 0 ? 0 : tableStartIndex + 1;
    const lastVisibleReportRow = Math.min(
        tableStartIndex + REPORT_ROWS_PER_PAGE,
        activeTableTotal,
    );

    return (
        <main className="min-h-screen bg-slate-100 print:bg-white">
            <section className="px-4 pb-5 sm:px-6 lg:px-8 print:p-0">
              <section className="mx-auto w-full max-w-[1600px]">
                <header className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg print:left-auto print:w-auto print:translate-x-0 print:bg-white print:text-slate-900 print:shadow-none">
                    <div className="print-hidden"><AdminSidebar /></div>
                    <span className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl print:hidden" />
                    <span className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl print:hidden" />
                    <section className="relative flex flex-col gap-5 px-5 py-6 sm:px-7 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                        <article>
                            <section>
                                <h1 className="text-3xl font-extrabold tracking-tight md:text-[2.6rem]">
                                    Reportes de citas
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base print:text-slate-600">
                                    Indicadores, estadísticas y control de
                                    inasistencias del sistema SICSA.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur print:border-slate-300 print:bg-white">
                                        {getAppliedRange(appliedFilters)}
                                    </span>

                                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur print:border-slate-300 print:bg-white">
                                        {appliedFilters.eps ||
                                            "Todas las EPS"}
                                    </span>

                                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur print:border-slate-300 print:bg-white">
                                        {appliedFilters.municipality ||
                                            "Todos los municipios"}
                                    </span>
                                </div>
                            </section>
                        </article>

                        <article className="flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur print:hidden xl:max-w-sm">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                              <ShieldCheck size={20} />
                            </span>

                            <section>
                                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                                    Acceso autorizado
                                </p>

                                <p className="mt-0.5 truncate text-sm font-semibold">
                                    Módulo exclusivo
                                </p>
                            </section>
                        </article>
                    </section>

                    <section className="print-hidden relative border-t border-white/10 bg-white/[0.06] px-5 py-4 sm:px-7 lg:px-8">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <section>
                                <p className="text-sm font-semibold">
                                    Exportar reporte filtrado
                                </p>

                                <p className="mt-0.5 text-xs text-cyan-200">
                                    Se exportarán los mismos datos que estás
                                    visualizando.
                                </p>
                            </section>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                <ExportButton
                                    label="Excel"
                                    icon={<FileSpreadsheet size={17} />}
                                    onClick={() =>
                                        void exportToExcel()
                                    }
                                    disabled={
                                        !hasExportData ||
                                        Boolean(exporting)
                                    }
                                    loading={exporting === "excel"}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                />

                                <ExportButton
                                    label="CSV"
                                    icon={<FileText size={17} />}
                                    onClick={exportToCsv}
                                    disabled={
                                        !hasExportData ||
                                        Boolean(exporting)
                                    }
                                    loading={exporting === "csv"}
                                    className="bg-cyan-600 hover:bg-cyan-700"
                                />

                                <ExportButton
                                    label="PDF"
                                    icon={<FileDown size={17} />}
                                    onClick={() =>
                                        void exportToPdf()
                                    }
                                    disabled={
                                        !hasExportData ||
                                        Boolean(exporting)
                                    }
                                    loading={exporting === "pdf"}
                                    className="bg-red-600 hover:bg-red-700"
                                />

                                <ExportButton
                                    label="Imprimir"
                                    icon={<Printer size={17} />}
                                    onClick={printReport}
                                    disabled={loading}
                                    className="bg-white/15 hover:bg-white/25"
                                />
                            </div>
                        </div>
                    </section>
                </header>

                <form
                    onSubmit={applyFilters}
                    className="print-hidden mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                    <header className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <section className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <Filter size={19} />
                            </span>

                            <section>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Filtros del reporte
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Deja EPS o Municipio vacíos para consultar
                                    todos.
                                </p>
                            </section>
                        </section>

                        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {appointments.length} citas encontradas
                        </span>
                    </header>

                    <section className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                        <FilterField label="Fecha inicial">
                            <input
                                type="date"
                                value={filters.startDate ?? ""}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "startDate",
                                        event.target.value,
                                    )
                                }
                                className="input-report"
                            />
                        </FilterField>

                        <FilterField label="Fecha final">
                            <input
                                type="date"
                                value={filters.endDate ?? ""}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "endDate",
                                        event.target.value,
                                    )
                                }
                                className="input-report"
                            />
                        </FilterField>

                        <FilterField label="Estado">
                            <select
                                value={filters.status ?? ""}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "status",
                                        event.target.value,
                                    )
                                }
                                className="input-report bg-white"
                            >
                                <option value="">
                                    Todos los estados
                                </option>
                                <option value="confirmada">
                                    Confirmadas
                                </option>
                                <option value="lista_espera">
                                    Lista de espera
                                </option>
                                <option value="atendida">
                                    Atendidas
                                </option>
                                <option value="cancelada">
                                    Canceladas
                                </option>
                                <option value="no asistida">
                                    No asistidas
                                </option>
                            </select>
                        </FilterField>

                        <FilterField label="Prioridad">
                            <select
                                value={filters.priority ?? ""}
                                onChange={(event) =>
                                    handleFilterChange(
                                        "priority",
                                        event.target.value,
                                    )
                                }
                                className="input-report bg-white"
                            >
                                <option value="">
                                    Todas las prioridades
                                </option>
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                            </select>
                        </FilterField>

                        <FilterField
                            label="EPS"
                            helper="Vacío = todas las EPS"
                        >
                            <input
                                type="text"
                                value={filters.eps ?? ""}
                                placeholder="Todas las EPS"
                                onChange={(event) =>
                                    handleFilterChange(
                                        "eps",
                                        event.target.value,
                                    )
                                }
                                className="input-report"
                            />
                        </FilterField>

                        <FilterField
                            label="Municipio"
                            helper="Vacío = todos los municipios"
                        >
                            <input
                                type="text"
                                value={filters.municipality ?? ""}
                                placeholder="Todos los municipios"
                                onChange={(event) =>
                                    handleFilterChange(
                                        "municipality",
                                        event.target.value,
                                    )
                                }
                                className="input-report"
                            />
                        </FilterField>
                    </section>

                    <footer className="flex flex-wrap items-center gap-2.5 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Filter size={18} />
                            Aplicar filtros
                        </button>

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:opacity-60"
                        >
                            <RefreshCcw size={18} />
                            Limpiar
                        </button>

                        <button
                            type="button"
                            onClick={reloadReports}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                        >
                            <RefreshCcw size={18} />
                            Actualizar
                        </button>
                    </footer>
                </form>

                {error && (
                    <section className="print-hidden mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
                        <AlertCircle className="mt-0.5 shrink-0" />

                        <section>
                            <p className="font-semibold">
                                No fue posible completar la operación
                            </p>

                            <p className="mt-1 text-sm">{error}</p>
                        </section>
                    </section>
                )}

                {loading ? (
                    <section className="mt-8 flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <article className="text-center">
                            <LoaderCircle
                                size={38}
                                className="mx-auto animate-spin text-blue-700"
                            />

                            <p className="mt-4 font-semibold text-slate-700">
                                Consultando datos del reporte...
                            </p>
                        </article>
                    </section>
                ) : (
                    <>
                        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            <MetricCard
                                title="Total de citas"
                                value={summary?.totalAppointments ?? 0}
                                description="Según los filtros"
                                icon={<CalendarDays size={22} />}
                                iconClass="bg-blue-50 text-blue-700"
                            />

                            <MetricCard
                                title="Atendidas"
                                value={summary?.attended ?? 0}
                                description="Atenciones realizadas"
                                icon={<CalendarCheck2 size={22} />}
                                iconClass="bg-emerald-50 text-emerald-700"
                            />

                            <MetricCard
                                title="Canceladas"
                                value={summary?.cancelled ?? 0}
                                description="Citas canceladas"
                                icon={<XCircle size={22} />}
                                iconClass="bg-red-50 text-red-700"
                            />

                            <MetricCard
                                title="Inasistencias"
                                value={summary?.noShow ?? 0}
                                description="Pacientes ausentes"
                                icon={<UserRoundX size={22} />}
                                iconClass="bg-orange-50 text-orange-700"
                            />

                            <MetricCard
                                title="Tasa de inasistencia"
                                value={`${summary?.noShowRate ?? 0}%`}
                                description="Sobre citas controladas"
                                icon={<Activity size={22} />}
                                iconClass="bg-violet-50 text-violet-700"
                            />
                        </section>

                        <section className="mt-3 grid gap-3 sm:grid-cols-3">
                            <CompactMetric
                                label="Pacientes diferentes"
                                value={summary?.totalPatients ?? 0}
                                icon={<UsersRound size={19} />}
                            />

                            <CompactMetric
                                label="Citas confirmadas"
                                value={summary?.confirmed ?? 0}
                                icon={<CheckCircle2 size={19} />}
                            />

                            <CompactMetric
                                label="Citas del mes"
                                value={
                                    summary?.appointmentsThisMonth ?? 0
                                }
                                icon={<Clock3 size={19} />}
                            />
                        </section>

                        <section className="mt-5 grid gap-4 xl:grid-cols-2">
                            <ChartCard
                                title="Distribución por estado"
                                description="Cantidad de citas según su estado."
                            >
                                {appointmentsByStatus.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={330}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={appointmentsByStatus}
                                                dataKey="total"
                                                nameKey="status"
                                                cx="50%"
                                                cy="45%"
                                                outerRadius={105}
                                                labelLine={false}
                                            >
                                                {appointmentsByStatus.map(
                                                    (item, index) => (
                                                        <Cell
                                                            key={`${item.status}-${index}`}
                                                            fill={getStatusColor(
                                                                item.status,
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </Pie>

                                            <Tooltip />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart />
                                )}
                            </ChartCard>

                            <ChartCard
                                title="Citas por especialidad"
                                description="Servicios con mayor demanda."
                            >
                                {appointmentsBySpecialty.length >
                                    0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={330}
                                    >
                                        <BarChart
                                            data={appointmentsBySpecialty.slice(
                                                0,
                                                10,
                                            )}
                                            margin={{
                                                top: 10,
                                                right: 20,
                                                left: 0,
                                                bottom: 70,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis
                                                dataKey="specialty"
                                                angle={-30}
                                                textAnchor="end"
                                                interval={0}
                                                height={95}
                                                tick={{ fontSize: 11 }}
                                            />

                                            <YAxis allowDecimals={false} />
                                            <Tooltip />

                                            <Bar
                                                dataKey="total"
                                                name="Citas"
                                                fill="#2563eb"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart />
                                )}
                            </ChartCard>
                        </section>

                        <section className="mt-4">
                            <ChartCard
                                title="Comportamiento mensual"
                                description="Evolución de las citas registradas."
                            >
                                {appointmentsByMonth.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={320}
                                    >
                                        <LineChart
                                            data={appointmentsByMonth}
                                            margin={{
                                                top: 10,
                                                right: 25,
                                                left: 0,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis dataKey="monthLabel" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />

                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                name="Citas"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart />
                                )}
                            </ChartCard>
                        </section>

                        <section className="mt-4">
                            <ChartCard
                                title="Inasistencias por especialidad"
                                description="Servicios con mayor cantidad de pacientes ausentes."
                            >
                                {noShowsBySpecialty.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={320}
                                    >
                                        <BarChart
                                            data={noShowsBySpecialty.slice(
                                                0,
                                                10,
                                            )}
                                            layout="vertical"
                                            margin={{
                                                top: 10,
                                                right: 30,
                                                left: 35,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis
                                                type="number"
                                                allowDecimals={false}
                                            />

                                            <YAxis
                                                type="category"
                                                dataKey="specialty"
                                                width={150}
                                                tick={{ fontSize: 11 }}
                                            />

                                            <Tooltip />

                                            <Bar
                                                dataKey="total"
                                                name="Inasistencias"
                                                fill="#ea580c"
                                                radius={[0, 8, 8, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart
                                        title="No hay inasistencias"
                                        description="No existen ausencias para los filtros aplicados."
                                    />
                                )}
                            </ChartCard>
                        </section>

                        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
                                <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <section>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Detalle del reporte
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Consulta todas las citas o únicamente
                                            las inasistencias.
                                        </p>
                                    </section>

                                    <div className="print-hidden flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                {
                                                    setActiveTable("appointments");
                                                    setTablePage(1);
                                                }
                                            }
                                            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${activeTable === "appointments"
                                                    ? "bg-white text-blue-700 shadow-sm"
                                                    : "text-slate-600"
                                                }`}
                                        >
                                            Todas las citas ({appointments.length})
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                {
                                                    setActiveTable("no-shows");
                                                    setTablePage(1);
                                                }
                                            }
                                            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${activeTable === "no-shows"
                                                    ? "bg-white text-orange-700 shadow-sm"
                                                    : "text-slate-600"
                                                }`}
                                        >
                                            Inasistencias ({noShows.length})
                                        </button>
                                    </div>
                                </section>
                            </header>

                            <section className="print-hidden overflow-x-auto">
                                {activeTable === "appointments" ? (
                                    <AppointmentsTable
                                        appointments={visibleAppointments}
                                    />
                                ) : (
                                    <NoShowsTable noShows={visibleNoShows} />
                                )}
                            </section>

                            <section className="print-hidden border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
                                <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <section>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Mostrando {firstVisibleReportRow} a {lastVisibleReportRow} de {activeTableTotal} {activeTable === "appointments" ? "citas" : "inasistencias"}
                                        </p>
                                        {tableTotalPages > 1 && (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Página {visibleTablePage} de {tableTotalPages}
                                            </p>
                                        )}
                                    </section>

                                    {tableTotalPages > 1 && (
                                        <nav aria-label="Paginación del detalle del reporte" className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTablePage((page) => Math.max(page - 1, 1))}
                                                disabled={visibleTablePage === 1}
                                                className="flex h-9 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ChevronLeft size={16} /> Anterior
                                            </button>

                                            {Array.from({ length: tableTotalPages }, (_, index) => index + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => setTablePage(page)}
                                                    aria-current={visibleTablePage === page ? "page" : undefined}
                                                    className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-sm font-bold transition ${visibleTablePage === page ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setTablePage((page) => Math.min(page + 1, tableTotalPages))}
                                                disabled={visibleTablePage === tableTotalPages}
                                                className="flex h-9 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Siguiente <ChevronRight size={16} />
                                            </button>
                                        </nav>
                                    )}
                                </section>
                            </section>

                            <section className="hidden overflow-visible print:block">
                                {activeTable === "appointments" ? (
                                    <AppointmentsTable appointments={appointments} />
                                ) : (
                                    <NoShowsTable noShows={noShows} />
                                )}
                            </section>
                        </section>
                    </>
                )}
              </section>
            </section>

            <style jsx global>{`
        .input-report {
          width: 100%;
          min-height: 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: rgb(248 250 252);
          padding: 0.625rem 0.875rem;
          color: rgb(15 23 42);
          font-size: 0.875rem;
          outline: none;
          transition: 0.2s;
        }

        .input-report:focus {
          border-color: rgb(37 99 235);
          background: white;
          box-shadow: 0 0 0 3px rgb(219 234 254);
        }

        @media print {
          .print-hidden {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            display: block !important;
          }

          article,
          section {
            break-inside: avoid;
          }
        }
      `}</style>
        </main>
    );
}

type ExportButtonProps = {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    className: string;
};

function ExportButton({
    label,
    icon,
    onClick,
    disabled,
    loading,
    className,
}: ExportButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
        >
            {loading ? (
                <LoaderCircle
                    size={17}
                    className="animate-spin"
                />
            ) : (
                icon
            )}

            {loading ? "Generando..." : label}
        </button>
    );
}

type FilterFieldProps = {
    label: string;
    helper?: string;
    children: ReactNode;
};

function FilterField({
    label,
    helper,
    children,
}: FilterFieldProps) {
    return (
        <label className="space-y-1.5">
            <span className="flex min-h-5 items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                {label}

                {helper && (
                    <small className="normal-case tracking-normal font-normal text-slate-400">
                        {helper}
                    </small>
                )}
            </span>

            {children}
        </label>
    );
}

type MetricCardProps = {
    title: string;
    value: number | string;
    description: string;
    icon: ReactNode;
    iconClass: string;
};

function MetricCard({
    title,
    value,
    description,
    icon,
    iconClass,
}: MetricCardProps) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 transition group-hover:opacity-100" />
            <section className="flex items-start justify-between gap-3">
              <section>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {title}
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {value}
                </p>
              </section>

              <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
              >
                  {icon}
              </span>
            </section>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
        </article>
    );
}

function CompactMetric({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: ReactNode;
}) {
    return (
        <article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200">
            <section className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    {icon}
                </span>

                <p className="text-sm font-medium text-slate-600">
                    {label}
                </p>
            </section>

            <p className="text-2xl font-extrabold text-slate-900">
                {value}
            </p>
        </article>
    );
}

function ChartCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </header>

            <section className="px-3 py-4 sm:px-5">{children}</section>
        </article>
    );
}

function EmptyChart({
    title = "No hay datos para mostrar",
    description = "Cambia o elimina algunos filtros.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <section className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6">
            <article className="text-center">
                <BarChart3
                    size={34}
                    className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-semibold text-slate-600">
                    {title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </article>
        </section>
    );
}

function AppointmentsTable({
    appointments,
}: {
    appointments: AppointmentRecord[];
}) {
    return (
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100/80">
                <tr>
                    <TableHeader>Fecha</TableHeader>
                    <TableHeader>Paciente</TableHeader>
                    <TableHeader>Documento</TableHeader>
                    <TableHeader>Especialidad</TableHeader>
                    <TableHeader>Médico</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>EPS</TableHeader>
                    <TableHeader>Municipio</TableHeader>
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
                {appointments.length > 0 ? (
                    appointments.map((item) => (
                        <tr
                            key={item.appointmentId}
                            className="transition-colors hover:bg-blue-50/40"
                        >
                            <TableCell>
                                <p className="font-semibold text-slate-900">
                                    {formatDate(item.date)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {formatTime(item.time)}
                                </p>
                            </TableCell>

                            <TableCell>
                                <p className="font-semibold text-slate-900">
                                    {item.patientName}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {item.phone}
                                </p>
                            </TableCell>

                            <TableCell>
                                {item.documentType}{" "}
                                {item.documentNumber}
                            </TableCell>

                            <TableCell>
                                {item.specialtyName}
                            </TableCell>

                            <TableCell>
                                {item.doctorName}
                            </TableCell>

                            <TableCell>
                                <StatusBadge status={item.status} />
                            </TableCell>

                            <TableCell>
                                {item.eps || "Sin EPS"}
                            </TableCell>

                            <TableCell>
                                {item.municipality ||
                                    "Sin municipio"}
                            </TableCell>
                        </tr>
                    ))
                ) : (
                    <EmptyTableRow
                        colSpan={8}
                        message="No se encontraron citas"
                    />
                )}
            </tbody>
        </table>
    );
}

function NoShowsTable({
    noShows,
}: {
    noShows: NoShowRecord[];
}) {
    return (
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100/80">
                <tr>
                    <TableHeader>Fecha</TableHeader>
                    <TableHeader>Paciente</TableHeader>
                    <TableHeader>Documento</TableHeader>
                    <TableHeader>Contacto</TableHeader>
                    <TableHeader>Especialidad</TableHeader>
                    <TableHeader>Médico</TableHeader>
                    <TableHeader>EPS</TableHeader>
                    <TableHeader>Municipio</TableHeader>
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
                {noShows.length > 0 ? (
                    noShows.map((item) => (
                        <tr
                            key={item.appointmentId}
                            className="transition hover:bg-orange-50/40"
                        >
                            <TableCell>
                                <p className="font-semibold text-slate-900">
                                    {formatDate(item.date)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {formatTime(item.time)}
                                </p>
                            </TableCell>

                            <TableCell>
                                <p className="font-semibold text-slate-900">
                                    {item.patientName}
                                </p>

                                <p className="mt-1 text-xs font-medium text-orange-600">
                                    {formatStatus(item.status)}
                                </p>
                            </TableCell>

                            <TableCell>
                                {item.documentNumber}
                            </TableCell>

                            <TableCell>
                                <p>{item.phone}</p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {item.email}
                                </p>
                            </TableCell>

                            <TableCell>
                                {item.specialtyName}
                            </TableCell>

                            <TableCell>
                                {item.doctorName}
                            </TableCell>

                            <TableCell>
                                {item.eps || "Sin EPS"}
                            </TableCell>

                            <TableCell>
                                {item.municipality ||
                                    "Sin municipio"}
                            </TableCell>
                        </tr>
                    ))
                ) : (
                    <EmptyTableRow
                        colSpan={8}
                        message="No se encontraron inasistencias"
                    />
                )}
            </tbody>
        </table>
    );
}

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const normalized =
        status?.toLowerCase().trim() || "";

    const className =
        normalized.includes("atendid") ||
            normalized.includes("complet")
            ? "bg-emerald-50 text-emerald-700"
            : normalized.includes("cancel")
                ? "bg-red-50 text-red-700"
                : normalized.includes("no asist") ||
                    normalized.includes("inasistencia")
                    ? "bg-orange-50 text-orange-700"
                    : normalized.includes("confirm")
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-700";

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}
        >
            {formatStatus(status)}
        </span>
    );
}

function TableHeader({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">
            {children}
        </th>
    );
}

function TableCell({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
            {children}
        </td>
    );
}

function EmptyTableRow({
    colSpan,
    message,
}: {
    colSpan: number;
    message: string;
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-6 py-14 text-center"
            >
                <CheckCircle2
                    size={38}
                    className="mx-auto text-emerald-600"
                />

                <p className="mt-3 font-semibold text-slate-700">
                    {message}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    Cambia o elimina algunos filtros.
                </p>
            </td>
        </tr>
    );
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipos de datos actualizados para recibir la información completa
type Payment = {
  amount: number;
  payment_date: string;
  customers: { name: string } | null;
  accounts: { streaming_services: { name: string } | null } | null;
};

type AccountCost = {
  total_cost: number | null;
  start_date: string;
  streaming_services: { name: string } | null;
};

export const generateFinancialReportPDF = (
  monthLabel: string,
  collected: number,
  spent: number,
  profit: number,
  payments: Payment[],
  costs: AccountCost[]
) => {
  const doc = new jsPDF();
  const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString('es-CL')}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("es-ES", { timeZone: 'UTC' });

  // 1. Título
  doc.setFontSize(20);
  doc.text("Reporte Financiero", 14, 22);
  doc.setFontSize(12);
  doc.text(`Período: ${monthLabel}`, 14, 30);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // 2. Resumen General
  autoTable(doc, {
    startY: 40,
    head: [['Concepto', 'Monto']],
    body: [
      ['Total Recaudado (Ingresos)', { content: formatCurrency(collected), styles: { halign: 'right' } }],
      ['Total Gastado (Costos)', { content: formatCurrency(spent), styles: { halign: 'right' } }],
      ['Ganancia Neta', { content: formatCurrency(profit), styles: { halign: 'right', fontStyle: 'bold' } }],
    ],
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
  });

  // --- CORRECCIÓN DE DISEÑO Y DATOS ---

  // 3. Título y Tabla de Ingresos
  doc.setFontSize(16);
  doc.text('Detalle de Ingresos', 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Fecha', 'Usuario', 'Servicio', 'Monto']],
    body: payments.map(p => [
      formatDate(p.payment_date),
      p.customers?.name || 'N/A', // <-- Muestra el nombre del usuario
      p.accounts?.streaming_services?.name || 'N/A', // <-- Muestra el nombre del servicio
      { content: formatCurrency(p.amount), styles: { halign: 'right' } }
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // 4. Título y Tabla de Gastos
  doc.setFontSize(16);
  doc.text('Detalle de Gastos', 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Fecha de Inicio', 'Servicio', 'Costo']],
    body: costs.map(c => [
        formatDate(c.start_date),
        c.streaming_services?.name || 'N/A', // <-- Muestra el nombre del servicio
        { content: formatCurrency(c.total_cost || 0), styles: { halign: 'right' } }
    ]),
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
  });

  // 5. Guardar el archivo
  doc.save(`Reporte_Financiero_${monthLabel.replace(/ /g, '_')}.pdf`);
};

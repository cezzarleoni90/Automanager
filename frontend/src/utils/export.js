import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate, formatDateTime, formatCurrency } from './formatters';
import { EXPORT } from './constants';

// Exportar a Excel
export const exportToExcel = (data, filename, options = {}) => {
  try {
    const {
      sheetName = 'Datos',
      headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'CCCCCC' } } },
      dateColumns = [],
      currencyColumns = [],
      numberColumns = []
    } = options;

    // Crear una copia de los datos para no modificar los originales
    const formattedData = data.map(row => {
      const newRow = { ...row };
      
      // Formatear fechas
      dateColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatDate(newRow[col]);
        }
      });

      // Formatear moneda
      currencyColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatCurrency(newRow[col]);
        }
      });

      // Formatear números
      numberColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = Number(newRow[col]).toFixed(2);
        }
      });

      return newRow;
    });

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Aplicar estilos al encabezado
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }

    // Crear libro
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generar archivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};

// Exportar a CSV
export const exportToCSV = (data, filename, options = {}) => {
  try {
    const {
      delimiter = ',',
      dateColumns = [],
      currencyColumns = [],
      numberColumns = []
    } = options;

    // Crear una copia de los datos para no modificar los originales
    const formattedData = data.map(row => {
      const newRow = { ...row };
      
      // Formatear fechas
      dateColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatDate(newRow[col]);
        }
      });

      // Formatear moneda
      currencyColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatCurrency(newRow[col]);
        }
      });

      // Formatear números
      numberColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = Number(newRow[col]).toFixed(2);
        }
      });

      return newRow;
    });

    // Convertir a CSV
    const headers = Object.keys(formattedData[0]);
    const csvContent = [
      headers.join(delimiter),
      ...formattedData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar valores que contengan el delimitador
          return typeof value === 'string' && value.includes(delimiter) 
            ? `"${value}"` 
            : value;
        }).join(delimiter)
      )
    ].join('\n');

    // Generar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
  } catch (error) {
    console.error('Error al exportar a CSV:', error);
    throw error;
  }
};

// Exportar a PDF
export const exportToPDF = async (data, filename, options = {}) => {
  try {
    const {
      title,
      columns,
      dateColumns = [],
      currencyColumns = [],
      numberColumns = []
    } = options;

    // Crear una copia de los datos para no modificar los originales
    const formattedData = data.map(row => {
      const newRow = { ...row };
      
      // Formatear fechas
      dateColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatDate(newRow[col]);
        }
      });

      // Formatear moneda
      currencyColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = formatCurrency(newRow[col]);
        }
      });

      // Formatear números
      numberColumns.forEach(col => {
        if (newRow[col]) {
          newRow[col] = Number(newRow[col]).toFixed(2);
        }
      });

      return newRow;
    });

    // Importar dinámicamente jsPDF
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    // Crear documento PDF
    const doc = new jsPDF();
    
    // Agregar título
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    // Agregar tabla
    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: formattedData.map(row => 
        columns.map(col => row[col.key])
      ),
      startY: title ? 25 : 15,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    // Guardar archivo
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    throw error;
  }
};

// Exportar datos según el formato especificado
export const exportData = (data, filename, format = EXPORT.DEFAULT_FORMAT, options = {}) => {
  switch (format.toLowerCase()) {
    case 'xlsx':
      return exportToExcel(data, filename, options);
    case 'csv':
      return exportToCSV(data, filename, options);
    case 'pdf':
      return exportToPDF(data, filename, options);
    default:
      throw new Error(`Formato de exportación no soportado: ${format}`);
  }
};

// Exportar factura a PDF
export const exportInvoiceToPDF = async (invoice, options = {}) => {
  try {
    const {
      companyInfo,
      logo
    } = options;

    // Importar dinámicamente jsPDF
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    // Crear documento PDF
    const doc = new jsPDF();

    // Agregar logo si existe
    if (logo) {
      doc.addImage(logo, 'PNG', 14, 10, 30, 30);
    }

    // Agregar información de la empresa
    if (companyInfo) {
      doc.setFontSize(12);
      doc.text(companyInfo.name, 14, 50);
      doc.setFontSize(10);
      doc.text(companyInfo.address, 14, 55);
      doc.text(`${companyInfo.postalCode} ${companyInfo.city}`, 14, 60);
      doc.text(`CIF: ${companyInfo.cif}`, 14, 65);
      doc.text(`Tel: ${companyInfo.phone}`, 14, 70);
    }

    // Agregar información de la factura
    doc.setFontSize(16);
    doc.text('FACTURA', 105, 30, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Nº Factura: ${invoice.numero}`, 105, 40, { align: 'right' });
    doc.text(`Fecha: ${formatDate(invoice.fecha)}`, 105, 45, { align: 'right' });

    // Agregar información del cliente
    doc.setFontSize(12);
    doc.text('DATOS DEL CLIENTE', 14, 90);
    doc.setFontSize(10);
    doc.text(`Nombre: ${invoice.cliente.nombre} ${invoice.cliente.apellidos}`, 14, 95);
    doc.text(`DNI/NIE: ${invoice.cliente.dni}`, 14, 100);
    doc.text(`Dirección: ${invoice.cliente.direccion}`, 14, 105);
    doc.text(`${invoice.cliente.codigoPostal} ${invoice.cliente.ciudad}`, 14, 110);
    doc.text(`Teléfono: ${invoice.cliente.telefono}`, 14, 115);

    // Agregar información del vehículo
    doc.setFontSize(12);
    doc.text('DATOS DEL VEHÍCULO', 14, 130);
    doc.setFontSize(10);
    doc.text(`Matrícula: ${invoice.vehiculo.matricula}`, 14, 135);
    doc.text(`Marca: ${invoice.vehiculo.marca}`, 14, 140);
    doc.text(`Modelo: ${invoice.vehiculo.modelo}`, 14, 145);
    doc.text(`Año: ${invoice.vehiculo.anio}`, 14, 150);

    // Agregar tabla de servicios
    autoTable(doc, {
      head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
      body: invoice.servicios.map(servicio => [
        servicio.descripcion,
        servicio.cantidad,
        formatCurrency(servicio.precioUnitario),
        formatCurrency(servicio.total)
      ]),
      startY: 160,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    // Agregar totales
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 105, finalY, { align: 'right' });
    doc.text(`IVA (${invoice.iva}%): ${formatCurrency(invoice.importeIva)}`, 105, finalY + 5, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`Total: ${formatCurrency(invoice.total)}`, 105, finalY + 15, { align: 'right' });

    // Agregar pie de página
    doc.setFontSize(8);
    doc.text('Gracias por su confianza', 105, 280, { align: 'center' });

    // Guardar archivo
    doc.save(`Factura_${invoice.numero}.pdf`);
  } catch (error) {
    console.error('Error al exportar factura a PDF:', error);
    throw error;
  }
}; 
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface MedicalReportPdfData {
  cita: {
    id: number;
    fecha: string;
    hora: string;
    estado: string;
    prioridad: string;
    scorePrioridad: number;
    motivoConsulta: string;
    explicacionPrioridad: string;
  };
  paciente: {
    nombre: string;
    documento: string;
    telefono: string;
    email: string;
    eps: string;
    edad: number | string;
  };
  doctor: {
    nombre: string;
    especialidad: string;
  };
  historiaClinica: {
    enfermedadActual: string;
    antecedentes: string;
    signosVitales: string;
    examenFisico: string;
    diagnostico: string;
    tratamiento: string;
    observaciones: string;
  };
}

@Injectable()
export class AppointmentPdfService {
  async generateMedicalReport(data: MedicalReportPdfData): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => {
        // Solución al error de 'any' / unsafe-argument
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      doc.on('error', (err: Error) => {
        // Solución al error de prefer-promise-reject-errors
        reject(new Error(err.message));
      });

      // --- ENCABEZADO INSTITUCIONAL ---
      this.addHeader(doc);

      // --- DATOS DEL PACIENTE ---
      this.addTableSection(doc, 'DATOS DEL PACIENTE', [
        [
          'Nombre:',
          data.paciente.nombre,
          'Documento:',
          data.paciente.documento,
        ],
        [
          'Edad:',
          String(data.paciente.edad),
          'Teléfono:',
          data.paciente.telefono,
        ],
        ['Correo:', data.paciente.email, 'EPS:', data.paciente.eps],
      ]);

      // --- DATOS DE ATENCIÓN ---
      this.addTableSection(doc, 'DATOS DE ATENCIÓN', [
        ['Fecha:', data.cita.fecha, 'Hora:', data.cita.hora],
        ['Admisión:', `#${data.cita.id}`, 'Estado:', data.cita.estado],
        [
          'Prioridad:',
          data.cita.prioridad,
          'Score:',
          String(data.cita.scorePrioridad),
        ],
      ]);

      // --- ADMINISTRADORA / SERVICIO ---
      this.addTableSection(doc, 'ADMINISTRADORA / SERVICIO', [
        [
          'Administradora:',
          data.paciente.eps,
          'Especialidad:',
          data.doctor.especialidad,
        ],
        [
          'Procedimiento:',
          'Consulta Médica',
          'Priorización:',
          data.cita.explicacionPrioridad || 'N/A',
        ],
      ]);

      // --- PROFESIONAL RESPONSABLE ---
      this.addTableSection(doc, 'PROFESIONAL RESPONSABLE', [
        [
          'Doctor(a):',
          data.doctor.nombre,
          'Especialidad:',
          data.doctor.especialidad,
        ],
      ]);

      // --- INFORMACIÓN CLÍNICA ---
      this.addClinicalContent(doc, data);

      // --- FIRMA Y FOOTER ---
      this.addSignature(doc);
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('E.S.E. Hospital Clarita Santos', { align: 'center' });
    doc
      .fontSize(10)
      .text('SICSA - Reporte clínico de atención', { align: 'center' });
    doc.moveDown(1);
    this.drawLine(doc);
  }

  private addTableSection(
    doc: PDFKit.PDFDocument,
    title: string,
    rows: string[][],
  ): void {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#444').text(title);
    doc.fillColor('black');

    const startY = doc.y + 2;
    const colWidth = 130;
    const rowHeight = 14;

    rows.forEach((row, i) => {
      let currentX = 40;
      row.forEach((text, j) => {
        const isLabel = j % 2 === 0;
        doc
          .font(isLabel ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .text(text || '', currentX, startY + i * rowHeight, {
            width: colWidth,
            lineBreak: false,
          });
        currentX += colWidth;
      });
    });

    doc.y = startY + rows.length * rowHeight + 5;
    this.drawLine(doc);
  }

  private addClinicalContent(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#444')
      .text('INFORMACIÓN CLÍNICA');
    doc.fillColor('black').moveDown(0.5);

    const sections = [
      { label: 'Motivo de consulta', content: data.cita.motivoConsulta },
      {
        label: 'Enfermedad actual',
        content: data.historiaClinica.enfermedadActual,
      },
      { label: 'Antecedentes', content: data.historiaClinica.antecedentes },
      { label: 'Signos vitales', content: data.historiaClinica.signosVitales },
      { label: 'Examen físico', content: data.historiaClinica.examenFisico },
      { label: 'Diagnóstico', content: data.historiaClinica.diagnostico },
      { label: 'Tratamiento', content: data.historiaClinica.tratamiento },
      { label: 'Observaciones', content: data.historiaClinica.observaciones },
    ];

    sections.forEach((s) => {
      if (doc.y > 700) doc.addPage();
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(`${s.label.toUpperCase()}: `, { continued: true });
      doc.font('Helvetica').text(s.content || 'Sin registros.');
      doc.moveDown(0.4);
    });
  }

  private addSignature(doc: PDFKit.PDFDocument): void {
    if (doc.y > 650) doc.addPage();
    doc.moveDown(3);
    const y = doc.y;
    doc.moveTo(40, y).lineTo(200, y).stroke();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('Firma del profesional responsable', 40, y + 5);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor('#777')
        .text(
          `Documento generado por SICSA para Hospital Clarita Santos | Página ${
            i + 1
          } de ${pages.count}`,
          40,
          doc.page.height - 30,
          { align: 'center' },
        );
    }
  }

  private drawLine(doc: PDFKit.PDFDocument): void {
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .lineWidth(0.5)
      .strokeColor('#ccc')
      .stroke();
    doc.moveDown(0.5);
  }
}

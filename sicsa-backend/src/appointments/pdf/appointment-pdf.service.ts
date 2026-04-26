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
      const doc: PDFKit.PDFDocument = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error: Error) => {
        reject(error);
      });

      this.addHeader(doc);
      this.addAppointmentSection(doc, data);
      this.addPatientSection(doc, data);
      this.addDoctorSection(doc, data);
      this.addClinicalSection(
        doc,
        'Motivo de consulta',
        data.cita.motivoConsulta || 'No registrado',
      );
      this.addClinicalSection(
        doc,
        'Enfermedad actual',
        data.historiaClinica.enfermedadActual,
      );
      this.addClinicalSection(
        doc,
        'Antecedentes',
        data.historiaClinica.antecedentes,
      );
      this.addClinicalSection(
        doc,
        'Signos vitales',
        data.historiaClinica.signosVitales,
      );
      this.addClinicalSection(
        doc,
        'Examen físico',
        data.historiaClinica.examenFisico,
      );
      this.addClinicalSection(
        doc,
        'Diagnóstico',
        data.historiaClinica.diagnostico,
      );
      this.addClinicalSection(
        doc,
        'Tratamiento',
        data.historiaClinica.tratamiento,
      );
      this.addClinicalSection(
        doc,
        'Observaciones',
        data.historiaClinica.observaciones,
      );
      this.addSignatureSection(doc);
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('E.S.E. HOSPITAL CLARITA SANTOS', {
        align: 'center',
      });

    doc
      .moveDown(0.3)
      .font('Helvetica')
      .fontSize(11)
      .text('Formato de atención médica / reporte clínico de cita', {
        align: 'center',
      });

    doc.moveDown(0.5);

    const y = doc.y;

    doc.moveTo(40, y).lineTo(555, y).stroke();

    doc.moveDown(1);
  }

  private addAppointmentSection(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    this.addSectionTitle(doc, 'DATOS DE LA CITA');

    this.addField(doc, 'ID de cita', String(data.cita.id));
    this.addField(doc, 'Fecha', data.cita.fecha);
    this.addField(doc, 'Hora', data.cita.hora);
    this.addField(doc, 'Estado', data.cita.estado);
    this.addField(doc, 'Prioridad', data.cita.prioridad);
    this.addField(
      doc,
      'Puntaje de prioridad',
      String(data.cita.scorePrioridad),
    );
    this.addField(
      doc,
      'Explicación de prioridad',
      data.cita.explicacionPrioridad || 'No registrada',
    );
  }

  private addPatientSection(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    this.addSectionTitle(doc, 'DATOS DEL PACIENTE');

    this.addField(doc, 'Nombre completo', data.paciente.nombre);
    this.addField(doc, 'Documento', data.paciente.documento);
    this.addField(doc, 'Edad', String(data.paciente.edad));
    this.addField(doc, 'Teléfono', data.paciente.telefono);
    this.addField(doc, 'Correo electrónico', data.paciente.email);
    this.addField(doc, 'EPS', data.paciente.eps);
  }

  private addDoctorSection(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    this.addSectionTitle(doc, 'DATOS DEL PROFESIONAL');

    this.addField(doc, 'Doctor(a)', data.doctor.nombre);
    this.addField(doc, 'Especialidad', data.doctor.especialidad);
  }

  private addClinicalSection(
    doc: PDFKit.PDFDocument,
    title: string,
    content: string,
  ): void {
    this.ensureSpace(doc, 110);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(11).text(title);

    const startY = doc.y + 4;
    const boxHeight = 70;

    doc.rect(40, startY, 515, boxHeight).stroke();

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(
        content ||
          '................................................................................',
        48,
        startY + 8,
        {
          width: 499,
          align: 'justify',
        },
      );

    doc.y = startY + boxHeight + 8;
  }

  private addSignatureSection(doc: PDFKit.PDFDocument): void {
    this.ensureSpace(doc, 120);

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).text('FIRMA');

    const startY = doc.y + 10;

    doc.rect(40, startY, 515, 60).stroke();

    doc
      .font('Helvetica')
      .fontSize(10)
      .text('Firma del profesional responsable:', 48, startY + 10);

    doc
      .moveTo(250, startY + 35)
      .lineTo(500, startY + 35)
      .stroke();

    doc.y = startY + 75;
  }

  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.ensureSpace(doc, 80);

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(12).text(title);
    doc.moveDown(0.2);

    const y = doc.y;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    doc.moveDown(0.5);
  }

  private addField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
  ): void {
    this.ensureSpace(doc, 30);

    doc.font('Helvetica-Bold').fontSize(10).text(`${label}:`, {
      continued: true,
    });

    doc.font('Helvetica').text(` ${value || 'No registrado'}`);
    doc.moveDown(0.2);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 770;

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Documento generado automáticamente por SICSA - Sistema Integral de Control y Seguimiento de Citas',
        40,
        footerY,
        {
          width: 515,
          align: 'center',
        },
      );
  }

  private ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number): void {
    const pageHeight = doc.page.height;
    const bottomMargin = doc.page.margins.bottom;
    const availableSpace = pageHeight - bottomMargin - doc.y;

    if (availableSpace < requiredHeight) {
      doc.addPage();
    }
  }
}

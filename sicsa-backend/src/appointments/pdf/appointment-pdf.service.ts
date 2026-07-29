import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

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
    motivoConsulta: string;
    enfermedadActual: string;

    antecedentes: string;
    antecedentesPersonales: string;
    antecedentesFamiliares: string;
    antecedentesQuirurgicos: string;
    antecedentesAlergicos: string;
    antecedentesFarmacologicos: string;

    signosVitales: string;
    presionArterial: string;
    frecuenciaCardiaca: string;
    frecuenciaRespiratoria: string;
    temperatura: string;
    saturacionOxigeno: string;
    peso: string;
    talla: string;
    imc: string;

    examenFisico: string;
    diagnostico: string;
    codigoCie10: string;

    tratamiento: string;
    recomendaciones: string;
    remision: string;
    observaciones: string;

    firmaDoctor: string;
  };
}

@Injectable()
export class AppointmentPdfService {
  async generateMedicalReport(
    data: MedicalReportPdfData,
  ): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 30,
          right: 34,
          bottom: 45,
          left: 34,
        },
        bufferPages: true,
        info: {
          Title: `Historia clínica - Cita ${data.cita.id}`,
          Author: 'SICSA - E.S.E. Hospital Clarita Santos',
          Subject: 'Historia clínica de consulta externa',
        },
      });

      const chunks: Uint8Array[] = [];

      doc.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error: Error) => {
        reject(new Error(error.message));
      });

      this.addHeader(doc, data);
      this.addGeneralInformation(doc, data);
      this.addClinicalInformation(doc, data);
      this.addSignature(doc, data);
      this.addFooter(doc);

      doc.end();
    });
  }

  // =========================================================
  // ENCABEZADO CON LOGO
  // =========================================================

  private addHeader(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    const startX = 34;
    const startY = 30;
    const totalWidth = 527;
    const headerHeight = 62;

    doc
      .roundedRect(startX, startY, totalWidth, headerHeight, 5)
      .fillAndStroke('#F0FDFA', '#5EEAD4');

    const logoPath = path.join(
      process.cwd(),
      'assets',
      'hospital.jpg',
    );

    const logoExists = fs.existsSync(logoPath);

    if (logoExists) {
      try {
        doc.image(logoPath, startX + 10, startY + 7, {
          fit: [50, 48],
          align: 'center',
          valign: 'center',
        });
      } catch {
        // El reporte continúa aunque la imagen no pueda cargarse.
      }
    }

    const textStartX = logoExists
      ? startX + 70
      : startX + 14;

    const textWidth = logoExists ? 290 : 345;

    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(12.5)
      .text(
        'E.S.E. HOSPITAL CLARITA SANTOS',
        textStartX,
        startY + 10,
        {
          width: textWidth,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(
        'SICSA · Historia clínica de consulta externa',
        textStartX,
        startY + 31,
        {
          width: textWidth,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Documento clínico institucional',
        textStartX,
        startY + 46,
        {
          width: textWidth,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(
        'N.º DE HISTORIA',
        startX + 382,
        startY + 13,
        {
          width: 125,
          align: 'center',
          lineBreak: false,
        },
      );

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        `HC-${String(data.cita.id).padStart(6, '0')}`,
        startX + 382,
        startY + 33,
        {
          width: 125,
          align: 'center',
          lineBreak: false,
        },
      );

    doc.y = startY + headerHeight + 8;
  }

  // =========================================================
  // INFORMACIÓN GENERAL
  // =========================================================

  private addGeneralInformation(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    this.addSectionTitle(doc, 'DATOS DEL PACIENTE');

    this.addCompactGrid(doc, [
      {
        label: 'Nombre completo',
        value: data.paciente.nombre,
        width: 260,
      },
      {
        label: 'Documento',
        value: data.paciente.documento,
        width: 130,
      },
      {
        label: 'Edad',
        value: this.formatAge(data.paciente.edad),
        width: 101,
      },
      {
        label: 'Teléfono',
        value: data.paciente.telefono,
        width: 150,
      },
      {
        label: 'Correo electrónico',
        value: data.paciente.email,
        width: 225,
      },
      {
        label: 'EPS',
        value: data.paciente.eps,
        width: 152,
      },
    ]);

    this.addSectionTitle(doc, 'DATOS DE LA ATENCIÓN');

    this.addCompactGrid(doc, [
      {
        label: 'Fecha',
        value: data.cita.fecha,
        width: 110,
      },
      {
        label: 'Hora',
        value: data.cita.hora,
        width: 80,
      },
      {
        label: 'Cita',
        value: `#${data.cita.id}`,
        width: 80,
      },
      {
        label: 'Estado',
        value: this.capitalizeText(data.cita.estado),
        width: 110,
      },
      {
        label: 'Prioridad',
        value: this.capitalizeText(data.cita.prioridad),
        width: 111,
      },
      {
        label: 'Profesional',
        value: data.doctor.nombre,
        width: 260,
      },
      {
        label: 'Especialidad',
        value: data.doctor.especialidad,
        width: 231,
      },
    ]);
  }

  // =========================================================
  // INFORMACIÓN CLÍNICA
  // =========================================================

  private addClinicalInformation(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    const motivoConsulta =
      data.historiaClinica.motivoConsulta ||
      data.cita.motivoConsulta;

    this.addSectionTitle(doc, 'INFORMACIÓN CLÍNICA');

    this.addTwoColumnTextBlocks(
      doc,
      {
        title: 'Motivo de consulta',
        content: motivoConsulta,
      },
      {
        title: 'Enfermedad actual',
        content: data.historiaClinica.enfermedadActual,
      },
    );

    this.addSubsectionTitle(doc, 'Antecedentes');

    this.addAntecedentsTable(doc, [
      {
        label: 'Personales',
        value: data.historiaClinica.antecedentesPersonales,
      },
      {
        label: 'Familiares',
        value: data.historiaClinica.antecedentesFamiliares,
      },
      {
        label: 'Quirúrgicos',
        value: data.historiaClinica.antecedentesQuirurgicos,
      },
      {
        label: 'Alérgicos',
        value: data.historiaClinica.antecedentesAlergicos,
      },
      {
        label: 'Farmacológicos',
        value: data.historiaClinica.antecedentesFarmacologicos,
      },
      {
        label: 'Generales',
        value: data.historiaClinica.antecedentes,
      },
    ]);

    this.addSubsectionTitle(doc, 'Signos vitales');

    this.addVitalSignsTable(doc, [
      {
        label: 'Presión arterial',
        value: this.withUnit(
          data.historiaClinica.presionArterial,
          'mmHg',
        ),
      },
      {
        label: 'Frecuencia cardíaca',
        value: this.withUnit(
          data.historiaClinica.frecuenciaCardiaca,
          'lpm',
        ),
      },
      {
        label: 'Frecuencia respiratoria',
        value: this.withUnit(
          data.historiaClinica.frecuenciaRespiratoria,
          'rpm',
        ),
      },
      {
        label: 'Temperatura',
        value: this.withUnit(
          data.historiaClinica.temperatura,
          '°C',
        ),
      },
      {
        label: 'Saturación O₂',
        value: this.withUnit(
          data.historiaClinica.saturacionOxigeno,
          '%',
        ),
      },
      {
        label: 'Peso',
        value: this.withUnit(
          data.historiaClinica.peso,
          'kg',
        ),
      },
      {
        label: 'Talla',
        value: this.withUnit(
          data.historiaClinica.talla,
          'm',
        ),
      },
      {
        label: 'IMC',
        value: this.withUnit(
          data.historiaClinica.imc,
          'kg/m²',
        ),
      },
    ]);

    if (this.hasValue(data.historiaClinica.signosVitales)) {
      this.addInlineObservation(
        doc,
        'Observaciones de signos vitales',
        data.historiaClinica.signosVitales,
      );
    }

    this.addSubsectionTitle(doc, 'Valoración médica');

    this.addTwoColumnTextBlocks(
      doc,
      {
        title: 'Examen físico',
        content: data.historiaClinica.examenFisico,
      },
      {
        title: 'Diagnóstico',
        content: data.historiaClinica.diagnostico,
        extraLabel: 'CIE-10',
        extraValue: data.historiaClinica.codigoCie10,
      },
    );

    this.addSubsectionTitle(doc, 'Conducta y plan de manejo');

    this.addTwoColumnTextBlocks(
      doc,
      {
        title: 'Tratamiento',
        content: data.historiaClinica.tratamiento,
      },
      {
        title: 'Recomendaciones',
        content: data.historiaClinica.recomendaciones,
      },
    );

    this.addTwoColumnTextBlocks(
      doc,
      {
        title: 'Remisión o interconsulta',
        content: data.historiaClinica.remision,
      },
      {
        title: 'Observaciones',
        content: data.historiaClinica.observaciones,
      },
    );
  }

  // =========================================================
  // FIRMA
  // =========================================================

  private addSignature(
    doc: PDFKit.PDFDocument,
    data: MedicalReportPdfData,
  ): void {
    this.ensureSpace(doc, 68);

    const startX = 34;
    const startY = doc.y + 3;
    const width = 527;
    const height = 58;

    doc
      .roundedRect(startX, startY, width, height, 4)
      .fillAndStroke('#F8FAFC', '#CBD5E1');

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(
        'VALIDACIÓN DEL PROFESIONAL',
        startX + 10,
        startY + 8,
        {
          width: 200,
          lineBreak: false,
        },
      );

    doc
      .moveTo(startX + 18, startY + 35)
      .lineTo(startX + 240, startY + 35)
      .lineWidth(0.6)
      .strokeColor('#64748B')
      .stroke();

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        this.normalizeValue(
          data.historiaClinica.firmaDoctor ||
            data.doctor.nombre,
        ),
        startX + 18,
        startY + 39,
        {
          width: 222,
          align: 'center',
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(6.5)
      .text(
        'Firma y nombre del profesional',
        startX + 18,
        startY + 49,
        {
          width: 222,
          align: 'center',
          lineBreak: false,
        },
      );

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(
        'Profesional:',
        startX + 290,
        startY + 18,
        {
          width: 65,
          lineBreak: false,
        },
      );

    doc
      .fillColor('#0F172A')
      .font('Helvetica')
      .fontSize(7.5)
      .text(
        this.normalizeValue(data.doctor.nombre),
        startX + 355,
        startY + 18,
        {
          width: 150,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(
        'Especialidad:',
        startX + 290,
        startY + 34,
        {
          width: 65,
          lineBreak: false,
        },
      );

    doc
      .fillColor('#0F172A')
      .font('Helvetica')
      .fontSize(7.5)
      .text(
        this.normalizeValue(data.doctor.especialidad),
        startX + 355,
        startY + 34,
        {
          width: 150,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc.y = startY + height + 5;
  }

  // =========================================================
  // TÍTULOS Y CUADRÍCULAS
  // =========================================================

  private addSectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
  ): void {
    this.ensureSpace(doc, 24);

    const y = doc.y + 1;

    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(title, 34, y, {
        width: 527,
        lineBreak: false,
      });

    doc
      .moveTo(34, y + 12)
      .lineTo(561, y + 12)
      .lineWidth(0.8)
      .strokeColor('#5EEAD4')
      .stroke();

    doc.y = y + 18;
  }

  private addSubsectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
  ): void {
    this.ensureSpace(doc, 20);

    const y = doc.y + 1;

    doc
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(title.toUpperCase(), 34, y, {
        width: 527,
        lineBreak: false,
      });

    doc
      .moveTo(34, y + 11)
      .lineTo(561, y + 11)
      .lineWidth(0.4)
      .strokeColor('#CBD5E1')
      .stroke();

    doc.y = y + 16;
  }

  private addCompactGrid(
    doc: PDFKit.PDFDocument,
    items: Array<{
      label: string;
      value: string;
      width: number;
    }>,
  ): void {
    const startX = 34;
    const totalWidth = 527;
    const gap = 6;
    const cellHeight = 33;

    let currentX = startX;
    let currentY = doc.y;

    items.forEach((item) => {
      const remainingWidth =
        startX + totalWidth - currentX;

      if (
        currentX !== startX &&
        item.width > remainingWidth
      ) {
        currentX = startX;
        currentY += cellHeight + gap;
      }

      if (
        currentY + cellHeight >
        doc.page.height - 47
      ) {
        doc.addPage();
        this.addContinuationHeader(doc);

        currentX = startX;
        currentY = doc.y;
      }

      doc
        .roundedRect(
          currentX,
          currentY,
          item.width,
          cellHeight,
          3,
        )
        .fillAndStroke('#F8FAFC', '#E2E8F0');

      doc
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .fontSize(6)
        .text(
          item.label.toUpperCase(),
          currentX + 7,
          currentY + 6,
          {
            width: item.width - 14,
            lineBreak: false,
            ellipsis: true,
          },
        );

      doc
        .fillColor('#0F172A')
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          this.normalizeValue(item.value),
          currentX + 7,
          currentY + 18,
          {
            width: item.width - 14,
            lineBreak: false,
            ellipsis: true,
          },
        );

      currentX += item.width + gap;

      if (currentX >= startX + totalWidth) {
        currentX = startX;
        currentY += cellHeight + gap;
      }
    });

    if (currentX !== startX) {
      currentY += cellHeight;
    }

    doc.y = currentY + 5;
  }

  // =========================================================
  // BLOQUES DE TEXTO
  // =========================================================

  private addTwoColumnTextBlocks(
    doc: PDFKit.PDFDocument,
    left: {
      title: string;
      content: string;
      extraLabel?: string;
      extraValue?: string;
    },
    right: {
      title: string;
      content: string;
      extraLabel?: string;
      extraValue?: string;
    },
  ): void {
    const startX = 34;
    const gap = 8;
    const columnWidth = (527 - gap) / 2;

    const leftContent = this.normalizeValue(left.content);
    const rightContent = this.normalizeValue(right.content);

    const leftHeight = this.calculateCompactBlockHeight(
      doc,
      leftContent,
      columnWidth - 16,
      Boolean(left.extraLabel),
    );

    const rightHeight = this.calculateCompactBlockHeight(
      doc,
      rightContent,
      columnWidth - 16,
      Boolean(right.extraLabel),
    );

    const blockHeight = Math.max(leftHeight, rightHeight);

    this.ensureSpace(doc, blockHeight + 7);

    const startY = doc.y;

    this.drawCompactTextBlock(
      doc,
      startX,
      startY,
      columnWidth,
      blockHeight,
      left,
    );

    this.drawCompactTextBlock(
      doc,
      startX + columnWidth + gap,
      startY,
      columnWidth,
      blockHeight,
      right,
    );

    doc.y = startY + blockHeight + 6;
  }

  private drawCompactTextBlock(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    block: {
      title: string;
      content: string;
      extraLabel?: string;
      extraValue?: string;
    },
  ): void {
    doc
      .roundedRect(x, y, width, height, 4)
      .fillAndStroke('#FFFFFF', '#E2E8F0');

    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(6.8)
      .text(
        block.title.toUpperCase(),
        x + 8,
        y + 7,
        {
          width: width - 16,
          lineBreak: false,
          ellipsis: true,
        },
      );

    let textWidth = width - 16;

    if (block.extraLabel) {
      textWidth -= 64;

      doc
        .fillColor('#047857')
        .font('Helvetica-Bold')
        .fontSize(6.3)
        .text(
          block.extraLabel,
          x + width - 65,
          y + 7,
          {
            width: 55,
            align: 'right',
            lineBreak: false,
          },
        );

      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(
          this.normalizeValue(block.extraValue),
          x + width - 65,
          y + 19,
          {
            width: 55,
            align: 'right',
            lineBreak: false,
            ellipsis: true,
          },
        );
    }

    doc
      .fillColor('#1E293B')
      .font('Helvetica')
      .fontSize(7.5)
      .text(
        this.normalizeValue(block.content),
        x + 8,
        y + 19,
        {
          width: textWidth,
          height: height - 25,
          lineGap: 1,
          ellipsis: true,
        },
      );
  }

  // =========================================================
  // ANTECEDENTES
  // =========================================================

  private addAntecedentsTable(
    doc: PDFKit.PDFDocument,
    items: Array<{
      label: string;
      value: string;
    }>,
  ): void {
    const startX = 34;
    const totalWidth = 527;
    const labelWidth = 80;
    const valueWidth =
      (totalWidth - labelWidth * 2) / 2;
    const rowHeight = 27;

    for (
      let index = 0;
      index < items.length;
      index += 2
    ) {
      this.ensureSpace(doc, rowHeight);

      const rowY = doc.y;
      const left = items[index];
      const right = items[index + 1];

      this.drawTableCell(
        doc,
        startX,
        rowY,
        labelWidth,
        rowHeight,
        left.label,
        true,
      );

      this.drawTableCell(
        doc,
        startX + labelWidth,
        rowY,
        valueWidth,
        rowHeight,
        this.normalizeValue(left.value),
        false,
      );

      if (right) {
        this.drawTableCell(
          doc,
          startX + labelWidth + valueWidth,
          rowY,
          labelWidth,
          rowHeight,
          right.label,
          true,
        );

        this.drawTableCell(
          doc,
          startX + labelWidth * 2 + valueWidth,
          rowY,
          valueWidth,
          rowHeight,
          this.normalizeValue(right.value),
          false,
        );
      }

      doc.y = rowY + rowHeight;
    }

    doc.y += 5;
  }

  // =========================================================
  // SIGNOS VITALES
  // =========================================================

  private addVitalSignsTable(
    doc: PDFKit.PDFDocument,
    items: Array<{
      label: string;
      value: string;
    }>,
  ): void {
    const startX = 34;
    const gap = 5;
    const columns = 4;
    const cellWidth = (527 - gap * 3) / columns;
    const cellHeight = 34;

    for (
      let index = 0;
      index < items.length;
      index += columns
    ) {
      this.ensureSpace(doc, cellHeight + 5);

      const rowY = doc.y;
      const rowItems = items.slice(
        index,
        index + columns,
      );

      rowItems.forEach((item, columnIndex) => {
        const x =
          startX +
          columnIndex * (cellWidth + gap);

        doc
          .roundedRect(
            x,
            rowY,
            cellWidth,
            cellHeight,
            3,
          )
          .fillAndStroke('#FFF7ED', '#FED7AA');

        doc
          .fillColor('#9A3412')
          .font('Helvetica-Bold')
          .fontSize(5.8)
          .text(
            item.label.toUpperCase(),
            x + 5,
            rowY + 6,
            {
              width: cellWidth - 10,
              align: 'center',
              lineBreak: false,
              ellipsis: true,
            },
          );

        doc
          .fillColor('#0F172A')
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(
            this.normalizeValue(item.value),
            x + 5,
            rowY + 19,
            {
              width: cellWidth - 10,
              align: 'center',
              lineBreak: false,
              ellipsis: true,
            },
          );
      });

      doc.y = rowY + cellHeight + 5;
    }
  }

  private addInlineObservation(
    doc: PDFKit.PDFDocument,
    title: string,
    content: string,
  ): void {
    this.ensureSpace(doc, 30);

    const startY = doc.y;
    const height = 25;

    doc
      .roundedRect(34, startY, 527, height, 3)
      .fillAndStroke('#F8FAFC', '#E2E8F0');

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text(
        `${title.toUpperCase()}:`,
        42,
        startY + 8,
        {
          width: 145,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc
      .fillColor('#1E293B')
      .font('Helvetica')
      .fontSize(7)
      .text(
        this.normalizeValue(content),
        188,
        startY + 8,
        {
          width: 363,
          lineBreak: false,
          ellipsis: true,
        },
      );

    doc.y = startY + height + 5;
  }

  private drawTableCell(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    isLabel: boolean,
  ): void {
    doc
      .rect(x, y, width, height)
      .fillAndStroke(
        isLabel ? '#F1F5F9' : '#FFFFFF',
        '#CBD5E1',
      );

    doc
      .fillColor(isLabel ? '#475569' : '#1E293B')
      .font(
        isLabel ? 'Helvetica-Bold' : 'Helvetica',
      )
      .fontSize(isLabel ? 6.2 : 7)
      .text(text, x + 5, y + 7, {
        width: width - 10,
        height: height - 10,
        lineGap: 1,
        ellipsis: true,
      });
  }

  // =========================================================
  // PIE DE PÁGINA
  // =========================================================

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (
      let pageIndex = 0;
      pageIndex < pages.count;
      pageIndex += 1
    ) {
      doc.switchToPage(pageIndex);

      const originalBottomMargin =
        doc.page.margins.bottom;

      doc.page.margins.bottom = 0;

      const footerLineY = doc.page.height - 32;
      const footerTextY = doc.page.height - 24;

      doc
        .moveTo(34, footerLineY)
        .lineTo(561, footerLineY)
        .lineWidth(0.4)
        .strokeColor('#CBD5E1')
        .stroke();

      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(6.5)
        .text(
          'Documento generado por SICSA · E.S.E. Hospital Clarita Santos',
          34,
          footerTextY,
          {
            width: 360,
            lineBreak: false,
          },
        );

      doc
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .text(
          `Página ${pageIndex + 1} de ${pages.count}`,
          420,
          footerTextY,
          {
            width: 141,
            align: 'right',
            lineBreak: false,
          },
        );

      doc.page.margins.bottom =
        originalBottomMargin;
    }
  }

  // =========================================================
  // PAGINACIÓN
  // =========================================================

  private ensureSpace(
    doc: PDFKit.PDFDocument,
    requiredHeight: number,
  ): void {
    const bottomLimit = doc.page.height - 47;

    if (doc.y + requiredHeight > bottomLimit) {
      doc.addPage();
      this.addContinuationHeader(doc);
    }
  }

  private addContinuationHeader(
    doc: PDFKit.PDFDocument,
  ): void {
    const startX = 34;
    const startY = 27;

    const logoPath = path.join(
      process.cwd(),
      'assets',
      'hospital.jpg',
    );

    const logoExists = fs.existsSync(logoPath);

    if (logoExists) {
      try {
        doc.image(logoPath, startX, startY, {
          fit: [34, 34],
        });
      } catch {
        // La página continúa aunque el logo no pueda cargarse.
      }
    }

    const textX = logoExists
      ? startX + 43
      : startX;

    doc
      .fillColor('#0F766E')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        'E.S.E. HOSPITAL CLARITA SANTOS',
        textX,
        startY + 1,
        {
          width: 340,
          lineBreak: false,
        },
      );

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Historia clínica de consulta externa · Continuación',
        textX,
        startY + 15,
        {
          width: 340,
          lineBreak: false,
        },
      );

    doc
      .moveTo(34, startY + 38)
      .lineTo(561, startY + 38)
      .lineWidth(0.6)
      .strokeColor('#99F6E4')
      .stroke();

    doc.y = startY + 45;
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  private calculateCompactBlockHeight(
    doc: PDFKit.PDFDocument,
    content: string,
    width: number,
    hasExtraValue: boolean,
  ): number {
    doc.font('Helvetica').fontSize(7.5);

    const availableWidth = hasExtraValue
      ? width - 64
      : width;

    const textHeight = doc.heightOfString(content, {
      width: availableWidth,
      lineGap: 1,
    });

    return Math.max(
      43,
      Math.min(textHeight + 29, 75),
    );
  }

  private normalizeValue(
    value: string | number | null | undefined,
  ): string {
    const normalized = String(value ?? '').trim();

    return normalized || 'Sin registros.';
  }

  private hasValue(
    value: string | null | undefined,
  ): boolean {
    const normalized = value?.trim();

    if (!normalized) {
      return false;
    }

    const valuesWithoutInformation = [
      'No registrados.',
      'No registrado.',
      'Sin registros.',
      'Sin observaciones adicionales.',
    ];

    return !valuesWithoutInformation.includes(
      normalized,
    );
  }

  private withUnit(
    value: string | null | undefined,
    unit: string,
  ): string {
    const normalized = value?.trim();

    if (!normalized) {
      return 'Sin registro';
    }

    if (
      normalized
        .toLowerCase()
        .includes(unit.toLowerCase())
    ) {
      return normalized;
    }

    return `${normalized} ${unit}`;
  }

  private capitalizeText(
    value: string | null | undefined,
  ): string {
    const normalized = String(value ?? '')
      .trim()
      .replaceAll('_', ' ');

    if (!normalized) {
      return 'Sin registro';
    }

    return (
      normalized.charAt(0).toUpperCase() +
      normalized.slice(1).toLowerCase()
    );
  }

  private formatAge(
    age: number | string,
  ): string {
    const normalized = String(age ?? '').trim();

    if (!normalized) {
      return 'No registrada';
    }

    const numericAge = Number(normalized);

    if (Number.isNaN(numericAge)) {
      return normalized;
    }

    return `${numericAge} años`;
  }
}
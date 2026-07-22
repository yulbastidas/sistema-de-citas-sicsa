type AppointmentDateData = {
  fecha: string;
  hora: string;
  estado?: string;
};

export function getAppointmentDateTime(
  fecha: string,
  hora: string,
): Date | null {
  const normalizedFecha = fecha?.trim();
  let normalizedHora = hora?.trim();

  if (!normalizedFecha || !normalizedHora) {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(normalizedHora)) {
    normalizedHora = `${normalizedHora}:00`;
  }

  const appointmentDateTime = new Date(
    `${normalizedFecha}T${normalizedHora}-05:00`,
  );

  if (Number.isNaN(appointmentDateTime.getTime())) {
    return null;
  }

  return appointmentDateTime;
}

export function isAppointmentUpcoming(
  appointment: AppointmentDateData,
): boolean {
  const appointmentDateTime = getAppointmentDateTime(
    appointment.fecha,
    appointment.hora,
  );

  if (!appointmentDateTime) {
    return false;
  }

  return appointmentDateTime.getTime() > Date.now();
}

export function isAppointmentCancellable(
  appointment: AppointmentDateData,
): boolean {
  const status = (appointment.estado || '').trim().toLowerCase();

  const nonCancellableStatuses = [
    'cancelada',
    'atendida',
    'no_asistida',
    'no asistida',
  ];

  return (
    !nonCancellableStatuses.includes(status) &&
    isAppointmentUpcoming(appointment)
  );
}
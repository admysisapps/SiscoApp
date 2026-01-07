import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

export const getAvisoIcon = (tipo: string) => {
  switch (tipo) {
    case "emergencia":
      return "warning";
    case "mantenimiento":
      return "construct";
    case "pago":
      return "card";
    case "recordatorio":
      return "time";
    case "advertencia":
      return "alert-circle";
    default:
      return "information-circle";
  }
};

export const getAvisoColor = (prioridad: string) => {
  switch (prioridad) {
    case "urgente":
      return "#EF4444";
    case "alta":
      return "#F59E0B";
    case "media":
      return "#3B82F6";
    case "baja":
      return "#6B7280";
    default:
      return "#6B7280";
  }
};

export const getPriorityText = (prioridad: string) => {
  switch (prioridad) {
    case "urgente":
      return "URGENTE";
    case "alta":
      return "ALTA";
    case "media":
      return "MEDIA";
    case "baja":
      return "BAJA";
    default:
      return "MEDIA";
  }
};

export const formatEventDate = (timestamp?: string) => {
  if (!timestamp) return null;

  const eventDate = dayjs(timestamp).startOf("day");
  const today = dayjs().startOf("day");
  const diffInDays = eventDate.diff(today, "day");

  if (diffInDays === 0) return "Hoy";
  if (diffInDays === 1) return "Mañana";
  if (diffInDays > 1) return `En ${diffInDays} días`;
  if (diffInDays < 0) return eventDate.format("DD/MM/YYYY");

  return eventDate.format("DD/MM/YYYY");
};

export const formatRelativeTime = (timestamp: string) => {
  if (!timestamp) return "Sin fecha";

  const now = dayjs();
  const createdDate = dayjs(timestamp);
  const diffInMinutes = now.diff(createdDate, "minute");
  const diffInHours = now.diff(createdDate, "hour");
  const diffInDays = now.diff(createdDate, "day");

  if (diffInMinutes < 1) return "hace unos momentos";
  if (diffInMinutes < 60) return `hace ${diffInMinutes} minutos`;
  if (diffInHours < 24) return `hace ${diffInHours} horas`;
  if (diffInDays === 1) return "hace 1 día";
  if (diffInDays < 7) return `hace ${diffInDays} días`;

  return createdDate.format("DD/MM/YYYY");
};

import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "apoderado_session";
const SESSION_TIMESTAMP_KEY = "session_timestamp";

export interface ApoderadoSession {
  apoderado_id: number;
  nombre: string;
  documento: string;
  correo: string;
  apartamentos: string[];
  proyecto_nombre: string;
  proyecto_nit: string;
  copropiedad: string;
  puede_reingresar: boolean;
  // Datos para validación
  codigo_otp: string;
  codigo_copropiedad: string;
  asamblea: {
    id: number;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora: string;
    lugar: string;
    modalidad: "presencial" | "virtual" | "mixta";
    enlace_virtual: string;
    estado: "programada" | "en_curso" | "finalizada" | "cancelada";
    tipo_asamblea: "ordinaria" | "extraordinaria";
    quorum_requerido: number;
    quorum_alcanzado: number;
  };
}

export const sessionService = {
  // Guardar sesión
  async saveSession(sessionData: ApoderadoSession): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [SESSION_KEY, JSON.stringify(sessionData)],
        [SESSION_TIMESTAMP_KEY, Date.now().toString()],
      ]);
    } catch (error) {
      console.error("SESSION_SERVICE: Error guardando sesión -", error);
    }
  },

  // Recuperar sesión
  async getSession(): Promise<ApoderadoSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);

      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed;
      } else {
        return null;
      }
    } catch (error) {
      console.error("SESSION_SERVICE: Error recuperando sesión -", error);
      return null;
    }
  },

  // Verificar si hay sesión válida
  async hasValidSession(): Promise<boolean> {
    try {
      const [sessionData, timestamp] = await AsyncStorage.multiGet([
        SESSION_KEY,
        SESSION_TIMESTAMP_KEY,
      ]);

      if (!sessionData[1] || !timestamp[1]) {
        return false;
      }

      // Verificar que no sea muy antigua (12 horas)
      const sessionTime = parseInt(timestamp[1]);
      const now = Date.now();
      const maxAge = 12 * 60 * 60 * 1000; // 12 horas
      const age = now - sessionTime;
      const isValid = age < maxAge;

      return isValid;
    } catch (error) {
      console.error("SESSION_SERVICE: Error verificando sesión -", error);
      return false;
    }
  },

  // Limpiar sesión
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, SESSION_TIMESTAMP_KEY]);
    } catch (error) {
      console.error("SESSION_SERVICE: Error limpiando sesión -", error);
    }
  },

  // Actualizar solo el estado de la asamblea
  async updateAsambleaEstado(
    nuevoEstado: "programada" | "en_curso" | "finalizada" | "cancelada"
  ): Promise<void> {
    try {
      const session = await this.getSession();
      if (session) {
        session.asamblea.estado = nuevoEstado;
        await this.saveSession(session);
      }
    } catch (error) {
      console.error("Error actualizando estado asamblea:", error);
    }
  },
};

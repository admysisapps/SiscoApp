import { apiService } from "./apiService";
import { PreguntaFormData } from "@/types/Votaciones";
import {
  getCrashlytics,
  recordError,
} from "@react-native-firebase/crashlytics";

export const votacionesService = {
  // SERVICIOS DE VOTACIONES

  async crearVotacion(
    asambleaId: number,
    titulo: string,
    descripcion: string,
    preguntas: PreguntaFormData[]
  ) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/crear",
        {
          asamblea_id: asambleaId,
          titulo,
          descripcion,
          preguntas,
        },
        "VOTACIONES_CREATE"
      );
    } catch (error) {
      console.error("Error creando votación:", error);
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  async obtenerVotaciones(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/listar",
        {
          asamblea_id: asambleaId,
        },
        "VOTACIONES_LIST"
      );
    } catch (error) {
      console.error("Error obteniendo votaciones:", error);
      throw error;
    }
  },

  async activarPregunta(preguntaId: number, estado: string) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/activar-pregunta",
        { pregunta_id: preguntaId, estado },
        "MANAGEMENT_QUESTIONS"
      );
    } catch (error) {
      console.error("Error activando pregunta:", error);
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  async finalizarPregunta(preguntaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/finalizar-pregunta",
        { pregunta_id: preguntaId },
        "MANAGEMENT_QUESTIONS"
      );
    } catch (error) {
      console.error("Error finalizando pregunta:", error);
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  async cancelarPregunta(preguntaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/cancelar-pregunta",
        { pregunta_id: preguntaId },
        "MANAGEMENT_QUESTIONS"
      );
    } catch (error) {
      throw error;
    }
  },

  async obtenerPreguntaActivaAsamblea(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/pregunta-activa",
        { asamblea_id: asambleaId },
        "ACTIVE_QUESTION"
      );
    } catch (error) {
      console.error("Error obteniendo pregunta activa:", error);
      throw error;
    }
  },

  async registrarVoto(preguntaId: number, opcionId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/registrar-voto",
        { pregunta_id: preguntaId, opcion_id: opcionId },
        "ACTIVE_QUESTION"
      );
    } catch (error) {
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  async obtenerResultados(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/votaciones/resultados",
        { asamblea_id: asambleaId },
        "VOTACIONES_LIST"
      );
    } catch (error) {
      console.error("Error obteniendo resultados:", error);
      throw error;
    }
  },
};

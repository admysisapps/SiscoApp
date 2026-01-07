import { quorumCacheService, Participante } from "./cache/quorumCacheService";
import { apiService } from "./apiService";

export const quorumService = {
  // SERVICIOS DE QUORUM

  // Obtiene el quorum de una asamblea específica

  async getQuorumAsamblea(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/quorum-en-curso",
        {
          asamblea_id: asambleaId,
        },
        "ASSEMBLY_QUORUM"
      );
    } catch (error) {
      console.error("Error obteniendo quorum de asamblea:", error);
      throw error;
    }
  },

  // Obtiene participantes con cache inteligente

  async getParticipantesConCache(asambleaId: number): Promise<Participante[]> {
    try {
      // 1. Intentar cargar desde cache
      const cached = await quorumCacheService.getParticipantes(asambleaId);
      let participantes: Participante[] = [];

      if (cached) {
        participantes = Object.values(cached.participantes);
      }

      // 2. Sincronizar con servidor
      const ultimaSync = cached?.ultima_sync;
      const data = await apiService.makeRequestWithContextType(
        "/asambleas/quorum-en-curso",
        {
          asamblea_id: asambleaId,
          include_participantes: true,
          ultima_sync: ultimaSync,
        },
        "ASSEMBLY_QUORUM"
      );

      if (data.success && data.participantes) {
        if (ultimaSync && data.participantes.length > 0) {
          // Sincronización incremental
          await quorumCacheService.applyIncrementalChanges(
            asambleaId,
            data.participantes
          );
          participantes =
            await quorumCacheService.getParticipantesArray(asambleaId);
        } else if (!ultimaSync) {
          // Primera carga completa
          await quorumCacheService.saveParticipantes(
            asambleaId,
            data.participantes
          );
          participantes = data.participantes;
        }
      }

      return participantes;
    } catch (error) {
      console.error("Error obteniendo participantes:", error);
      // En caso de error, devolver cache si existe
      return await quorumCacheService.getParticipantesArray(asambleaId);
    }
  },

  //Limpiar cache de participantes

  async clearParticipantesCache(asambleaId: number | undefined): Promise<void> {
    await quorumCacheService.clearCache(asambleaId);
  },
};

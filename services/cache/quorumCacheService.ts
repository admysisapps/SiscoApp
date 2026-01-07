import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Participante {
  id: number;
  documento: string;
  nombre: string;
  coeficiente: number;
  apartamentos: number;
  presente: boolean;
  ultima_actualizacion: string;
}

export interface QuorumCache {
  participantes: Record<string, Participante>;
  ultima_sync: string;
  total_participantes: number;
  asamblea_id: number;
}

export const quorumCacheService = {
  // Generar clave de cache
  getCacheKey(asambleaId: number): string {
    return `quorum_participantes_${asambleaId}`;
  },

  // Guardar participantes en cache
  async saveParticipantes(
    asambleaId: number,
    participantes: Participante[]
  ): Promise<void> {
    try {
      const participantesMap: Record<string, Participante> = {};

      participantes.forEach((p) => {
        participantesMap[p.id.toString()] = p;
      });

      const cacheData: QuorumCache = {
        participantes: participantesMap,
        ultima_sync: new Date().toISOString(),
        total_participantes: participantes.length,
        asamblea_id: asambleaId,
      };

      await AsyncStorage.setItem(
        this.getCacheKey(asambleaId),
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error("Error guardando participantes en cache:", error);
    }
  },

  // Obtener participantes del cache
  async getParticipantes(asambleaId: number): Promise<QuorumCache | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getCacheKey(asambleaId));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error obteniendo participantes del cache:", error);
      return null;
    }
  },

  // Aplicar cambios incrementales
  async applyIncrementalChanges(
    asambleaId: number,
    nuevosParticipantes: Participante[]
  ): Promise<void> {
    try {
      const cached = await this.getParticipantes(asambleaId);
      if (!cached) return;

      // Aplicar cambios
      nuevosParticipantes.forEach((nuevo) => {
        cached.participantes[nuevo.id.toString()] = nuevo;
      });

      // Actualizar metadata
      cached.ultima_sync = new Date().toISOString();
      cached.total_participantes = Object.keys(cached.participantes).length;

      await AsyncStorage.setItem(
        this.getCacheKey(asambleaId),
        JSON.stringify(cached)
      );
    } catch (error) {
      console.error("Error aplicando cambios incrementales:", error);
    }
  },

  // Obtener lista de participantes como array
  async getParticipantesArray(asambleaId: number): Promise<Participante[]> {
    const cached = await this.getParticipantes(asambleaId);
    if (!cached) return [];

    return Object.values(cached.participantes);
  },

  // Limpiar cache de una asamblea
  async clearCache(asambleaId: number | undefined): Promise<void> {
    if (!asambleaId) return;
    try {
      await AsyncStorage.removeItem(this.getCacheKey(asambleaId));
    } catch (error) {
      console.error("Error limpiando cache:", error);
    }
  },

  // Obtener timestamp de última sincronización
  async getLastSync(asambleaId: number): Promise<string | null> {
    const cached = await this.getParticipantes(asambleaId);
    return cached?.ultima_sync || null;
  },
};

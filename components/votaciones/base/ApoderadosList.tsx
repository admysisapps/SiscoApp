import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { apoderadoService } from "@/services/apoderadoService";

interface Apoderado {
  id: number;
  nombre: string;
  correo: string;
  apartamentos_detalle: string;
  codigo_usado: number;
}

interface ApoderadosListProps {
  asambleaId: number;
}

export default function ApoderadosList({ asambleaId }: ApoderadosListProps) {
  const [expanded, setExpanded] = useState(false);
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cargarApoderados = async () => {
    if (loaded) return;

    setLoading(true);
    try {
      const response =
        await apoderadoService.obtenerApoderadosAsamblea(asambleaId);
      if (response.success && response.data) {
        setApoderados(response.data);
      }
    } catch (error) {
      console.error("Error cargando apoderados:", error);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const handleToggle = () => {
    if (!expanded && !loaded) {
      cargarApoderados();
    }
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.toggleLeft}>
          <Ionicons name="people" size={20} color={THEME.colors.primary} />
          <Text style={styles.toggleText}>Mis apoderados</Text>
          {apoderados.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{apoderados.length}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={THEME.colors.text.secondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Cargando apoderados...</Text>
            </View>
          ) : apoderados.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.emptyText}>No se encontraron apoderados</Text>
            </View>
          ) : (
            apoderados.map((apoderado) => (
              <View key={apoderado.id} style={styles.apoderadoItem}>
                <View style={styles.apoderadoHeader}>
                  <View style={styles.apoderadoInfo}>
                    <Text style={styles.apoderadoNombre}>
                      {apoderado.nombre}
                    </Text>
                    <Text style={styles.apoderadoInmuebles}>
                      {apoderado.correo}
                    </Text>
                    <Text style={styles.apoderadoInmuebles}>
                      Inmuebles: {apoderado.apartamentos_detalle}
                    </Text>
                  </View>
                  {apoderado.codigo_usado === 1 && (
                    <View style={styles.asistenciaBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={THEME.colors.success}
                      />
                      <Text style={styles.asistenciaText}>Asistió</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    overflow: "hidden",
    marginBottom: THEME.spacing.md,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: THEME.spacing.md,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  toggleText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  countBadge: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  loadingText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  emptyText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  apoderadoItem: {
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  apoderadoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  apoderadoInfo: {
    flex: 1,
  },
  apoderadoNombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  apoderadoInmuebles: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  asistenciaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.successLight,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    gap: 4,
  },
  asistenciaText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.success,
  },
});

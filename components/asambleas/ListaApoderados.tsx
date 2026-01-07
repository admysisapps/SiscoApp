import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { apoderadoService } from "@/services/apoderadoService";
import ConfirmModal from "./ConfirmModal";

interface Apoderado {
  id: number;
  nombre: string;
  documento: string;
  correo: string;
  apartamentos_detalle: string;
  codigo_usado: number;
}

interface ListaApoderadosProps {
  asambleaId: number;
  onApoderadoEliminado: () => void;
  onShowToast: (message: string, type: "success" | "error" | "warning") => void;
  refreshTrigger?: number;
  onApartamentosOcupadosChange?: (apartamentos: string[]) => void;
}

const ListaApoderados: React.FC<ListaApoderadosProps> = ({
  asambleaId,
  onApoderadoEliminado,
  onShowToast,
  refreshTrigger,
  onApartamentosOcupadosChange,
}) => {
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [loading, setLoading] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [apoderadoToDelete, setApoderadoToDelete] = useState<Apoderado | null>(
    null
  );

  const cargarApoderados = useCallback(async () => {
    try {
      setLoading(true);
      const response =
        await apoderadoService.obtenerApoderadosAsamblea(asambleaId);

      if (response.success) {
        const apoderadosData = response.data || [];
        setApoderados(apoderadosData);

        // Extraer apartamentos ocupados
        const ocupados = apoderadosData.flatMap((apoderado: Apoderado) =>
          apoderado.apartamentos_detalle
            ? apoderado.apartamentos_detalle.split(",").map((apt) => apt.trim())
            : []
        );
        onApartamentosOcupadosChange?.(ocupados);
      } else {
        setApoderados([]);
        onApartamentosOcupadosChange?.([]);
      }
    } catch {
      setApoderados([]);
      onApartamentosOcupadosChange?.([]);
    } finally {
      setLoading(false);
    }
  }, [asambleaId, onApartamentosOcupadosChange]);

  useEffect(() => {
    cargarApoderados();
  }, [cargarApoderados]);

  // Refresh cuando cambie el trigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      cargarApoderados();
    }
  }, [refreshTrigger, cargarApoderados]);

  const formatearInmuebles = (inmueblesCodigos: string) => {
    if (!inmueblesCodigos || inmueblesCodigos.trim() === "") {
      return "N/A";
    }
    return inmueblesCodigos;
  };

  const confirmarEliminacion = (apoderado: Apoderado) => {
    if (apoderado.codigo_usado === 1) {
      onShowToast(
        "No se puede eliminar un apoderado que ya ha usado su código",
        "warning"
      );
      return;
    }

    setApoderadoToDelete(apoderado);
    setShowConfirmModal(true);
  };

  const eliminarApoderado = async (apoderadoId: number) => {
    try {
      setEliminandoId(apoderadoId);
      const response = await apoderadoService.eliminarApoderado(apoderadoId);

      if (response.success) {
        onShowToast("Apoderado eliminado exitosamente", "success");
        const nuevosApoderados = apoderados.filter((a) => a.id !== apoderadoId);
        setApoderados(nuevosApoderados);

        // Actualizar apartamentos ocupados
        const ocupados = nuevosApoderados.flatMap((apoderado: Apoderado) =>
          apoderado.apartamentos_detalle
            ? apoderado.apartamentos_detalle.split(",").map((apt) => apt.trim())
            : []
        );
        onApartamentosOcupadosChange?.(ocupados);
        onApoderadoEliminado();
      } else {
        onShowToast(response.error || "Error al eliminar apoderado", "error");
      }
    } catch {
      onShowToast("Error al eliminar apoderado", "error");
    } finally {
      setEliminandoId(null);
    }
  };

  const renderApoderado = (item: Apoderado) => (
    <View key={item.id} style={styles.apoderadoCard}>
      <View style={styles.apoderadoInfo}>
        <Text style={styles.apoderadoNombre}>{item.nombre}</Text>
        <Text style={styles.apoderadoDetalle}>Doc: {item.documento}</Text>
        <Text style={styles.apoderadoDetalle}>
          Inmuebles: {formatearInmuebles(item.apartamentos_detalle)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          { opacity: item.codigo_usado === 1 ? 0.5 : 1 },
        ]}
        onPress={() => confirmarEliminacion(item)}
        disabled={eliminandoId === item.id || item.codigo_usado === 1}
      >
        {eliminandoId === item.id ? (
          <Ionicons
            name="hourglass-outline"
            size={20}
            color={THEME.colors.text.secondary}
          />
        ) : (
          <Ionicons name="trash-outline" size={20} color={THEME.colors.error} />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Cargando apoderados...</Text>
      </View>
    );
  }

  if (apoderados.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="people-outline"
          size={48}
          color={THEME.colors.text.secondary}
        />
        <Text style={styles.emptyText}>No hay apoderados registrados</Text>
        <Text style={styles.emptySubtext}>
          Los apoderados aparecerán aquí una vez registrados
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="people-outline"
          size={20}
          color={THEME.colors.primary}
        />
        <Text style={styles.headerTitle}>
          Apoderados Registrados ({apoderados.length})
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {apoderados.map(renderApoderado)}
      </ScrollView>

      <ConfirmModal
        visible={showConfirmModal}
        type="confirm"
        title="Eliminar apoderado"
        message={`¿Estás seguro que deseas eliminar el poder de ${apoderadoToDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (apoderadoToDelete) {
            eliminarApoderado(apoderadoToDelete.id);
          }
          setShowConfirmModal(false);
          setApoderadoToDelete(null);
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setApoderadoToDelete(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.lg,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.xl,
  },
  loadingText: {
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  listContainer: {
    paddingBottom: THEME.spacing.md,
  },
  apoderadoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  apoderadoInfo: {
    flex: 1,
  },
  apoderadoNombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  apoderadoDetalle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },

  deleteButton: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.error + "10",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyText: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    textAlign: "center",
  },
});

export default ListaApoderados;

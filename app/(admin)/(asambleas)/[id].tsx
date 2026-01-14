import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { THEME } from "@/constants/theme";
import { asambleaService } from "@/services/asambleaService";
import LoadingOverlay from "@/components/LoadingOverlay";
import AsambleaDetalleHeader from "@/components/asambleas/AsambleaDetalleHeader";
import AsambleaProgramada from "@/components/asambleas/AsambleaProgramada";
import AsambleaProgramadaAdmin from "@/components/asambleas/AsambleaProgramadaAdmin";
import Toast from "@/components/Toast";
import ScreenHeader from "@/components/shared/ScreenHeader";

import AsambleaFinalizadaAdmin from "@/components/asambleas/AsambleaFinalizadaAdmin";
import AsambleaCancelada from "@/components/asambleas/AsambleaCancelada";
import { Asamblea } from "@/types/Asamblea";
import { useRole } from "@/hooks/useRole";

export default function AdminDetalleAsambleaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useRole();
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const cargarAsamblea = useCallback(async () => {
    if (!id) return;

    setCargando(true);
    setError(null);

    try {
      const response = await asambleaService.getAsamblea(Number(id));

      if (response.success && response.asamblea) {
        setAsamblea(response.asamblea);
      } else {
        setError("No se pudo cargar la asamblea");
      }
    } catch (err) {
      console.error("Error al cargar asamblea:", err);
      setError("No se pudo cargar la asamblea");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    const loadInitialData = async () => {
      await cargarAsamblea();
      setIsFirstLoad(false);
    };
    loadInitialData();
  }, [cargarAsamblea]);

  // Redirigir a moderación si la asamblea está en curso
  useEffect(() => {
    if (asamblea?.estado === "en_curso") {
      // Pasar datos directamente para evitar re-carga
      router.replace({
        pathname: "/(admin)/(asambleas)/asamblea-moderacion",
        params: {
          asambleaId: asamblea.id.toString(),
          fromRedirect: "true",
        },
      });
    }
  }, [asamblea?.estado, asamblea?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarAsamblea();
    setRefreshing(false);
  };

  const showToast = useCallback(
    (message: string, type: "error" | "success" | "warning") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  // Renderizado condicional según el estado
  const renderContenidoSegunEstado = () => {
    if (!asamblea) return null;

    switch (asamblea.estado) {
      case "programada":
        return isAdmin ? (
          <AsambleaProgramadaAdmin
            asamblea={asamblea}
            onEstadoChanged={cargarAsamblea}
            onShowToast={showToast}
          />
        ) : (
          <AsambleaProgramada asamblea={asamblea} onShowToast={showToast} />
        );
      case "finalizada":
        return (
          <AsambleaFinalizadaAdmin
            asamblea={asamblea}
            onShowToast={showToast}
          />
        );
      case "cancelada":
        return <AsambleaCancelada asamblea={asamblea} />;
      default:
        return null;
    }
  };

  // Solo mostrar LoadingOverlay en la primera carga
  if (cargando && isFirstLoad) {
    return <LoadingOverlay visible={true} />;
  }

  if (error || !asamblea) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Detalle de Asamblea" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "No se pudo cargar la asamblea"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Detalle de Asamblea" />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.primary}
            colors={[THEME.colors.primary, THEME.colors.primaryLight]}
            progressBackgroundColor={THEME.colors.surface}
            title="Actualizando detalle..."
            titleColor={THEME.colors.text.secondary}
          />
        }
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado con información básica */}
        <AsambleaDetalleHeader asamblea={asamblea} onShowToast={showToast} />

        {/* Contenido específico según estado */}
        {renderContenidoSegunEstado()}

        {/* Espacio adicional al final */}
        <View style={{ height: 50 }} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.error,
  },
});

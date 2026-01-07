import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { asambleaService } from "@/services/asambleaService";
import LoadingOverlay from "@/components/LoadingOverlay";
import AsambleaDetalleHeader from "@/components/asambleas/AsambleaDetalleHeader";
import AsambleaProgramada from "@/components/asambleas/AsambleaProgramada";
import AsambleaEnCurso from "@/components/asambleas/AsambleaEnCurso";
import AsambleaFinalizada from "@/components/asambleas/AsambleaFinalizada";
import AsambleaCancelada from "@/components/asambleas/AsambleaCancelada";
import Toast from "@/components/Toast";
import { Asamblea } from "@/types/Asamblea";

export default function DetalleAsambleaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
  }, [cargarAsamblea, id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarAsamblea();
    setRefreshing(false);
  }, [cargarAsamblea]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

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
        return (
          <AsambleaProgramada asamblea={asamblea} onShowToast={showToast} />
        );
      case "en_curso":
        return <AsambleaEnCurso asamblea={asamblea} />;
      case "finalizada":
        return <AsambleaFinalizada asamblea={asamblea} />;
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={THEME.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle de Asamblea</Text>
          <View style={styles.backButton} />
        </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Asamblea</Text>
        <View style={styles.headerSpacer} />
      </View>

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
        <View style={styles.bottomSpacer} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
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
  bottomSpacer: {
    height: 50,
  },
});

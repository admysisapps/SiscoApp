import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { THEME } from "@/constants/theme";
import { useApoderado } from "@/contexts/ApoderadoContext";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { sessionService } from "@/services/cache/sessionService";

import AsambleaDetalleHeaderApoderado from "@/components/asambleas/AsambleaDetalleHeaderApoderado";
import AsambleaProgramada from "@/components/asambleas/AsambleaProgramada";
import AsambleaEnCursoApoderado from "@/components/asambleas/AsambleaEnCursoApoderado";
import AsambleaFinalizada from "@/components/asambleas/AsambleaFinalizada";
import AsambleaCancelada from "@/components/asambleas/AsambleaCancelada";
import { Asamblea } from "@/types/Asamblea";

export default function DetalleAsambleaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, restoreSession } = useApoderado();
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });
  const [showExitModal, setShowExitModal] = useState(false);

  const cargarAsamblea = useCallback(async () => {
    if (!session) {
      // Intentar restaurar sesión desde AsyncStorage
      const restored = await restoreSession();
      if (restored) {
        // La sesión se restauró, el useEffect se ejecutará de nuevo
        return;
      }

      setError("No hay sesión de apoderado activa");
      return;
    }

    const asambleaId = id ? Number(id) : session.asamblea?.id;

    if (asambleaId !== session.asamblea?.id) {
      setError("ID de asamblea no coincide con la sesión");
      return;
    }

    try {
      // Usar los datos completos de la asamblea desde la sesión
      if (session.asamblea) {
        const asambleaCompleta: Asamblea = {
          id: session.asamblea.id,
          titulo: session.asamblea.titulo,
          descripcion: session.asamblea.descripcion || "",
          fecha:
            session.asamblea.fecha || new Date().toISOString().split("T")[0],
          hora: session.asamblea.hora || "00:00",
          lugar: session.asamblea.lugar || "",
          modalidad: session.asamblea.modalidad || "virtual",
          enlace_virtual: session.asamblea.enlace_virtual || "",
          estado: session.asamblea.estado as
            | "programada"
            | "en_curso"
            | "finalizada"
            | "cancelada",
          tipo_asamblea: session.asamblea.tipo_asamblea as
            | "ordinaria"
            | "extraordinaria",
          quorum_requerido: session.asamblea.quorum_requerido || 0,
          quorum_alcanzado: session.asamblea.quorum_alcanzado || 0,
          proyecto_id: session.proyecto_nit || "",
          creador_id: 0,
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
        };

        setAsamblea(asambleaCompleta);
        setError(null);
      } else {
        setError("No se encontraron datos de la asamblea en la sesión");
      }
    } catch {
      setError("Error al procesar los datos de la asamblea");
    }
  }, [id, session, restoreSession]);

  useEffect(() => {
    cargarAsamblea();
  }, [cargarAsamblea]);

  // Manejar botón de retroceso
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

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
        return <AsambleaEnCursoApoderado asamblea={asamblea} />;
      case "finalizada":
        return <AsambleaFinalizada asamblea={asamblea} />;
      case "cancelada":
        return <AsambleaCancelada asamblea={asamblea} />;
      default:
        return null;
    }
  };

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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Detalle de Asamblea"
        onBackPress={() => setShowExitModal(true)}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado con información básica */}
        <AsambleaDetalleHeaderApoderado
          asamblea={asamblea}
          onShowToast={showToast}
        />

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

      <ConfirmModal
        visible={showExitModal}
        type="warning"
        title="Salir de la asamblea"
        message="Si sales ahora, deberás volver a iniciar sesión para acceder nuevamente. ¿Estás seguro?"
        confirmText="Salir"
        cancelText="Cancelar"
        onConfirm={async () => {
          setShowExitModal(false);
          // Limpiar sesión de apoderado y user_context
          await sessionService.clearSession();
          try {
            await AsyncStorage.removeItem("user_context");
          } catch (error) {
            console.error("Error limpiando user_context:", error);
          }
          router.replace("/(auth)/login");
        }}
        onCancel={() => setShowExitModal(false)}
      />
    </SafeAreaView>
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
  bottomSpacer: {
    height: 50,
  },
});

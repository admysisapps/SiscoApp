import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { THEME } from "@/constants/theme";
import { Votacion, PreguntaFormData } from "@/types/Votaciones";
import { votacionesService } from "@/services/votacionesService";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

import VotacionForm from "@/components/votaciones/base/admin/VotacionForm";
import PreguntasForm from "@/components/votaciones/base/admin/PreguntasForm";

const VotacionCrearScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const asambleaId = params.asambleaId
    ? parseInt(params.asambleaId as string)
    : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [votacionData, setVotacionData] = useState<Partial<Votacion>>({
    asamblea_id: asambleaId || 0,
    estado: "programada",
  });
  const [preguntas, setPreguntas] = useState<PreguntaFormData[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  const handleVotacionSubmit = (data: Partial<Votacion>) => {
    setVotacionData(data);
    setCurrentStep(2);
  };

  const handlePreguntasSubmit = async (preguntasData: PreguntaFormData[]) => {
    setPreguntas(preguntasData);
    try {
      const response = await votacionesService.crearVotacion(
        asambleaId!,
        votacionData.titulo!,
        votacionData.descripcion || "",
        preguntasData
      );

      if (response.success) {
        showToast("Votación creada exitosamente", "success");
        setTimeout(() => router.back(), 1500);
      } else {
        showToast(response.error || "Error al crear la votación", "error");
      }
    } catch (error) {
      console.error("Error creando votación:", error);
      showToast("Error al crear la votación", "error");
    }
  };

  const handleBack = () => {
    if (currentStep === 2 && preguntas.length > 0) {
      setShowExitModal(true);
    } else if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(1);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (currentStep === 2 && preguntas.length > 0) {
          setShowExitModal(true);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [currentStep, preguntas])
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Votación</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {currentStep === 1 ? (
          <VotacionForm
            initialData={votacionData}
            onSubmit={handleVotacionSubmit}
          />
        ) : (
          <PreguntasForm
            votacionData={votacionData}
            initialPreguntas={preguntas}
            onSubmit={handlePreguntasSubmit}
            onBack={() => setCurrentStep(1)}
            onPreguntasChange={setPreguntas}
            showToast={showToast}
          />
        )}
      </View>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ConfirmModal
        visible={showExitModal}
        type="warning"
        title="Salir sin guardar"
        message="Tienes preguntas sin guardar. Si sales ahora, se perderán todos los cambios. ¿Estás seguro?"
        confirmText="Salir"
        cancelText="Continuar"
        onConfirm={() => {
          setShowExitModal(false);
          setPreguntas([]);
          setCurrentStep(1);
        }}
        onCancel={() => setShowExitModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    padding: 16,
  },
});

export default VotacionCrearScreen;

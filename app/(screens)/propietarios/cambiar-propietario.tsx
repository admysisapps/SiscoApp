import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import { propietarioService } from "@/services/propietarioService";
import { ConfirmarCreacionModal } from "@/components/propietarios/ConfirmarCreacionModal";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import Toast from "@/components/Toast";

export default function CambiarPropietarioScreen() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();
  const [cedula, setCedula] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cedulaParaCrear, setCedulaParaCrear] = useState("");
  const [animationActive, setAnimationActive] = useState(true);

  // Animaciones para los números
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!animationActive) return;

    // Animación secuencial de los números
    const animateNumbers = () => {
      if (!animationActive) return;

      scaleAnims.forEach((anim, index) => {
        setTimeout(() => {
          if (!animationActive) return;

          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 200);
      });
    };

    // Iniciar animación después de un delay
    const timer = setTimeout(animateNumbers, 500);

    // Repetir cada 4 segundos
    intervalRef.current = setInterval(animateNumbers, 4000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scaleAnims, animationActive]);

  const buscarUsuario = async () => {
    if (!cedula.trim()) {
      setToast({
        visible: true,
        message: "Ingresa la cédula",
        type: "error",
      });
      return;
    }

    if (!/^[1-9][0-9]{3,10}$/.test(cedula.trim())) {
      setToast({
        visible: true,
        message: "Verifica la cédula",
        type: "error",
      });
      return;
    }

    // Validar que no sea la cédula del admin
    if (user?.documento === cedula.trim()) {
      setToast({
        visible: true,
        message: "No se puede transferir inmuebles a su propia cédula",
        type: "warning",
      });
      return;
    }

    // Detener animación durante la búsqueda
    setAnimationActive(false);
    showLoading("Buscando usuario...");
    try {
      const resultado = await propietarioService.buscarUsuario(cedula);

      if (resultado.success && resultado.data) {
        if (resultado.data.existe) {
          // Navegar automáticamente a pantalla de usuario existente
          router.push({
            pathname: "/(screens)/propietarios/usuario-existente",
            params: {
              usuario: JSON.stringify(resultado.data.usuario),
              apartamentos: JSON.stringify(resultado.data.apartamentos || []),
            },
          });
        } else {
          // Mostrar modal de confirmación para crear usuario
          setCedulaParaCrear(resultado.data.cedula);
          setShowConfirmModal(true);
        }
      } else {
        setToast({
          visible: true,
          message: resultado.error || "No se pudo buscar el usuario",
          type: "error",
        });
      }
    } catch {
      setToast({
        visible: true,
        message: "Error de conexión al buscar usuario",
        type: "error",
      });
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transferir la propiedad</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input de búsqueda */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Buscar Propietario</Text>
          <Text style={styles.sectionSubtitle}>
            Ingresa la cédula del propietario actual o de la persona que
            recibirá el inmueble.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Número de cédula"
              placeholderTextColor={COLORS.text.muted}
              value={cedula}
              onChangeText={setCedula}
              keyboardType="numeric"
              maxLength={11}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              !cedula.trim() && styles.searchButtonDisabled,
            ]}
            onPress={buscarUsuario}
            disabled={!cedula.trim()}
          >
            <Ionicons
              name="search"
              size={20}
              color={THEME.colors.text.inverse}
            />
            <Text
              style={[
                styles.searchButtonText,
                { marginLeft: THEME.spacing.sm },
              ]}
            >
              Buscar Usuario
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información del proceso */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          </View>

          <View style={styles.stepsList}>
            <View style={[styles.step, { marginBottom: THEME.spacing.md }]}>
              <Animated.View
                style={[
                  styles.stepNumber,
                  { transform: [{ scale: scaleAnims[0] }] },
                ]}
              >
                <Text style={styles.stepNumberText}>1</Text>
              </Animated.View>
              <Text style={styles.stepText}>
                Verificamos si el usuario ya tiene cuenta en el sistema
              </Text>
            </View>

            <View style={[styles.step, { marginBottom: THEME.spacing.md }]}>
              <Animated.View
                style={[
                  styles.stepNumber,
                  { transform: [{ scale: scaleAnims[1] }] },
                ]}
              >
                <Text style={styles.stepNumberText}>2</Text>
              </Animated.View>
              <Text style={styles.stepText}>
                Si no está registrada, solicitaremos sus datos básicos
              </Text>
            </View>

            <View style={[styles.step, { marginBottom: THEME.spacing.md }]}>
              <Animated.View
                style={[
                  styles.stepNumber,
                  { transform: [{ scale: scaleAnims[2] }] },
                ]}
              >
                <Text style={styles.stepNumberText}>3</Text>
              </Animated.View>
              <Text style={styles.stepText}>
                Seleccionamos la unidad que se transferirá
              </Text>
            </View>

            <View style={styles.step}>
              <Animated.View
                style={[
                  styles.stepNumber,
                  { transform: [{ scale: scaleAnims[3] }] },
                ]}
              >
                <Text style={styles.stepNumberText}>4</Text>
              </Animated.View>
              <Text style={styles.stepText}>
                Confirmamos el cambio, Esta acción no se puede revertir.
              </Text>
            </View>
          </View>
        </View>

        {/* Consideraciones importantes */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={THEME.colors.warning} />
            <Text style={styles.warningTitle}>¡Importante!</Text>
          </View>

          <Text style={styles.warningText}>
            • Una vez confirmado, el cambio no se puede deshacer
          </Text>
          <Text style={styles.warningText}>
            • El acceso al inmueble se actualizará automáticamente
          </Text>
          <Text style={styles.warningText}>
            • Asegúrate de revisar que los datos sean correctos antes de
            confirmar
          </Text>
        </View>
      </ScrollView>

      {/* Modal de confirmación */}
      <ConfirmarCreacionModal
        visible={showConfirmModal}
        cedula={cedulaParaCrear}
        onConfirm={() => {
          setShowConfirmModal(false);
          router.push({
            pathname: "/(screens)/propietarios/crear-usuario",
            params: { cedula: cedulaParaCrear },
          });
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setCedulaParaCrear("");
        }}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
  },
  searchSection: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
    color: COLORS.text.primary,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
  },
  searchButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.text.muted,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  infoTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  stepsList: {
    // gap removido para compatibilidad
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.sm,
  },
  stepNumberText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: THEME.colors.warningLight,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  warningTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.warning,
    marginLeft: THEME.spacing.sm,
  },
  warningText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.warning,
    marginBottom: 4,
    lineHeight: 18,
  },
});

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "@/components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";
import { userCacheService } from "@/services/cache/userCacheService";
import { THEME } from "@/constants/theme";

interface EditPersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export default function EditPersonalInfoModal({
  visible,
  onClose,
  onSave,
}: EditPersonalInfoModalProps) {
  const { user, updateUserInfo } = useUser();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  useEffect(() => {
    if (visible && user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        telefono: user.telefono || "",
      });
      setErrors({});
    }
  }, [visible, user]);

  const hasChanges =
    user &&
    (formData.nombre !== (user.nombre || "") ||
      formData.apellido !== (user.apellido || "") ||
      formData.telefono !== (user.telefono || ""));

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    } else if (formData.apellido.trim().length < 3) {
      newErrors.apellido = "El apellido debe tener al menos 3 caracteres";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!/^3[0-9]{9}$/.test(formData.telefono.trim())) {
      newErrors.telefono = "El teléfono debe empezar con 3 y tener 10 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setToast({ visible: true, message, type });
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    setSaving(true);
    const success = await updateUserInfo(formData);

    if (success) {
      if (user?.documento && selectedProject) {
        await userCacheService.invalidateProject(
          user.documento,
          selectedProject.NIT
        );
      }

      showToast("Información actualizada correctamente", "success");
      onSave();
    } else {
      showToast("No se pudo actualizar la información", "error");
    }

    setSaving(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        "Descartar cambios",
        "¿Estás seguro de que quieres cerrar sin guardar?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              setFormData({
                nombre: user?.nombre || "",
                apellido: user?.apellido || "",
                telefono: user?.telefono || "",
              });
              setErrors({});
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalBackground} edges={["top", "bottom"]}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons
              name="close-circle"
              size={32}
              color={THEME.colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Editar Información</Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={[styles.input, errors.nombre && styles.inputError]}
                  value={formData.nombre}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre: text })
                  }
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={THEME.colors.text.muted}
                  autoCapitalize="words"
                  maxLength={50}
                />
                {errors.nombre && (
                  <Text style={styles.errorText}>{errors.nombre}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={[styles.input, errors.apellido && styles.inputError]}
                  value={formData.apellido}
                  onChangeText={(text) =>
                    setFormData({ ...formData, apellido: text })
                  }
                  placeholder="Ingresa tu apellido"
                  placeholderTextColor={THEME.colors.text.muted}
                  autoCapitalize="words"
                  maxLength={50}
                />
                {errors.apellido && (
                  <Text style={styles.errorText}>{errors.apellido}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={[styles.input, errors.telefono && styles.inputError]}
                  value={formData.telefono}
                  onChangeText={(text) =>
                    setFormData({ ...formData, telefono: text })
                  }
                  placeholder="Ingresa tu teléfono"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.telefono && (
                  <Text style={styles.errorText}>{errors.telefono}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!hasChanges || isSaving) && styles.submitButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  titleContainer: {
    alignItems: "center",
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    paddingHorizontal: 50,
  },
  title: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  form: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
  fieldContainer: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    backgroundColor: THEME.colors.surface,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.error,
    marginTop: 4,
  },

  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    alignItems: "center",
    marginTop: THEME.spacing.md,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.colors.primary + "60",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});

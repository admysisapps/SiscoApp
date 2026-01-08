import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "@/services/apiService";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

interface GenerarPoderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ApoderadoData) => void;
  asambleaId: number;
  onShowToast?: (
    message: string,
    type: "success" | "error" | "warning"
  ) => void;
  emailError?: string | null;
  apartamentosOcupados?: string[];
}

interface ApoderadoData {
  nombre: string;
  cedula: string;
  correo: string;
  telefono?: string;
  apartamentos?: string;
}

interface FormErrors {
  nombre?: string;
  cedula?: string;
  correo?: string;
  telefono?: string;
  apartamentos?: string;
}

export default function GenerarPoderModal({
  visible,
  onClose,
  onSave,
  asambleaId,
  onShowToast,
  emailError: externalEmailError,
  apartamentosOcupados = [],
}: GenerarPoderModalProps) {
  // Estados del formulario
  const [formData, setFormData] = useState<ApoderadoData>({
    nombre: "",
    cedula: "",
    correo: "",
  });
  const [selectedApartamentos, setSelectedApartamentos] = useState<string[]>(
    []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Estados de apartamentos
  const [apartamentos, setApartamentos] = useState<string[]>([]);
  const [loadingApartamentos, setLoadingApartamentos] = useState(false);
  const [errorApartamentos, setErrorApartamentos] = useState<string | null>(
    null
  );

  // Estado de poderes habilitados
  const [poderesHabilitados, setPoderesHabilitados] = useState(true);

  // Estado para error de correo en el modal
  const [emailError, setEmailError] = useState<string | null>(null);

  // Estado para la cédula del usuario actual
  const [userCedula, setUserCedula] = useState<string | null>(null);

  // Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar apartamentos desde API
  const loadApartamentos = useCallback(async () => {
    setLoadingApartamentos(true);
    setErrorApartamentos(null);

    try {
      const response = await apiService.getApartamentosUsuario();

      if (response.success && response.data) {
        const apartamentosFormateados = response.data.map((apt: any) =>
          apt.bloque ? `${apt.numero}-${apt.bloque}` : apt.numero
        );
        setApartamentos(apartamentosFormateados);
      } else {
        setErrorApartamentos("No se pudieron cargar los apartamentos");
      }
    } catch {
      setErrorApartamentos("Error de conexión al cargar apartamentos");
    } finally {
      setLoadingApartamentos(false);
    }
  }, []);

  // Verificar poderes habilitados y obtener cédula del usuario
  const checkPoderes = useCallback(async () => {
    try {
      const context = await AsyncStorage.getItem("user_context");
      if (context) {
        const parsedContext = JSON.parse(context);
        setPoderesHabilitados(parsedContext.poderes_habilitados);
        setUserCedula(parsedContext.documento?.trim() || null);
      }
    } catch {
      // Error silencioso, mantener estado por defecto
    }
  }, []);

  // Obtener clave de storage con proyecto y usuario
  const getStorageKey = useCallback(async () => {
    try {
      const context = await AsyncStorage.getItem("user_context");
      if (context) {
        const parsedContext = JSON.parse(context);
        return `apoderado_${parsedContext.documento}_${parsedContext.proyecto_nit}_${asambleaId}`;
      }
    } catch {}
    return `apoderado_${asambleaId}`; // Fallback
  }, [asambleaId]);

  // Cargar datos guardados
  const loadSavedData = useCallback(async () => {
    try {
      const storageKey = await getStorageKey();
      const savedData = await AsyncStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);

        if (parsedData.apartamentos) {
          setSelectedApartamentos(
            parsedData.apartamentos.split(",").map((apt: string) => apt.trim())
          );
        } else {
          setSelectedApartamentos([]);
        }
      } else {
        setFormData({ nombre: "", cedula: "", correo: "" });
        setSelectedApartamentos([]);
      }
    } catch {
      setFormData({ nombre: "", cedula: "", correo: "" });
      setSelectedApartamentos([]);
    }
    setErrors({});
    setHasChanges(false);
  }, [getStorageKey]);

  // Inicializar modal cuando se abre
  useEffect(() => {
    if (visible) {
      checkPoderes();
      loadApartamentos();
      loadSavedData();
      setEmailError(null); // Limpiar error de correo al abrir
    }
  }, [visible, asambleaId, checkPoderes, loadApartamentos, loadSavedData]);

  // Actualizar error de correo desde prop externa
  useEffect(() => {
    setEmailError(externalEmailError || null);
  }, [externalEmailError]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const checkChanges = async () => {
      try {
        const storageKey = await getStorageKey();
        const savedData = await AsyncStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const savedApartamentos = parsedData.apartamentos
            ? parsedData.apartamentos
                .split(",")
                .map((apt: string) => apt.trim())
            : [];

          const apartamentosChanged =
            selectedApartamentos.length !== savedApartamentos.length ||
            selectedApartamentos.some(
              (apt) => !savedApartamentos.includes(apt)
            );

          const changed =
            formData.nombre !== parsedData.nombre ||
            formData.cedula !== parsedData.cedula ||
            formData.correo !== parsedData.correo ||
            (formData.telefono || "") !== (parsedData.telefono || "") ||
            apartamentosChanged;

          setHasChanges(changed);
        } else {
          setHasChanges(
            formData.nombre !== "" ||
              formData.cedula !== "" ||
              formData.correo !== "" ||
              (formData.telefono || "") !== "" ||
              selectedApartamentos.length > 0
          );
        }
      } catch {
        setHasChanges(true);
      }
    };

    checkChanges();
  }, [formData, selectedApartamentos, getStorageKey]);

  // Validar formulario
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Limpiar espacios en blanco
    const cleanNombre = formData.nombre.trim();
    const cleanCedula = formData.cedula.trim();
    const cleanCorreo = formData.correo.trim();
    const cleanTelefono = formData.telefono?.trim();

    if (!cleanNombre) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!cleanCedula) {
      newErrors.cedula = "Ingresa la cédula";
    } else if (!/^[1-9][0-9]{3,10}$/.test(cleanCedula)) {
      newErrors.cedula = "Verifica la cédula";
    } else if (userCedula && cleanCedula === userCedula) {
      newErrors.cedula = "No puedes asignar poder a tu propia cédula";
    }

    if (!cleanCorreo) {
      newErrors.correo = "Ingresa el correo";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanCorreo)
    ) {
      newErrors.correo = "Verifica el correo";
    }

    if (cleanTelefono && !/^3[0-9]{9}$/.test(cleanTelefono)) {
      newErrors.telefono = "El teléfono debe empezar con 3 y tener 10 dígitos";
    }

    if (selectedApartamentos.length === 0) {
      newErrors.apartamentos = "Debe seleccionar al menos un inmueble";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar datos del formulario
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // Limpiar espacios en blanco antes de guardar
      const dataToSave = {
        nombre: formData.nombre.trim(),
        cedula: formData.cedula.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono?.trim(),
        apartamentos: selectedApartamentos.join(","),
      };

      const storageKey = await getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(dataToSave));

      onSave(dataToSave);
    } catch {
      onShowToast?.("No se pudo guardar la información", "error");
    }
  };

  // Cerrar modal con confirmación si hay cambios
  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  // Seleccionar/deseleccionar apartamento
  const toggleApartamento = (apartamento: string) => {
    // Convertir formato: "13-A" -> "A013"
    const codigoApt = apartamento.includes("-")
      ? apartamento.split("-")[1] + apartamento.split("-")[0].padStart(3, "0")
      : apartamento.padStart(3, "0");

    // Verificar si está ocupado
    if (apartamentosOcupados.includes(codigoApt)) {
      return; // No hacer nada si está ocupado
    }

    if (selectedApartamentos.includes(apartamento)) {
      setSelectedApartamentos(
        selectedApartamentos.filter((apt) => apt !== apartamento)
      );
    } else {
      setSelectedApartamentos([...selectedApartamentos, apartamento]);
    }
  };

  // No mostrar modal si poderes están deshabilitados
  if (!poderesHabilitados) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Botón de cierre en la esquina */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons
              name="close-circle"
              size={32}
              color={THEME.colors.primary}
            />
          </TouchableOpacity>

          {/* Título */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Generar Poder</Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              {/* Campo Nombre */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Nombre completo *</Text>
                <TextInput
                  style={[styles.input, errors.nombre && styles.inputError]}
                  value={formData.nombre}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre: text })
                  }
                  placeholder="Ingrese nombre completo"
                  placeholderTextColor={THEME.colors.text.muted}
                  autoCapitalize="words"
                  maxLength={100}
                />
                {errors.nombre && (
                  <Text style={styles.errorText}>{errors.nombre}</Text>
                )}
              </View>

              {/* Campo Cédula */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Cédula *</Text>
                <TextInput
                  style={[styles.input, errors.cedula && styles.inputError]}
                  value={formData.cedula}
                  onChangeText={(text) =>
                    setFormData({ ...formData, cedula: text })
                  }
                  placeholder="Ingrese número de cédula"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={11}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  importantForAutofill="yes"
                  autoCorrect={false}
                />
                {errors.cedula && (
                  <Text style={styles.errorText}>{errors.cedula}</Text>
                )}
              </View>

              {/* Campo Correo */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Correo electrónico *</Text>
                <TextInput
                  style={[styles.input, errors.correo && styles.inputError]}
                  value={formData.correo}
                  onChangeText={(text) => {
                    setFormData({ ...formData, correo: text });
                    setEmailError(null); // Limpiar error al escribir
                  }}
                  placeholder="Ingrese correo electrónico"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={100}
                />
                {errors.correo && (
                  <Text style={styles.errorText}>{errors.correo}</Text>
                )}
                {emailError && (
                  <View style={styles.emailErrorContainer}>
                    <Ionicons
                      name="warning"
                      size={16}
                      color={THEME.colors.error}
                    />
                    <Text style={styles.emailErrorText}>{emailError}</Text>
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={[styles.input, errors.telefono && styles.inputError]}
                  value={formData.telefono || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, telefono: text })
                  }
                  placeholder="Ingrese número de teléfono"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  textContentType="none"
                  autoComplete="off"
                  importantForAutofill="no"
                  autoCorrect={false}
                />
                {errors.telefono && (
                  <Text style={styles.errorText}>{errors.telefono}</Text>
                )}
              </View>

              {/* Selector de Apartamentos */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Seleccione inmuebles *</Text>

                {/* Loading de apartamentos */}
                {loadingApartamentos && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>
                      Cargando inmuebles...
                    </Text>
                  </View>
                )}

                {/* Error de apartamentos */}
                {errorApartamentos && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorApartamentos}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={loadApartamentos}
                    >
                      <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Grid de apartamentos */}
                {!loadingApartamentos && !errorApartamentos && (
                  <View style={styles.apartamentosGrid}>
                    {apartamentos.map((apartamento) => {
                      // Convertir formato: "13-A" -> "A013"
                      const codigoApt = apartamento.includes("-")
                        ? apartamento.split("-")[1] +
                          apartamento.split("-")[0].padStart(3, "0")
                        : apartamento.padStart(3, "0");
                      const estaOcupado =
                        apartamentosOcupados.includes(codigoApt);

                      return (
                        <TouchableOpacity
                          key={apartamento}
                          style={[
                            styles.apartamentoItem,
                            selectedApartamentos.includes(apartamento) &&
                              styles.apartamentoSelected,
                            estaOcupado && styles.apartamentoDisabled,
                          ]}
                          onPress={() => toggleApartamento(apartamento)}
                          disabled={estaOcupado}
                        >
                          <Text
                            style={[
                              styles.apartamentoText,
                              selectedApartamentos.includes(apartamento) &&
                                styles.apartamentoTextSelected,
                              estaOcupado && styles.apartamentoTextDisabled,
                            ]}
                          >
                            {apartamento}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {errors.apartamentos && (
                  <Text style={styles.errorText}>{errors.apartamentos}</Text>
                )}
                {selectedApartamentos.length > 0 && (
                  <View style={styles.selectionInfo}>
                    <Text style={styles.selectionText}>
                      {selectedApartamentos.length} inmueble(s) seleccionado(s)
                    </Text>
                  </View>
                )}
              </View>

              {/* Info sobre el poder */}
              <View style={styles.infoContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={THEME.colors.primary}
                />
                <Text style={styles.infoText}>
                  Se enviará un código de acceso al correo electrónico
                  proporcionado para que el apoderado pueda acceder a la
                  asamblea.
                </Text>
              </View>

              {/* Botón de guardar */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !hasChanges && styles.submitButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!hasChanges}
              >
                <Text style={styles.submitButtonText}>Guardar</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <ConfirmModal
          visible={showConfirmModal}
          type="warning"
          title="Descartar cambios"
          message="¿Estás seguro de que quieres cerrar sin guardar?"
          confirmText="Descartar"
          cancelText="Continuar editando"
          onConfirm={() => {
            setShowConfirmModal(false);
            onClose();
          }}
          onCancel={() => setShowConfirmModal(false)}
        />
      </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: "center",
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "center",
    marginTop: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.xl * 2,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.colors.primary + "80",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  form: {
    padding: THEME.spacing.lg,
  },
  fieldContainer: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    backgroundColor: THEME.colors.surface,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    marginTop: THEME.spacing.xs,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: THEME.colors.primaryLight + "20",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "flex-start",
    marginTop: THEME.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.sm,
  },
  // Estilos para el selector de apartamentos
  apartamentosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -THEME.spacing.xs,
  },
  apartamentoItem: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    margin: THEME.spacing.xs,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  apartamentoSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  apartamentoText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  apartamentoTextSelected: {
    color: "#fff",
  },
  apartamentoDisabled: {
    backgroundColor: THEME.colors.border,
    borderColor: THEME.colors.border,
    opacity: 0.5,
  },
  apartamentoTextDisabled: {
    color: THEME.colors.text.muted,
  },

  selectionInfo: {
    marginTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.primaryLight + "20",
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
  },
  selectionText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
  },

  // Estilos para loading y error
  loadingContainer: {
    padding: THEME.spacing.md,
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  loadingText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  errorContainer: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.error + "20",
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  retryButton: {
    marginTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
  },

  // Estilos para error de correo en el modal
  emailErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.error + "20",
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.xs,
  },
  emailErrorText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    marginLeft: THEME.spacing.xs,
    flex: 1,
  },
});

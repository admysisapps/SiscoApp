import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";
import { useRole } from "@/hooks/useRole";
import { apiService } from "@/services/apiService";
import { userCacheService } from "@/services/cache/userCacheService";
import { THEME } from "@/constants/theme";
import Toast from "@/components/Toast";
import EliminarCuentaModal from "@/components/ConfiguracionSistema/EliminarCuentaModal";
export default function PersonalInfo() {
  const { user, setUser } = useUser();
  const { selectedProject } = useProject();
  const { isAdmin } = useRole();

  const [isLoadingFullData, setIsLoadingFullData] = useState(true);
  const loadedKeyRef = useRef<string | null>(null);

  // Estados para secciones colapsables
  const [personalDataExpanded, setPersonalDataExpanded] = useState(true);
  const [contactInfoExpanded, setContactInfoExpanded] = useState(false);
  const [deleteAccountExpanded, setDeleteAccountExpanded] = useState(false);

  // Estados para campos editables
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Estados para guardar
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  // Modal eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Memorizar si tenemos datos completos
  const hasCompleteData = useMemo(
    () => Boolean(user?.telefono && user?.email),
    [user?.telefono, user?.email]
  );

  // Crear key única para esta combinación de usuario/proyecto
  const currentKey = useMemo(
    () => `${user?.documento}_${selectedProject?.NIT}`,
    [user?.documento, selectedProject?.NIT]
  );

  // Función de carga memoizada
  const loadUserData = useCallback(async () => {
    if (!user?.documento || !selectedProject) return;

    // Si ya tenemos datos completos o ya cargamos esta combinación, no hacer nada
    if (hasCompleteData || loadedKeyRef.current === currentKey) {
      setIsLoadingFullData(false);
      return;
    }

    setIsLoadingFullData(true);

    try {
      // 1. Intentar cache primero
      const cachedData = await userCacheService.getCachedData(
        user.documento,
        selectedProject.NIT
      );

      if (cachedData) {
        setUser(cachedData);
        loadedKeyRef.current = currentKey;
        setIsLoadingFullData(false);
        return;
      }

      // 2. Si no hay cache, hacer API call
      const response = await apiService.getUserInfo(user.documento, true);
      if (response.success && response.data) {
        setUser(response.data);
        loadedKeyRef.current = currentKey;

        // 3. Guardar en cache
        await userCacheService.setCachedData(
          user.documento,
          selectedProject.NIT,
          response.data
        );
      }
    } catch (error) {
      console.error("Error cargando información personal:", error);
    } finally {
      setIsLoadingFullData(false);
    }
  }, [user?.documento, selectedProject, hasCompleteData, currentKey, setUser]);

  // CACHE-FIRST: Intentar cache primero, luego API si es necesario
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Inicializar campos cuando se carga el usuario
  useEffect(() => {
    if (user) {
      setNombre(user.nombre || "");
      setApellido(user.apellido || "");
      setTelefono(user.telefono || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Detectar cambios en Datos Personales
  const hasPersonalDataChanges = useMemo(() => {
    if (!user) return false;
    return nombre !== (user.nombre || "") || apellido !== (user.apellido || "");
  }, [nombre, apellido, user]);

  // Detectar cambios en Información de contacto
  const hasContactInfoChanges = useMemo(() => {
    if (!user) return false;
    return telefono !== (user.telefono || "");
  }, [telefono, user]);

  const handleSavePersonalData = async () => {
    if (!hasPersonalDataChanges || !user?.documento) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const response = await apiService.updateUserInfo(user.documento, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
      });
      if (response.success) {
        const trimmedNombre = nombre.trim();
        const trimmedApellido = apellido.trim();
        setNombre(trimmedNombre);
        setApellido(trimmedApellido);
        setUser({ ...user, nombre: trimmedNombre, apellido: trimmedApellido });
        await userCacheService.setCachedData(
          user.documento,
          selectedProject?.NIT || "",
          { ...user, nombre: trimmedNombre, apellido: trimmedApellido }
        );
        setToast({
          visible: true,
          message: "Datos personales actualizados",
          type: "success",
        });
      } else {
        throw new Error(response.error || "Error al actualizar");
      }
    } catch {
      setToast({
        visible: true,
        message: "Error al guardar los cambios",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContactInfo = async () => {
    if (!hasContactInfoChanges || !user?.documento) return;

    const trimmedPhone = telefono.trim();

    // Validar longitud mínima
    if (trimmedPhone.length < 10) {
      setToast({
        visible: true,
        message: "El teléfono debe tener mínimo 10 dígitos",
        type: "error",
      });
      return;
    }

    // Si no empieza con 3 ni con +, pedir código de país
    if (!trimmedPhone.startsWith("3") && !trimmedPhone.startsWith("+")) {
      setToast({
        visible: true,
        message: "Por favor incluye el código del país (ej: +57)",
        type: "warning",
      });
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const response = await apiService.updateUserInfo(user.documento, {
        telefono: trimmedPhone,
      });
      if (response.success) {
        setTelefono(trimmedPhone);
        setUser({ ...user, telefono: trimmedPhone });
        await userCacheService.setCachedData(
          user.documento,
          selectedProject?.NIT || "",
          { ...user, telefono: trimmedPhone }
        );
        setToast({
          visible: true,
          message: "Información de contacto actualizada",
          type: "success",
        });
      } else {
        throw new Error(response.error || "Error al actualizar");
      }
    } catch {
      setToast({
        visible: true,
        message: "Error al guardar los cambios",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]} mode="padding">
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

        <Text style={styles.title}>Información Personal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sección: Datos Personales */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => {
              setPersonalDataExpanded(!personalDataExpanded);
              if (!personalDataExpanded) {
                setContactInfoExpanded(false);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionBorder} />
              <Text style={styles.sectionTitle}>Datos Personales</Text>
            </View>
            <Ionicons
              name={personalDataExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          {personalDataExpanded && (
            <View style={styles.sectionContent}>
              {/* Nombre */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={THEME.colors.text.muted}
                  editable={!isLoadingFullData}
                />
              </View>

              {/* Apellido */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Apellidos</Text>
                <TextInput
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Ingresa tus apellidos"
                  placeholderTextColor={THEME.colors.text.muted}
                  editable={!isLoadingFullData}
                />
              </View>

              {/* Documento */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Número de documento</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={user?.documento || user?.usuario || ""}
                  editable={false}
                  placeholderTextColor={THEME.colors.text.muted}
                />
                <Text style={styles.helperText}>
                  Este campo no se puede modificar
                </Text>
              </View>

              {/* Botón Guardar Datos Personales */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!hasPersonalDataChanges || isSaving) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSavePersonalData}
                disabled={!hasPersonalDataChanges || isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar información</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Sección: Información de contacto */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => {
              setContactInfoExpanded(!contactInfoExpanded);
              if (!contactInfoExpanded) {
                setPersonalDataExpanded(false);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionBorder} />
              <Text style={styles.sectionTitle}>Información de contacto</Text>
            </View>
            <Ionicons
              name={contactInfoExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          {contactInfoExpanded && (
            <View style={styles.sectionContent}>
              {/* Correo */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.fieldLabel}>Correo electrónico</Text>
                </View>
                <TouchableOpacity
                  style={styles.inputWithIcon}
                  onPress={() => router.push("/(screens)/CambiarCorreo")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.input, styles.inputWithIconPadding]}>
                    <Text
                      style={[
                        styles.inputText,
                        !email && styles.placeholderText,
                      ]}
                    >
                      {email || "correo@ejemplo.com"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => router.push("/(screens)/CambiarCorreo")}
                  >
                    <Feather
                      name="edit"
                      size={20}
                      color={THEME.colors.primary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* Teléfono */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons
                    name="call"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.fieldLabel}>Celular</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="3001234567"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="phone-pad"
                  editable={!isLoadingFullData}
                />
              </View>

              {/* Botón Guardar Información de contacto */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!hasContactInfoChanges || isSaving) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSaveContactInfo}
                disabled={!hasContactInfoChanges || isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar información</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Sección: Eliminar cuenta - Oculto para admin */}
          {!isAdmin && (
            <>
              <TouchableOpacity
                style={[styles.sectionHeader, styles.dangerSectionHeader]}
                onPress={() => {
                  setDeleteAccountExpanded(!deleteAccountExpanded);
                  if (!deleteAccountExpanded) {
                    setPersonalDataExpanded(false);
                    setContactInfoExpanded(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionBorder, styles.dangerBorder]} />
                  <Text style={[styles.sectionTitle, styles.dangerTitle]}>
                    Eliminar cuenta
                  </Text>
                </View>
                <Ionicons
                  name={deleteAccountExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={THEME.colors.error}
                />
              </TouchableOpacity>

              {deleteAccountExpanded && (
                <View style={styles.sectionContent}>
                  <Text style={styles.deleteDescription}>
                    ¿Estás seguro de que deseas eliminar tu cuenta?
                  </Text>
                  <Text style={styles.deleteDescriptionBold}>
                    Perderás el acceso a todos los servicios y datos asociados a
                    esta cuenta.
                  </Text>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setShowDeleteModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <EliminarCuentaModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => setShowDeleteModal(false)}
        onError={(message) =>
          setToast({ visible: true, message, type: "error" })
        }
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
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionBorder: {
    width: 4,
    height: 24,
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
    marginRight: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  sectionContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  fieldContainer: {
    marginBottom: THEME.spacing.lg,
  },
  fieldLabel: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    marginLeft: THEME.spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputDisabled: {
    backgroundColor: "#E2E8F0",
    color: THEME.colors.text.muted,
  },
  inputWithIcon: {
    position: "relative",
  },
  inputWithIconPadding: {
    paddingRight: 40,
  },
  inputText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  placeholderText: {
    color: THEME.colors.text.muted,
  },
  editIconButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  inputIcon: {
    position: "absolute",
    right: THEME.spacing.md,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  helperText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: THEME.spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
    color: THEME.colors.text.primary,
  },
  dangerText: {
    color: THEME.colors.error,
  },
  saveButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: THEME.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  loadingIndicator: {
    alignSelf: "flex-start",
  },
  dangerSectionHeader: {
    borderColor: THEME.colors.error + "20",
    borderWidth: 1,
  },
  dangerBorder: {
    backgroundColor: THEME.colors.error,
  },
  dangerTitle: {
    color: THEME.colors.error,
  },
  emptyText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    paddingVertical: THEME.spacing.md,
  },
  deleteDescription: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 22,
  },
  deleteDescriptionBold: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  deleteButton: {
    backgroundColor: "#FFF",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: THEME.colors.error,
  },
  deleteButtonText: {
    color: THEME.colors.error,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});

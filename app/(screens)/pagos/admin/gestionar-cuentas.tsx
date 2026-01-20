import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, THEME } from "@/constants/theme";
import { CuentaPago } from "@/types/CuentaPago";
import ModalCrearCuenta from "@/components/pagos/ModalCrearCuenta";
import { cuentasPagoService } from "@/services/cuentasPagoService";
import Toast from "@/components/Toast";
import { eventBus, EVENTS } from "@/utils/eventBus";
import ScreenHeader from "@/components/shared/ScreenHeader";

const getTipoNombre = (tipo: string): string => {
  const tipos = {
    ahorros: "Cuenta de Ahorros",
    corriente: "Cuenta Corriente",
    billeteras_digitales: "Billetera Digital",
    pasarela: "Pasarela de Pago",
    fisico: "Pago en Efectivo",
  };
  return tipos[tipo as keyof typeof tipos] || tipo;
};

export default function GestionarCuentasScreen() {
  const [cuentas, setCuentas] = useState<CuentaPago[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<CuentaPago | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const handleAddAccount = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const loadCuentas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cuentasPagoService.obtenerCuentasPago();
      if (response.success) {
        setCuentas(response.cuentas || []);
      } else {
        showToast(response.error || "Error al cargar métodos de pago", "error");
      }
    } catch {
      showToast("Error de conexión al cargar métodos de pago", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveAccount = useCallback(
    async (accountData: Omit<CuentaPago, "id">) => {
      try {
        setCreating(true);

        if (isEditMode && editingAccount) {
          const response = await cuentasPagoService.editarCuentaPago(
            editingAccount.id,
            accountData
          );
          if (response.success) {
            setCuentas((prev) =>
              prev.map((c) =>
                c.id === editingAccount.id
                  ? ({ ...accountData, id: c.id } as CuentaPago)
                  : c
              )
            );
            eventBus.emit(EVENTS.CUENTA_PAGO_UPDATED);
            setShowCreateModal(false);
            showToast("Método de pago actualizado correctamente", "success");
          } else {
            showToast(
              response.error || "Error al actualizar método de pago",
              "error"
            );
          }
        } else {
          const response =
            await cuentasPagoService.crearCuentaPago(accountData);
          if (response.success) {
            await loadCuentas();
            eventBus.emit(EVENTS.CUENTA_PAGO_CREATED);
            setShowCreateModal(false);
            showToast("Método de pago creado correctamente", "success");
          } else {
            showToast(
              response.error || "Error al crear método de pago",
              "error"
            );
          }
        }
      } catch {
        showToast("Error de conexión", "error");
      } finally {
        setCreating(false);
      }
    },
    [isEditMode, editingAccount, loadCuentas]
  );

  const handleEditAccount = useCallback(
    (id: number) => {
      const cuenta = cuentas.find((c) => c.id === id);
      if (cuenta) {
        setEditingAccount(cuenta);
        setIsEditMode(true);
        setShowCreateModal(true);
      }
    },
    [cuentas]
  );

  const handleDeleteAccount = useCallback((id: number) => {
    const deleteAccount = async () => {
      try {
        setDeleting(id);
        const response = await cuentasPagoService.eliminarCuentaPago(id);
        if (response.success) {
          setCuentas((prev) => prev.filter((c) => c.id !== id));
          eventBus.emit(EVENTS.CUENTA_PAGO_DELETED);
          showToast("Método de pago eliminado correctamente", "success");
        } else {
          showToast(
            response.error || "Error al eliminar método de pago",
            "error"
          );
        }
      } catch {
        showToast("Error de conexión al eliminar método de pago", "error");
      } finally {
        setDeleting(null);
      }
    };

    Alert.alert(
      "Eliminar Cuenta",
      "¿Estás seguro de que deseas eliminar esta cuenta de pago?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: deleteAccount },
      ]
    );
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setIsEditMode(false);
    setEditingAccount(null);
  }, []);

  const getTypeColor = useCallback((tipo: string) => {
    switch (tipo) {
      case "ahorros":
      case "corriente":
        return THEME.colors.primary;
      case "billeteras_digitales":
        return THEME.colors.success;
      case "pasarela":
        return THEME.colors.secondary;
      case "fisico":
        return THEME.colors.warning;
      default:
        return THEME.colors.text.muted;
    }
  }, []);

  const getTypeIcon = useCallback((tipo: string) => {
    switch (tipo) {
      case "ahorros":
      case "corriente":
        return "card";
      case "billeteras_digitales":
        return "phone-portrait";
      case "pasarela":
        return "wallet";
      case "fisico":
        return "storefront";
      default:
        return "card-outline";
    }
  }, []);

  useEffect(() => {
    loadCuentas();
  }, [loadCuentas]);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => setToast({ visible: true, message, type });

  const hideToast = () =>
    setToast({ visible: false, message: "", type: "success" });

  const sortedCuentas = useMemo(() => {
    return [...cuentas].sort((a, b) => a.id - b.id);
  }, [cuentas]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Gestionar Métodos de Pago" />

      {/* Botón Crear Visible */}
      <View style={styles.createSection}>
        <TouchableOpacity
          style={styles.createButtonWrapper}
          onPress={handleAddAccount}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#16A34A", "#059669", "#047857"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButton}
          >
            <Ionicons name="add-circle" size={28} color="white" />
            <Text style={styles.createText}>Agregar Método de Pago</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Lista de Cuentas */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Cargando métodos de pago...</Text>
          </View>
        ) : cuentas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="card-outline"
              size={64}
              color={THEME.colors.text.muted}
            />
            <Text style={styles.emptyTitle}>No hay cuentas configuradas</Text>
            <Text style={styles.emptySubtitle}>
              Agrega la primera cuenta de pago
            </Text>
          </View>
        ) : (
          sortedCuentas.map((cuenta) => (
            <View key={cuenta.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.accountInfo}>
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: getTypeColor(cuenta.tipo_cuenta) },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(cuenta.tipo_cuenta) as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountBank}>
                      {cuenta.nombre_banco}
                    </Text>
                    <Text style={styles.accountType}>
                      {getTipoNombre(cuenta.tipo_cuenta)}
                    </Text>
                    {cuenta.numero_cuenta && (
                      <Text style={styles.accountNumber}>
                        {cuenta.numero_cuenta}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.accountActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditAccount(cuenta.id)}
                >
                  <Ionicons
                    name="create"
                    size={16}
                    color={THEME.colors.primary}
                  />
                  <Text
                    style={[styles.actionText, { color: THEME.colors.primary }]}
                  >
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteAccount(cuenta.id)}
                  disabled={deleting === cuenta.id}
                >
                  {deleting === cuenta.id ? (
                    <ActivityIndicator
                      size="small"
                      color={THEME.colors.error}
                    />
                  ) : (
                    <Ionicons
                      name="trash"
                      size={16}
                      color={THEME.colors.error}
                    />
                  )}
                  <Text
                    style={[styles.actionText, { color: THEME.colors.error }]}
                  >
                    {deleting === cuenta.id ? "Eliminando..." : "Eliminar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ModalCrearCuenta
        visible={showCreateModal}
        onClose={handleCloseModal}
        onSave={handleSaveAccount}
        loading={creating}
        isEditMode={isEditMode}
        initialData={editingAccount || undefined}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  createSection: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
  },
  createButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  createText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.md,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountBank: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  accountType: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textTransform: "capitalize",
  },
  accountNumber: {
    fontSize: 12,
    color: THEME.colors.text.muted,
    fontFamily: "monospace",
  },

  accountActions: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: THEME.colors.primaryLight + "20",
  },

  deleteButton: {
    backgroundColor: THEME.colors.error + "20",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginTop: 16,
  },
});

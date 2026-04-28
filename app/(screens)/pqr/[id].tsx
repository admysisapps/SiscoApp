import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  KeyboardGestureArea,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { THEME } from "@/constants/theme";
import { useProject } from "@/contexts/ProjectContext";
import { useRole } from "@/hooks/useRole";
import { usePqrDetail } from "@/hooks/usePqrDetail";
import { s3Service } from "@/services/s3Service";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import PqrDetailSkeleton from "@/components/pqr/PqrDetailSkeleton";
import PqrHeroCard from "@/components/pqr/PqrHeroCard";
import PqrInfoGrid from "@/components/pqr/PqrInfoGrid";
import PqrAttachment from "@/components/pqr/PqrAttachment";
import PqrChatMessages from "@/components/pqr/PqrChatMessages";
import Toast from "@/components/Toast";
import { UserRole, ROLES } from "@/types/Roles";

export default function PQRDetailScreen() {
  const { id } = useLocalSearchParams();
  const pqrId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { selectedProject } = useProject();
  const { isAdmin, isUser, isContador, role } = useRole();
  const canManage = isAdmin || isContador;
  const { bottom } = useSafeAreaInsets();
  const MARGIN = 8;

  const {
    pqr,
    loading,
    mensajes,
    enviando,
    toast,
    puedeResponder,
    recargarDetalle,
    enviarMensaje,
    cambiarEstado,
    anularPQR,
    hideToast,
  } = usePqrDetail(pqrId);

  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [showResolverModal, setShowResolverModal] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);

  const rolActual: UserRole = role ?? ROLES.PROPIETARIO;

  const handleEnviar = async () => {
    if (!nuevoMensaje.trim()) return;
    await enviarMensaje(nuevoMensaje);
    setNuevoMensaje("");
  };

  const handleDescargarArchivo = async () => {
    if (!pqr?.archivo_nombre || !selectedProject?.nit) return;
    try {
      const result = await s3Service.downloadPQRFile(
        selectedProject.nit,
        pqr.archivo_nombre
      );
      if (result.success && result.url) {
        await WebBrowser.openBrowserAsync(result.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: THEME.colors.primary,
          toolbarColor: THEME.colors.primary,
        });
      }
    } catch {
      // error silencioso — el toast lo maneja el hook
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {loading
              ? "Detalle PQR"
              : !pqr
                ? "PQR no encontrada"
                : `PQR #${pqr.id_pqr}`}
          </Text>
          {pqr && !loading && (
            <Text style={styles.headerSubtitle}>{pqr.tipo_peticion}</Text>
          )}
        </View>
      </View>

      {loading && <PqrDetailSkeleton />}

      {!loading && !pqr && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={THEME.colors.error}
          />
          <Text style={styles.errorText}>
            No se pudo cargar la información de la PQR
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={recargarDetalle}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && pqr && (
        <KeyboardGestureArea
          interpolator="ios"
          style={styles.flex}
          textInputNativeID="pqr-chat-input"
        >
          <PqrChatMessages
            mensajes={mensajes}
            rolActual={rolActual}
            isAdmin={isAdmin}
            estadoPqr={pqr.estado_pqr}
            offset={bottom - MARGIN}
            staticContent={
              <>
                <PqrHeroCard
                  pqr={pqr}
                  canManagePQR={canManage}
                  isUser={isUser}
                  onResolver={() => setShowResolverModal(true)}
                  onAnular={() => setShowAnularModal(true)}
                />
                <PqrInfoGrid pqr={pqr} />
                {pqr.archivo_nombre && (
                  <PqrAttachment
                    archivoNombre={pqr.archivo_nombre}
                    onPress={handleDescargarArchivo}
                  />
                )}
              </>
            }
          />

          <KeyboardStickyView offset={{ opened: bottom - MARGIN }}>
            <View
              style={[
                styles.inputContainer,
                !puedeResponder && styles.inputContainerDisabled,
              ]}
            >
              <TextInput
                nativeID="pqr-chat-input"
                style={[styles.input, !puedeResponder && styles.inputDisabled]}
                placeholder={
                  puedeResponder
                    ? "Escribe tu mensaje..."
                    : "Conversación cerrada"
                }
                placeholderTextColor={THEME.colors.text.muted}
                multiline
                submitBehavior="newline"
                value={nuevoMensaje}
                onChangeText={setNuevoMensaje}
                editable={!enviando && puedeResponder}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!puedeResponder || !nuevoMensaje.trim() || enviando) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleEnviar}
                disabled={enviando || !nuevoMensaje.trim() || !puedeResponder}
              >
                {enviando ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardStickyView>
        </KeyboardGestureArea>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ConfirmModal
        visible={showResolverModal}
        type="confirm"
        title="Resolver PQR"
        message="¿Estás seguro de que deseas marcar esta PQR como resuelta?"
        confirmText="Marcar como Resuelto"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowResolverModal(false);
          cambiarEstado("Resuelto");
        }}
        onCancel={() => setShowResolverModal(false)}
      />

      <ConfirmModal
        visible={showAnularModal}
        type="warning"
        title="Anular PQR"
        message="¿Estás seguro de que deseas anular esta PQR? Esta acción no se puede deshacer."
        confirmText="Anular"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowAnularModal(false);
          anularPQR();
        }}
        onCancel={() => setShowAnularModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceLight,
    gap: 8,
  },
  inputContainerDisabled: { backgroundColor: THEME.colors.background },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
    color: THEME.colors.text.heading,
  },
  inputDisabled: {
    backgroundColor: THEME.colors.surfaceLight,
    borderColor: THEME.colors.input.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: THEME.colors.text.muted },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    textAlign: "center",
    color: THEME.colors.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: THEME.colors.text.inverse, fontWeight: "600" },
});

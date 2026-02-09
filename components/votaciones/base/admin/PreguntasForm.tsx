import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { Votacion, PreguntaFormData, TipoPregunta } from "@/types/Votaciones";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

interface PreguntaFormDataWithTempId extends PreguntaFormData {
  tempId: string;
}

interface PreguntasFormProps {
  votacionData: Partial<Votacion>;
  initialPreguntas: PreguntaFormData[];
  onSubmit: (preguntas: PreguntaFormData[]) => void;
  onBack: () => void;
  onPreguntasChange?: (preguntas: PreguntaFormData[]) => void;
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
  isCreating?: boolean;
}

const PreguntasForm: React.FC<PreguntasFormProps> = ({
  votacionData,
  initialPreguntas,
  onSubmit,
  onBack,
  onPreguntasChange,
  showToast,
  isCreating = false,
}) => {
  const [preguntas, setPreguntas] = useState<PreguntaFormDataWithTempId[]>(
    initialPreguntas.map((p) => ({
      ...p,
      tempId: Math.random().toString(36).slice(2, 11),
    }))
  );
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<{
    pregunta: PreguntaFormDataWithTempId;
    index: number;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [preguntaToDelete, setPreguntaToDelete] = useState<string | null>(null);
  const [showBackModal, setShowBackModal] = useState(false);

  const agregarPregunta = (pregunta: PreguntaFormData) => {
    const nuevaPregunta: PreguntaFormDataWithTempId = {
      ...pregunta,
      tempId: Math.random().toString(36).slice(2, 11),
      orden: preguntas.length + 1,
      estado: "programada" as const,
    };
    const nuevasPreguntas = [...preguntas, nuevaPregunta];
    setPreguntas(nuevasPreguntas);
    onPreguntasChange?.(nuevasPreguntas);
    setShowPreguntaForm(false);

    Keyboard.dismiss();
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const editarPregunta = (pregunta: PreguntaFormData, index: number) => {
    const preguntasActualizadas = [...preguntas];
    preguntasActualizadas[index] = {
      ...preguntasActualizadas[index],
      ...pregunta,
    };
    setPreguntas(preguntasActualizadas);
    onPreguntasChange?.(preguntasActualizadas);
    setEditingPregunta(null);
    setShowPreguntaForm(false);

    Keyboard.dismiss();
  };

  const eliminarPregunta = (tempId: string) => {
    const nuevasPreguntas = preguntas.filter((p) => p.tempId !== tempId);
    const preguntasReordenadas = nuevasPreguntas.map((p, i) => ({
      ...p,
      orden: i + 1,
    }));
    setPreguntas(preguntasReordenadas);
    onPreguntasChange?.(preguntasReordenadas);
    setShowDeleteModal(false);
    setPreguntaToDelete(null);
  };

  const handleDeleteClick = (tempId: string) => {
    setPreguntaToDelete(tempId);
    setShowDeleteModal(true);
  };

  const handleBackClick = () => {
    if (preguntas.length > 0) {
      setShowBackModal(true);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (preguntas.length === 0) {
      showToast?.("Debes agregar al menos una pregunta", "error");
      return;
    }
    onSubmit(preguntas);
  };

  const getTipoIcon = (tipo: TipoPregunta) => {
    return tipo === "si_no" ? "checkmark-circle" : "list-circle";
  };

  const getTipoLabel = (tipo: TipoPregunta) => {
    return tipo === "si_no" ? "Sí/No" : "Múltiple";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Preguntas de Votación</Text>
          <Text style={styles.subtitle}>{votacionData.titulo}</Text>
        </View>

        {preguntas.length === 0 && !showPreguntaForm ? (
          <View style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No hay preguntas</Text>
            <Text style={styles.emptyText}>
              Agrega al menos una pregunta para continuar
            </Text>
          </View>
        ) : null}

        {preguntas.length > 0 && (
          <View style={styles.preguntasList}>
            {preguntas.map((pregunta, index) => (
              <View key={pregunta.tempId} style={styles.preguntaCard}>
                <View style={styles.preguntaHeader}>
                  <View style={styles.preguntaInfo}>
                    <Text style={styles.preguntaOrden}>
                      Pregunta {pregunta.orden}
                    </Text>
                    <View style={styles.tipoBadge}>
                      <Ionicons
                        name={getTipoIcon(pregunta.tipo_pregunta!)}
                        size={14}
                        color={THEME.colors.primary}
                      />
                      <Text style={styles.tipoText}>
                        {getTipoLabel(pregunta.tipo_pregunta!)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingPregunta({ pregunta, index });
                        setShowPreguntaForm(true);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({
                            animated: true,
                          });
                        }, 100);
                      }}
                      style={styles.editButton}
                    >
                      <MaterialCommunityIcons
                        name="text-box-edit-outline"
                        size={25}
                        color={THEME.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteClick(pregunta.tempId)}
                      style={styles.deleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={25}
                        color={THEME.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.preguntaTexto}>{pregunta.pregunta}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingPregunta(null);
            setShowPreguntaForm(true);
            if (preguntas.length >= 2) {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
        >
          <Ionicons name="add-circle" size={24} color={THEME.colors.primary} />
          <Text style={styles.addButtonText}>Agregar pregunta</Text>
        </TouchableOpacity>

        {showPreguntaForm && (
          <View style={styles.formSection}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingPregunta ? "Editar Pregunta" : "Nueva Pregunta"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPreguntaForm(false);
                  setEditingPregunta(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <PreguntaFormInline
              onSubmit={
                editingPregunta
                  ? (pregunta) =>
                      editarPregunta(pregunta, editingPregunta.index)
                  : agregarPregunta
              }
              onCancel={() => {
                setShowPreguntaForm(false);
                setEditingPregunta(null);
              }}
              showToast={showToast}
              scrollViewRef={scrollViewRef}
              initialData={editingPregunta?.pregunta}
              isEditing={!!editingPregunta}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackClick}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableWithoutFeedback
          onPress={handleSubmit}
          disabled={preguntas.length === 0 || isCreating}
        >
          <View style={{ flex: 2 }}>
            <LinearGradient
              colors={
                preguntas.length === 0 || isCreating
                  ? ["#94A3B8", "#94A3B8"]
                  : [THEME.colors.primary, "#1E40AF"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Crear Votación</Text>
              )}
            </LinearGradient>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <ConfirmModal
        visible={showDeleteModal}
        type="warning"
        title="Eliminar pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => preguntaToDelete && eliminarPregunta(preguntaToDelete)}
        onCancel={() => {
          setShowDeleteModal(false);
          setPreguntaToDelete(null);
        }}
      />

      <ConfirmModal
        visible={showBackModal}
        type="warning"
        title="Salir sin guardar"
        message="Tienes preguntas sin guardar. Si sales ahora, se perderán todos los cambios. ¿Estás seguro?"
        confirmText="Salir"
        cancelText="Continuar editando"
        onConfirm={() => {
          setShowBackModal(false);
          onBack();
        }}
        onCancel={() => setShowBackModal(false)}
      />
    </KeyboardAvoidingView>
  );
};

const PreguntaFormInline: React.FC<{
  onSubmit: (pregunta: PreguntaFormData) => void;
  onCancel: () => void;
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  initialData?: PreguntaFormData;
  isEditing?: boolean;
}> = ({
  onSubmit,
  onCancel,
  showToast,
  scrollViewRef,
  initialData,
  isEditing = false,
}) => {
  const [pregunta, setPregunta] = useState(initialData?.pregunta || "");
  const [tipo, setTipo] = useState<TipoPregunta>(
    initialData?.tipo_pregunta || "si_no"
  );
  const [opciones, setOpciones] = useState<string[]>(
    initialData?.opciones || ["", ""]
  );
  const [showCancelModal, setShowCancelModal] = useState(false);

  const hasChanges = () => {
    if (!initialData) {
      return pregunta.trim() !== "" || opciones.some((op) => op.trim() !== "");
    }
    return (
      pregunta !== initialData.pregunta ||
      tipo !== initialData.tipo_pregunta ||
      JSON.stringify(opciones) !==
        JSON.stringify(initialData.opciones || ["", ""])
    );
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowCancelModal(true);
    } else {
      onCancel();
    }
  };

  const agregarOpcion = () => {
    setOpciones([...opciones, ""]);
  };

  const eliminarOpcion = (index: number) => {
    if (opciones.length > 2) {
      setOpciones(opciones.filter((_, i) => i !== index));
    }
  };

  const actualizarOpcion = (index: number, valor: string) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index] = valor;
    setOpciones(nuevasOpciones);
  };

  const handleSubmit = () => {
    if (!pregunta.trim()) {
      showToast?.("Debes escribir una pregunta", "error");
      return;
    }
    if (tipo === "multiple" && opciones.some((op) => !op.trim())) {
      showToast?.("Todas las opciones deben tener texto", "error");
      return;
    }

    // Validar opciones duplicadas
    if (tipo === "multiple") {
      const opcionesLimpias = opciones.map((op) => op.trim().toLowerCase());
      const opcionesUnicas = new Set(opcionesLimpias);
      if (opcionesLimpias.length !== opcionesUnicas.size) {
        showToast?.("No puedes tener opciones duplicadas", "error");
        return;
      }
    }

    onSubmit({
      pregunta: pregunta.trim(),
      tipo_pregunta: tipo,
      opciones:
        tipo === "multiple" ? opciones.filter((op) => op.trim()) : undefined,
    });
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.field}>
        <Text style={styles.label}>Pregunta *</Text>
        <TextInput
          style={styles.input}
          value={pregunta}
          onChangeText={setPregunta}
          placeholder="Escribe tu pregunta..."
          multiline
          numberOfLines={3}
          placeholderTextColor="#64748B"
          onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tipo de respuesta</Text>
        <View style={styles.tipoButtons}>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === "si_no" && styles.tipoButtonActive,
            ]}
            onPress={() => setTipo("si_no")}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={tipo === "si_no" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.tipoButtonText,
                tipo === "si_no" && styles.tipoButtonTextActive,
              ]}
            >
              Sí/No
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === "multiple" && styles.tipoButtonActive,
            ]}
            onPress={() => {
              setTipo("multiple");
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Ionicons
              name="list-circle"
              size={16}
              color={tipo === "multiple" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.tipoButtonText,
                tipo === "multiple" && styles.tipoButtonTextActive,
              ]}
            >
              Múltiple
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tipo === "multiple" && (
        <View style={styles.field}>
          <Text style={styles.label}>Opciones</Text>
          {opciones.map((opcion, index) => (
            <View key={index} style={styles.opcionContainer}>
              <View style={styles.opcionInput}>
                <View style={styles.opcionBullet}>
                  <Text style={styles.opcionNumero}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.opcionText}
                  value={opcion}
                  onChangeText={(valor) => actualizarOpcion(index, valor)}
                  placeholder={`Opción ${index + 1}`}
                  placeholderTextColor="#94A3B8"
                  onFocus={() =>
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                  }
                />
                {opciones.length > 2 && (
                  <TouchableOpacity
                    onPress={() => eliminarOpcion(index)}
                    style={styles.eliminarOpcion}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.agregarOpcion}
            onPress={agregarOpcion}
          >
            <Ionicons name="add" size={16} color={THEME.colors.primary} />
            <Text style={styles.agregarOpcionText}>Agregar opción</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inlineFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {isEditing ? "Guardar" : "Agregar"}
          </Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showCancelModal}
        type="warning"
        title="Descartar cambios"
        message="¿Estás seguro de que deseas salir sin guardar? Los cambios se perderán."
        confirmText="Descartar"
        cancelText="Continuar editando"
        onConfirm={() => {
          setShowCancelModal(false);
          onCancel();
        }}
        onCancel={() => setShowCancelModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 8,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  preguntasList: {
    padding: 2,
  },
  preguntaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  preguntaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  preguntaInfo: {
    flex: 1,
  },
  preguntaOrden: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.primary,
    marginBottom: 6,
  },
  tipoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  tipoText: {
    fontSize: 12,
    color: THEME.colors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
  },
  preguntaTexto: {
    fontSize: 16,
    color: "#0F172A",
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButtonText: {
    fontSize: 16,
    color: THEME.colors.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  formSection: {
    padding: 4,
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
    minHeight: 80,
  },
  tipoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  tipoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  tipoButtonActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  tipoButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  tipoButtonTextActive: {
    color: "#FFFFFF",
  },
  inlineFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  opcionContainer: {
    marginBottom: 12,
  },
  opcionInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  opcionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  opcionNumero: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  opcionText: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 4,
  },
  eliminarOpcion: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  agregarOpcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    gap: 6,
    marginTop: 8,
  },
  agregarOpcionText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default PreguntasForm;

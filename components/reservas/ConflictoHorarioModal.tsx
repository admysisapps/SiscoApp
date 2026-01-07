import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ConflictoHorarioModalProps {
  visible: boolean;
  onClose: () => void;
  horarioSolicitado: {
    inicio: string;
    fin: string;
    duracion: number;
  };
  conflicto: {
    hora_inicio?: string;
    hora_fin?: string;
    datetime_inicio?: string;
    datetime_fin?: string;
    estado?: string;
  };
  conflictos_adicionales?: {
    hora_inicio?: string;
    hora_fin?: string;
    datetime_inicio?: string;
    datetime_fin?: string;
    estado: string;
  }[];
  todas_reservas_dia?: {
    hora_inicio?: string;
    hora_fin?: string;
    datetime_inicio?: string;
    datetime_fin?: string;
    estado: string;
  }[];
  alternativas: {
    inicio: string;
    fin: string;
    precio: number;
  }[];
  onSeleccionarAlternativa: (alternativa: any) => void;
}

export const ConflictoHorarioModal: React.FC<ConflictoHorarioModalProps> = ({
  visible,
  onClose,
  horarioSolicitado,
  conflicto,
  conflictos_adicionales,
  todas_reservas_dia,
  alternativas,
  onSeleccionarAlternativa,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.title}>Horario no disponible</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.conflictoInfo}>
              <Text style={styles.conflictoLabel}>Tu selección:</Text>
              <Text style={styles.conflictoHorario}>
                {horarioSolicitado.inicio} - {horarioSolicitado.fin} (
                {horarioSolicitado.duracion} min)
              </Text>

              <Text style={styles.conflictoLabel}>Horario ocupado:</Text>
              <Text style={styles.conflictoOcupado}>
                {conflicto.hora_inicio ||
                  (conflicto.datetime_inicio
                    ? new Date(conflicto.datetime_inicio).toLocaleTimeString(
                        "es-ES",
                        { hour: "2-digit", minute: "2-digit" }
                      )
                    : "N/A")}{" "}
                -{" "}
                {conflicto.hora_fin ||
                  (conflicto.datetime_fin
                    ? new Date(conflicto.datetime_fin).toLocaleTimeString(
                        "es-ES",
                        { hour: "2-digit", minute: "2-digit" }
                      )
                    : "N/A")}
              </Text>
              <Text style={styles.conflictoEstado}>
                Estado: {conflicto.estado || "Confirmada"}
              </Text>
            </View>

            {todas_reservas_dia && todas_reservas_dia.length > 0 && (
              <View style={styles.reservasDelDiaSection}>
                <Text style={styles.reservasDelDiaTitle}>
                  Reservas del día:
                </Text>
                {todas_reservas_dia.slice(0, 3).map((reserva, index) => (
                  <View key={index} style={styles.reservaDelDiaItem}>
                    <Text style={styles.reservaDelDiaHorario}>
                      {reserva.hora_inicio ||
                        (reserva.datetime_inicio
                          ? new Date(
                              reserva.datetime_inicio
                            ).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A")}{" "}
                      -{" "}
                      {reserva.hora_fin ||
                        (reserva.datetime_fin
                          ? new Date(reserva.datetime_fin).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "N/A")}
                    </Text>
                    <Text
                      style={[
                        styles.reservaDelDiaEstado,
                        reserva.estado === "Confirmada"
                          ? styles.estadoConfirmada
                          : styles.estadoPendiente,
                      ]}
                    >
                      {reserva.estado}
                    </Text>
                  </View>
                ))}
                {todas_reservas_dia.length > 3 && (
                  <Text style={styles.masReservas}>
                    +{todas_reservas_dia.length - 3} más
                  </Text>
                )}
              </View>
            )}

            {alternativas && alternativas.length > 0 && (
              <View style={styles.alternativasSection}>
                <Text style={styles.alternativasTitle}>
                  Horarios disponibles ({horarioSolicitado.duracion} min):
                </Text>
                {alternativas.map((alternativa, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.alternativaItem}
                    onPress={() => onSeleccionarAlternativa(alternativa)}
                  >
                    <View style={styles.alternativaInfo}>
                      <Text style={styles.alternativaHorario}>
                        {alternativa.inicio} - {alternativa.fin}
                      </Text>
                      <Text style={styles.alternativaPrecio}>
                        ${alternativa.precio.toLocaleString()}
                      </Text>
                    </View>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10B981"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(!alternativas || alternativas.length === 0) && (
              <View style={styles.noAlternativas}>
                <Ionicons name="calendar" size={24} color="#64748B" />
                <Text style={styles.noAlternativasText}>
                  No hay horarios disponibles para esta duración hoy.
                </Text>
                <Text style={styles.noAlternativasSugerencia}>
                  Intenta con una duración menor o selecciona otro día.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    maxHeight: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 500,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  conflictoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  conflictoHorario: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  conflictoOcupado: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  conflictoEstado: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 4,
  },

  reservasDelDiaTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  reservaDelDiaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reservaDelDiaHorario: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  reservaDelDiaEstado: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoConfirmada: {
    backgroundColor: "#FEF2F2",
    color: "#EF4444",
  },
  estadoPendiente: {
    backgroundColor: "#FFFBEB",
    color: "#F59E0B",
  },
  masReservas: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  alternativasTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  alternativaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  alternativaInfo: {
    flex: 1,
  },
  alternativaHorario: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  alternativaPrecio: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },

  noAlternativasText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  noAlternativasSugerencia: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
  conflictoInfo: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  reservasDelDiaSection: {
    marginBottom: 16,
  },
  alternativasSection: {
    marginBottom: 16,
  },
  noAlternativas: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});

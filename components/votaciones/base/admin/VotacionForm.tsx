import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { Votacion } from "@/types/Votaciones";

interface VotacionFormProps {
  initialData: Partial<Votacion>;
  onSubmit: (data: Partial<Votacion>) => void;
}

const VotacionForm: React.FC<VotacionFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<Votacion>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo?.trim()) {
      newErrors.titulo = "Escribe un titulo";
    }

    if (!formData.descripcion?.trim()) {
      newErrors.descripcion = "Escribe una descripcion";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = (field: keyof Votacion, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Información de la Votación</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={[styles.input, errors.titulo && styles.inputError]}
            value={formData.titulo || ""}
            onChangeText={(value) => updateField("titulo", value)}
            placeholder="Ej: Elección Junta Directiva 2024"
            placeholderTextColor={THEME.colors.text.secondary}
          />
          {errors.titulo && (
            <Text style={styles.errorText}>{errors.titulo}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.textArea, errors.descripcion && styles.inputError]}
            value={formData.descripcion || ""}
            onChangeText={(value) => updateField("descripcion", value)}
            placeholder="Describe el propósito de esta votación..."
            placeholderTextColor={THEME.colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.descripcion && (
            <Text style={styles.errorText}>{errors.descripcion}</Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableWithoutFeedback onPress={handleSubmit}>
          <View>
            <LinearGradient
              colors={[THEME.colors.primary, "#1E40AF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>Agregar Preguntas</Text>
            </LinearGradient>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 24,
    letterSpacing: -0.5,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.error,
    marginTop: 6,
  },
  footer: {
    padding: 5,
  },
  nextButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});

export default VotacionForm;

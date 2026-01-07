import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function CrearAsambleaDashboardCard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const context = await AsyncStorage.getItem("user_context");
        if (context) {
          const parsedContext = JSON.parse(context);
          setIsAdmin(parsedContext.rol === "admin");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };

    checkUserRole();
  }, []);

  const handlePress = () => {
    // Navegar a crear asamblea (solo admin)
    router.push("/(admin)/(asambleas)/crearAsamblea");
  };

  // Solo mostrar si es admin
  if (!isAdmin) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="add-circle" size={24} color={THEME.colors.success} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Crear Asamblea</Text>
          <Text style={styles.subtitle}>Nueva asamblea</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Programar fecha y hora</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="settings-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Configurar modalidad</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="people-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Definir quórum</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "bold",
    color: THEME.colors.success,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  content: {
    paddingLeft: THEME.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.sm,
  },
});

import React, { useEffect, useState } from "react";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
export function AsambleasDashboardCard() {
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
    // Navegar a la ruta correcta según el rol
    if (isAdmin) {
      router.push("/(admin)/(asambleas)");
    } else {
      router.push("/(asambleas)");
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <FontAwesome6
            name="users-line"
            size={24}
            color={THEME.colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Asambleas</Text>
          <Text style={styles.subtitle}>Gestión de asambleas</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Próximas asambleas</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="document-text-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Actas y documentos</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="person-add-outline"
            size={16}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.infoText}>Gestión de apoderados</Text>
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
    backgroundColor: THEME.colors.primary + "15",
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
    color: THEME.colors.text.primary,
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

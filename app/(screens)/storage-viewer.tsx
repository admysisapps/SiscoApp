import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { THEME } from "@/constants/theme";

export default function StorageViewer() {
  const [storageData, setStorageData] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);

  const getByteSize = (str: string) => {
    return new Blob([str]).size;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadStorageData = useCallback(async () => {
    try {
      setLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);

      const data: { [key: string]: any } = {};
      let total = 0;

      stores.forEach(([key, value]) => {
        const size = getByteSize(value || "");
        total += size;

        try {
          data[key] = {
            value: JSON.parse(value || "null"),
            size,
            rawValue: value,
          };
        } catch {
          data[key] = {
            value: value,
            size,
            rawValue: value,
          };
        }
      });

      setStorageData(data);
      setTotalSize(total);
    } catch (error) {
      console.error("Error loading storage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStorage = () => {
    Alert.alert(
      "Limpiar Almacenamiento",
      "¿Estás seguro? Esto eliminará todos los datos guardados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            loadStorageData();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Almacenamiento Asíncrono</Text>
        <TouchableOpacity onPress={loadStorageData}>
          <Ionicons name="refresh" size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <View style={styles.sizeInfo}>
          <Text style={styles.sizeText}>
            Peso total: {formatBytes(totalSize)}
          </Text>
          <Text style={styles.itemCount}>
            {Object.keys(storageData).length} elementos
          </Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearStorage}>
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.clearButtonText}>Limpiar Todo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loading}>Cargando...</Text>
        ) : Object.keys(storageData).length === 0 ? (
          <Text style={styles.empty}>No hay datos en el almacenamiento</Text>
        ) : (
          Object.entries(storageData).map(([key, data]) => (
            <View key={key} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.key}>{key}</Text>
                <Text style={styles.size}>{formatBytes(data.size)}</Text>
              </View>
              <Text style={styles.value}>
                {typeof data.value === "object"
                  ? JSON.stringify(data.value, null, 2)
                  : String(data.value)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    justifyContent: "space-between",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  itemCount: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.error,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    alignSelf: "flex-start",
  },
  clearButtonText: {
    color: "white",
    marginLeft: THEME.spacing.xs,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  loading: {
    textAlign: "center",
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xl,
  },
  empty: {
    textAlign: "center",
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xl,
  },
  item: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.xs,
  },
  size: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.warning,
    fontWeight: "500",
    backgroundColor: THEME.colors.background,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  key: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
  },
  value: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    fontFamily: "monospace",
  },
});

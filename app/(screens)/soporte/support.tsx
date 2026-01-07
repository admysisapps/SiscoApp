import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { THEME } from "@/constants/theme";
import supportData from "@/data/supportData.json";

export default function SupportScreen() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleContactEmail = useCallback(async () => {
    // Limpiar el email en caso de que ya tenga mailto:
    const cleanEmail = supportData.contact.email.replace("mailto:", "");
    const emailUrl = `mailto:${cleanEmail}?subject=${encodeURIComponent(supportData.contact.emailSubject)}&body=${encodeURIComponent(supportData.contact.emailBody)}`;

    try {
      const supported = await Linking.canOpenURL(emailUrl);

      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert("Error", "No se puede abrir el cliente de email.");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al intentar abrir el correo");
    }
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const filteredFAQ = supportData.faq.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{supportData.helpDesk.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{supportData.helpDesk.subtitle}</Text>
          <Text style={styles.heroDescription}>
            {supportData.helpDesk.description}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={THEME.colors.text.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar Ayuda"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={THEME.colors.text.muted}
          />
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {filteredFAQ.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                onPress={() => toggleFAQ(item.id)}
                style={styles.faqQuestion}
              >
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={expandedItems.has(item.id) ? "remove" : "add"}
                    size={18}
                    color={THEME.colors.primary}
                  />
                </View>
              </TouchableOpacity>
              {expandedItems.has(item.id) && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>
            {supportData.actions.stillStuck}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Contact Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleContactEmail}
          style={styles.contactButton}
        >
          <Text style={styles.contactButtonText}>
            {supportData.actions.sendMessage}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 28,
  },
  heroDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.lg,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchIcon: {
    marginRight: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  faqSection: {
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.md,
  },
  faqItem: {
    marginBottom: THEME.spacing.xs,
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: "hidden",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    marginRight: THEME.spacing.sm,
    fontWeight: "500",
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  faqAnswerContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceLight,
  },
  faqAnswer: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    paddingTop: THEME.spacing.sm,
  },
  contactSection: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    textAlign: "center",
    fontWeight: "500",
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME, COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useLoading } from "@/contexts/LoadingContext";

export default function RegistrationSuccess() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const animationRef = useRef<LottieView>(null);
  const { hideLoading } = useLoading();

  const router = useRouter();
  const { email, username } = useLocalSearchParams<{
    email: string;
    username: string;
  }>();

  useEffect(() => {
    // Ocultar cualquier loading que pueda estar activo
    hideLoading();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, hideLoading]);

  const handleAnimationFinish = () => {
    // Cuando termine la animación completa, hacer loop en la parte final
    setTimeout(() => {
      animationRef.current?.play(270, 400);
    }, 1000);
  };

  const handleGoToLogin = () => {
    // Ir al login inmediatamente
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Animación de éxito */}
          <View style={styles.successIconContainer}>
            <LottieView
              ref={animationRef}
              source={require("@/assets/lottie/SuccessCheck.json")}
              autoPlay={true}
              loop={false}
              style={styles.lottieAnimation}
              speed={0.8}
              onAnimationFinish={handleAnimationFinish}
            />
          </View>

          {/* Contenido principal */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>¡Registro Exitoso!</Text>
            <Text style={styles.subtitle}>
              Tu cuenta ha sido creada correctamente
            </Text>

            {/* Información del usuario */}
            <View style={styles.userInfoCard}>
              <View style={styles.userInfoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.userInfoLabel}>Documento:</Text>
                <Text style={styles.userInfoValue}>{username}</Text>
              </View>
              {email && (
                <View style={styles.userInfoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.userInfoLabel}>Correo:</Text>
                  <Text style={styles.userInfoValue}>{email}</Text>
                </View>
              )}
            </View>

            {/* Próximos pasos */}
            <View style={styles.stepsCard}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Inicia sesión</Text>
                  <Text style={styles.stepDescription}>
                    Tu cuenta está confirmada y lista para usar
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Explora tu copropiedad</Text>
                  <Text style={styles.stepDescription}>
                    Accede a reservas, asambleas, pagos y más
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Gestiona tu hogar</Text>
                  <Text style={styles.stepDescription}>
                    Administra tus inmuebles y mantente informado
                  </Text>
                </View>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.primaryButtonText}>Ir al Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary,
    top: -125,
    right: -125,
  },
  circle2: {
    width: 180,
    height: 180,
    backgroundColor: COLORS.primaryLight,
    bottom: -90,
    left: -90,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary,
    top: 300,
    right: -60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: THEME.spacing.xl,
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    alignItems: "center",
    minHeight: "100%",
  },
  successIconContainer: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    alignItems: "center",
  },
  lottieAnimation: {
    width: 230,
    height: 230,
  },
  mainContent: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: THEME.fontSize.lg,
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.lg,
    textAlign: "center",
  },
  userInfoCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  userInfoLabel: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginLeft: THEME.spacing.sm,
    marginRight: THEME.spacing.sm,
    fontWeight: "500",
  },
  userInfoValue: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: "600",
    flex: 1,
  },
  stepsCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  step: {
    flexDirection: "row",
    marginBottom: THEME.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.sm,
  },
  stepNumberText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    color: "white",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  actionButtons: {
    width: "100%",
    marginBottom: THEME.spacing.lg,
  },

  primaryButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.sm,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
    marginRight: THEME.spacing.sm,
  },
});

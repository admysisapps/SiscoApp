import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { THEME, COLORS } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface OTPInputProps {
  value: string[];
  onChange: (code: string[]) => void;
  onComplete?: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function OTPInput({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}: OTPInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const handleChangeText = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "").slice(0, 6);
    const newOtp = cleanText.split("");
    while (newOtp.length < 6) {
      newOtp.push("");
    }
    onChange(newOtp);

    // Llamar onComplete cuando se completan los 6 dígitos
    if (cleanText.length === 6 && onComplete) {
      onComplete(cleanText);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.codeInputWrapper}>
          <View style={styles.codeInputContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  value[index] && styles.codeBoxFilled,
                  error && styles.codeBoxError,
                  index === 0 && isFocused && styles.codeBoxFocused,
                ]}
              >
                <Text style={styles.codeDigit} allowFontScaling={true}>
                  {value[index] || ""}
                </Text>
              </View>
            ))}
          </View>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={value.join("")}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            placeholder="Código de verificación"
            placeholderTextColor={COLORS.text.muted}
            editable={!disabled}
          />
        </View>
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText} allowFontScaling={true}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "08",
  },
  codeInputWrapper: {
    flex: 1,
    position: "relative",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: THEME.spacing.sm,
  },
  codeBox: {
    width: Math.min(width * 0.12, 50),
    height: Math.min(width * 0.14, 60),
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },
  codeBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  codeBoxError: {
    borderColor: COLORS.error,
  },
  codeBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + "10",
  },
  codeDigit: {
    fontSize: width < 360 ? 16 : 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
});

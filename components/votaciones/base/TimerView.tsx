import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimerViewProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isFinalizada: boolean;
}

export const TimerView = React.memo(
  ({ initialSeconds, onTimeUp, isFinalizada }: TimerViewProps) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);

    useEffect(() => {
      if (isFinalizada || initialSeconds <= 0) return;

      setTimeLeft(initialSeconds - 1);

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }, [initialSeconds, isFinalizada, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLowTime = timeLeft <= 30;

    return (
      <View style={[styles.timer, isLowTime && styles.timerWarning]}>
        <Ionicons
          name="timer-outline"
          size={18}
          color={isLowTime ? "#EF4444" : "#10B981"}
        />
        <Text style={[styles.timerText, isLowTime && styles.timerTextWarning]}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isFinalizada === nextProps.isFinalizada &&
    prevProps.initialSeconds === nextProps.initialSeconds
);

TimerView.displayName = "TimerView";

const styles = StyleSheet.create({
  timer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  timerWarning: {
    backgroundColor: "#EF444420",
  },
  timerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  timerTextWarning: {
    color: "#EF4444",
  },
});

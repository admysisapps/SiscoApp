import type { ViewStyle, TextStyle } from "react-native";

export interface IButton {
  children: React.ReactNode;
  isLoading?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
  loadingTextBackgroundColor?: string;
  loadingText?: string;
  loadingTextColor?: string;
  loadingTextSize?: number;
  showLoadingIndicator?: boolean;
  renderLoadingIndicator?: () => React.ReactNode;
  borderRadius?: number;
  gradientColors?: string[];
  style?: ViewStyle;
  loadingTextStyle?: TextStyle;
  withPressAnimation?: boolean;
  animationDuration?: number;
  disabled?: boolean;
}

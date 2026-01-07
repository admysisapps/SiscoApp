import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import ApartmentSelector from "../ApartmentSelector";
import UserPaymentStatus from "./UserPaymentStatus";
import UserQuickActions from "./UserQuickActions";
// import UserNotifications from "./UserNotifications";
import UserActivity from "./UserActivity";

export default function UserDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ApartmentSelector />
      <UserPaymentStatus />
      <UserQuickActions />
      {/* <UserNotifications /> */}
      <UserActivity />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

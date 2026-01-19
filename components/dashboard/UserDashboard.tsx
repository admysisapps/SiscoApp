import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import ApartmentSelector from "../ApartmentSelector";
import SystemAnnouncement from "./SystemAnnouncement";
import UserPaymentStatus from "./UserPaymentStatus";
import UserQuickActions from "./UserQuickActions";
// import UserNotifications from "./UserNotifications";
import UserActivity from "./UserActivity";

const UserDashboard = React.memo(function UserDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ApartmentSelector />
      <SystemAnnouncement />
      <UserPaymentStatus />
      <UserQuickActions />
      {/* <UserNotifications /> */}
      <UserActivity />
    </ScrollView>
  );
});

export default UserDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

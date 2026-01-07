import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import PaymentChart from "./PaymentChart";
import FinancialStatus from "./FinancialStatus";
import UpcomingPayments from "./UpcomingPayments";
import RecentActivity from "./RecentActivity";
import ApartmentSelector from "../ApartmentSelector";

export default function DashboardHome() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ApartmentSelector />
      <PaymentChart />
      <FinancialStatus />
      <UpcomingPayments />
      <RecentActivity />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

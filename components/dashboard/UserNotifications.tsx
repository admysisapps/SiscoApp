// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useFocusEffect } from "@react-navigation/native";
// import { THEME } from "@/constants/theme";
// import { avisosService } from "@/services/avisoService";
// import dayjs from "dayjs";
// import "dayjs/locale/es";

// dayjs.locale("es");

// interface Aviso {
//   id: number;
//   tipo:
//     | "advertencia"
//     | "recordatorio"
//     | "pago"
//     | "general"
//     | "mantenimiento"
//     | "emergencia";
//   titulo: string;
//   descripcion: string;
//   fecha_creacion: string;
//   prioridad: "baja" | "media" | "alta" | "urgente";
// }

// const getAvisoIcon = (tipo: string) => {
//   switch (tipo) {
//     case "emergencia":
//       return "warning";
//     case "mantenimiento":
//       return "construct";
//     case "pago":
//       return "card";
//     case "recordatorio":
//       return "time";
//     case "advertencia":
//       return "alert-circle";
//     default:
//       return "information-circle";
//   }
// };

// const getAvisoColor = (prioridad: string) => {
//   switch (prioridad) {
//     case "urgente":
//       return "#EF4444";
//     case "alta":
//       return "#F59E0B";
//     case "media":
//       return "#3B82F6";
//     case "baja":
//       return "#6B7280";
//     default:
//       return "#6B7280";
//   }
// };

// export default function UserNotifications() {
//   const router = useRouter();
//   const [avisos, setAvisos] = useState<Aviso[]>([]);
//   const [loading, setLoading] = useState(false);

//   const cargarAvisos = useCallback(async () => {
//     try {
//       // Solo mostrar loading si no hay avisos previos
//       if (avisos.length === 0) {
//         setLoading(true);
//       }

//       const response = await avisosService.obtenerAvisos(1, 4);
//       if (response.success) {
//         setAvisos(response.avisos || []);
//       }
//     } catch (error) {
//       console.error("Error cargando avisos:", error);
//       // No mostrar error en UI para no bloquear
//     } finally {
//       setLoading(false);
//     }
//   }, [avisos.length]);

//   useFocusEffect(
//     useCallback(() => {
//       // Cargar avisos de forma no bloqueante
//       cargarAvisos();
//     }, [cargarAvisos])
//   );

//   // Inicializar con loading false para no bloquear la UI
//   React.useEffect(() => {
//     setLoading(false);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Notificaciones</Text>
//         <TouchableOpacity
//           style={styles.viewAllButton}
//           onPress={() => router.push("/(tabs)" as any)}
//         >
//           <Text style={styles.viewAllText}>Ver todas</Text>
//           <Ionicons
//             name="chevron-forward"
//             size={16}
//             color={THEME.colors.primary}
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.notificationsList}>
//         {loading && (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="small" color={THEME.colors.primary} />
//             <Text style={styles.loadingText}>Cargando avisos...</Text>
//           </View>
//         )}
//         {!loading &&
//           (avisos.length > 0 ? (
//             avisos.map((aviso) => (
//               <TouchableOpacity
//                 key={aviso.id}
//                 style={styles.notificationItem}
//                 activeOpacity={0.7}
//               >
//                 <View style={styles.notificationContent}>
//                   <View style={styles.notificationHeader}>
//                     <View
//                       style={[
//                         styles.iconContainer,
//                         {
//                           backgroundColor: `${getAvisoColor(aviso.prioridad)}20`,
//                         },
//                       ]}
//                     >
//                       <Ionicons
//                         name={
//                           getAvisoIcon(
//                             aviso.tipo
//                           ) as keyof typeof Ionicons.glyphMap
//                         }
//                         size={16}
//                         color={getAvisoColor(aviso.prioridad)}
//                       />
//                     </View>

//                     <View style={styles.notificationInfo}>
//                       <View style={styles.titleRow}>
//                         <Text style={styles.notificationTitle}>
//                           {aviso.titulo}
//                         </Text>
//                         <View
//                           style={[
//                             styles.priorityBadge,
//                             { backgroundColor: getAvisoColor(aviso.prioridad) },
//                           ]}
//                         >
//                           <Text style={styles.priorityText}>
//                             {aviso.prioridad.toUpperCase()}
//                           </Text>
//                         </View>
//                       </View>
//                       <Text style={styles.notificationTime}>
//                         {aviso.fecha_creacion.split(" ")[0]}
//                       </Text>
//                     </View>
//                   </View>

//                   <Text style={styles.notificationMessage}>
//                     {aviso.descripcion}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             ))
//           ) : (
//             <View style={styles.emptyContainer}>
//               <Ionicons
//                 name="notifications-off"
//                 size={32}
//                 color={THEME.colors.text.secondary}
//               />
//               <Text style={styles.emptyText}>No hay avisos recientes</Text>
//             </View>
//           ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: THEME.colors.text.primary,
//   },
//   viewAllButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   viewAllText: {
//     fontSize: 14,
//     color: THEME.colors.primary,
//     fontWeight: "500",
//   },
//   notificationsList: {
//     gap: 12,
//   },
//   notificationItem: {
//     backgroundColor: "#F8FAFC",
//     borderRadius: 8,
//     padding: 12,
//   },
//   notificationContent: {
//     gap: 8,
//   },
//   notificationHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//   },
//   iconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   notificationInfo: {
//     flex: 1,
//   },
//   titleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   notificationTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: THEME.colors.text.primary,
//     flex: 1,
//   },
//   priorityBadge: {
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//   },
//   priorityText: {
//     fontSize: 10,
//     fontWeight: "600",
//     color: "white",
//   },
//   loadingContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 20,
//     gap: 8,
//   },
//   loadingText: {
//     fontSize: 14,
//     color: THEME.colors.text.secondary,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     paddingVertical: 20,
//     gap: 8,
//   },
//   emptyText: {
//     fontSize: 14,
//     color: THEME.colors.text.secondary,
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: THEME.colors.text.secondary,
//     marginTop: 2,
//   },
//   notificationMessage: {
//     fontSize: 13,
//     color: THEME.colors.text.secondary,
//     lineHeight: 18,
//     marginLeft: 44,
//   },
// });

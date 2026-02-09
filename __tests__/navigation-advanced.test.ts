/**
 * Test de Navegación Inicial - COMPLETO Y DETALLADO
 *
 * Este test verifica TODOS los escenarios críticos de navegación
 * Cubre: Conexión, Autenticación, Roles, Proyectos, Errores
 */

type NavigationState = {
  isConnected: boolean;
  onboardingSeen: boolean | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  userLoading: boolean;
  isLoadingProjects: boolean;
  user: any;
  userHasError: boolean;
  userHasAccessError: boolean;
  proyectos: any[];
  selectedProject: any;
};

function getExpectedRoute(state: NavigationState): string {
  // 1. PRIORIDAD MÁXIMA: Sin conexión
  if (!state.isConnected) {
    return "/(screens)/NoConnection";
  }

  // 2. Estados de carga iniciales
  if (state.authLoading || state.onboardingSeen === null) {
    return "LOADING";
  }

  // 3. Usuario NO autenticado
  if (!state.isAuthenticated) {
    if (!state.onboardingSeen) {
      return "/(onboarding)";
    }
    return "/(auth)/login";
  }

  // 4. Usuario autenticado - Estados de carga
  if (state.userLoading || state.isLoadingProjects) {
    return "LOADING";
  }

  // 5. Errores de usuario autenticado
  if (state.userHasError) {
    return "/(screens)/ConnectionErrorScreen";
  }

  if (state.userHasAccessError) {
    return "/(screens)/AccessDenied";
  }

  // 6. Proyecto seleccionado (prioridad alta)
  if (state.selectedProject) {
    return state.selectedProject.rolUsuario === "admin"
      ? "/(admin)"
      : "/(tabs)";
  }

  // 7. Usuario sin datos
  if (!state.user) {
    return "/(screens)/AccessDenied";
  }

  // 8. Sin proyectos
  if (state.proyectos.length === 0) {
    return "/(screens)/AccessDenied";
  }

  // 9. Múltiples proyectos
  if (state.proyectos.length > 1) {
    return "/project-selector";
  }

  // 10. Un solo proyecto
  const proyecto = state.proyectos[0];
  return proyecto.rolUsuario === "admin" ? "/(admin)" : "/(tabs)";
}

describe("Lógica de Navegación Inicial - COMPLETO", () => {
  describe("1. PRIORIDAD MÁXIMA - Sin Conexión", () => {
    test("debe redirigir a NoConnection incluso si está autenticado", () => {
      const state: NavigationState = {
        isConnected: false,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "admin" }],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/NoConnection");
    });

    test("debe redirigir a NoConnection incluso con proyecto seleccionado", () => {
      const state: NavigationState = {
        isConnected: false,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: { id: "1", rolUsuario: "admin" },
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/NoConnection");
    });
  });

  describe("2. Estados de Carga Iniciales", () => {
    test("debe mostrar loading cuando authLoading es true", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: false,
        authLoading: true,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("LOADING");
    });

    test("debe mostrar loading cuando onboardingSeen es null", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: null,
        isAuthenticated: false,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("LOADING");
    });
  });

  describe("3. Usuario NO Autenticado", () => {
    test("debe redirigir a onboarding si nunca lo vio", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: false,
        isAuthenticated: false,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(onboarding)");
    });

    test("debe redirigir a login si ya vio onboarding", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: false,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(auth)/login");
    });
  });

  describe("4. Usuario Autenticado - Estados de Carga", () => {
    test("debe mostrar loading cuando userLoading es true", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: true,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("LOADING");
    });

    test("debe mostrar loading cuando isLoadingProjects es true", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: true,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("LOADING");
    });
  });

  describe("5. Manejo de Errores", () => {
    test("debe redirigir a ConnectionErrorScreen cuando userHasError", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: true,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/ConnectionErrorScreen");
    });

    test("debe redirigir a AccessDenied cuando userHasAccessError", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: true,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/AccessDenied");
    });
  });

  describe("6. Proyecto Seleccionado (Prioridad Alta)", () => {
    test("debe ir a (admin) con proyecto admin seleccionado", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "admin" }],
        selectedProject: { id: "1", rolUsuario: "admin" },
      };

      expect(getExpectedRoute(state)).toBe("/(admin)");
    });

    test("debe ir a (tabs) con proyecto propietario seleccionado", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "propietario" }],
        selectedProject: { id: "1", rolUsuario: "propietario" },
      };

      expect(getExpectedRoute(state)).toBe("/(tabs)");
    });
  });

  describe("7. Usuario Sin Datos", () => {
    test("debe redirigir a AccessDenied si no hay user", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/AccessDenied");
    });
  });

  describe("8. Sin Proyectos", () => {
    test("debe redirigir a AccessDenied si no tiene proyectos", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/AccessDenied");
    });
  });

  describe("9. Múltiples Proyectos", () => {
    test("debe ir a project-selector con 2+ proyectos", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [
          { id: "1", rolUsuario: "admin" },
          { id: "2", rolUsuario: "propietario" },
        ],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/project-selector");
    });
  });

  describe("10. Un Solo Proyecto", () => {
    test("debe ir a (admin) con 1 proyecto admin", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "admin" }],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(admin)");
    });

    test("debe ir a (tabs) con 1 proyecto propietario", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "propietario" }],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(tabs)");
    });
  });

  describe("11. Escenarios Complejos (Edge Cases)", () => {
    test("proyecto seleccionado tiene prioridad sobre múltiples proyectos", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: false,
        userHasAccessError: false,
        proyectos: [
          { id: "1", rolUsuario: "admin" },
          { id: "2", rolUsuario: "propietario" },
        ],
        selectedProject: { id: "1", rolUsuario: "admin" },
      };

      expect(getExpectedRoute(state)).toBe("/(admin)");
    });

    test("error tiene prioridad sobre proyecto seleccionado", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: true,
        userHasAccessError: false,
        proyectos: [{ id: "1", rolUsuario: "admin" }],
        selectedProject: { id: "1", rolUsuario: "admin" },
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/ConnectionErrorScreen");
    });

    test("sin conexión tiene prioridad sobre todo", () => {
      const state: NavigationState = {
        isConnected: false,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: { id: "123" },
        userHasError: true,
        userHasAccessError: true,
        proyectos: [{ id: "1", rolUsuario: "admin" }],
        selectedProject: { id: "1", rolUsuario: "admin" },
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/NoConnection");
    });

    test("loading tiene prioridad sobre errores cuando está autenticado", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: true,
        isLoadingProjects: false,
        user: null,
        userHasError: true,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("LOADING");
    });

    test("usuario autenticado sin user ni proyectos va a AccessDenied", () => {
      const state: NavigationState = {
        isConnected: true,
        onboardingSeen: true,
        isAuthenticated: true,
        authLoading: false,
        userLoading: false,
        isLoadingProjects: false,
        user: null,
        userHasError: false,
        userHasAccessError: false,
        proyectos: [],
        selectedProject: null,
      };

      expect(getExpectedRoute(state)).toBe("/(screens)/AccessDenied");
    });
  });
});

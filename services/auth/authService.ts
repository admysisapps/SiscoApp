import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  getCurrentUser,
  resendSignUpCode,
  fetchUserAttributes,
  confirmSignIn,
} from "aws-amplify/auth";
import { authCacheService } from "../cache/authCacheService";

// Tipos para el servicio de autenticación
export interface AuthError {
  code?: string;
  message: string;
  name?: string;
}

export interface LoginResult {
  isSignedIn: boolean;
  nextStep?: any;
}

export interface RegisterResult {
  isSignUpComplete: boolean;
  userId?: string;
  nextStep?: any;
}

export interface ConfirmRegistrationResult {
  isSignUpComplete: boolean;
  nextStep?: any;
}

export interface ForgotPasswordResult {
  nextStep?: any;
}

export interface ResetPasswordResult {
  success: boolean;
}

export interface ChangePasswordResult {
  success: boolean;
}

export interface ConfirmSignInResult {
  isSignedIn: boolean;
  nextStep?: any;
}

export interface ResendCodeResult {
  success: boolean;
}

export interface UserAttributes {
  [key: string]: string | undefined;
}

// Servicio de autenticación con Cognito Contiene solo la lógica pura de autenticación

export const authService = {
  //  Iniciar sesión con Cognito

  async login(usernameOrEmail: string, password: string): Promise<LoginResult> {
    const { isSignedIn, nextStep } = await signIn({
      username: usernameOrEmail,
      password,
    });

    // Actualizar cache si el login fue exitoso
    if (isSignedIn) {
      try {
        const userData = await getCurrentUser();
        await authCacheService.setAuthStatus(true, userData.username);
      } catch {
        await authCacheService.setAuthStatus(true, usernameOrEmail);
      }
    }

    return { isSignedIn, nextStep };
  },

  // Cerrar sesión con Cognito

  async logout(): Promise<void> {
    await signOut();
    await authCacheService.clearAuthCache();

    // Limpiar cache de token
    const { apiService } = await import("../apiService");
    apiService.clearTokenCache();
  },

  //Registrar nuevo usuario con Cognito

  async register(
    username: string,
    password: string,
    email: string
  ): Promise<RegisterResult> {
    // TODO: Validar código de invitación con backend antes de crear en Cognito

    const { isSignUpComplete, userId, nextStep } = await signUp({
      username,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });

    return { isSignUpComplete, userId, nextStep };
  },

  // Confirmar registro de usuario

  async confirmRegistration(
    username: string,
    code: string
  ): Promise<ConfirmRegistrationResult> {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username,
      confirmationCode: code,
    });

    return { isSignUpComplete, nextStep };
  },

  //Solicitar código de recuperación de contraseña

  async forgotPassword(username: string): Promise<ForgotPasswordResult> {
    const { nextStep } = await resetPassword({ username });
    return { nextStep };
  },

  // Confirmar nueva contraseña

  async resetPassword(
    username: string,
    code: string,
    newPassword: string
  ): Promise<ResetPasswordResult> {
    await confirmResetPassword({
      username,
      confirmationCode: code,
      newPassword,
    });

    return { success: true };
  },

  // Cambiar contraseña de usuario autenticado

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResult> {
    await updatePassword({
      oldPassword,
      newPassword,
    });

    return { success: true };
  },

  //Reenviar código de confirmación

  async resendConfirmationCode(username: string): Promise<ResendCodeResult> {
    await resendSignUpCode({ username });
    return { success: true };
  },

  //Obtener atributos del usuario autenticado

  async fetchUserAttributes(): Promise<UserAttributes> {
    const attributes = await fetchUserAttributes();
    return attributes as UserAttributes;
  },

  //Obtener usuario actual de Cognito

  async getCurrentUser() {
    return await getCurrentUser();
  },

  //Confirmar sign-in para challenges como NEW_PASSWORD_REQUIRED

  async confirmSignIn(challengeResponse: string): Promise<ConfirmSignInResult> {
    const { isSignedIn, nextStep } = await confirmSignIn({
      challengeResponse,
    });

    // Actualizar cache si el login fue exitoso
    if (isSignedIn) {
      try {
        const userData = await getCurrentUser();
        await authCacheService.setAuthStatus(true, userData.username);
      } catch {
        await authCacheService.setAuthStatus(true, "unknown");
      }
    }

    return { isSignedIn, nextStep };
  },

  // Verificar si hay una sesión activa (con cache para auto-login rápido)

  async checkAuthStatus(): Promise<{
    isAuthenticated: boolean;
    username?: string;
  }> {
    try {
      // Primero verificar cache para respuesta rápida
      const cachedAuth = await authCacheService.getAuthStatus();
      if (cachedAuth && cachedAuth.isAuthenticated) {
        // Verificación en background para mantener cache actualizado
        this.validateCacheInBackground();
        return cachedAuth;
      }

      // Si no hay cache válido, verificar con Cognito
      const userData = await getCurrentUser();
      const authStatus = {
        isAuthenticated: true,
        username: userData.username,
      };

      // Actualizar cache
      await authCacheService.setAuthStatus(true, userData.username);

      console.log(" Sesión válida para:", userData.username);

      return authStatus;
    } catch (error: any) {
      console.log(" Sesión inválida:", error.message || "Token expirado");

      // Limpiar cache si la verificación falla
      await authCacheService.clearAuthCache();
      return {
        isAuthenticated: false,
      };
    }
  },

  // Validar cache en background sin bloquear la UI

  async validateCacheInBackground(): Promise<void> {
    setTimeout(async () => {
      try {
        await getCurrentUser();
        // Si llegamos aquí, la sesión sigue válida
      } catch {
        // Sesión inválida, limpiar cache
        await authCacheService.clearAuthCache();
      }
    }, 100);
  },
};

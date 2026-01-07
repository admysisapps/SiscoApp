import { updateUserAttribute, confirmUserAttribute } from "aws-amplify/auth";
import { apiService } from "../apiService";

export const profileService = {
  // Cambia email usando Cognito directamente

  async updateEmail(newEmail: string) {
    try {
      const result = await updateUserAttribute({
        userAttribute: {
          attributeKey: "email",
          value: newEmail,
        },
      });

      return {
        success: true,
        message: "Código de verificación enviado al nuevo email",
        result,
      };
    } catch (error: any) {
      console.error("ProfileService: Error actualizando email:", error.code);
      throw error;
    }
  },

  // Confirma el nuevo email con código de verificación

  async confirmEmailChange(verificationCode: string) {
    try {
      await confirmUserAttribute({
        userAttributeKey: "email",
        confirmationCode: verificationCode,
      });

      return { success: true, message: "Email actualizado correctamente" };
    } catch (error: any) {
      console.error("ProfileService: Error confirmando email:", error.code);
      throw error;
    }
  },

  // Sincroniza email entre Cognito y base de datos

  async syncEmailToDatabase(documento: string, newEmail: string) {
    try {
      const result = await apiService.makeRequestWithContextType(
        "/usuarios/actualizar-email",
        {
          documento: String(documento),
          nuevo_email: String(newEmail),
        },
        "USER_UPDATE"
      );
      return result;
    } catch (error: any) {
      console.error(error.message || error);
      throw error;
    }
  },
};

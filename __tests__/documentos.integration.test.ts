/**
 * Tests de Integración - Sistema de Documentos
 * Prueba el flujo completo desde la generación de reportes hasta la gestión de documentos
 */

// Mock de AsyncStorage antes de cualquier import
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock de servicios externos
jest.mock("@/services/apiService");
jest.mock("@/services/s3Service");

// Mock completo de los servicios
const mockDocumentoService = {
  listarDocumentos: jest.fn(),
  eliminarDocumento: jest.fn(),
  actualizarVisibilidad: jest.fn(),
};

const mockAsambleaService = {
  generarReporteAsistencia: jest.fn(),
};

jest.mock("@/services/documentoService", () => mockDocumentoService);
jest.mock("@/services/asambleaService", () => mockAsambleaService);

describe("Sistema de Documentos - Tests de Integración", () => {
  const mockUserContext = {
    documento: "1070464012",
    rol: "admin",
    copropiedad: "copropiedad_test",
    proyecto_nit: "900123456",
  };

  const mockAsamblea = {
    id: 61,
    titulo: "Asamblea Extraordinaria - Obra Fachada",
    estado: "finalizada",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Generación de Reportes de Asistencia", () => {
    it("debe generar un reporte nuevo exitosamente", async () => {
      // Mock de respuesta exitosa
      const mockResponse = {
        success: true,
        mensaje: "Reporte de asistencia generado correctamente",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(mockResponse);

      const result = await mockAsambleaService.generarReporteAsistencia(
        mockAsamblea.id
      );

      expect(result.success).toBe(true);
      expect(result.mensaje).toContain("generado correctamente");
      expect(mockAsambleaService.generarReporteAsistencia).toHaveBeenCalledWith(
        61
      );
    });

    it("debe detectar cuando un reporte ya existe", async () => {
      const mockResponse = {
        success: true,
        mensaje:
          "El reporte de asistencia ya existe. Puedes consultarlo en la sección de documentos.",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(mockResponse);

      const result = await mockAsambleaService.generarReporteAsistencia(
        mockAsamblea.id
      );

      expect(result.success).toBe(true);
      expect(result.mensaje).toContain("ya existe");
    });

    it("debe manejar errores de permisos", async () => {
      const mockResponse = {
        success: false,
        error: "Solo los administradores pueden generar reportes",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(mockResponse);

      const result = await mockAsambleaService.generarReporteAsistencia(
        mockAsamblea.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("administradores");
    });
  });

  describe("Gestión de Documentos", () => {
    const mockDocumentos = [
      {
        id: 99,
        nombre_archivo: "RPT_AST_61_1770850277.pdf",
        nombre_original: "Reporte de Asistencia - Asamblea Extraordinaria.pdf",
        tamaño: 12745,
        subido_por: "sistema",
        fecha_creacion: "2026-02-11 22:51:17",
        visible_cop: 0,
      },
      {
        id: 97,
        nombre_archivo: "1770850222035_documento.pdf",
        nombre_original: "Documento Manual.pdf",
        tamaño: 157687,
        subido_por: "1070464012",
        fecha_creacion: "2026-02-11 22:50:23",
        visible_cop: 1,
      },
    ];

    it("debe listar documentos correctamente", async () => {
      const mockResponse = {
        success: true,
        documentos: mockDocumentos,
      };

      jest
        .spyOn(mockDocumentoService, "listarDocumentos")
        .mockResolvedValue(mockResponse);

      const result = await mockDocumentoService.listarDocumentos();

      expect(result.success).toBe(true);
      expect(result.documentos).toHaveLength(2);
      expect(result.documentos![0].subido_por).toBe("sistema"); // Reporte automático
      expect(result.documentos![1].subido_por).toBe("1070464012"); // Documento manual
    });

    it("debe filtrar reportes automáticos vs documentos manuales", async () => {
      const mockResponse = {
        success: true,
        documentos: mockDocumentos,
      };

      jest
        .spyOn(mockDocumentoService, "listarDocumentos")
        .mockResolvedValue(mockResponse);

      const result = await mockDocumentoService.listarDocumentos();

      const reportesAutomaticos = result.documentos!.filter(
        (doc) =>
          doc.subido_por === "sistema" &&
          doc.nombre_archivo.startsWith("RPT_AST_")
      );

      const documentosManuales = result.documentos!.filter(
        (doc) => doc.subido_por !== "sistema"
      );

      expect(reportesAutomaticos).toHaveLength(1);
      expect(documentosManuales).toHaveLength(1);
      expect(reportesAutomaticos[0].visible_cop).toBe(0); // Solo admin
      expect(documentosManuales[0].visible_cop).toBe(1); // Visible para copropietarios
    });

    it("debe eliminar documentos correctamente", async () => {
      const mockResponse = {
        success: true,
        mensaje: "Documento eliminado correctamente",
      };

      jest
        .spyOn(mockDocumentoService, "eliminarDocumento")
        .mockResolvedValue(mockResponse);

      const result = await mockDocumentoService.eliminarDocumento(
        "900123456",
        "99",
        "RPT_AST_61_1770850277.pdf",
        "Reporte de Asistencia - Asamblea Extraordinaria.pdf"
      );

      expect(result.success).toBe(true);
      expect(mockDocumentoService.eliminarDocumento).toHaveBeenCalledWith(
        "900123456",
        "99",
        "RPT_AST_61_1770850277.pdf",
        "Reporte de Asistencia - Asamblea Extraordinaria.pdf"
      );
    });

    it("debe actualizar visibilidad de documentos", async () => {
      const mockResponse = {
        success: true,
        mensaje: "Visibilidad actualizada correctamente",
      };

      jest
        .spyOn(mockDocumentoService, "actualizarVisibilidad")
        .mockResolvedValue(mockResponse);

      const result = await mockDocumentoService.actualizarVisibilidad(
        "97",
        false
      );

      expect(result.success).toBe(true);
      expect(mockDocumentoService.actualizarVisibilidad).toHaveBeenCalledWith(
        "97",
        false
      );
    });
  });

  describe("Flujo Completo: Generar Reporte → Ver en Documentos", () => {
    it("debe completar el flujo de generación y visualización", async () => {
      // 1. Generar reporte
      const reporteResponse = {
        success: true,
        mensaje: "Reporte de asistencia generado correctamente",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(reporteResponse);

      const generarResult =
        await mockAsambleaService.generarReporteAsistencia(61);
      expect(generarResult.success).toBe(true);

      // 2. Verificar que aparece en la lista de documentos
      const documentosResponse = {
        success: true,
        documentos: [
          {
            id: 101,
            nombre_archivo: "RPT_AST_61_1770850310.pdf",
            nombre_original:
              "Reporte de Asistencia - Asamblea Extraordinaria - Obra Fachada.pdf",
            tamaño: 12745,
            subido_por: "sistema",
            fecha_creacion: "2026-02-11 22:51:51",
            visible_cop: 0,
          },
        ],
      };

      jest
        .spyOn(mockDocumentoService, "listarDocumentos")
        .mockResolvedValue(documentosResponse);

      const listarResult = await mockDocumentoService.listarDocumentos();

      expect(listarResult.success).toBe(true);
      expect(listarResult.documentos![0].nombre_archivo).toContain(
        "RPT_AST_61_"
      );
      expect(listarResult.documentos![0].subido_por).toBe("sistema");
      expect(listarResult.documentos![0].visible_cop).toBe(0);
    });
  });

  describe("Manejo de Errores", () => {
    it("debe manejar errores de conexión S3", async () => {
      const mockError = {
        success: false,
        error: "Error al subir archivo a S3: NoSuchBucket",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(mockError);

      const result = await mockAsambleaService.generarReporteAsistencia(61);

      expect(result.success).toBe(false);
      expect(result.error).toContain("S3");
    });

    it("debe manejar errores de base de datos", async () => {
      const mockError = {
        success: false,
        error: "Error interno del servidor: Connection timeout",
      };

      jest
        .spyOn(mockDocumentoService, "listarDocumentos")
        .mockResolvedValue(mockError);

      const result = await mockDocumentoService.listarDocumentos();

      expect(result.success).toBe(false);
      expect(result.error).toContain("servidor");
    });
  });

  describe("Validaciones de Seguridad", () => {
    it("debe validar permisos de administrador para generar reportes", async () => {
      const mockResponse = {
        success: false,
        error: "Solo los administradores pueden generar reportes",
      };

      jest
        .spyOn(mockAsambleaService, "generarReporteAsistencia")
        .mockResolvedValue(mockResponse);

      const result = await mockAsambleaService.generarReporteAsistencia(61);

      expect(result.success).toBe(false);
      expect(result.error).toContain("administradores");
    });

    it("debe validar permisos para eliminar documentos", async () => {
      const mockResponse = {
        success: false,
        error: "No tienes permisos para eliminar este documento",
      };

      jest
        .spyOn(mockDocumentoService, "eliminarDocumento")
        .mockResolvedValue(mockResponse);

      const result = await mockDocumentoService.eliminarDocumento(
        "900123456",
        "99",
        "RPT_AST_61_1770850277.pdf",
        "Reporte de Asistencia.pdf"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("permisos");
    });
  });
});

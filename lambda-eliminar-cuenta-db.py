import json
import pymysql
import os
import boto3
from contextlib import contextmanager

CENTRAL_DB_NAME = "sisco_central"

DB_CONFIG = {
    "host": os.environ.get("DB_HOST"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
    "connect_timeout": 5,
    "read_timeout": 10,
    "write_timeout": 10,
    "cursorclass": pymysql.cursors.DictCursor,
}

@contextmanager
def get_db_connection(database_name):
    conn = None
    try:
        conn = pymysql.connect(database=database_name, **DB_CONFIG)
        yield conn
    except pymysql.Error as e:
        print(f"Error de conexión a BD {database_name}: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

def create_error_response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": False, "error": message}),
    }

def create_success_response(data):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
    }

def lambda_handler(event, context):
    try:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        user_context = body.get("user_context")

        if not user_context:
            return create_error_response(400, "Contexto de usuario requerido")

        database_name = user_context.get("copropiedad")
        documento = user_context.get("documento")
        proyecto_nit = user_context.get("proyecto_nit")

        if not database_name or not documento or not proyecto_nit:
            return create_error_response(400, "Datos incompletos")

        print(f"Eliminando cuenta de usuario {documento}")

        # Guardar en bitácora de BD local
        with get_db_connection(database_name) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM usuarios WHERE documento = %s", (documento,))
                usuario = cursor.fetchone()
                
                if not usuario:
                    return create_error_response(404, "Usuario no encontrado")

                cursor.execute("""
                    INSERT INTO bitacora (usuario_documento, responsable, modulo, accion, detalles, fecha)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (
                    documento,
                    documento,
                    "Cuenta",
                    "Eliminar Cuenta",
                    json.dumps({"usuario_id": usuario["id"], "tipo": "voluntaria"})
                ))
                conn.commit()

        # Eliminar de BD central
        with get_db_connection(CENTRAL_DB_NAME) as central_conn:
            with central_conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM usuarios_sistema 
                    WHERE documento = %s AND proyecto_nit = %s
                """, (documento, proyecto_nit))
                
                cursor.execute("""
                    DELETE FROM notificaciones
                    WHERE usuario_documento = %s AND proyecto_nit = %s
                """, (documento, proyecto_nit))
                
                central_conn.commit()

        # Invocar Lambda de Cognito
        lambda_client = boto3.client("lambda")
        response = lambda_client.invoke(
            FunctionName="siscoapp-propietarios-eliminar-cuenta-cognito",
            InvocationType="RequestResponse",
            Payload=json.dumps({"documento": documento})
        )

        payload_json = json.loads(response['Payload'].read())

        if not payload_json.get("success"):
            error_msg = payload_json.get('error', 'Error desconocido')
            print(f"Error en Cognito: {error_msg}")
            return create_error_response(500, f"No se pudo eliminar de Cognito: {error_msg}")

        return create_success_response({
            "success": True,
            "message": "Cuenta eliminada exitosamente"
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_error_response(500, f"Error interno: {str(e)}")

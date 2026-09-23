import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_connection, init_db

app = Flask(__name__)
CORS(app, origins=os.environ.get("FRONTEND_ORIGIN", "*"))
init_db()

ESTADOS_VALIDOS = {"pendiente", "en_progreso", "completada"}


def tarea_a_dict(row):
    return {"id": row["id"], "tarea": row["tarea"], "estado": row["estado"]}


@app.route("/tareas", methods=["GET"])
def listar_tareas():
    conn = get_connection()
    filas = conn.execute("SELECT * FROM tareas ORDER BY id").fetchall()
    conn.close()
    return jsonify([tarea_a_dict(f) for f in filas])


@app.route("/tareas/<int:tarea_id>", methods=["GET"])
def obtener_tarea(tarea_id):
    conn = get_connection()
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    conn.close()
    if fila is None:
        return jsonify({"error": "Tarea no encontrada"}), 404
    return jsonify(tarea_a_dict(fila))


@app.route("/tareas", methods=["POST"])
def crear_tarea():
    datos = request.get_json(silent=True) or {}
    tarea = datos.get("tarea")
    estado = datos.get("estado", "pendiente")

    if not tarea or not isinstance(tarea, str) or not tarea.strip():
        return jsonify({"error": "El campo 'tarea' es obligatorio"}), 400
    if estado not in ESTADOS_VALIDOS:
        return jsonify({"error": f"Estado inválido. Valores permitidos: {sorted(ESTADOS_VALIDOS)}"}), 400

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO tareas (tarea, estado) VALUES (?, ?)", (tarea.strip(), estado)
    )
    conn.commit()
    nueva_id = cursor.lastrowid
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (nueva_id,)).fetchone()
    conn.close()
    return jsonify(tarea_a_dict(fila)), 201


@app.route("/tareas/<int:tarea_id>", methods=["PUT"])
def actualizar_tarea(tarea_id):
    datos = request.get_json(silent=True) or {}

    conn = get_connection()
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    if fila is None:
        conn.close()
        return jsonify({"error": "Tarea no encontrada"}), 404

    tarea = datos.get("tarea", fila["tarea"])
    estado = datos.get("estado", fila["estado"])

    if not tarea or not isinstance(tarea, str) or not tarea.strip():
        conn.close()
        return jsonify({"error": "El campo 'tarea' no puede estar vacío"}), 400
    if estado not in ESTADOS_VALIDOS:
        conn.close()
        return jsonify({"error": f"Estado inválido. Valores permitidos: {sorted(ESTADOS_VALIDOS)}"}), 400

    conn.execute(
        "UPDATE tareas SET tarea = ?, estado = ? WHERE id = ?",
        (tarea.strip(), estado, tarea_id),
    )
    conn.commit()
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    conn.close()
    return jsonify(tarea_a_dict(fila))


@app.route("/tareas/<int:tarea_id>", methods=["DELETE"])
def eliminar_tarea(tarea_id):
    conn = get_connection()
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    if fila is None:
        conn.close()
        return jsonify({"error": "Tarea no encontrada"}), 404

    conn.execute("DELETE FROM tareas WHERE id = ?", (tarea_id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Tarea eliminada correctamente"}), 200


if __name__ == "__main__":
    app.run(debug=True)

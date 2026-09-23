import sqlite3

DATABASE = "tareas.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tarea TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'pendiente'
        )
        """
    )
    conn.commit()
    conn.close()

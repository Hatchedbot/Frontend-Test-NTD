const ES_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Reemplaza esta URL por la de tu backend una vez desplegado en Render.
const API_URL = ES_LOCAL
  ? "http://127.0.0.1:5000/tareas"
  : "https://TU-BACKEND.onrender.com/tareas";

const form = document.getElementById("form-tarea");
const inputTarea = document.getElementById("input-tarea");
const inputEstado = document.getElementById("input-estado");
const lista = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");
const contador = document.getElementById("contador");

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  setTimeout(() => {
    mensaje.className = "mensaje oculto";
  }, 3000);
}

async function cargarTareas() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("No se pudieron cargar las tareas");
    const tareas = await respuesta.json();
    renderizarLista(tareas);
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

function renderizarLista(tareas) {
  lista.innerHTML = "";
  actualizarContador(tareas.length);

  if (tareas.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "No hay tareas todavía.";
    lista.appendChild(vacio);
    return;
  }

  tareas.forEach((tarea) => lista.appendChild(crearElementoTarea(tarea)));
}

function actualizarContador(cantidad) {
  contador.textContent = `${cantidad} ${cantidad === 1 ? "tarea" : "tareas"}`;
}

function crearElementoTarea(tarea) {
  const li = document.createElement("li");
  li.className = "tarea";
  li.dataset.id = tarea.id;

  const id = document.createElement("span");
  id.className = "tarea-id";
  id.textContent = `#${tarea.id}`;

  const texto = document.createElement("span");
  texto.className = `tarea-texto${tarea.estado === "completada" ? " completada" : ""}`;
  texto.textContent = tarea.tarea;

  const estado = document.createElement("span");
  estado.className = `badge ${tarea.estado}`;
  estado.textContent = ETIQUETAS_ESTADO[tarea.estado] ?? tarea.estado;

  const acciones = document.createElement("div");
  acciones.className = "tarea-acciones";

  const btnEditar = document.createElement("button");
  btnEditar.className = "btn-editar";
  btnEditar.textContent = "Editar";
  btnEditar.addEventListener("click", () => activarEdicion(li, tarea));

  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn-eliminar";
  btnEliminar.textContent = "Eliminar";
  btnEliminar.addEventListener("click", () => eliminarTarea(tarea.id));

  acciones.append(btnEditar, btnEliminar);
  li.append(id, texto, estado, acciones);

  return li;
}

function activarEdicion(li, tarea) {
  li.innerHTML = "";

  const id = document.createElement("span");
  id.className = "tarea-id";
  id.textContent = `#${tarea.id}`;

  const inputTexto = document.createElement("input");
  inputTexto.type = "text";
  inputTexto.value = tarea.tarea;

  const selectEstado = document.createElement("select");
  Object.entries(ETIQUETAS_ESTADO).forEach(([valor, etiqueta]) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = etiqueta;
    if (valor === tarea.estado) opcion.selected = true;
    selectEstado.appendChild(opcion);
  });

  const acciones = document.createElement("div");
  acciones.className = "tarea-acciones";

  const btnGuardar = document.createElement("button");
  btnGuardar.className = "btn-guardar";
  btnGuardar.textContent = "Guardar";
  btnGuardar.addEventListener("click", () =>
    actualizarTarea(tarea.id, inputTexto.value, selectEstado.value)
  );

  const btnCancelar = document.createElement("button");
  btnCancelar.className = "btn-cancelar";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.addEventListener("click", cargarTareas);

  acciones.append(btnGuardar, btnCancelar);
  li.append(id, inputTexto, selectEstado, acciones);
}

async function crearTarea(tarea, estado) {
  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarea, estado }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "Error al crear la tarea");
    mostrarMensaje("Tarea agregada correctamente", "exito");
    cargarTareas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function actualizarTarea(id, tarea, estado) {
  if (!tarea.trim()) {
    mostrarMensaje("La tarea no puede estar vacía", "error");
    return;
  }
  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarea, estado }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "Error al actualizar la tarea");
    mostrarMensaje("Tarea actualizada correctamente", "exito");
    cargarTareas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function eliminarTarea(id) {
  if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
  try {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "Error al eliminar la tarea");
    mostrarMensaje("Tarea eliminada correctamente", "exito");
    cargarTareas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const tarea = inputTarea.value.trim();
  const estado = inputEstado.value;
  if (!tarea) return;
  crearTarea(tarea, estado);
  form.reset();
  inputEstado.value = "pendiente";
});

cargarTareas();

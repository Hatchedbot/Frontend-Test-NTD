const ES_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Reemplaza esta URL por la de tu backend una vez desplegado en Render.
const API_URL = ES_LOCAL
  ? "http://127.0.0.1:5000/tareas"
  : "https://TU-BACKEND.onrender.com/tareas";

const ESTADOS = ["pendiente", "en_progreso", "completada"];
const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

const mensaje = document.getElementById("mensaje");
const resumen = document.getElementById("resumen");

let arrastrandoId = null;
let mensajeTimeoutId = null;

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  if (mensajeTimeoutId) clearTimeout(mensajeTimeoutId);
  mensajeTimeoutId = setTimeout(() => {
    mensaje.className = "mensaje oculto";
  }, 3000);
}

async function cargarTareas() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("No se pudieron cargar las tareas");
    const tareas = await respuesta.json();
    renderizarTablero(tareas);
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

function renderizarTablero(tareas) {
  const completadas = tareas.filter((t) => t.estado === "completada").length;
  resumen.textContent = `${completadas} de ${tareas.length} completadas`;

  ESTADOS.forEach((estado) => {
    const lista = document.getElementById(`lista-${estado}`);
    const contador = document.getElementById(`contador-${estado}`);
    const tareasEstado = tareas.filter((t) => t.estado === estado);

    contador.textContent = tareasEstado.length;
    lista.innerHTML = "";

    if (tareasEstado.length === 0) {
      const vacio = document.createElement("li");
      vacio.className = "vacio-columna";
      vacio.textContent = "Sin tareas";
      lista.appendChild(vacio);
    } else {
      tareasEstado.forEach((tarea) => lista.appendChild(crearTarjeta(tarea)));
    }
  });
}

function crearTarjeta(tarea) {
  const li = document.createElement("li");
  li.className = "tarjeta";
  li.draggable = true;
  li.dataset.id = tarea.id;

  li.addEventListener("dragstart", () => {
    arrastrandoId = tarea.id;
    requestAnimationFrame(() => li.classList.add("arrastrando"));
  });
  li.addEventListener("dragend", () => {
    li.classList.remove("arrastrando");
    arrastrandoId = null;
  });

  const id = document.createElement("span");
  id.className = "tarjeta-id";
  id.textContent = `#${tarea.id}`;

  const texto = document.createElement("p");
  texto.className = "tarjeta-texto";
  texto.textContent = tarea.tarea;

  const pie = document.createElement("div");
  pie.className = "tarjeta-pie";

  const mover = document.createElement("select");
  mover.className = "tarjeta-mover";
  mover.setAttribute("aria-label", "Mover tarea a otro estado");
  ESTADOS.forEach((valor) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = ETIQUETAS_ESTADO[valor];
    if (valor === tarea.estado) opcion.selected = true;
    mover.appendChild(opcion);
  });
  mover.addEventListener("change", () => moverTarea(tarea.id, mover.value));

  const acciones = document.createElement("div");
  acciones.className = "tarjeta-acciones";

  const btnEditar = document.createElement("button");
  btnEditar.type = "button";
  btnEditar.className = "btn-icono";
  btnEditar.textContent = "Editar";
  btnEditar.addEventListener("click", () => activarEdicion(li, tarea));

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "btn-icono btn-icono-peligro";
  btnEliminar.textContent = "Eliminar";
  btnEliminar.addEventListener("click", () => eliminarTarea(tarea.id));

  acciones.append(btnEditar, btnEliminar);
  pie.append(mover, acciones);
  li.append(id, texto, pie);

  return li;
}

function activarEdicion(li, tarea) {
  li.innerHTML = "";
  li.draggable = false;

  const inputTexto = document.createElement("textarea");
  inputTexto.className = "tarjeta-input";
  inputTexto.rows = 2;
  inputTexto.value = tarea.tarea;

  const acciones = document.createElement("div");
  acciones.className = "tarjeta-acciones";
  acciones.style.opacity = "1";
  acciones.style.marginTop = "6px";

  const btnGuardar = document.createElement("button");
  btnGuardar.type = "button";
  btnGuardar.className = "btn-icono btn-icono-exito";
  btnGuardar.textContent = "Guardar";
  btnGuardar.addEventListener("click", () => actualizarTarea(tarea.id, inputTexto.value, tarea.estado));

  const btnCancelar = document.createElement("button");
  btnCancelar.type = "button";
  btnCancelar.className = "btn-icono";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.addEventListener("click", cargarTareas);

  acciones.append(btnGuardar, btnCancelar);
  li.append(inputTexto, acciones);

  inputTexto.focus();
  inputTexto.setSelectionRange(inputTexto.value.length, inputTexto.value.length);
  inputTexto.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      actualizarTarea(tarea.id, inputTexto.value, tarea.estado);
    }
    if (evento.key === "Escape") cargarTareas();
  });
}

function abrirFormularioNuevo(estado) {
  cerrarFormularioNuevo();

  const lista = document.getElementById(`lista-${estado}`);
  const vacio = lista.querySelector(".vacio-columna");
  if (vacio) vacio.remove();

  const li = document.createElement("li");
  li.className = "tarjeta tarjeta-nueva";
  li.id = "form-nueva-tarjeta";

  const textarea = document.createElement("textarea");
  textarea.className = "tarjeta-input";
  textarea.rows = 2;
  textarea.placeholder = "Título de la tarea";

  const acciones = document.createElement("div");
  acciones.className = "tarjeta-acciones";
  acciones.style.opacity = "1";
  acciones.style.marginTop = "6px";

  const btnGuardar = document.createElement("button");
  btnGuardar.type = "button";
  btnGuardar.className = "btn-icono btn-icono-exito";
  btnGuardar.textContent = "Agregar";
  btnGuardar.addEventListener("click", () => confirmarNuevaTarjeta(estado, textarea.value));

  const btnCancelar = document.createElement("button");
  btnCancelar.type = "button";
  btnCancelar.className = "btn-icono";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.addEventListener("click", cerrarFormularioNuevo);

  acciones.append(btnGuardar, btnCancelar);
  li.append(textarea, acciones);
  lista.appendChild(li);

  textarea.focus();
  textarea.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      confirmarNuevaTarjeta(estado, textarea.value);
    }
    if (evento.key === "Escape") cerrarFormularioNuevo();
  });
}

function cerrarFormularioNuevo() {
  const existente = document.getElementById("form-nueva-tarjeta");
  if (existente) existente.remove();
}

async function confirmarNuevaTarjeta(estado, texto) {
  if (!texto.trim()) {
    mostrarMensaje("La tarea no puede estar vacía", "error");
    return;
  }
  await crearTarea(texto.trim(), estado);
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
    mostrarMensaje("Tarea agregada", "exito");
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
    mostrarMensaje("Tarea actualizada", "exito");
    cargarTareas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function moverTarea(id, estadoNuevo) {
  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: estadoNuevo }),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "Error al mover la tarea");
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
    mostrarMensaje("Tarea eliminada", "exito");
    cargarTareas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

document.querySelectorAll(".btn-agregar").forEach((boton) => {
  boton.addEventListener("click", () => abrirFormularioNuevo(boton.dataset.estado));
});

document.querySelectorAll(".columna").forEach((columna) => {
  const estado = columna.dataset.estado;

  columna.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    columna.classList.add("sobre-arrastre");
  });

  columna.addEventListener("dragleave", (evento) => {
    if (!columna.contains(evento.relatedTarget)) {
      columna.classList.remove("sobre-arrastre");
    }
  });

  columna.addEventListener("drop", (evento) => {
    evento.preventDefault();
    columna.classList.remove("sobre-arrastre");
    if (arrastrandoId !== null) moverTarea(arrastrandoId, estado);
  });
});

cargarTareas();

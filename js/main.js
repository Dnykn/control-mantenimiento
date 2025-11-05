// Importamos TODAS las herramientas de Firebase que usaremos
import { checkAuthState } from './auth.js';
import { authGuard, setupLogoutButton } from './auth.js';
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db } from './firebase.js';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper: tiempo relativo simple
function timeAgo(date) {
  const now = Date.now();
  const diff = Math.floor((now - date) / 1000); // segundos
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

// --- FUNCIÓN PARA CARGAR MÁQUINAS (index.html) ---
async function cargarMaquinas() {
  const tablaMaquinas = document.getElementById("tablaMaquinas");
  if (!tablaMaquinas) return;

  try {
    const maquinasCollection = collection(db, "maquinas");
    const querySnapshot = await getDocs(maquinasCollection);
    
    tablaMaquinas.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      // Normalizamos el estado para decidir color y jerarquía visual
      const estado = (data.estado || 'Desconocido').toString();
      const estadoLower = estado.toLowerCase();

      // Determinar clase de badge y estilo de fila según el estado
      let badgeClass = 'bg-secondary';
      let rowStyle = ''; // puede usarse para opacidad o destaque
      if (estadoLower.includes('operativ')) {
        badgeClass = 'bg-success';
        rowStyle = 'opacity:0.85;'; // operativas menos prominentes
      } else if (estadoLower.includes('revisión') || estadoLower.includes('revision') || estadoLower.includes('mantenimiento')) {
        badgeClass = 'bg-warning text-dark';
        rowStyle = 'opacity:1;'; // atención necesaria
      } else if (estadoLower.includes('fuera') || estadoLower.includes('inoper') || estadoLower.includes('fuera de servicio')) {
        badgeClass = 'bg-danger';
        rowStyle = 'opacity:1;font-weight:600;'; // destacar fuertemente
      }

      // Formatear fecha si existe
      let ultimaRevision = '-';
      if (data.fecha && data.fecha.toDate) {
        try {
          const d = data.fecha.toDate();
          ultimaRevision = timeAgo(d.getTime()); // usa tiempo relativo
        } catch (e) {
          ultimaRevision = String(data.fecha);
        }
      } else if (data.fecha) {
        ultimaRevision = String(data.fecha);
      }

      // Construimos la fila con la insignia de estado y botón copiar id
      const tr = document.createElement('tr');
      tr.setAttribute('style', rowStyle);

      tr.innerHTML = `
        <td data-label="Código">${data.codigo || id}</td>
        <td data-label="Nombre">${data.nombre || '-'}</td>
        <td data-label="Estado">
          <span class="badge ${badgeClass}" data-bs-toggle="tooltip" title="${estado}">${estado}</span>
        </td>
        <td data-label="Última Revisión">${ultimaRevision}</td>
        <td data-label="Técnico">${data.tecnico || '-'}</td>
        <td data-label="Acciones">
          <a href="maquina.html?id=${id}" class="btn btn-sm btn-info">
            <i class="fa-solid fa-eye me-1"></i> Ver
          </a>
          <button type="button" class="btn btn-sm btn-outline-light btn-copy ms-1" data-id="${id}" data-bs-toggle="tooltip" title="Copiar ID">
            <i class="fa-regular fa-copy"></i>
          </button>
        </td>
      `;
      tablaMaquinas.appendChild(tr);

    });

    // Inicializar tooltips de Bootstrap para los nuevos elementos
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Listener: copiar ID y mostrar toast
    const copyBtns = tablaMaquinas.querySelectorAll('.btn-copy');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idToCopy = btn.getAttribute('data-id');
        try {
          await navigator.clipboard.writeText(idToCopy);
          // mostrar toast simple (usa el toast en index.html)
          const toastEl = document.getElementById('copy-toast');
          if (toastEl) {
            toastEl.querySelector('.toast-body').textContent = `ID ${idToCopy} copiado`;
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
          }
        } catch (err) {
          console.error('No se pudo copiar ID:', err);
        }
      });
    });

  } catch (error) {
    console.error("Error cargando máquinas:", error);
    tablaMaquinas.innerHTML = `<tr><td colspan="6">Error al cargar las máquinas.</td></tr>`;
  }
}

// --- FUNCIÓN PARA CARGAR DETALLES DE MÁQUINA (maquina.html) ---
async function cargarDetalleMaquina(idMaquina) {
  const detalleContainer = document.getElementById("detalle-maquina");
  if (!detalleContainer) return;

  try {
    const maquinaRef = doc(db, "maquinas", idMaquina);
    const docSnap = await getDoc(maquinaRef);

    if (docSnap.exists()) {
      const maquina = docSnap.data();
      document.getElementById('nombre-maquina').textContent = maquina.nombre || 'N/A';
      document.getElementById('id-maquina').textContent = idMaquina;
      document.getElementById('estado-maquina').textContent = maquina.estado || 'N/A';
      
      let fechaFormateada = maquina.fecha?.toDate().toLocaleDateString() || 'N/A';
      document.getElementById('fecha-mantenimiento').textContent = fechaFormateada;
      document.getElementById('tecnico-asignado').textContent = maquina.tecnico || 'N/A';
      
      const badgeEstado = document.getElementById('estado-maquina');
      badgeEstado.className = 'badge';
      switch (maquina.estado) {
        case 'Operativo': badgeEstado.classList.add('bg-success'); break;
        case 'En Revisión': badgeEstado.classList.add('bg-warning', 'text-dark'); break;
        case 'Fuera de Servicio': badgeEstado.classList.add('bg-danger'); break;
        default: badgeEstado.classList.add('bg-secondary');
      }
    } else {
      detalleContainer.innerHTML = `<h1>Error: Máquina no encontrada.</h1>`;
    }
  } catch (error) {
    console.error("Error al cargar detalles: ", error);
    detalleContainer.innerHTML = `<h1>Error al cargar la información.</h1>`;
  }
}

// --- NUEVA FUNCIÓN PARA CARGAR EL HISTORIAL (maquina.html) ---
async function cargarHistorial(idMaquina) {
  const historialLista = document.getElementById("historial-lista");
  if (!historialLista) return;

  try {
    // Apuntamos a la subcolección 'historial' y la ordenamos por fecha descendente
    const historialRef = collection(db, "maquinas", idMaquina, "historial");
    const q = query(historialRef, orderBy("fecha", "desc"));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      historialLista.innerHTML = `<li class="list-group-item">No hay registros de mantenimiento.</li>`;
      return;
    }

    historialLista.innerHTML = ""; // Limpiamos la lista
    querySnapshot.forEach((doc) => {
      const registro = doc.data();
      const fecha = registro.fecha?.toDate().toLocaleString() || 'Fecha no disponible';

      const item = `
        <li class="list-group-item">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">Estado: ${registro.estado}</h6>
            <small>${fecha}</small>
          </div>
          <p class="mb-1">${registro.descripcion}</p>
          <small>Técnico: ${registro.tecnico}</small>
        </li>
      `;
      historialLista.innerHTML += item;
    });

  } catch (error) {
    console.error("Error al cargar el historial: ", error);
    historialLista.innerHTML = `<li class="list-group-item">Error al cargar el historial.</li>`;
  }
}


// --- FUNCIÓN PARA MANEJAR EL FORMULARIO ---
function configurarFormularioMantenimiento(idMaquina) {
  const form = document.getElementById("form-nuevo-mantenimiento");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const boton = form.querySelector("button");
    boton.disabled = true;
    boton.textContent = 'Guardando...';

    try {
      // --- INICIO DEL CAMBIO ---

      // 1. Obtenemos el usuario actual que ha iniciado sesión.
      const auth = getAuth();
      const user = auth.currentUser;

      // Si por alguna razón no hay usuario, detenemos todo.
      if (!user) {
        throw new Error("No hay sesión de usuario activa para guardar.");
      }

      // 2. Usamos el UID del usuario para buscar su perfil en Firestore.
      const tecnicoRef = doc(db, "tecnicos", user.uid);
      const docSnap = await getDoc(tecnicoRef);

      // Si no encontramos un perfil, detenemos todo.
      if (!docSnap.exists()) {
        throw new Error("No se encontró el perfil del técnico en la base de datos.");
      }
      
      // 3. ¡Aquí está! Sacamos el nombre del perfil.
      const perfilTecnico = docSnap.data();
      const nombreDelTecnico = perfilTecnico.Nombre;

      // --- FIN DEL CAMBIO ---

      // Usamos el nombre que acabamos de obtener.
      const nuevoMantenimiento = {
        estado: document.getElementById("nuevo-estado").value,
        descripcion: document.getElementById("descripcion-mantenimiento").value,
        tecnico: nombreDelTecnico, // ¡Automático!
        fecha: serverTimestamp()
      };
      
      const historialRef = collection(db, "maquinas", idMaquina, "historial");
      await addDoc( historialRef, nuevoMantenimiento);

      const datosActualizados = {
        estado: nuevoMantenimiento.estado,
        tecnico: nombreDelTecnico, // ¡Automático!
        fecha: serverTimestamp()
      };
      
      const maquinaRef = doc(db, "maquinas", idMaquina);
      await updateDoc(maquinaRef, datosActualizados);

      alert("¡Mantenimiento registrado con éxito!");
      window.location.reload();

    } catch (error) {
      console.error("Error al guardar el mantenimiento:", error);
      alert("Hubo un error al guardar: " + error.message);
      boton.disabled = false;
      boton.textContent = 'Guardar Registro';
    }
  });
}

// --- PUNTO DE ENTRADA PRINCIPAL (mínimo cambio) ---
document.addEventListener("DOMContentLoaded", () => {

  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = "login.html";
      }
      return;
    }

    // Actualizar navbar con el nombre del técnico (si existe)
    try {
      const tecnicoRef = doc(db, "tecnicos", user.uid);
      const docSnap = await getDoc(tecnicoRef);
      if (docSnap.exists()) {
        const perfilTecnico = docSnap.data();
        const navbarUserName = document.getElementById('navbar-user-name');
        if (navbarUserName) {
          navbarUserName.textContent = perfilTecnico.Nombre || user.email || 'Usuario';
        }
      } else {
        const navbarUserName = document.getElementById('navbar-user-name');
        if (navbarUserName) navbarUserName.textContent = user.email || 'Usuario';
      }
    } catch (error) {
      console.error("Error al cargar perfil para navbar:", error);
      const navbarUserName = document.getElementById('navbar-user-name');
      if (navbarUserName) navbarUserName.textContent = user.email || 'Usuario';
    }

    // Hacer funcional el botón de cerrar sesión (sin depender de auth.js)
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await signOut(getAuth());
          window.location.href = "login.html";
        } catch (err) {
          console.error("Error al cerrar sesión:", err);
        }
      });
    }

    // Lógica de carga de página (igual que antes)
    const urlParams = new URLSearchParams(window.location.search);
    const idMaquina = urlParams.get('id');

    if (idMaquina) {
      cargarDetalleMaquina(idMaquina);
      cargarHistorial(idMaquina);
      configurarFormularioMantenimiento(idMaquina);
    } else {
      cargarMaquinas();
    }
  });
});
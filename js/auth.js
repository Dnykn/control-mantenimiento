
import { app } from './firebase.js';

import { getAuth, signInWithEmailAndPassword,  onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

 
  
  // Obtenemos la instancia del servicio de Autenticación
  const auth = getAuth(app);
  
  // "Capturamos" el formulario de login y el div para mensajes de error
  const loginForm = document.getElementById("login-form");
  const errorMessageDiv = document.getElementById("error-message");
   const urlParams = new URLSearchParams(window.location.search);

  // Si no encontramos el formulario en la página, no hacemos nada más
  if (!loginForm) return;

  // Añadimos un "escuchador" para el evento 'submit' del formulario
  loginForm.addEventListener("submit", async (event) => {
    // Prevenimos el comportamiento por defecto del formulario (que es recargar la página)
    event.preventDefault();

    // Ocultamos cualquier mensaje de error previo
    errorMessageDiv.classList.add("d-none");

    // Obtenemos los valores de los campos de email y contraseña
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // 1. Intentamos iniciar sesión con la función de Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Si llegamos aquí, el inicio de sesión fue exitoso
      console.log("Inicio de sesión exitoso:", userCredential.user);
      
      // 2. Redirigimos al usuario al panel principal
      window.location.href = "index.html";

    } catch (error) {
      // Si Firebase devuelve un error, lo capturamos aquí
      console.error("Error en el inicio de sesión:", error.code);
      
      let mensaje = "Ocurrió un error inesperado.";
      // 3. Traducimos los códigos de error de Firebase a mensajes amigables
      switch (error.code) {
        case "auth/user-not-found":
          mensaje = "El correo electrónico no está registrado.";
          break;
        case "auth/wrong-password":
          mensaje = "La contraseña es incorrecta.";
          break;
        case "auth/invalid-email":
          mensaje = "El formato del correo electrónico es inválido.";
          break;
        default:
          mensaje = "Error al intentar iniciar sesión. Revisa tus credenciales.";
      }
      
      // 4. Mostramos el mensaje de error en la página
      errorMessageDiv.textContent = mensaje;
      errorMessageDiv.classList.remove("d-none");
    }
  });
});
// --- NUEVA FUNCIÓN: EL GUARDIÁN DE RUTAS ---
export function checkAuthState() {
  const auth = getAuth();
  
  onAuthStateChanged(auth, (user) => {
    // Si NO hay un usuario con sesión iniciada
    if (!user) {
      // Y NO estamos ya en la página de login
      if (window.location.pathname.endsWith('login.html') === false) {
        console.log("Usuario no autenticado. Redirigiendo al login...");
        // Lo redirigimos a la página de login
        window.location.href = "login.html";
      }
    } else {
      // Si SÍ hay un usuario con sesión iniciada
      console.log("Usuario autenticado:", user.email);
    }
  });
}
export const authGuard = (callback) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = "login.html";
      }
    }
  });
};

export const setupLogoutButton = () => {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }
};
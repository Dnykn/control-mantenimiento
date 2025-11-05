// Importa las funciones que necesitas de los SDKs que necesitas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyDSez8osmzOqCeppq3CnsXdByGR2yt6G7Y",
 authDomain: "control-mantenimiento-app.firebaseapp.com",
 projectId: "control-mantenimiento-app",
 storageBucket: "control-mantenimiento-app.firebasestorage.app",
 messagingSenderId: "965100785397",
 appId: "1:965100785397:web:1e34a523c2b7dc17687fbc"
};


// Inicializa Firebase con tu configuración
export const app = initializeApp(firebaseConfig);

// Exporta la instancia de la base de datos Firestore para que
// podamos usarla en otros archivos (como en main.js)
export const db = getFirestore(app);
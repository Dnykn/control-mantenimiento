// Importa las funciones que necesitas de los SDKs que necesitas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "Tu clave de firebase",
 authDomain: "",
 projectId: "",
 storageBucket: "",
 messagingSenderId: "",
 appId: ""
};


// Inicializa Firebase con tu configuración
export const app = initializeApp(firebaseConfig);

// Exporta la instancia de la base de datos Firestore para que
// podamos usarla en otros archivos (como en main.js)
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCwLwrV3yJ4xRt8dw5BPX7ufYnn19Hx71A",
  authDomain: "homifi-bac92.firebaseapp.com",
  projectId: "homifi-bac92",
  storageBucket: "homifi-bac92.firebasestorage.app",
  messagingSenderId: "876737044340",
  appId: "1:876737044340:web:07d098db6f17f9c80bd621",
  measurementId: "G-M3L18TRTWF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

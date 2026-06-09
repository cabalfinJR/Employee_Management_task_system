import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBicp0QYhwfTZGiIPIXaD8Fzgs4vFHc4N8",
  authDomain: "employee-task-system-web.firebaseapp.com",
  projectId: "employee-task-system-web",
  storageBucket: "employee-task-system-web.firebasestorage.app",
  messagingSenderId: "206113180368",
  appId: "1:206113180368:web:5dbe3328fd6756f41eacd5"
};

const app = initializeApp(firebaseConfig);

export { app };

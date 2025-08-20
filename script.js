// ============================
// 🔥 Firebase Setup
// ============================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserId = null;

// ============================
// 🌙 Dark Mode Toggle
// ============================
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// ============================
// 📌 Navbar Active State
// ============================
function setActive(el) {
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  el.classList.add("active");
}

// ============================
// 🗣️ Text-to-Speech
// ============================
function speakById(id) {
  let text = document.getElementById(id).innerText;
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-US";

  // Optional: let reader pick a voice
  let voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    utterance.voice = voices.find(v => v.name.includes("Google")) || voices[0];
  }

  speechSynthesis.speak(utterance);
}

// ============================
// 📝 Post a Story
// ============================
async function postStory() {
  const storyText = document.getElementById("storyInput").value;
  if (!storyText.trim()) return alert("Write something before publishing!");

  if (!currentUserId) return alert("Please login first to post.");

  await db.collection("stories").add({
    text: storyText,
    user: currentUserId,
    createdAt: Date.now()
  });

  document.getElementById("storyInput").value = "";
  loadStories();
}

// ============================
// 📂 Load Stories
// ============================
async function loadStories() {
  const container = document.getElementById("postedStories");
  container.innerHTML = "";

  const snapshot = await db.collection("stories").orderBy("createdAt", "desc").get();
  snapshot.forEach(doc => {
    let data = doc.data();
    let div = document.createElement("div");
    div.classList.add("story-box");
    div.innerHTML = `
      <p>${data.text}</p>
      <button onclick="deleteStory('${doc.id}')">🗑 Delete</button>
    `;
    container.appendChild(div);
  });
}

// ============================
// ❌ Delete Story
// ============================
async function deleteStory(id) {
  if (confirm("Are you sure you want to delete this story?")) {
    await db.collection("stories").doc(id).delete();
    loadStories();
  }
}

// ============================
// 👤 Firebase Auth
// ============================
async function signupEmail(email, password) {
  await auth.createUserWithEmailAndPassword(email, password);
}
async function loginEmail(email, password) {
  await auth.signInWithEmailAndPassword(email, password);
}
async function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
}
function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    document.getElementById("authStatus").innerText = `Logged in as ${user.email}`;
    loadStories();
  } else {
    currentUserId = null;
    document.getElementById("authStatus").innerText = "Not logged in.";
    document.getElementById("postedStories").innerHTML = "";
  }
});

// ============================
// 📱 PWA Install Button
// ============================
let deferredPrompt;
const installBtn = document.createElement("button");
installBtn.textContent = "📲 Install App";
installBtn.classList.add("install-btn");
installBtn.style.display = "none";
document.body.appendChild(installBtn);

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  installBtn.style.display = "none";
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

/***********************
 * Quinme Stories – main script
 * Keep your index.html unchanged.
 ***********************/

/* ------------------ CONFIG ------------------ */
const CONFIG = {
  // Fill these from Firebase Console: Project settings ➜ General ➜ Your apps ➜ Web app
  const firebaseConfig = {
  apiKey: "AIzaSyARK1Ry3njEAK7mSWq6PX-hhStepGy...",
  authDomain: "mystoryapp-c7c76.firebaseapp.com",
  projectId: "mystoryapp-c7c76",
  storageBucket: "mystoryapp-c7c76.appspot.com",
  messagingSenderId: "208809550277",
  appId: "1:208809550277:web:77de6ce70e3e04203aabac"
};

  // Optional: hook for AI TTS providers (disabled by default).
  // Leave enabled:false to use the built-in browser voices.
  aiTts: {
    enabled: false,
    provider: "custom",          // just a label
    endpoint: "",                // e.g. your Cloud Function/Server endpoint
    apiKey: "",                  // your API key if needed
    voiceId: ""                  // provider specific
  }
};

/* --------------- THEME TOGGLE --------------- */
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

/* --------------- NAV ACTIVE STATE ----------- */
function setActive(el) {
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  el.classList.add("active");
}

/* --------------- PWA: INSTALL BUTTON -------- */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement("button");
  btn.className = "install-btn";
  btn.textContent = "📲 Install App";
  document.body.appendChild(btn);
  btn.addEventListener("click", async () => {
    btn.remove();
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});

/* --------------- SERVICE WORKER ------------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" })
    .then(() => console.log("Service Worker registered"))
    .catch(console.warn);
}

/* --------------- VOICE (TTS) ---------------- */
let voices = [];
function ensureVoiceUI() {
  // Insert a small voice selector under the Stories section without changing your HTML
  const storiesSection = document.getElementById("stories");
  if (!storiesSection || document.getElementById("voiceSelect")) return;

  const label = document.createElement("label");
  label.setAttribute("for", "voiceSelect");
  label.textContent = "🎤 Choose Voice: ";
  label.style.display = "inline-block";
  label.style.marginTop = "10px";

  const select = document.createElement("select");
  select.id = "voiceSelect";
  select.style.marginLeft = "6px";

  const container = document.createElement("div");
  container.appendChild(label);
  container.appendChild(select);
  storiesSection.insertBefore(container, storiesSection.querySelector("#postedStories"));
}

function loadVoices() {
  voices = speechSynthesis.getVoices();
  ensureVoiceUI();
  const voiceSelect = document.getElementById("voiceSelect");
  if (!voiceSelect) return;
  voiceSelect.innerHTML = "";
  voices.forEach((voice, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${voice.name} ${voice.lang}${voice.default ? " (default)" : ""}`;
    voiceSelect.appendChild(opt);
  });
}
speechSynthesis.onvoiceschanged = loadVoices;

async function speak(text) {
  // If AI TTS is configured (optional), try it first
  if (CONFIG.aiTts.enabled && CONFIG.aiTts.endpoint) {
    try {
      const res = await fetch(CONFIG.aiTts.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(CONFIG.aiTts.apiKey ? { "Authorization": `Bearer ${CONFIG.aiTts.apiKey}` } : {})
        },
        body: JSON.stringify({
          text,
          voiceId: CONFIG.aiTts.voiceId
        })
      });
      if (!res.ok) throw new Error("AI TTS request failed");
      const blob = await res.blob(); // expecting audio/mpeg
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      return;
    } catch (e) {
      console.warn("AI TTS failed, falling back to device voice.", e);
    }
  }

  // Fallback: browser device voices
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  const voiceSelect = document.getElementById("voiceSelect");
  if (voices.length && voiceSelect && voiceSelect.value !== "") {
    utter.voice = voices[Number(voiceSelect.value)];
  }
  speechSynthesis.speak(utter);
}
function speakById(id) {
  const el = document.getElementById(id);
  if (!el) return;
  speak(el.textContent || el.innerText || "");
}

/* --------------- FIREBASE ------------------- */
// Load Firebase (compat scripts already included in index.html)
firebase.initializeApp(CONFIG.firebase);
const auth = firebase.auth();
const db = firebase.firestore();

// offline persistence
db.enablePersistence().catch(err => {
  // multi-tab or unsupported
  console.warn("Persistence not enabled:", err.code);
});

/* --------------- AUTH UI (injected) --------- */
let currentUser = null;

function injectAuthBar() {
  const writeSection = document.getElementById("write");
  if (!writeSection || document.getElementById("authBar")) return;

  const bar = document.createElement("div");
  bar.id = "authBar";
  bar.style.marginBottom = "10px";

  const signUp = document.createElement("button");
  signUp.textContent = "Sign Up (Email)";
  signUp.addEventListener("click", signupEmail);

  const logIn = document.createElement("button");
  logIn.textContent = "Log In (Email)";
  logIn.style.marginLeft = "8px";
  logIn.addEventListener("click", loginEmail);

  const gBtn = document.createElement("button");
  gBtn.textContent = "Google Login";
  gBtn.style.marginLeft = "8px";
  gBtn.addEventListener("click", googleLogin);

  const logOut = document.createElement("button");
  logOut.textContent = "Log Out";
  logOut.className = "delete-btn";
  logOut.style.marginLeft = "8px";
  logOut.addEventListener("click", logout);

  bar.append(signUp, logIn, gBtn, logOut);
  writeSection.insertBefore(bar, writeSection.firstChild);
}

async function signupEmail() {
  const email = prompt("Enter email:");
  if (!email) return;
  const pass = prompt("Enter password (min 6 chars):");
  if (!pass) return;
  await auth.createUserWithEmailAndPassword(email, pass);
  alert("Account created. You’re signed in.");
}

async function loginEmail() {
  const email = prompt("Enter email:");
  if (!email) return;
  const pass = prompt("Enter password:");
  if (!pass) return;
  await auth.signInWithEmailAndPassword(email, pass);
  alert("Logged in.");
}

async function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;
  const status = document.getElementById("authStatus");
  if (currentUser) {
    status.textContent = `Signed in as: ${currentUser.email || "Anonymous"} ✓`;
  } else {
    status.textContent = "Not signed in — using anonymous mode.";
  }

  // If totally signed out, sign in anonymously so device can still post/like (optional)
  if (!currentUser) {
    try {
      await auth.signInAnonymously();
    } catch (e) {
      console.warn("Anonymous sign-in failed:", e);
    }
  }
});

/* --------------- STORIES CRUD + LIKES ------- */
async function postStory() {
  const input = document.getElementById("storyInput");
  const text = (input.value || "").trim();
  if (!text) return alert("Please write something before publishing.");
  if (!auth.currentUser) return alert("Sign in failed. Try again.");

  await db.collection("stories").add({
    text,
    authorId: auth.currentUser.uid,
    authorName: auth.currentUser.displayName || auth.currentUser.email || "Anonymous",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
}

function renderStory(doc, mine) {
  const data = doc.data();

  const div = document.createElement("div");
  div.className = "story-box";

  const title = document.createElement("h3");
  const ts = data.createdAt?.toDate?.()?.toLocaleString?.() || "…";
  title.textContent = `${data.authorName || "Unknown"} • ${ts}${mine ? " (you)" : ""}`;

  const p = document.createElement("p");
  p.textContent = data.text;

  const listen = document.createElement("button");
  listen.textContent = "🔊 Listen";
  listen.addEventListener("click", () => speak(data.text));

  // Likes
  const likeWrap = document.createElement("span");
  likeWrap.style.marginLeft = "10px";
  const likeBtn = document.createElement("button");
  likeBtn.textContent = "👍 Like";
  likeBtn.style.marginLeft = "8px";
  const likeCount = document.createElement("span");
  likeCount.className = "muted";
  likeCount.style.marginLeft = "6px";

  // Observe likes
  db.collection("stories").doc(doc.id).collection("likes")
    .onSnapshot(s => {
      likeCount.textContent = `(${s.size})`;
    });

  likeBtn.addEventListener("click", async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Please sign in.");
    const likeRef = db.collection("stories").doc(doc.id).collection("likes").doc(uid);
    const snap = await likeRef.get();
    if (snap.exists) {
      await likeRef.delete();     // unlike
    } else {
      await likeRef.set({ at: firebase.firestore.FieldValue.serverTimestamp() });
    }
  });

  likeWrap.appendChild(likeBtn);
  likeWrap.appendChild(likeCount);

  div.append(title, p, listen, likeWrap);

  // Edit/Delete (owner only)
  if (mine) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Edit";
    editBtn.style.marginLeft = "8px";
    editBtn.addEventListener("click", async () => {
      const newText = prompt("Edit your story:", data.text);
      if (newText === null) return;
      await db.collection("stories").doc(doc.id).update({
        text: newText.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "❌ Delete";
    delBtn.style.marginLeft = "8px";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this story?")) return;
      await db.collection("stories").doc(doc.id).delete();
    });

    div.append(editBtn, delBtn);
  }

  return div;
}

function setupRealtime() {
  const container = document.getElementById("postedStories");
  db.collection("stories").orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      container.innerHTML = "";
      snap.forEach((doc) => {
        const data = doc.data();
        const mine = auth.currentUser && data.authorId === auth.currentUser.uid;
        const card = renderStory(doc, !!mine);
        container.appendChild(card);
      });
    });
}

/* --------------- INIT ----------------------- */
window.addEventListener("load", () => {
  // theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  // voice UI & list
  ensureVoiceUI();
  loadVoices();
  // auth bar (buttons)
  injectAuthBar();
  // realtime feed
  setupRealtime();
});

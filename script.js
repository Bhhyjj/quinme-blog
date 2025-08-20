// Import Firebase SDK modules (v9+ modular syntax)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut }
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs }
  from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// ✅ Your Firebase config (copy from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSy4R1kY3njEAK7mSWq6PX-hhSTepGy1PAQ",
  authDomain: "mystoryapp-c7c76.firebaseapp.com",
  projectId: "mystoryapp-c7c76",
  storageBucket: "mystoryapp-c7c76.appspot.com",
  messagingSenderId: "208809550277",
  appId: "1:208809550277:web:77de6ce70e3e04203aabac"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Example: Sign up a user
async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ User signed up:", userCredential.user);
  } catch (error) {
    console.error("❌ Signup error:", error.message);
  }
}

// 🔹 Example: Login a user
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ User logged in:", userCredential.user);
  } catch (error) {
    console.error("❌ Login error:", error.message);
  }
}

// 🔹 Example: Logout
async function logout() {
  try {
    await signOut(auth);
    console.log("✅ User signed out");
  } catch (error) {
    console.error("❌ Logout error:", error.message);
  }
}

// 🔹 Example: Save a story
async function saveStory(title, content) {
  try {
    const docRef = await addDoc(collection(db, "stories"), {
      title: title,
      content: content,
      timestamp: new Date()
    });
    console.log("✅ Story saved with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Error saving story:", error.message);
  }
}

// 🔹 Example: Fetch all stories
async function getStories() {
  try {
    const querySnapshot = await getDocs(collection(db, "stories"));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
  } catch (error) {
    console.error("❌ Error fetching stories:", error.message);
  }
}

// Example calls (delete later, just for test)
// signup("test@example.com", "mypassword");
// login("test@example.com", "mypassword");
// saveStory("My First Story", "This is the content of the story.");
// getStories();

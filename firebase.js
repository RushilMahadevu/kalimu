import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore"; // Ensure addDoc is imported here

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const handleAuthError = (error) => {
  if (error.code === "auth/popup-closed-by-user") {
    return {
      error: true,
      message: "Sign-in cancelled. Please try again if you want to sign in.",
    };
  }
  return {
    error: true,
    message: "An error occurred during sign-in. Please try again.",
  };
};

const loadUserVisits = async (userId) => {
  try {
    const userVisitsRef = collection(db, "users", userId, "plannedVisits");
    const snapshot = await getDocs(userVisitsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error loading visits:", error);
    return [];
  }
};

const loadGPAHistory = async (userId) => {
  if (!userId || !auth.currentUser) {
    console.error("No user ID provided or user not authenticated");
    return [];
  }
  try {
    
    const userGPARef = collection(db, "users", userId, "gpaHistory");
    const snapshot = await getDocs(userGPARef);
    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error loading GPA history:", error);
    return []; // Return empty array instead of throwing
  }
};

const loadStudyScheduleHistory = async (userId) => {
  if (!userId || !auth.currentUser) {
    console.error("No user ID provided or user not authenticated");
    return [];
  }

  try {
    const userScheduleRef = collection(db, "users", userId, "studyScheduleHistory");
    const snapshot = await getDocs(userScheduleRef);
    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error loading study schedule history:", error);
    return []; // Return empty array instead of throwing
  }
};

const loadHomeworkTasks = async () => {
  if (!auth.currentUser) {
    throw new Error("Please sign in to view tasks");
  }

  try {
    const tasksRef = collection(db, "users", auth.currentUser.uid, "homework");
    const q = query(tasksRef, orderBy("dueDate", "asc")); // Order by dueDate
    const snapshot = await getDocs(q); // Execute the query

    const loadedTasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return loadedTasks; // Return the tasks to be handled by the calling component
  } catch (error) {
    console.error("Error loading homework tasks:", error);
    throw new Error("Failed to load homework tasks");
  }
};

// Adding homework task
const addHomeworkTask = async (taskData) => {
  if (!auth.currentUser) {
    throw new Error("Please sign in to add tasks");
  }

  try {
    const task = {
      ...taskData,
      createdAt: new Date().toISOString(),
      userId: auth.currentUser.uid,
    };

    const tasksRef = collection(db, "users", auth.currentUser.uid, "homework");
    await addDoc(tasksRef, task); // Using addDoc correctly
    return task; // Return the newly created task
  } catch (error) {
    console.error("Error adding homework task:", error);
    throw new Error("Failed to add homework task");
  }
};

// Updating homework task status
const updateHomeworkTaskStatus = async (taskId, status) => {
  if (!auth.currentUser) {
    throw new Error("Please sign in to update tasks");
  }

  try {
    const taskRef = doc(db, "users", auth.currentUser.uid, "homework", taskId);
    await updateDoc(taskRef, { status });
    return { id: taskId, status };
  } catch (error) {
    console.error("Error updating homework task status:", error);
    throw new Error("Failed to update task status");
  }
};

// Deleting homework task
const deleteHomeworkTask = async (taskId) => {
  if (!auth.currentUser) {
    throw new Error("Please sign in to delete tasks");
  }

  try {
    const taskRef = doc(db, "users", auth.currentUser.uid, "homework", taskId);
    await deleteDoc(taskRef);
    return taskId;
  } catch (error) {
    console.error("Error deleting homework task:", error);
    throw new Error("Failed to delete task");
  }
};

// Add these new functions after the existing homework functions
const loadTestPrep = async (userId) => {
  if (!userId) {
    throw new Error("No user ID provided");
  }

  try {
    const testsRef = collection(db, "users", userId, "tests");
    const q = query(testsRef, orderBy("testDate", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading tests:", error);
    throw new Error("Failed to load tests");
  }
};

const addTestPrep = async (testData) => {
  if (!testData.userId) {
    throw new Error("No user ID provided");
  }

  try {
    const testsRef = collection(db, "users", testData.userId, "tests");
    const docRef = await addDoc(testsRef, testData);
    return { id: docRef.id, ...testData };
  } catch (error) {
    console.error("Error adding test:", error);
    throw new Error("Failed to add test");
  }
};

const deleteTestPrep = async (userId, testId) => {
  if (!userId || !testId) {
    throw new Error("Missing userId or testId");
  }

  try {
    const testRef = doc(db, "users", userId, "tests", testId);
    await deleteDoc(testRef);
    return testId;
  } catch (error) {
    console.error("Error deleting test:", error);
    throw new Error("Failed to delete test");
  }
};

export {
  auth,
  db,
  loadUserVisits,
  loadGPAHistory,
  loadStudyScheduleHistory,
  handleAuthError,
  loadHomeworkTasks,
  addHomeworkTask,
  updateHomeworkTaskStatus,
  deleteHomeworkTask,
  loadTestPrep,
  addTestPrep,
  deleteTestPrep,
};

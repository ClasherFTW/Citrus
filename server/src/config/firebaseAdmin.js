const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_FILENAME = "citrus-5589a-firebase-adminsdk-fbsvc-6f43e26d92.json";

const buildCredential = () => {
  // Method 1: Load from service account JSON file on disk (highest priority)
  const serviceAccountPath = path.resolve(__dirname, "..", "..", SERVICE_ACCOUNT_FILENAME);
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    console.log("[Firebase] Initialized using service account JSON file.");
    return admin.credential.cert(serviceAccount);
  }

  // Method 2: Load from FIREBASE_SERVICE_ACCOUNT_JSON env var (full JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("[Firebase] Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env var.");
    return admin.credential.cert(serviceAccount);
  }

  // Method 3: Load from individual env var fields
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    console.log("[Firebase] Initialized using individual env var fields.");
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  // Method 4: Fall back to Application Default Credentials
  console.log("[Firebase] Falling back to Application Default Credentials.");
  return admin.credential.applicationDefault();
};

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: buildCredential(),
  });
};

const verifyFirebaseIdToken = async (token) => {
  const app = getFirebaseAdminApp();
  return app.auth().verifyIdToken(token);
};

module.exports = {
  getFirebaseAdminApp,
  verifyFirebaseIdToken,
};

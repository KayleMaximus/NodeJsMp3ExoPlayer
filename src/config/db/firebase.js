const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('../../creds.json'); // Replace with your actual path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://nodejsapp-89f00.appspot.com"
});

// Get Firestore and Storage references
const db = getFirestore();
const storage = getStorage();
const messaging = getMessaging();
const auth = getAuth();

module.exports = { admin, db, storage, messaging, auth };
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY 환경변수가 설정되지 않았습니다.")
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID 환경변수가 설정되지 않았습니다.")
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)

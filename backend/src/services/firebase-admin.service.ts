/**
 * Firebase Admin Service
 * Verify Firebase ID Tokens from client
 */
import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Initialize Firebase Admin
let app: admin.app.App;

export const initializeFirebaseAdmin = (): void => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      logger.info('🔥 Firebase Admin already initialized');
      return;
    }

    // Option 1: Try environment variables first (for production/Render)
    const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
    const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID || 'doctor-3c3ef',
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });

      logger.info('🔥 Firebase Admin initialized from environment variables');
      return;
    }

    // Option 2: Fallback to service account JSON file (for local development)
    logger.info('Trying to load firebase-service-account.json...');
    const serviceAccount = require('../../firebase-service-account.json');
    
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: 'doctor-3c3ef',
    });

    logger.info('🔥 Firebase Admin initialized from service account file');
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin:', error);
    throw new Error('Firebase Admin initialization failed. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.');
  }
};

/**
 * Verify Firebase ID Token
 * @param token - Firebase ID token from client
 * @returns Decoded token with user info
 */
export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    if (!app) {
      initializeFirebaseAdmin();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    logger.info('✅ Firebase token verified:', {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number,
    });

    return decodedToken;
  } catch (error: any) {
    logger.error('❌ Failed to verify Firebase token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase token expired');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid Firebase token format');
    }
    
    throw new Error('Failed to verify Firebase token');
  }
};

/**
 * Get user by phone number
 * @param phoneNumber - Phone number (E.164 format: +84...)
 */
export const getUserByPhone = async (phoneNumber: string): Promise<admin.auth.UserRecord | null> => {
  try {
    if (!app) {
      initializeFirebaseAdmin();
    }

    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    logger.error('Failed to get user by phone:', error);
    throw error;
  }
};

/**
 * Delete Firebase user (for cleanup)
 * @param uid - Firebase UID
 */
export const deleteFirebaseUser = async (uid: string): Promise<void> => {
  try {
    if (!app) {
      initializeFirebaseAdmin();
    }

    await admin.auth().deleteUser(uid);
    logger.info(`🗑️ Firebase user deleted: ${uid}`);
  } catch (error) {
    logger.error('Failed to delete Firebase user:', error);
    throw error;
  }
};


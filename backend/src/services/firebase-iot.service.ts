/**
 * Firebase IoT Service
 * Query IoT data from Firebase Realtime Database
 */
import admin from "firebase-admin";
import {
  FIREBASE_IOT_CONFIG,
  getDateKeys,
} from "../config/firebase-iot.config";
import { logger } from "../utils/logger";

export class FirebaseIoTService {
  private db: admin.database.Database | null = null;
  private iotApp: admin.app.App | null = null;

  /**
   * Initialize Firebase IoT App (separate from auth app)
   */
  private initIoTApp() {
    if (this.iotApp) {
      return this.iotApp;
    }

    try {
      // Check if IoT app already exists
      try {
        this.iotApp = admin.app("iot");
        logger.info("🔥 Firebase IoT App already initialized");
        return this.iotApp;
      } catch {
        // App doesn't exist, create it
      }

      // Option 1: Try environment variables for IoT credentials
      const IOT_PROJECT_ID =
        process.env.FIREBASE_IOT_PROJECT_ID || "rice-813b5";
      const IOT_CLIENT_EMAIL = process.env.FIREBASE_IOT_CLIENT_EMAIL;
      const IOT_PRIVATE_KEY = process.env.FIREBASE_IOT_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      // Debug logging
      logger.info("🔍 Checking IoT credentials from env:", {
        hasProjectId: !!IOT_PROJECT_ID,
        hasClientEmail: !!IOT_CLIENT_EMAIL,
        hasPrivateKey: !!IOT_PRIVATE_KEY,
        projectId: IOT_PROJECT_ID,
        clientEmail: IOT_CLIENT_EMAIL
          ? IOT_CLIENT_EMAIL.substring(0, 20) + "..."
          : "undefined",
      });

      if (IOT_CLIENT_EMAIL && IOT_PRIVATE_KEY) {
        logger.info(
          "✅ IoT credentials found in env, initializing Firebase IoT App..."
        );

        this.iotApp = admin.initializeApp(
          {
            credential: admin.credential.cert({
              projectId: IOT_PROJECT_ID,
              clientEmail: IOT_CLIENT_EMAIL,
              privateKey: IOT_PRIVATE_KEY,
            }),
            databaseURL: FIREBASE_IOT_CONFIG.databaseURL,
          },
          "iot" // Named app
        );

        logger.info(
          "🔥 Firebase IoT App initialized from environment variables",
          {
            appName: this.iotApp.name,
            projectId: IOT_PROJECT_ID,
            databaseURL: FIREBASE_IOT_CONFIG.databaseURL,
          }
        );
        return this.iotApp;
      }

      // Option 2: Try service account file for IoT
      logger.info("Trying to load firebase-iot-service-account.json...");
      try {
        const iotServiceAccount = require("../../firebase-iot-service-account.json");

        this.iotApp = admin.initializeApp(
          {
            credential: admin.credential.cert(
              iotServiceAccount as admin.ServiceAccount
            ),
            databaseURL: FIREBASE_IOT_CONFIG.databaseURL,
          },
          "iot" // Named app
        );

        logger.info(
          "🔥 Firebase IoT App initialized from service account file"
        );
        return this.iotApp;
      } catch {
        logger.warn("⚠️ firebase-iot-service-account.json not found");
      }

      // Option 3: Public database access (NO AUTH - only for testing!)
      logger.warn(
        "⚠️ Using Firebase IoT without authentication credentials (public access only)"
      );
      logger.warn("⚠️ This only works if database rules allow public read!");

      this.iotApp = admin.initializeApp(
        {
          databaseURL: FIREBASE_IOT_CONFIG.databaseURL,
        },
        "iot" // Named app
      );

      logger.info(
        "🔥 Firebase IoT App initialized WITHOUT credentials (public mode)"
      );
      return this.iotApp;
    } catch (error) {
      logger.error("❌ Firebase IoT App init error:", error);
      throw error;
    }
  }

  /**
   * Initialize Firebase Realtime Database connection
   */
  private initDatabase() {
    if (!this.db) {
      try {
        // Initialize IoT app first
        const app = this.initIoTApp();

        logger.info("🔍 About to get database from app:", {
          appName: app.name,
          isDatabaseInitialized: !!this.db,
        });

        this.db = app.database();

        logger.info("🔥 Firebase IoT Database initialized", {
          appName: app.name,
          databaseURL: FIREBASE_IOT_CONFIG.databaseURL,
        });
      } catch (error) {
        logger.error("❌ Firebase IoT init error:", error);
        throw error;
      }
    }
    return this.db;
  }

  /**
   * Detect active device_id from Firebase
   * Check recent feeds to find the device that's actually uploading
   */
  async detectActiveDevice(): Promise<string | null> {
    try {
      const db = this.initDatabase();

      // Check last 3 days for any active device
      const today = new Date();
      const dateKeys = [];

      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0].replace(/-/g, "");
        dateKeys.push(dateKey);
      }

      logger.info(
        `🔍 Checking Firebase for active devices in dates:`,
        dateKeys
      );

      // Check each date
      for (const dateKey of dateKeys) {
        const feedsRef = db.ref(`feeds/${dateKey}`);
        const snapshot = await feedsRef.limitToLast(1).once("value");

        if (snapshot.exists()) {
          const data = snapshot.val();
          const latestFeed = Object.values(data)[0] as any;

          if (latestFeed?.device_id) {
            const normalizedDeviceId = latestFeed.device_id.toLowerCase();
            logger.info(
              `✅ Found active device: ${latestFeed.device_id} → normalized: ${normalizedDeviceId} in ${dateKey}`
            );
            return normalizedDeviceId;
          }
        }
      }

      logger.warn(`⚠️ No active device found in Firebase`);
      return null;
    } catch (error: any) {
      logger.error("❌ Failed to detect active device:", error.message);
      return null;
    }
  }

  /**
   * Get images from sensors_data for specific date
   */
  async getImagesForDate(date: string, deviceId?: string): Promise<any[]> {
    try {
      const db = this.initDatabase();
      const path = `${FIREBASE_IOT_CONFIG.SENSORS_PATH}/${date}`;
      const ref = db.ref(path);

      logger.info(`🔍 Querying Firebase Realtime Database:`, {
        path,
        deviceId,
      });

      const snapshot = await ref.once("value");
      const data = snapshot.val();

      logger.info(`📊 Query result:`, {
        path,
        hasData: !!data,
        dataKeys: data ? Object.keys(data).length : 0,
        sampleKeys: data ? Object.keys(data).slice(0, 3) : [],
      });

      if (!data) {
        logger.warn(`⚠️ No data found at path: ${path}`);
        return [];
      }

      const images: any[] = [];

      Object.keys(data).forEach((captureId) => {
        const capture = data[captureId];

        // Log first capture for debugging
        if (images.length === 0) {
          const imageUrl =
            capture.image_url || (capture.image && capture.image.url);
          logger.info(`🔍 Sample capture structure for ${captureId}:`, {
            hasImage: !!capture.image,
            hasImageNested: !!(capture.image && capture.image.url),
            hasImageUrlDirect: !!capture.image_url,
            imageUrl: imageUrl ? imageUrl.substring(0, 50) + "..." : "N/A",
            hasGps: !!capture.gps,
            rawGpsObject: capture.gps, // RAW GPS object
            gpsLat: capture.gps?.lat,
            gpsLon: capture.gps?.lon,
            gpsLng: capture.gps?.lng,
            gpsLatType: typeof capture.gps?.lat,
            gpsLonType: typeof capture.gps?.lon,
            hasEnv: !!capture.env,
            envKeys: capture.env ? Object.keys(capture.env) : [],
            device_id: capture.device_id,
            allKeys: Object.keys(capture),
          });
        }

        // Filter by deviceId if provided (but allow "ANY")
        // Case-insensitive comparison
        if (
          deviceId &&
          deviceId !== "ANY" &&
          capture.device_id?.toLowerCase() !== deviceId.toLowerCase()
        ) {
          if (images.length === 0) {
            // Log first mismatch for debugging
            logger.warn(
              `⏭️ Device mismatch: capture.device_id="${capture.device_id}" !== requested="${deviceId}"`
            );
          }
          return;
        }

        // Strict validation - require image URL and valid GPS coordinates
        // env is optional (mobile app might not have sensors)
        const hasValidGPS =
          capture.gps &&
          typeof capture.gps.lat === "number" &&
          (typeof capture.gps.lon === "number" ||
            typeof capture.gps.lng === "number");

        // Support both formats:
        // 1. New format: capture.image_url (direct property from Jetson devices)
        // 2. Old format: capture.image.url (nested object from mobile app)
        const imageUrl =
          capture.image_url || (capture.image && capture.image.url);

        if (imageUrl && hasValidGPS) {
          // Get timestamp from image.ts or root ts
          let timestamp =
            (capture.image && capture.image.ts) ||
            capture.ts ||
            new Date().toISOString();

          // Normalize timestamp: if no timezone specified, assume GMT+7 (Vietnam) and convert to UTC
          const originalTimestamp = timestamp;
          if (
            timestamp &&
            !timestamp.endsWith("Z") &&
            !timestamp.includes("+") &&
            !timestamp.includes("-", 10)
          ) {
            // Device sends local time (GMT+7) without timezone info
            // Add +07:00 timezone, then convert to UTC
            const timestampWithTz = timestamp + "+07:00";
            const date = new Date(timestampWithTz);
            timestamp = date.toISOString();

            // Log first 3 normalized timestamps for debugging
            if (images.length < 3) {
              logger.info(
                `⏰ Converted GMT+7 to UTC #${
                  images.length + 1
                }: "${originalTimestamp}" → "${timestampWithTz}" → "${timestamp}"`
              );
            }
          } else if (images.length < 3) {
            logger.info(
              `⏰ Timestamp #${
                images.length + 1
              } already has timezone: "${timestamp}"`
            );
          }

          images.push({
            captureId,
            deviceId: capture.device_id || "unknown",
            imageUrl: imageUrl,
            timestamp: timestamp,
            gps: {
              lat: capture.gps.lat,
              lng: capture.gps.lon || capture.gps.lng, // Support both 'lon' and 'lng'
            },
            sensors: {
              // Map to frontend field names (temperature, soilMoisture, windSpeed)
              temperature: capture.env?.temp || capture.env?.temperature || 0,
              humidity: capture.env?.hum || capture.env?.humidity || 0,
              ph: capture.env?.ph || 0,
              soilMoisture: capture.env?.soil || capture.env?.moisture || 0,
              lux: capture.env?.lux || capture.env?.light || 0,
              windSpeed: capture.env?.wind || capture.env?.wind_speed || 0,
            },
          });
        } else {
          logger.warn(`⚠️ Incomplete capture data for ${captureId}:`, {
            hasImage: !!capture.image,
            hasImageUrl: !!(capture.image && capture.image.url),
            hasImageUrlDirect: !!capture.image_url,
            imageUrlValue: imageUrl,
            hasGps: !!capture.gps,
            gpsLat: capture.gps?.lat,
            gpsLon: capture.gps?.lon,
            gpsLng: capture.gps?.lng,
            hasValidGPS: hasValidGPS,
            hasEnv: !!capture.env,
            device_id: capture.device_id,
            captureKeys: Object.keys(capture),
          });
        }
      });

      logger.info(`✅ Found ${images.length} valid images for date ${date}`);

      return images;
    } catch (error: any) {
      logger.error(`❌ Error fetching images for date ${date}:`, error.message);
      return [];
    }
  }

  /**
   * Get images for last N days
   */
  async getRecentImages(
    deviceId: string,
    days: number = 7,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const dateKeys = getDateKeys(days);
      const allImages: any[] = [];

      for (const date of dateKeys) {
        const images = await this.getImagesForDate(date, deviceId);
        allImages.push(...images);

        if (allImages.length >= limit) break;
      }

      // Sort by timestamp desc
      allImages.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return allImages.slice(0, limit);
    } catch (error: any) {
      logger.error("❌ Error fetching recent images:", error.message);
      return [];
    }
  }

  /**
   * Write treatment data to Firebase
   * Writes to /executions/{date}/{type}/{timestamp}
   */
  async writeTreatment(
    sessionId: string,
    treatmentData: any,
    photoData: any
  ): Promise<string[]> {
    try {
      const db = this.initDatabase();
      const paths: string[] = [];

      // Import format helper (dynamic to avoid circular dependencies)
      const { formatForFirebase } = await import(
        "../utils/treatment-generator.utils"
      );
      const formatted = formatForFirebase(treatmentData, photoData);

      // === 1. Write to /executions/{dateStr}/ (NEW DATE-BASED FORMAT) ===
      // Option A: executions/20251112/treatment/[timestamp]/...
      const executionsBasePath = `${FIREBASE_IOT_CONFIG.EXECUTIONS_PATH}/${formatted.dateStr}`;

      for (const [type, data] of Object.entries(formatted.executions)) {
        const typePath = `${executionsBasePath}/${type}`;
        const ref = db.ref(typePath);
        // Use update() instead of set() to merge with existing data (preserve old entries)
        await ref.update(data as any);
        paths.push(typePath);

        // Log details for debugging
        const dataObj = data as Record<string, any>;
        const timestampKey = Object.keys(dataObj)[0];
        const entry = dataObj[timestampKey];
        logger.info(
          `✅ [New Format] ${type} written to: ${typePath} (date: ${formatted.dateStr})`,
          {
            timestamp: timestampKey,
            disease: entry?.disease_name || "N/A",
          }
        );
      }

      logger.info(`✅ Treatment written to executions:`, {
        sessionId: formatted.sessionId,
        dateStr: formatted.dateStr,
        totalPaths: paths.length,
      });

      return paths;
    } catch (error: any) {
      logger.error("❌ Error writing treatment:", error.message);
      throw error;
    }
  }

  /**
   * Upload mobile image to Firebase IoT
   * Uploads to Storage + writes metadata to Realtime Database
   */
  async uploadMobileImage(params: {
    imageBuffer: Buffer;
    captureId: string;
    dateKey: string;
    fieldId: string;
    fieldName: string;
    gps: { lat: number; lng: number };
    userId: string;
    deviceId: string;
  }): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    const {
      imageBuffer,
      captureId,
      dateKey,
      fieldId,
      fieldName,
      gps,
      userId,
      deviceId,
    } = params;

    try {
      // Initialize IoT app and database
      this.initIoTApp();
      const db = this.initDatabase();

      // Upload to Firebase Storage
      const storagePath = `captures/${dateKey}/img_${captureId}.jpg`;
      const bucket = this.iotApp!.storage().bucket();
      const file = bucket.file(storagePath);

      logger.info(`📤 Uploading to Firebase Storage: ${storagePath}`);

      await file.save(imageBuffer, {
        contentType: "image/jpeg",
        metadata: {
          metadata: {
            uploadedBy: "mobile-app",
            userId,
            fieldId,
            captureId,
          },
        },
      });

      // Make file public (or use signed URL)
      await file.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      logger.info(`✅ Image uploaded: ${imageUrl}`);

      // Write metadata to Realtime Database
      const path = `${FIREBASE_IOT_CONFIG.SENSORS_PATH}/${dateKey}/${captureId}`;
      const dataRef = db.ref(path);

      const metadata = {
        device_id: deviceId,
        env: {
          // Mobile app doesn't have sensors - use placeholder values
          temp: 0,
          hum: 0,
          ph: 0,
          soil: 0,
          lux: 0,
          wind: 0,
        },
        gps: {
          lat: gps.lat,
          lon: gps.lng, // Firebase uses 'lon'
        },
        image: {
          url: imageUrl,
          ts: new Date().toISOString(),
          object: storagePath,
        },
        host: "mobile-app",
        field_id: fieldId,
        field_name: fieldName,
        ts: new Date().toISOString(),
      };

      await dataRef.set(metadata);

      logger.info(`✅ Metadata written to ${path}`);

      return {
        success: true,
        imageUrl,
      };
    } catch (error: any) {
      logger.error(`❌ Error uploading mobile image:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const firebaseIoTService = new FirebaseIoTService();

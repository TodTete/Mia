import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Inicializa Firebase Admin SDK asegurando que no se inicialice más de una vez
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    // Verificamos si existe el archivo para evitar que la aplicación falle al no encontrarlo (por ejemplo, en Vercel)
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://mia-610eb-default-rtdb.firebaseio.com"
      });
      console.log('Firebase Admin inicializado correctamente con el archivo local.');
    } else {
      // Para producción (como Vercel) se recomienda usar variables de entorno en lugar de subir el archivo
      console.warn('No se encontró serviceAccountKey.json. Configura las variables de entorno para Firebase Admin en producción.');
    }
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.database() : null;

import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize the single Firebase App instance
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Request the requested Drive scope
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Sync status changes to the client-side state
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Triggers a Google Popup Auth Flow for retrieving the necessary access token/credentials
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve current active token in memory
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Disposes active session
 */
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE DRIVE API OPERATIONS
// ==========================================

const FOLDER_NAME = "One Tree Democracy - एक पेड़ लोकतंत्र";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size?: string;
  createdTime: string;
}

/**
 * Verify or create dedicated Campaign folder in user's Google Drive
 */
export const getOrCreateFolder = async (accessToken: string): Promise<string> => {
  // Query for name & parent constraints
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const findUrl = `https://www.googleapis.com/drive/v3/files?q=${query}`;

  try {
    const searchRes = await fetch(findUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchRes.ok) {
      throw new Error("Error searching folder in Google Drive");
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Creating folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder"
      })
    });

    if (!createRes.ok) {
      throw new Error("Error creating Campaign subdirectory in Google Drive");
    }

    const folderInfo = await createRes.json();
    return folderInfo.id;
  } catch (error) {
    console.error("getOrCreateFolder failed:", error);
    throw error;
  }
};

/**
 * Uploads a base64 or blob document straight to Google Drive Folder
 */
export const uploadCertificate = async (
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBlob: Blob
): Promise<DriveFile> => {
  try {
    // Phase 1: Create File Metadata linked to parent directory
    const createMetaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fileName,
        mimeType: mimeType,
        parents: [folderId]
      })
    });

    if (!createMetaRes.ok) {
      throw new Error("Unable to create file empty metadata template in Google Drive");
    }

    const fileMeta = await createMetaRes.json();
    const fileId = fileMeta.id;

    // Phase 2: Upload Raw Media via PATCH media API
    const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType
      },
      body: fileBlob
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to dispatch and upload bytes content to Drive file ID");
    }

    // Phase 3: Fetch full updated file descriptors
    const detailRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,size,createdTime`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!detailRes.ok) {
      throw new Error("Failed to retrieve file details");
    }

    return await detailRes.json();
  } catch (error) {
    console.error("uploadCertificate error:", error);
    throw error;
  }
};

/**
 * Lists all certificates stored in the application's root Google Drive Folder
 */
export const listCertificates = async (accessToken: string, folderId: string): Promise<DriveFile[]> => {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,size,createdTime)&orderBy=createdTime%20desc`;

  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!listRes.ok) {
      throw new Error("Unable to fetch directory list from Google Drive API");
    }

    const data = await listRes.json();
    return data.files || [];
  } catch (error) {
    console.error("listCertificates error:", error);
    throw error;
  }
};

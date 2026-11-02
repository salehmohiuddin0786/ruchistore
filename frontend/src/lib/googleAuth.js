/**
 * Standalone Google Identity Services (GIS) OAuth integration for Ruchi Store.
 * Replaces Firebase Auth with native Google OAuth 2.0 / GIS.
 */

export const initGoogleSdk = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      return resolve(null);
    }
    if (window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts);
    }

    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      // Script tag exists, wait for load
      existing.addEventListener("load", () => resolve(window.google?.accounts || null));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);

    // Timeout fallback after 4 seconds
    setTimeout(() => {
      resolve(window.google?.accounts || null);
    }, 4000);
  });
};

/**
 * Prompt Google Sign-In and fetch user profile without Firebase
 */
export const loginWithGoogleSdk = () => {
  return new Promise(async (resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Google Login is only available in browser"));
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return reject(
        new Error(
          "Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local"
        )
      );
    }

    const accounts = await initGoogleSdk();
    if (!accounts?.oauth2) {
      return reject(
        new Error("Google Identity SDK could not be loaded. Please check your internet connection.")
      );
    }

    try {
      const client = accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid profile email",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(
              new Error(tokenResponse.error_description || "Google sign-in was cancelled or failed")
            );
          }
          try {
            // Fetch profile directly from Google userinfo endpoint
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (!res.ok) {
              return reject(new Error("Failed to fetch user info from Google"));
            }
            const profile = await res.json();
            resolve({
              accessToken: tokenResponse.access_token,
              uid: profile.sub,
              email: profile.email,
              name: profile.name,
              photoURL: profile.picture,
            });
          } catch (err) {
            reject(err);
          }
        },
      });

      client.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
};

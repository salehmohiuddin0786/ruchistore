/**
 * Official Facebook JavaScript SDK integration for Ruchi Store.
 * Supports FB.init, FB.getLoginStatus, checkLoginState, and FB.login with Graph API.
 */

const DEFAULT_API_VERSION = "v19.0";

/**
 * Initialize Facebook JavaScript SDK
 */
export const initFacebookSdk = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      return resolve(null);
    }

    // If FB is already loaded and initialized
    if (window.FB) {
      return resolve(window.FB);
    }

    const appId =
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
      window.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_FACEBOOK_APP_ID ||
      "";

    const apiVersion =
      process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || DEFAULT_API_VERSION;

    window.fbAsyncInit = function () {
      if (appId && appId !== "{your-app-id}") {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: apiVersion,
        });
        try {
          window.FB.AppEvents?.logPageView?.();
        } catch (e) {
          // ignore tracking error
        }
      }
      resolve(window.FB);
    };

    // Load SDK script asynchronously
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");

    // Timeout fallback after 4 seconds
    setTimeout(() => {
      resolve(window.FB || null);
    }, 4000);
  });
};

/**
 * Check current Facebook login status
 */
export const getFacebookLoginStatus = async () => {
  const FB = await initFacebookSdk();
  return new Promise((resolve) => {
    if (!FB || typeof FB.getLoginStatus !== "function") {
      return resolve({ status: "unknown" });
    }
    FB.getLoginStatus(function (response) {
      resolve(response);
    });
  });
};

/**
 * checkLoginState - Matches standard Facebook snippet
 */
export const checkLoginState = async (callback) => {
  const status = await getFacebookLoginStatus();
  if (typeof callback === "function") {
    callback(status);
  }
  return status;
};

/**
 * Log in with Facebook via Facebook JavaScript SDK
 * Requests public_profile,email scope and extracts user profile
 */
export const loginWithFacebookSdk = () => {
  return new Promise(async (resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Facebook Login is only available in browser"));
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId || appId === "{your-app-id}") {
      return reject(
        new Error(
          "Facebook App ID is not configured. Please set NEXT_PUBLIC_FACEBOOK_APP_ID in frontend/.env.local"
        )
      );
    }

    const FB = await initFacebookSdk();
    if (!FB || typeof FB.login !== "function") {
      return reject(new Error("Facebook SDK could not be loaded. Check your ad blocker or internet connection."));
    }

    FB.login(
      function (response) {
        if (response && response.status === "connected" && response.authResponse) {
          const { accessToken, userID } = response.authResponse;

          // Fetch profile details from Facebook Graph API
          FB.api(
            "/me",
            { fields: "id,name,email,picture.width(200).height(200)" },
            function (profile) {
              if (profile && !profile.error) {
                resolve({
                  accessToken,
                  userID: userID || profile.id,
                  email: profile.email || null,
                  name: profile.name || "Facebook User",
                  photoURL: profile.picture?.data?.url || null,
                });
              } else {
                // If Graph API call had an issue, fallback with basic ID info
                resolve({
                  accessToken,
                  userID,
                  email: null,
                  name: "Facebook User",
                  photoURL: null,
                });
              }
            }
          );
        } else if (response && response.status === "not_authorized") {
          reject(new Error("Facebook login was not authorized."));
        } else {
          reject(new Error("Facebook sign-in was cancelled or closed."));
        }
      },
      { scope: "public_profile,email", return_scopes: true }
    );
  });
};

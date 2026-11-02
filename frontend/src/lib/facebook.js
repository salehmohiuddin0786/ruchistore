/**
 * Official Facebook JavaScript SDK integration for Ruchi Store.
 * Supports FB.init, FB.getLoginStatus, checkLoginState, and FB.login with Graph API.
 */

const DEFAULT_API_VERSION = "v19.0";

/**
 * Get Facebook App ID from localStorage or environment
 */
export const getFacebookAppId = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ruchi_facebook_app_id");
    if (saved && saved.trim()) return saved.trim();
  }
  return (
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    (typeof window !== "undefined" && window.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_FACEBOOK_APP_ID) ||
    ""
  );
};

/**
 * Initialize Facebook JavaScript SDK
 */
export const initFacebookSdk = (customAppId = null) => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      return resolve(null);
    }

    const appId = customAppId || getFacebookAppId();
    const apiVersion =
      process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || DEFAULT_API_VERSION;

    // If FB is already loaded
    if (window.FB && appId) {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: apiVersion,
        });
      } catch (e) {
        // ignore
      }
      return resolve(window.FB);
    }

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
export const getFacebookLoginStatus = async (customAppId = null) => {
  const FB = await initFacebookSdk(customAppId);
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
export const loginWithFacebookSdk = (customAppId = null) => {
  return new Promise(async (resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Facebook Login is only available in browser"));
    }

    const appId = customAppId || getFacebookAppId();
    if (!appId || appId === "{your-app-id}") {
      const err = new Error("FACEBOOK_APP_ID_MISSING");
      err.code = "FACEBOOK_APP_ID_MISSING";
      return reject(err);
    }

    const FB = await initFacebookSdk(appId);
    if (!FB || typeof FB.login !== "function") {
      return reject(
        new Error("Facebook SDK could not be loaded. Check your ad blocker or internet connection.")
      );
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

/**
 * Local development test / simulated Facebook login (when Meta App ID is not yet created)
 */
export const loginWithFacebookDemo = async (customName = "Facebook User") => {
  const mockId = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
  return {
    accessToken: `demo_fb_token_${Date.now()}`,
    userID: mockId,
    email: `fb_user_${mockId.slice(-4)}@facebook.com`,
    name: customName,
    photoURL: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
  };
};

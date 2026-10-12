/**
 * Geolocation and Reverse Geocoding Helper
 */
export async function getCurrentGeoAddress() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            const road =
              addr.road ||
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.quarter ||
              "";
            const city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.city_district ||
              addr.county ||
              "Hyderabad";
            const state = addr.state || "Telangana";
            const pincode = addr.postcode ? addr.postcode.replace(/\D/g, "").slice(0, 6) : "500081";

            const streetParts = [
              addr.house_number,
              road,
              addr.suburb !== road ? addr.suburb : "",
            ].filter(Boolean);

            const addressLine = streetParts.length > 0 ? streetParts.join(", ") : data.display_name?.split(",").slice(0, 2).join(",") || "Near Current Location";

            return resolve({
              success: true,
              latitude: lat,
              longitude: lng,
              addressLine: addressLine.trim(),
              city,
              state,
              pincode,
              displayName: data.display_name || `${addressLine}, ${city}`,
            });
          }
        } catch (err) {
          console.warn("Reverse geocode fetch failed, using fallback coordinates:", err);
        }

        // Fallback with GPS coordinates
        resolve({
          success: true,
          latitude: lat,
          longitude: lng,
          addressLine: "Current GPS Location",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
          displayName: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        });
      },
      (err) => {
        let msg = "Could not fetch current location. Please grant location permission.";
        if (err.code === 1) {
          msg = "Location permission denied. Please allow location access in your browser.";
        } else if (err.code === 2) {
          msg = "Position unavailable. Please try again or type your address.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try again.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

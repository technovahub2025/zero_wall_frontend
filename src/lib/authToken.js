let accessToken = null;

export function getStoredAccessToken() {
  return accessToken;
}

export function setStoredAccessToken(token) {
  accessToken = token || null;
}

export function clearStoredAccessToken() {
  accessToken = null;
}

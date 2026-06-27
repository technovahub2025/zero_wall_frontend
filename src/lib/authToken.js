let accessToken = null;
let refreshBlocked = false;

export function getStoredAccessToken() {
  return accessToken;
}

export function setStoredAccessToken(token) {
  accessToken = token || null;
}

export function clearStoredAccessToken() {
  accessToken = null;
}

export function isAuthRefreshBlocked() {
  return refreshBlocked;
}

export function setAuthRefreshBlocked(value) {
  refreshBlocked = Boolean(value);
}

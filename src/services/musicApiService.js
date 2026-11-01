import { AUDIO_CONFIG } from '../constants/config';

const API_BASE_URL = AUDIO_CONFIG.apiBaseUrl;

const readResponse = async (response) => {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('The MusicAPI server returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(body?.error || `MusicAPI request failed (${response.status}).`);
  }
  return body;
};

const authenticatedRequest = async (path, user, sessionToken, nextParam) => {
  if (!API_BASE_URL) {
    throw new Error('Set AUDIO_API_BASE_URL to the reachable backend address first.');
  }
  if (typeof user?.getIdToken !== 'function') {
    throw new Error('Sign in to your Spotibai account before opening this library.');
  }

  const url = new URL(`${API_BASE_URL}/api/musicapi${path}`);
  if (nextParam) url.searchParams.set('nextParam', nextParam);
  const idToken = await user.getIdToken();
  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${idToken}`,
      'x-musicapi-session': sessionToken,
    },
  });
  return readResponse(response);
};

export const getMusicApiConfig = async () => {
  if (!API_BASE_URL) {
    throw new Error('Set AUDIO_API_BASE_URL to the reachable backend address first.');
  }
  const response = await fetch(`${API_BASE_URL}/api/musicapi/config`);
  return readResponse(response);
};

export const createMusicApiSignInUrl = (config, userId) => {
  if (!config?.configured || !config.slug || !config.returnUrl) {
    throw new Error('MusicAPI is not configured on the backend yet.');
  }

  const query = [
    `returnUrl=${encodeURIComponent(config.returnUrl)}`,
    'forwardFailures=true',
    `merchantUserId=${encodeURIComponent(userId)}`,
  ].join('&');
  return `https://app.musicapi.com/${encodeURIComponent(config.slug)}?${query}`;
};

export const connectMusicApiUser = async (user, data64) => {
  if (!API_BASE_URL) {
    throw new Error('Set AUDIO_API_BASE_URL to the reachable backend address first.');
  }
  if (typeof user?.getIdToken !== 'function') {
    throw new Error('Sign in to your Spotibai account before connecting a service.');
  }

  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/musicapi/connect`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data64: data64.replace(/ /g, '+') }),
  });
  return readResponse(response);
};

export const getMusicApiPlaylists = (user, sessionToken, nextParam) =>
  authenticatedRequest('/playlists', user, sessionToken, nextParam);

export const getMusicApiPlaylistItems = (
  user,
  sessionToken,
  playlistId,
  nextParam
) =>
  authenticatedRequest(
    `/playlists/${encodeURIComponent(playlistId)}/items`,
    user,
    sessionToken,
    nextParam
  );

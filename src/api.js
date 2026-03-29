import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const STORAGE_KEYS = {
  SERVER_URL: 'crewai_server_url',
  TOKEN: 'crewai_token',
  USER: 'crewai_user',
};

export async function getServerUrl() {
  return await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
}

export async function saveServerUrl(url) {
  const trimmed = url.trim().replace(/\/$/, '');
  await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, trimmed);
}

export async function getToken() {
  return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
}

export async function saveToken(token) {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export async function saveUser(user) {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser() {
  const u = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return u ? JSON.parse(u) : null;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
}

export async function createApiClient() {
  const serverUrl = await getServerUrl();
  const token = await getToken();
  return axios.create({
    baseURL: serverUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    timeout: 15000,
  });
}

export async function login(username, password) {
  const serverUrl = await getServerUrl();
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const resp = await axios.post(`${serverUrl}/auth/token`, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  await saveToken(resp.data.access_token);
  await saveUser({
    username: resp.data.username,
    is_admin: resp.data.is_admin,
    avatar_url: resp.data.avatar_url,
  });
  return resp.data;
}

export async function fetchDashboard() {
  const api = await createApiClient();
  const [agents, crews, executions] = await Promise.all([
    api.get('/api/agents').catch(() => ({ data: [] })),
    api.get('/api/crews').catch(() => ({ data: [] })),
    api.get('/api/executions').catch(() => ({ data: [] })),
  ]);
  return {
    agents: agents.data,
    crews: crews.data,
    executions: executions.data,
  };
}

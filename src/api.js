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
  const [agents, crews, executions, tools, llmConfigs] = await Promise.all([
    api.get('/api/agents').catch(() => ({ data: [] })),
    api.get('/api/crews').catch(() => ({ data: [] })),
    api.get('/api/executions').catch(() => ({ data: [] })),
    api.get('/api/tools').catch(() => ({ data: [] })),
    api.get('/api/llm-configs').catch(() => ({ data: [] })),
  ]);
  return {
    agents: agents.data,
    crews: crews.data,
    executions: executions.data,
    tools: tools.data,
    llmConfigs: llmConfigs.data,
  };
}

// Agents
export async function getAgents() {
  const api = await createApiClient();
  const resp = await api.get('/api/agents');
  return resp.data;
}

export async function createAgent(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/agents', data);
  return resp.data;
}

export async function updateAgent(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/agents/${id}`, data);
  return resp.data;
}

export async function deleteAgent(id) {
  const api = await createApiClient();
  await api.delete(`/api/agents/${id}`);
}

// Tasks
export async function getTasks() {
  const api = await createApiClient();
  const resp = await api.get('/api/tasks');
  return resp.data;
}

export async function createTask(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/tasks', data);
  return resp.data;
}

export async function updateTask(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/tasks/${id}`, data);
  return resp.data;
}

export async function deleteTask(id) {
  const api = await createApiClient();
  await api.delete(`/api/tasks/${id}`);
}

// Crews
export async function getCrews() {
  const api = await createApiClient();
  const resp = await api.get('/api/crews');
  return resp.data;
}

export async function createCrew(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/crews', data);
  return resp.data;
}

export async function updateCrew(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/crews/${id}`, data);
  return resp.data;
}

export async function deleteCrew(id) {
  const api = await createApiClient();
  await api.delete(`/api/crews/${id}`);
}

// Flows
export async function getFlows() {
  const api = await createApiClient();
  const resp = await api.get('/api/flows');
  return resp.data;
}

export async function createFlow(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/flows', data);
  return resp.data;
}

export async function updateFlow(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/flows/${id}`, data);
  return resp.data;
}

export async function deleteFlow(id) {
  const api = await createApiClient();
  await api.delete(`/api/flows/${id}`);
}

// Tools
export async function getTools() {
  const api = await createApiClient();
  const resp = await api.get('/api/tools');
  return resp.data;
}

export async function createTool(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/tools', data);
  return resp.data;
}

export async function updateTool(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/tools/${id}`, data);
  return resp.data;
}

export async function deleteTool(id) {
  const api = await createApiClient();
  await api.delete(`/api/tools/${id}`);
}

// LLM Configs
export async function getLLMConfigs() {
  const api = await createApiClient();
  const resp = await api.get('/api/llm-configs');
  return resp.data;
}

export async function createLLMConfig(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/llm-configs', data);
  return resp.data;
}

export async function updateLLMConfig(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/llm-configs/${id}`, data);
  return resp.data;
}

export async function deleteLLMConfig(id) {
  const api = await createApiClient();
  await api.delete(`/api/llm-configs/${id}`);
}

export async function testLLMConfig(id) {
  const api = await createApiClient();
  const resp = await api.post(`/api/llm-configs/${id}/test`);
  return resp.data;
}

// Knowledge
export async function getKnowledge() {
  const api = await createApiClient();
  const resp = await api.get('/api/knowledge');
  return resp.data;
}

export async function createKnowledge(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/knowledge', data);
  return resp.data;
}

export async function deleteKnowledge(id) {
  const api = await createApiClient();
  await api.delete(`/api/knowledge/${id}`);
}

// Scheduler Jobs
export async function getSchedulerJobs() {
  const api = await createApiClient();
  const resp = await api.get('/api/scheduler/jobs');
  return resp.data;
}

export async function createSchedulerJob(data) {
  const api = await createApiClient();
  const resp = await api.post('/api/scheduler/jobs', data);
  return resp.data;
}

export async function updateSchedulerJob(id, data) {
  const api = await createApiClient();
  const resp = await api.put(`/api/scheduler/jobs/${id}`, data);
  return resp.data;
}

export async function deleteSchedulerJob(id) {
  const api = await createApiClient();
  await api.delete(`/api/scheduler/jobs/${id}`);
}

// Executions
export async function getExecutions() {
  const api = await createApiClient();
  const resp = await api.get('/api/executions');
  return resp.data;
}

export async function getExecution(id) {
  const api = await createApiClient();
  const resp = await api.get(`/api/executions/${id}`);
  return resp.data;
}

export async function runCrew(crewId, inputs = {}) {
  const api = await createApiClient();
  const resp = await api.post('/api/executions/run/crew', { crew_id: crewId, inputs });
  return resp.data;
}

export async function runFlow(flowId, inputs = {}) {
  const api = await createApiClient();
  const resp = await api.post('/api/executions/run/flow', { flow_id: flowId, inputs });
  return resp.data;
}

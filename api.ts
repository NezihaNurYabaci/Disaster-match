import axios from 'axios';
import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:8000`;
  }
  return 'http://192.168.1.113:8000';
};

const API_URL = getApiUrl();

export const addNeed = (data: {
  userId: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
}) => axios.post(`${API_URL}/needs`, data);

export const addResource = (data: {
  userId: string;
  category: string;
  description: string;
  quantity: string;
  latitude: number;
  longitude: number;
}) => axios.post(`${API_URL}/resources`, data);

export const getMatches = (needId: string) =>
  axios.get(`${API_URL}/match/${needId}`);

export const getUserResources = (userId: string) =>
  axios.get(`${API_URL}/resources/user/${userId}`);

export const deleteResource = (resourceId: string) =>
  axios.delete(`${API_URL}/resources/${resourceId}`);



import axios from 'axios';
import type { 
  LoginRequest, 
  SignupRequest, 
  AuthResponse, 
  Movie, 
  RateMovieRequest,
  Rating,
  RecommendationsResponse 
} from '../types';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-aws-api-url.com'
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moviematcher_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('moviematcher_token');
      localStorage.removeItem('moviematcher_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  signup: async (credentials: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post('/users/signup', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// Movies API calls
export const moviesAPI = {
  getMovies: async (): Promise<Movie[]> => {
    const response = await api.get('/movies');
    return response.data;
  },

  getMovie: async (id: number): Promise<Movie> => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },
};

// Ratings API calls
export const ratingsAPI = {
  rateMovie: async (ratingData: RateMovieRequest): Promise<{ success: boolean }> => {
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },

  getUserRatings: async (): Promise<Rating[]> => {
    const response = await api.get('/ratings');
    return response.data;
  },
};

// Recommendations API calls
export const recommendationsAPI = {
  getRecommendations: async (limit = 10): Promise<RecommendationsResponse> => {
    const response = await api.get(`/recommendations?limit=${limit}`);
    return response.data;
  },
};

export default api;
// User types
export interface User {
    id: number;
    name: string;
    email: string;
  }
  
  export interface UserPayload {
    userId: number;
    email?: string;
  }
  
  // Auth types
  export interface SignupRequest {
    name: string;
    email: string;
    password: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  // Movie types
  export interface Movie {
    id: number;
    title: string;
    genre: string;
    description: string;
  }
  
  export interface MovieWithRating extends Movie {
    userRating?: number;
  }
  
  // Rating types
  export interface RateMovieRequest {
    movieId: number;
    rating: number; // 0 or 1
  }
  
  export interface Rating {
    movie_id: number;
    rating: number;
  }
  
  // Recommendation types
  export interface Recommendation extends Movie {
    explanation: string;
  }
  
  export interface RecommendationsResponse {
    recommendations: Recommendation[];
    userId: number;
    limit: number;
    timestamp: string;
  }
  
  // API Error type
  export interface ApiError {
    error: string;
    message?: string;
  }
  
  // Context types
  export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginRequest) => Promise<void>;
    signup: (credentials: SignupRequest) => Promise<void>;
    logout: () => void;
    loading: boolean;
    recommendationsKey: number;
    invalidateRecommendations: () => void;
  }
  
  // Component prop types
  export interface ProtectedRouteProps {
    children: React.ReactNode;
  }
  
  export interface MovieCardProps {
    movie: Movie;
    onClick?: () => void;
  }
  
  export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
  }
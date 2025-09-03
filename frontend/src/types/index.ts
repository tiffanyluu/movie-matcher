export interface User {
    id: number;
    name: string;
    email: string;
  }
  
  export interface UserPayload {
    userId: number;
    email?: string;
  }
  
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
  
  export interface Movie {
    id: number;
    title: string;
    genre: string;
    description: string;
  }
  
  export interface RateMovieRequest {
    movieId: number;
    rating: number;
  }
  
  export interface Rating {
    movie_id: number;
    rating: number;
  }
  
  export interface Recommendation extends Movie {
    explanation: string;
  }
  
  export interface RecommendationsResponse {
    recommendations: Recommendation[];
    userId: number;
    limit: number;
    timestamp: string;
  }
  
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
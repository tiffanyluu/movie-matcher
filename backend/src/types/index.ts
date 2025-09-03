export interface UserRow {
    id: number;
    name: string;
    email: string;
    password_hash: string;
}
  
export interface MovieRow {
  id: number;
  title: string;
  genre: string;
  description: string;
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

export interface RateMovieRequest {
  movieId: number;
  rating: number;
}

export interface UserPayload {
  userId: number;
  email?: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface RatingResponse {
  id: number;
  movieId: number;
  rating: number;
  timestamp: Date;
}
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

export interface RatingRow {
  id: number;
  user_id: number;
  movie_id: number;
  rating: number;
  timestamp: Date;
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

export interface MovieResponse {
  id: number;
  title: string;
  genre: string;
  description: string;
}

export interface RatingResponse {
  id: number;
  movieId: number;
  rating: number;
  timestamp: Date;
}

export interface RatingWithMovieResponse {
  id: number;
  rating: number;
  timestamp: Date;
  movie: MovieResponse;
}

// export interface PaginationResponse {
//   currentPage: number;
//   totalPages: number;
//   hasNext: boolean;
//   hasPrev: boolean;
// }

// export interface MovieListResponse {
//   movies: MovieResponse[];
//   pagination: PaginationResponse & {
//     totalMovies: number;
//   };
// }

// export interface UserRatingsResponse {
//   ratings: RatingWithMovieResponse[];
//   pagination: PaginationResponse & {
//     totalRatings: number;
//   };
// }

// export interface MovieStatsResponse {
//   movieId: number;
//   totalRatings: number;
//   averageRating: number;
//   ratingDistribution: {
//     5: number;
//     4: number;
//     3: number;
//     2: number;
//     1: number;
//   };
// }

// export interface MovieQueryParams {
//   page?: string;
//   limit?: string;
//   genre?: string;
//   search?: string;
// }

// export interface RatingQueryParams {
//   page?: string;
//   limit?: string;
// }

// export interface ErrorResponse {
//   error: string;
// }
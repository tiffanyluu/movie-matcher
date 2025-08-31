import React from 'react';
import type { MovieCardProps } from '../types';

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="movie-card"
    >
      <h3 className="font-semibold text-gray-900 mb-2">{movie.title}</h3>
      <p className="text-sm text-gray-600">{movie.genre}</p>
    </div>
  );
};

export default MovieCard;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { moviesAPI, ratingsAPI } from '../services/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Movie } from '../types';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invalidateRecommendations } = useAuth(); // Add this
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchMovieData = async () => {
      if (!id) return;

      try {
        const movieData = await moviesAPI.getMovie(parseInt(id));
        setMovie(movieData);

        const userRatings = await ratingsAPI.getUserRatings();
        const existingRating = userRatings.find(r => r.movie_id === parseInt(id));
        setUserRating(existingRating ? existingRating.rating : null);
      } catch (err) {
        const error = err as AxiosError<{ error: string }>;
        setError(error.response?.data?.error || 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  const handleRating = async (rating: number) => {
    if (!movie || ratingLoading) return;

    setRatingLoading(true);
    try {
      await ratingsAPI.rateMovie({ movieId: movie.id, rating });
      setUserRating(rating);
      
      invalidateRecommendations();
      
      console.log('Rating saved! Recommendations will be updated.');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      setError(error.response?.data?.error || 'Failed to rate movie');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/movies" className="text-primary-600 hover:text-primary-500">
            Back to Movies
          </Link>
        </div>
      </Layout>
    );
  }

  if (!movie) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-500 mb-4">Movie not found</p>
          <Link to="/movies" className="text-primary-600 hover:text-primary-500">
            Back to Movies
          </Link>
        </div>
      </Layout>
    );
  }

  const isDescriptionLong = movie.description.length > 200;
  const displayDescription = showFullDescription || !isDescriptionLong 
    ? movie.description 
    : movie.description.slice(0, 200) + '...';

  return (
    <Layout>
      <div className="mb-6">
        <Link 
          to="/movies" 
          className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Movies
        </Link>
      </div>

      <div className="card">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{movie.title}</h1>
          <p className="text-lg text-gray-600">{movie.genre}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed">
            {displayDescription}
          </p>
          {isDescriptionLong && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-2 text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate this movie</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleRating(1)}
              disabled={ratingLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                userRating === 1
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-green-50 hover:border-green-300'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span>Like</span>
            </button>

            <button
              onClick={() => handleRating(0)}
              disabled={ratingLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                userRating === 0
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300'
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span>Dislike</span>
            </button>

            {ratingLoading && <LoadingSpinner size="sm" />}
          </div>

          {userRating !== null && (
            <p className="mt-3 text-sm text-gray-600">
              You {userRating === 1 ? 'liked' : 'disliked'} this movie
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MovieDetail;
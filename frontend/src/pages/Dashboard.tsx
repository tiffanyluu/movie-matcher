import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { recommendationsAPI } from '../services/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Recommendation } from '../types';

const Dashboard: React.FC = () => {
  const { recommendationsKey } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered, recommendationsKey:', recommendationsKey);
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching recommendations...');
        const data = await recommendationsAPI.getRecommendations(10);
        console.log('✅ Got recommendations:', data.recommendations.length, 'movies');
        setRecommendations(data.recommendations);
        setError('');
      } catch (err) {
        const error = err as AxiosError<{ error: string }>;
        setError(error.response?.data?.error || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
  
    fetchRecommendations();
  }, [recommendationsKey]);

  const handleMovieClick = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Layout currentPage="dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Movie Recommendations</h2>
        <p className="text-gray-600">Based on your ratings and preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((movie, index) => (
          <div
            key={movie.id}
            onClick={() => handleMovieClick(movie.id)}
            className="movie-card flex items-start space-x-4"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
              {index + 1}
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-900 mb-1">{movie.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{movie.genre}</p>
              <p className="text-sm text-primary-600 italic">{movie.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="card max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">
              Rate some movies to get personalized recommendations!
            </p>
            <Link to="/movies" className="btn-primary">
              Browse Movies
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
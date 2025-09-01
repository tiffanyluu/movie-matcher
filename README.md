# 🍿 MovieMatcher 🎬

MovieMatcher is a movie recommendation system that uses **machine learning algorithms** to deliver personalized film suggestions through **hybrid collaborative filtering** with **real-time Redis caching**.  
It combines user rating patterns with genre preferences using ML techniques to generate accurate recommendations with explanations in under 2ms.

<p align="center">
  <img src="images/pic.png" alt="moviematcher homepage" width="400"/>
</p>

## **Live Demo:** [MovieMatcher](https://movie-matcher-tiffany.vercel.app/)

### Features

- **Hybrid ML Recommendations**: Collaborative filtering with genre-based fallback for comprehensive suggestions
- **Real-Time Caching**: Sub-2ms recommendation responses with Redis cache invalidation on user actions
- **User Authentication**: JWT-based auth with 7-day token expiration and protected routes
- **Movie Rating System**: Thumbs up/down interface with persistent rating storage

### Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL for user data, movies, and ratings
- **Caching**: Redis for recommendation performance optimization
- **Testing**: Vitest (unit tests) + Playwright (E2E across 3 browsers)
- **CI/CD**: GitHub Actions pipeline with automated testing
- **Deployment**: Frontend (Vercel) + Backend (Render) + Database (Supabase)

### How It Works

1. **User Ratings** – Rate movies with thumbs up/down to build preference profile
2. **Collaborative Filtering** – ML algorithm finds users with similar rating patterns for recommendations  
3. **Genre-Based Fallback** – Machine learning model uses genre preferences when collaborative data is limited
4. **Cache Optimization** – Redis stores computed ML recommendations with real-time invalidation
5. **Personalized Results** – Display top recommendations with ML-generated explanations

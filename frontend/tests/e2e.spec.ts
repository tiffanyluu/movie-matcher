// frontend/tests/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('signup → browse → rate → recommendations flow', async ({ page }) => {
    // Generate unique email for this test run
    const uniqueEmail = `e2e-test-${Date.now()}@example.com`;
    const userName = 'E2E Test User';
    
    // 1. SIGNUP FLOW
    await page.goto('/signup');
    
    // Fill out signup form using actual form field names
    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('text=Your Movie Recommendations')).toBeVisible();

    // 2. BROWSE MOVIES FLOW
    await page.goto('/movies');
    
    // Should see the movies page header (the h2, not the nav link)
    await expect(page.getByRole('heading', { name: 'Browse Movies' })).toBeVisible();
    
    // Should see movies in the grid (using MovieCard components)
    await expect(page.locator('.movie-card').first()).toBeVisible();
    
    // Click on first movie card to see details
    await page.locator('.movie-card').first().click();
    
    // Should navigate to movie detail page
    await expect(page.url()).toContain('/movies/');
    await expect(page.locator('text=Description')).toBeVisible();

    // 3. RATING FLOW - Thumbs Up
    // Should see rating buttons with Lucide icons
    await expect(page.locator('button:has-text("Like"):has(.lucide-thumbs-up)')).toBeVisible();
    await expect(page.locator('button:has-text("Dislike"):has(.lucide-thumbs-down)')).toBeVisible();
    
    // Rate movie positively
    await page.locator('button:has-text("Like"):has(.lucide-thumbs-up)').click();
    
    // Should see feedback that rating was saved
    await expect(page.locator('text=You liked this movie')).toBeVisible({ timeout: 5000 });

    // Go back to browse another movie  
    await page.goto('/movies');
    await page.locator('.movie-card').nth(1).click(); // Click second movie card

    // 4. RATING FLOW - Thumbs Down
    await page.locator('button:has-text("Dislike"):has(.lucide-thumbs-down)').click();
    await expect(page.locator('text=You disliked this movie')).toBeVisible({ timeout: 5000 });

    // 5. RECOMMENDATIONS FLOW
    await page.goto('/dashboard');
    
    // Should see personalized recommendations page
    await expect(page.locator('text=Your Movie Recommendations')).toBeVisible();
    
    // Should see recommendation cards
    await expect(page.locator('.movie-card').first()).toBeVisible();
    
    // 6. VERIFY RATING PERSISTENCE
    // Go back to a rated movie and verify the rating is remembered
    await page.goto('/movies');
    await page.locator('.movie-card').first().click(); // Go back to first movie we rated
    
    // The Like button should show as selected/active (green background)
    await expect(page.locator('button:has-text("Like"):has(.lucide-thumbs-up)')).toHaveClass(/bg-green/);
    
    // Navigation should work smoothly
    await page.goto('/movies');
    await expect(page.getByRole('heading', { name: 'Browse Movies' })).toBeVisible();
    
    // Profile should show user info in header
    await expect(page.locator(`text=Hello, ${userName}`)).toBeVisible();
  });

  test('authentication flow works correctly', async ({ page }) => {
    // Generate unique email for this test
    const uniqueEmail = `auth-test-${Date.now()}@example.com`;
    const userName = 'Auth Test User';
    
    // 1. CREATE USER FIRST
    await page.goto('/signup');
    await page.fill('input[name="name"]', userName);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Verify we can access protected routes while logged in
    await page.goto('/movies');
    await expect(page).toHaveURL('/movies');
    
    // 2. LOGOUT
    await page.goto('/dashboard'); // Go back to dashboard first
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login');
    
    // 3. LOGIN WITH CREATED USER  
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // 4. VERIFY PROTECTED ROUTES WORK AFTER LOGIN
    await page.goto('/movies');
    await expect(page).toHaveURL('/movies');
  });
});
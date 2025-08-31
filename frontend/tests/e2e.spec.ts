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
    // 1. LOGIN WITH EXISTING USER
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // 2. PROTECTED ROUTES
    // Should be able to access protected pages
    await page.goto('/movies');
    await expect(page).toHaveURL('/movies');
    
    // 3. LOGOUT (if you have logout functionality)
    // This would depend on how you implemented logout
    // await page.click('text=Logout');
    // await expect(page).toHaveURL('/login');
  });

  // test('handles errors gracefully', async ({ page }) => {
  //   // Test signup with existing email
  //   await page.goto('/signup');
    
  //   await page.fill('input[name="name"]', 'Test User');
  //   await page.fill('input[name="email"]', 'test@example.com'); // Already exists in mock data
  //   await page.fill('input[name="password"]', 'password123');
    
  //   await page.click('button[type="submit"]');
    
  //   // Should show exact error message from backend
  //   await expect(page.locator('text=Email exists.')).toBeVisible();
    
  //   // Test invalid login
  //   await page.goto('/login');
    
  //   await page.fill('input[name="email"]', 'wrong@example.com');
  //   await page.fill('input[name="password"]', 'wrongpassword');
  //   await page.click('button[type="submit"]');
    
  //   // Wait for the API call to complete and error to be processed
  //   await page.waitForTimeout(2000);
    
  //   // Check that we're still on the login page (didn't redirect)
  //   await expect(page).toHaveURL('/login');
    
  //   // And check for any error div with red text
  //   await expect(page.locator('div.text-red-600')).toBeVisible();
  // });
});
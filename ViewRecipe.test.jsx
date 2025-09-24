import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ViewRecipe from './ViewRecipe';
import { Recipe } from '@/entities/all';
import { BrowserRouter } from 'react-router-dom';

// Mocking dependencies
jest.mock('@/entities/all', () => ({
  Recipe: {
    filter: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mocking window.location.search
Object.defineProperty(window, 'location', {
  value: {
    search: '?id=123',
  },
  writable: true,
});

const mockRecipe = {
  id: '123',
  title: 'Test Recipe',
  description: 'A delicious test recipe.',
  image_url: 'https://example.com/image.jpg',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  created_by: 'test@example.com',
  created_date: new Date().toISOString(),
  ingredients: [{ quantity: '1', name: 'Test Ingredient' }],
  instructions: ['Step 1'],
  tags: ['test'],
};

describe('ViewRecipe', () => {
  it('should render only the video when both video and image are available', async () => {
    Recipe.filter.mockResolvedValue([mockRecipe]);

    render(
      <BrowserRouter>
        <ViewRecipe />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check that the video iframe is rendered
      const iframe = screen.getByTitle('Video de la receta');
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');

      // Check that the image is not rendered
      const image = screen.queryByAltText('Test Recipe');
      expect(image).not.toBeInTheDocument();
    });
  });
});
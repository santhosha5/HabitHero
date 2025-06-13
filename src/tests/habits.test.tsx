import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { RealtimeProvider } from '../contexts/RealtimeContext';
import HabitForm from '../components/habits/HabitForm';
import HabitList from '../components/habits/HabitList';
import HabitStreak from '../components/habits/HabitStreak';
import { habitService } from '../services/habitService';

// Mock the habit service
jest.mock('../services/habitService', () => ({
  habitService: {
    getUserHabits: jest.fn(),
    createHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    getHabitLocations: jest.fn(),
    completeHabit: jest.fn(),
    getHabitCompletions: jest.fn(),
    getHabitStreak: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock react-router-dom functions
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ habitId: 'test-habit-id' }),
}));

// Sample habit data
const mockHabits = [
  {
    id: 'test-habit-id',
    user_id: 'test-user-id',
    title: 'Morning Meditation',
    description: 'Start the day with 5 minutes of mindfulness',
    two_minute_version: 'Take 5 deep breaths',
    habit_stack: 'After I brush my teeth',
    category: 'Mindfulness',
    target_frequency: 7,
    is_active: true,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    id: 'test-habit-id-2',
    user_id: 'test-user-id',
    title: 'Daily Reading',
    description: 'Read for 30 minutes',
    two_minute_version: 'Read one page',
    habit_stack: 'After dinner',
    category: 'Learning',
    target_frequency: 5,
    is_active: true,
    created_at: '2023-01-02T00:00:00.000Z',
  },
];

const mockCompletions = [
  {
    id: 'completion-1',
    habit_id: 'test-habit-id',
    user_id: 'test-user-id',
    completed_at: '2023-05-01T10:00:00.000Z',
    points_earned: 10,
  },
  {
    id: 'completion-2',
    habit_id: 'test-habit-id',
    user_id: 'test-user-id',
    completed_at: '2023-05-02T10:00:00.000Z',
    points_earned: 10,
  },
];

describe('Habit Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HabitForm', () => {
    beforeEach(() => {
      (habitService.getUserHabits as jest.Mock).mockResolvedValue(mockHabits);
      (habitService.getHabitLocations as jest.Mock).mockResolvedValue([]);
    });

    it('renders form for creating a new habit', async () => {
      render(
        <MemoryRouter>
          <HabitForm />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Habit')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/habit title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2-minute version/i)).toBeInTheDocument();
      expect(screen.getByText(/habit stack/i)).toBeInTheDocument();
      expect(screen.getByText(/category/i)).toBeInTheDocument();
      expect(screen.getByText(/target frequency/i)).toBeInTheDocument();
    });

    it('submits form to create a new habit', async () => {
      (habitService.createHabit as jest.Mock).mockResolvedValue({
        id: 'new-habit-id',
        title: mockHabits[0].title,
        description: mockHabits[0].description,
        category: mockHabits[0].category,
        target_frequency: mockHabits[0].target_frequency,
        is_active: true,
        user_id: 'test-user-id'
      });

      render(
        <MemoryRouter>
          <HabitForm />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Create New Habit')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/habit title/i), {
        target: { value: 'Morning Meditation' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Start the day with 5 minutes of mindfulness' },
      });
      fireEvent.change(screen.getByLabelText(/2-minute version/i), {
        target: { value: 'Take 5 deep breaths' },
      });
      fireEvent.change(screen.getAllByRole('textbox')[2], { // Habit stack input
        target: { value: 'After I brush my teeth' },
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create habit/i }));

      await waitFor(() => {
        expect(habitService.createHabit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Morning Meditation',
            description: 'Start the day with 5 minutes of mindfulness',
            two_minute_version: 'Take 5 deep breaths',
            habit_stack: 'After I brush my teeth',
            user_id: 'test-user-id',
          })
        );
      });
    });

    it('loads and edits existing habit', async () => {
      (habitService.getUserHabits as jest.Mock).mockResolvedValue(mockHabits);

      render(
        <MemoryRouter>
          <HabitForm habitId="test-habit-id" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Habit')).toBeInTheDocument();
      });

      // Form should be pre-filled
      expect(screen.getByLabelText(/habit title/i)).toHaveValue('Morning Meditation');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Start the day with 5 minutes of mindfulness'
      );
      expect(screen.getByLabelText(/2-minute version/i)).toHaveValue('Take 5 deep breaths');

      // Update habit
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Updated description' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update habit/i }));

      await waitFor(() => {
        expect(habitService.updateHabit).toHaveBeenCalledWith(
          'test-habit-id',
          expect.objectContaining({
            description: 'Updated description',
          })
        );
      });
    });
  });

  describe('HabitList', () => {
    beforeEach(() => {
      (habitService.getUserHabits as jest.Mock).mockResolvedValue(mockHabits);
      (habitService.getHabitCompletions as jest.Mock).mockResolvedValue([]);
      (habitService.getHabitStreak as jest.Mock).mockResolvedValue({ currentStreak: 0, longestStreak: 0 });
    });

    it('renders list of habits', async () => {
      render(
        <MemoryRouter>
          <HabitList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
        expect(screen.getByText('Daily Reading')).toBeInTheDocument();
      });
    });

    it('completes a habit when clicked', async () => {
      (habitService.completeHabit as jest.Mock).mockResolvedValue({
        id: 'new-completion-id',
        habit_id: 'test-habit-id',
        user_id: 'test-user-id',
        completed_at: new Date().toISOString(),
        points_earned: 10,
      });

      render(
        <MemoryRouter>
          <HabitList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
      });

      // Find and click the complete button
      const completeButtons = screen.getAllByRole('button');
      fireEvent.click(completeButtons[0]); // First habit's complete button

      await waitFor(() => {
        expect(habitService.completeHabit).toHaveBeenCalledWith('test-habit-id');
      });
    });

    it('deletes a habit', async () => {
      (habitService.deleteHabit as jest.Mock).mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <HabitList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
      });

      // Open dropdown menu
      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find(button => 
        button.getAttribute('aria-label') === 'More options' ||
        button.textContent?.includes('More')
      );
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        // Find and click delete button
        const deleteButton = await screen.findByText('Delete');
        fireEvent.click(deleteButton);
        
        // Confirm deletion
        const confirmButton = await screen.findByText('Delete Habit');
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
          expect(habitService.deleteHabit).toHaveBeenCalledWith('test-habit-id');
        });
      }
    });
  });

  describe('HabitStreak', () => {
    it('displays the current streak', () => {
      render(<HabitStreak streak={5} maxStreak={10} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('(Best: 10)')).toBeInTheDocument();
    });

    it('displays zero streak when there is no streak', () => {
      render(<HabitStreak streak={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});

// Update HabitStreak component props
interface HabitStreakProps {
  habitId: string;
}
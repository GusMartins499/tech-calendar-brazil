import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import type { TechEvent } from '@/@types/tech-events-brazil-api-response';
import { authClient } from '@/app/lib/better-auth-client';
import { EventCard } from './event-card';

vi.mock('@/app/lib/better-auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

const mockOnlineEvent: TechEvent = {
  name: 'Next.js Conf',
  eventDays: '10 de Setembro de 2025',
  eventDate: ['10'],
  url: 'https://nextjs.org/conf',
  type: 'Online',
  badge: 'online',
  city: '',
  month: 'setembro',
  monthNumber: '9',
  uf: '',
};

const mockOnSiteEvent: TechEvent = {
  name: 'Next.js Conf',
  eventDays: '10 de Setembro de 2025',
  eventDate: ['10'],
  url: 'https://nextjs.org/conf',
  type: 'Presencial',
  badge: 'onSite',
  city: 'São Paulo',
  month: 'setembro',
  monthNumber: '9',
  uf: 'SP',
};

const mockHybridEvent: TechEvent = {
  name: 'Next.js Conf',
  eventDays: '10 de Setembro de 2025',
  eventDate: ['10'],
  url: 'https://nextjs.org/conf',
  type: 'Híbrido',
  badge: 'hybrid',
  city: 'Rio de Janeiro',
  month: 'setembro',
  monthNumber: '9',
  uf: 'RJ',
};

describe('EventCard', () => {
  beforeEach(() => {
    (authClient.useSession as Mock).mockReturnValue({
      data: {
        user: {
          id: '123',
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      },
      error: undefined,
    });
  });
  test('Should render an event card', () => {
    render(<EventCard event={mockOnlineEvent} />);
    expect(screen.getByTestId('tech-event-card')).toBeInTheDocument();
  });

  test('Should render an online event correctly', () => {
    render(<EventCard event={mockOnlineEvent} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockOnlineEvent.url
    );
    expect(screen.getByText(mockOnlineEvent.name)).toBeInTheDocument();
    expect(screen.getByText(mockOnlineEvent.eventDays)).toBeInTheDocument();
    expect(screen.getByTestId('tech-event-card-badge')).toHaveTextContent(
      'Online'
    );
  });

  test('Should render an on-site event correctly', () => {
    render(<EventCard event={mockOnSiteEvent} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockOnSiteEvent.url
    );
    expect(screen.getByText(mockOnSiteEvent.name)).toBeInTheDocument();
    expect(screen.getByText(mockOnSiteEvent.eventDays)).toBeInTheDocument();
    expect(screen.getByTestId('tech-event-card-badge')).toHaveTextContent(
      'Presencial'
    );
  });

  test('Should render a hybrid event correctly', () => {
    render(<EventCard event={mockHybridEvent} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockHybridEvent.url
    );
    expect(screen.getByText(mockHybridEvent.name)).toBeInTheDocument();
    expect(screen.getByText(mockHybridEvent.eventDays)).toBeInTheDocument();
    expect(screen.getByTestId('tech-event-card-badge')).toHaveTextContent(
      'Híbrido'
    );
  });

  test('Should be able to disable button', () => {
    (authClient.useSession as Mock).mockReturnValue({
      data: { user: null },
      error: undefined,
    });
    render(<EventCard event={mockOnlineEvent} />);

    expect(
      screen.getByRole('button', { name: /adicionar a minha agenda/i })
    ).toHaveProperty('disabled');
  });
});

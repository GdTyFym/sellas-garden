import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Garden from '@/app/garden/page';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { alt = '', ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} {...rest} />
    );
  }
}));

vi.mock('@/components/Fireflies', () => ({
  default: () => <div data-testid="fireflies" />
}));

vi.mock('@/components/Flower', () => ({
  default: () => <div data-testid="flower" />
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn()
  })
}));

describe('Garden', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the hero headline and tagline', () => {
    render(<Garden />);
    expect(screen.getByText(/Sebuah doa yang/i)).toBeInTheDocument();
    expect(screen.getByText(/tumbuh/i)).toBeInTheDocument();
    expect(screen.getByText(/Selamat ulang tahun/i)).toBeInTheDocument();
  });

  it('shows the pre-intro gate entry control', async () => {
    const user = userEvent.setup();
    render(<Garden />);
    await user.click(screen.getByRole('button', { name: /mulai/i }));
    expect(await screen.findByPlaceholderText(/tulis namamu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lanjut/i })).toBeInTheDocument();
  });

  it('shows the blooms counter label', () => {
    render(<Garden />);
    expect(screen.getByText(/blooms/i)).toBeInTheDocument();
  });
});

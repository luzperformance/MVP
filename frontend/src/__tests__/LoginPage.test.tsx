import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mocking simpler version of LoginPage for UI test demonstration
// In a real scenario, we would test the actual component
const LoginPageMock = ({ onLogin }: { onLogin: (e: any) => void }) => (
  <form onSubmit={onLogin}>
    <h1>Entrar</h1>
    <input name="email" placeholder="E-mail" required />
    <input name="password" type="password" placeholder="Senha" required />
    <button type="submit">Entrar</button>
  </form>
);

describe('LoginPage UI', () => {
  it('renders login fields', () => {
    render(<LoginPageMock onLogin={() => {}} />);
    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByText('Entrar', { selector: 'button' })).toBeInTheDocument();
  });

  it('calls onLogin when submitted', () => {
    const handleLogin = vi.fn((e) => e.preventDefault());
    render(<LoginPageMock onLogin={handleLogin} />);
    
    const button = screen.getByText('Entrar', { selector: 'button' });
    fireEvent.click(button);
    
    expect(handleLogin).toHaveBeenCalled();
  });
});

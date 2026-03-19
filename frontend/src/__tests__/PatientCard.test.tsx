import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// Mocking simple component for structure
const PatientCard = ({ name }: { name: string }) => <div>{name}</div>;

describe('PatientCard', () => {
    it('renders patient name', () => {
        render(<PatientCard name="João Silva" />);
        expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
});

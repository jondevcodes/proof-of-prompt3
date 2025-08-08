import { render, screen, fireEvent } from '@testing-library/react';
import VerifyPage from '../page';
import { verifyProof } from '@/utils/api';

jest.mock('@/utils/api', () => ({
  verifyProof: jest.fn()
}));

describe('VerifyPage', () => {
  it('shows verification result on successful submission', async () => {
    (verifyProof as jest.Mock).mockResolvedValue({
      verified: true,
      hash: '0x123...abc',
      blockchain: { tx_hash: '0x456...def' }
    });

    render(<VerifyPage />);
    
    fireEvent.change(screen.getByLabelText('Original Prompt'), {
      target: { value: 'Test prompt' }
    });
    
    fireEvent.change(screen.getByLabelText('AI Response'), {
      target: { value: 'Test response' }
    });
    
    fireEvent.click(screen.getByText('Verify Proof'));
    
    expect(await screen.findByText('Proof Verified')).toBeInTheDocument();
    expect(screen.getByText(/0x123...abc/i)).toBeInTheDocument();
  });

  it('shows error when verification fails', async () => {
    (verifyProof as jest.Mock).mockRejectedValue(new Error('Verification failed'));

    render(<VerifyPage />);
    
    fireEvent.change(screen.getByLabelText('Original Prompt'), {
      target: { value: 'Test prompt' }
    });
    
    fireEvent.change(screen.getByLabelText('AI Response'), {
      target: { value: 'Test response' }
    });
    
    fireEvent.click(screen.getByText('Verify Proof'));
    
    expect(await screen.findByText('Verification failed')).toBeInTheDocument();
  });
});
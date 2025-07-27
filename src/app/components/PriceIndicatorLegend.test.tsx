import { render, screen, fireEvent } from '@testing-library/react';
import PriceIndicatorLegend from './PriceIndicatorLegend';

describe('PriceIndicatorLegend', () => {
  it('renders the full variant by default', () => {
    render(<PriceIndicatorLegend />);
    
    expect(screen.getByText('How to Read Price Indicators')).toBeInTheDocument();
    expect(screen.getByText('Excellent Deal')).toBeInTheDocument();
    expect(screen.getByText('Good Deal')).toBeInTheDocument();
    expect(screen.getByText('Fair Price')).toBeInTheDocument();
    expect(screen.getByText('Expensive')).toBeInTheDocument();
    expect(screen.getByText('Overpriced')).toBeInTheDocument();
  });

  it('renders compact variant when specified', () => {
    render(<PriceIndicatorLegend variant="compact" />);
    
    expect(screen.getByText('Price Indicators:')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Expensive')).toBeInTheDocument();
    expect(screen.getByText('Overpriced')).toBeInTheDocument();
  });

  it('expands and collapses when toggle button is clicked', () => {
    render(<PriceIndicatorLegend />);
    
    const toggleButton = screen.getByLabelText('Expand explanation');
    expect(toggleButton).toBeInTheDocument();
    
    // Initially collapsed - detailed content should not be visible
    expect(screen.queryByText('How Price Indicators Work')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(toggleButton);
    expect(screen.getByText('How Price Indicators Work')).toBeInTheDocument();
    expect(screen.getByText('Price Indicator Categories')).toBeInTheDocument();
    expect(screen.getByText('Investment Insights')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('How Price Indicators Work')).not.toBeInTheDocument();
  });

  it('displays all price indicator categories with correct descriptions', () => {
    render(<PriceIndicatorLegend />);
    
    // Expand the accordion
    const toggleButton = screen.getByLabelText('Expand explanation');
    fireEvent.click(toggleButton);
    
    // Check that all categories are displayed with their descriptions
    expect(screen.getByText('10%+ below 24-month average')).toBeInTheDocument();
    expect(screen.getByText('5-10% below 24-month average')).toBeInTheDocument();
    expect(screen.getByText('Within 5% of 24-month average')).toBeInTheDocument();
    expect(screen.getByText('5-10% above 24-month average')).toBeInTheDocument();
    expect(screen.getByText('10%+ above 24-month average')).toBeInTheDocument();
  });

  it('shows investment insights when expanded', () => {
    render(<PriceIndicatorLegend />);
    
    // Expand the accordion
    const toggleButton = screen.getByLabelText('Expand explanation');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Look for "Excellent" and "Good" deals:')).toBeInTheDocument();
    expect(screen.getByText('"Fair Price" properties:')).toBeInTheDocument();
    expect(screen.getByText('Be cautious with "Expensive" properties:')).toBeInTheDocument();
    expect(screen.getByText('Avoid "Overpriced" properties:')).toBeInTheDocument();
  });
}); 
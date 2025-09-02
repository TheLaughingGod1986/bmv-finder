const { PortfolioService } = require('../src/lib/services/portfolioService');

async function testPortfolioService() {
  const portfolioService = new PortfolioService();
  
  try {
    console.log('Testing Portfolio Service...');
    
    // Test creating a portfolio
    console.log('\n1. Creating portfolio...');
    const portfolio = await portfolioService.createPortfolio(
      'test-user-123',
      'Test Portfolio',
      'A test portfolio for development'
    );
    console.log('✅ Portfolio created:', portfolio);
    
    // Test getting user portfolios
    console.log('\n2. Getting user portfolios...');
    const portfolios = await portfolioService.getUserPortfolios('test-user-123');
    console.log('✅ User portfolios:', portfolios);
    
    // Test getting portfolio details
    console.log('\n3. Getting portfolio details...');
    const portfolioDetails = await portfolioService.getPortfolio(portfolio.id);
    console.log('✅ Portfolio details:', portfolioDetails);
    
  } catch (error) {
    console.error('❌ Portfolio service test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testPortfolioService();

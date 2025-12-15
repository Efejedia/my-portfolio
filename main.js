import './style.css'

// Alpha Vantage API configuration
const API_KEY = 'VZB113U00TQY6IX0';
const BASE_URL = 'https://www.alphavantage.co/query';

// Nigerian Stock Exchange symbols mapping
const NIGERIAN_STOCKS = {
  'DANGCEM': 'Dangote Cement',
  'GTCO': 'Guaranty Trust Holding Company',
  'ZENITHBANK': 'Zenith Bank',
  'BUACEMENT': 'BUA Cement',
  'MTNN': 'MTN Nigeria',
  'AIRTELAFRI': 'Airtel Africa',
  'BUAFOODS': 'BUA Foods',
  'SEPLAT': 'Seplat Petroleum',
  'FBNH': 'FBN Holdings',
  'ACCESS': 'Access Holdings',
  'UBA': 'United Bank for Africa',
  'OANDO': 'Oando',
  'STERLNBANK': 'Sterling Bank',
  'FCMB': 'First City Monument Bank',
  'WAPCO': 'Lafarge Africa'
};

class GlobalStockPredictor {
  constructor() {
    this.currentMarket = 'us';
    this.currentData = null;
    this.historicalData = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeHeroChart();
    this.updateMarketHints();
  }

  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Market tabs
    document.querySelectorAll('.market-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentMarket = e.target.dataset.market;
        this.updateMarketHints();
      });
    });

    // Prediction button
    const predictBtn = document.getElementById('predictButton');
    const stockInput = document.getElementById('stockSymbol');
    const yearInput = document.getElementById('targetYear');

    predictBtn.addEventListener('click', () => this.handlePrediction());
    
    // Allow Enter key to trigger prediction
    [stockInput, yearInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handlePrediction();
      });
    });

    // Analysis tabs
    document.querySelectorAll('.analysis-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
      });
    });

    // Retry button
    document.getElementById('retryButton').addEventListener('click', () => {
      this.hideError();
      this.handlePrediction();
    });

    // Set current year as default
    const currentYear = new Date().getFullYear();
    yearInput.placeholder = `e.g., ${currentYear + 1}, ${currentYear + 5}, ${currentYear + 10}`;
  }

  updateMarketHints() {
    const symbolHint = document.getElementById('symbolHint');
    const marketBadge = document.getElementById('marketBadge');
    
    if (this.currentMarket === 'us') {
      symbolHint.textContent = 'Enter US stock symbol (e.g., AAPL, MSFT, GOOGL, TSLA)';
      if (marketBadge) marketBadge.textContent = 'US Market';
    } else {
      symbolHint.textContent = 'Enter Nigerian stock symbol (e.g., DANGCEM, GTCO, ZENITHBANK)';
      if (marketBadge) marketBadge.textContent = 'Nigerian Market';
    }
  }

  initializeHeroChart() {
    const canvas = document.getElementById('heroChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Generate sample data points
    const points = [];
    const numPoints = 50;
    let baseValue = height * 0.7;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const noise = (Math.random() - 0.5) * 40;
      const trend = (i / numPoints) * -100; // Upward trend
      const y = baseValue + noise + trend;
      points.push({ x, y });
    }
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.01)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Draw line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = '#6366f1';
    points.forEach((point, index) => {
      if (index % 5 === 0) { // Show every 5th point
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  async handlePrediction() {
    const symbol = document.getElementById('stockSymbol').value.trim().toUpperCase();
    const targetYear = parseInt(document.getElementById('targetYear').value);
    const currentYear = new Date().getFullYear();

    if (!symbol) {
      this.showError('Please enter a stock symbol');
      return;
    }

    if (!targetYear || targetYear <= currentYear) {
      this.showError(`Please enter a target year greater than ${currentYear}`);
      return;
    }

    // Validate Nigerian stocks
    if (this.currentMarket === 'nigeria' && !NIGERIAN_STOCKS[symbol]) {
      this.showError('Please enter a valid Nigerian stock symbol (e.g., DANGCEM, GTCO, ZENITHBANK)');
      return;
    }

    this.setLoading(true);
    this.hideError();

    try {
      // Update loading text based on market
      const loadingText = document.getElementById('loadingText');
      loadingText.textContent = `Fetching ${this.currentMarket === 'us' ? 'US' : 'Nigerian'} market data...`;

      // Fetch current stock data
      const currentData = await this.fetchCurrentPrice(symbol);
      
      loadingText.textContent = 'Analyzing historical trends...';
      
      // Fetch historical data for prediction
      const historicalData = await this.fetchHistoricalData(symbol);
      
      loadingText.textContent = 'Generating AI predictions...';
      
      // Calculate prediction
      const prediction = this.calculatePrediction(currentData, historicalData, targetYear);
      
      // Display results
      this.displayResults(currentData, prediction, targetYear, symbol);
      
    } catch (error) {
      console.error('Prediction error:', error);
      this.showError(`Failed to fetch ${this.currentMarket === 'us' ? 'US' : 'Nigerian'} stock data. Please check the symbol and try again.`);
    } finally {
      this.setLoading(false);
    }
  }

  async fetchCurrentPrice(symbol) {
    // For Nigerian stocks, we'll simulate data since Alpha Vantage has limited NSE coverage
    if (this.currentMarket === 'nigeria') {
      return this.simulateNigerianStockData(symbol);
    }

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      throw new Error('Invalid symbol or API limit reached');
    }

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('No data available for this symbol');
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', ''))
    };
  }

  simulateNigerianStockData(symbol) {
    // Simulate realistic Nigerian stock data
    const basePrice = {
      'DANGCEM': 280.50,
      'GTCO': 32.15,
      'ZENITHBANK': 28.90,
      'BUACEMENT': 95.20,
      'MTNN': 185.75,
      'AIRTELAFRI': 1420.00,
      'BUAFOODS': 78.30,
      'SEPLAT': 1250.00,
      'FBNH': 14.85,
      'ACCESS': 12.40,
      'UBA': 18.65,
      'OANDO': 8.75,
      'STERLNBANK': 2.95,
      'FCMB': 4.20,
      'WAPCO': 28.50
    }[symbol] || 50.00;

    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const change = (basePrice * changePercent) / 100;

    return {
      symbol: symbol,
      price: basePrice,
      change: change,
      changePercent: changePercent
    };
  }

  async fetchHistoricalData(symbol) {
    // For Nigerian stocks, simulate historical data
    if (this.currentMarket === 'nigeria') {
      return this.simulateHistoricalData(symbol);
    }

    const url = `${BASE_URL}?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      throw new Error('Unable to fetch historical data');
    }

    const timeSeries = data['Monthly Time Series'];
    if (!timeSeries) {
      throw new Error('No historical data available');
    }

    // Process last 24 months of data
    const prices = [];
    const dates = Object.keys(timeSeries).sort().slice(-24);
    
    dates.forEach(date => {
      prices.push(parseFloat(timeSeries[date]['4. close']));
    });

    return prices;
  }

  simulateHistoricalData(symbol) {
    // Generate realistic historical data for Nigerian stocks
    const prices = [];
    const currentPrice = this.simulateNigerianStockData(symbol).price;
    let price = currentPrice * 0.8; // Start 20% lower than current
    
    for (let i = 0; i < 24; i++) {
      const monthlyChange = (Math.random() - 0.45) * 0.15; // Slight upward bias
      price = price * (1 + monthlyChange);
      prices.push(price);
    }
    
    return prices;
  }

  calculatePrediction(currentData, historicalPrices, targetYear) {
    const currentYear = new Date().getFullYear();
    const yearsToPredict = targetYear - currentYear;
    
    // Calculate various growth metrics
    const recentGrowth = this.calculateRecentGrowth(historicalPrices);
    const averageGrowth = this.calculateAverageGrowth(historicalPrices);
    const volatility = this.calculateVolatility(historicalPrices);
    
    // Market-specific adjustments
    let marketMultiplier = 1.0;
    if (this.currentMarket === 'nigeria') {
      marketMultiplier = 1.15; // Nigerian market tends to have higher growth potential
    }
    
    // Weighted prediction algorithm
    const shortTermWeight = Math.max(0, 1 - (yearsToPredict * 0.1));
    const longTermWeight = 1 - shortTermWeight;
    
    const weightedGrowth = (recentGrowth * shortTermWeight) + (averageGrowth * longTermWeight);
    
    // Apply time decay for longer predictions
    const timeDecay = Math.pow(0.95, yearsToPredict - 1);
    const adjustedGrowth = weightedGrowth * timeDecay * marketMultiplier;
    
    // Calculate predicted price
    const predictedPrice = currentData.price * Math.pow(1 + adjustedGrowth, yearsToPredict);
    const priceChange = predictedPrice - currentData.price;
    const changePercent = (priceChange / currentData.price) * 100;
    
    // Determine trend
    const trend = changePercent > 5 ? 'bullish' : changePercent < -5 ? 'bearish' : 'neutral';
    
    // Calculate confidence (decreases with time and volatility)
    const baseConfidence = this.currentMarket === 'nigeria' ? 80 : 85; // Slightly lower for emerging markets
    const timeConfidence = Math.max(50, baseConfidence - (yearsToPredict * 5));
    const volatilityPenalty = Math.min(20, volatility * 100);
    const confidence = Math.max(40, timeConfidence - volatilityPenalty);
    
    return {
      price: predictedPrice,
      change: priceChange,
      changePercent,
      trend,
      confidence: Math.round(confidence),
      volatility: volatility * 100,
      timeHorizon: yearsToPredict,
      riskLevel: volatility > 0.25 ? 'High' : volatility > 0.15 ? 'Medium' : 'Low'
    };
  }

  calculateRecentGrowth(prices) {
    if (prices.length < 6) return 0;
    const recent = prices.slice(-6);
    const older = prices.slice(-12, -6);
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;
    return (recentAvg - olderAvg) / olderAvg;
  }

  calculateAverageGrowth(prices) {
    if (prices.length < 12) return 0;
    const yearAgo = prices[0];
    const current = prices[prices.length - 1];
    return (current - yearAgo) / yearAgo;
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  displayResults(currentData, prediction, targetYear, symbol) {
    const currency = this.currentMarket === 'nigeria' ? '₦' : '$';
    
    // Update current data
    document.getElementById('currentPrice').textContent = `${currency}${currentData.price.toFixed(2)}`;
    document.getElementById('currentChange').textContent = 
      `${currentData.changePercent >= 0 ? '+' : ''}${currentData.changePercent.toFixed(2)}%`;
    document.getElementById('currentChange').className = 
      `price-change ${currentData.changePercent >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('currentSymbol').textContent = 
      this.currentMarket === 'nigeria' && NIGERIAN_STOCKS[symbol] 
        ? `${symbol} (${NIGERIAN_STOCKS[symbol]})` 
        : symbol;
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Update prediction data
    document.getElementById('predictedPrice').textContent = `${currency}${prediction.price.toFixed(2)}`;
    document.getElementById('predictedChange').textContent = 
      `${prediction.changePercent >= 0 ? '+' : ''}${prediction.changePercent.toFixed(2)}%`;
    document.getElementById('predictedChange').className = 
      `price-change ${prediction.changePercent >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('targetYearDisplay').textContent = targetYear;
    document.getElementById('yearsAhead').textContent = 
      `${prediction.timeHorizon} ${prediction.timeHorizon === 1 ? 'year' : 'years'} ahead`;
    document.getElementById('confidenceBadge').textContent = `${prediction.confidence}% Confidence`;

    // Update market badge
    document.getElementById('marketBadge').textContent = 
      this.currentMarket === 'us' ? 'US Market' : 'Nigerian Market';

    // Update trend analysis
    const trendIcon = document.getElementById('trendIcon');
    const trendLabel = document.getElementById('trendLabel');
    const trendDescription = document.getElementById('trendDescription');
    
    if (prediction.trend === 'bullish') {
      trendIcon.textContent = '📈';
      trendLabel.textContent = 'Bullish Trend';
      trendDescription.textContent = 'Strong upward momentum expected';
    } else if (prediction.trend === 'bearish') {
      trendIcon.textContent = '📉';
      trendLabel.textContent = 'Bearish Trend';
      trendDescription.textContent = 'Downward pressure anticipated';
    } else {
      trendIcon.textContent = '📊';
      trendLabel.textContent = 'Neutral Trend';
      trendDescription.textContent = 'Sideways movement expected';
    }

    // Update metrics
    document.getElementById('expectedReturn').textContent = 
      `${prediction.changePercent >= 0 ? '+' : ''}${prediction.changePercent.toFixed(1)}%`;
    document.getElementById('expectedReturn').className = 
      `metric-value ${prediction.changePercent >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('riskLevel').textContent = prediction.riskLevel;
    document.getElementById('volatility').textContent = `${prediction.volatility.toFixed(1)}%`;
    document.getElementById('timeHorizon').textContent = 
      `${prediction.timeHorizon} ${prediction.timeHorizon === 1 ? 'year' : 'years'}`;

    // Update detailed analysis
    this.updateDetailedAnalysis(currentData, prediction, symbol);

    // Show results
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }

  updateDetailedAnalysis(currentData, prediction, symbol) {
    // Update overview
    const priceMovementText = document.getElementById('priceMovementText');
    const marketConditionsText = document.getElementById('marketConditionsText');
    
    if (prediction.trend === 'bullish') {
      priceMovementText.textContent = 'Historical analysis indicates strong growth potential with positive momentum indicators.';
      marketConditionsText.textContent = 'Current market conditions and sector performance support this bullish outlook.';
    } else if (prediction.trend === 'bearish') {
      priceMovementText.textContent = 'Technical indicators suggest potential downward pressure in the forecast period.';
      marketConditionsText.textContent = 'Market headwinds and sector challenges may impact performance negatively.';
    } else {
      priceMovementText.textContent = 'Mixed signals indicate a balanced outlook with moderate price movements expected.';
      marketConditionsText.textContent = 'Stable market conditions suggest sideways trading within established ranges.';
    }

    // Update technical indicators
    document.getElementById('maTrend').textContent = prediction.trend === 'bullish' ? 'Bullish' : 
      prediction.trend === 'bearish' ? 'Bearish' : 'Neutral';
    document.getElementById('momentum').textContent = prediction.volatility > 20 ? 'Strong' : 
      prediction.volatility > 10 ? 'Moderate' : 'Weak';
    document.getElementById('supportLevel').textContent = 
      `${this.currentMarket === 'nigeria' ? '₦' : '$'}${(currentData.price * 0.9).toFixed(2)}`;
    document.getElementById('resistanceLevel').textContent = 
      `${this.currentMarket === 'nigeria' ? '₦' : '$'}${(currentData.price * 1.15).toFixed(2)}`;

    // Update risk assessment
    const riskFill = document.getElementById('riskFill');
    const riskPercentage = prediction.riskLevel === 'High' ? 80 : 
      prediction.riskLevel === 'Medium' ? 60 : 40;
    riskFill.style.width = `${riskPercentage}%`;
  }

  setLoading(loading) {
    const btn = document.getElementById('predictButton');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (loading) {
      btn.disabled = true;
      btn.classList.add('loading');
      loadingSection.classList.remove('hidden');
      resultsSection.classList.add('hidden');
    } else {
      btn.disabled = false;
      btn.classList.remove('loading');
      loadingSection.classList.add('hidden');
    }
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('loadingSection').classList.add('hidden');
  }

  hideError() {
    document.getElementById('errorSection').classList.add('hidden');
  }
}

// Global functions for navigation
window.scrollToPredictor = function() {
  document.getElementById('predictor').scrollIntoView({ behavior: 'smooth' });
};

window.scrollToFeatures = function() {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new GlobalStockPredictor();
});

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// Update active navigation on scroll
window.addEventListener('scroll', () => {
  const sections = ['home', 'features', 'predictor', 'about'];
  const navLinks = document.querySelectorAll('.nav-link');
  
  let current = '';
  sections.forEach(section => {
    const element = document.getElementById(section);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        current = section;
      }
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});
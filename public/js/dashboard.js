// Dashboard module
const Dashboard = (function() {
  // Initialize dashboard
  function init() {
    console.log('Initializing dashboard...');
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Listen for settings changes
    $(document).on('settingsChanged', function() {
      console.log('Dashboard detected settings change');
      loadDashboardData();
    });
  }
  
  // Load dashboard data
  function loadDashboardData() {
    // Get data from localStorage or API
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const cars = JSON.parse(localStorage.getItem('cars') || '[]');
    const revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
    
    // Update dashboard UI
    updateDashboardStats(rentals, cars, revenue);
    updateRecentRentals(rentals);
    updateCarAvailability(cars);
  }
  
  // Update dashboard statistics
  function updateDashboardStats(rentals, cars, revenue) {
    // Calculate statistics
    const activeRentals = rentals.filter(r => !r.returned);
    const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    // Calculate monthly revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRevenue = revenue
      .filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    // Update the UI with statistics
    $('#totalCars').text(cars.length);
    $('#availableCars').text(cars.filter(c => !c.isRented).length);
    $('#activeRentals').text(activeRentals.length);
    
    // Update revenue figures with data attributes for currency formatting
    $('#totalRevenue')
      .attr('data-value', totalRevenue)
      .text(formatCurrency(totalRevenue));
      
    $('#monthlyRevenue')
      .attr('data-value', monthlyRevenue)
      .text(formatCurrency(monthlyRevenue));
  }
  
  // Helper function to format currency using AppSettings if available
  function formatCurrency(amount) {
    if (typeof AppSettings !== 'undefined' && AppSettings.formatCurrency) {
      return AppSettings.formatCurrency(amount);
    } else {
      // Fallback
      const symbol = localStorage.getItem('appSettings') ? 
        JSON.parse(localStorage.getItem('appSettings')).currency || 'K' : 'K';
      return `${symbol} ${parseFloat(amount).toFixed(2)}`;
    }
  }
  
  // Update recent rentals list
  function updateRecentRentals(rentals) {
    // ... existing code ...
  }
  
  // Update car availability
  function updateCarAvailability(cars) {
    // ... existing code ...
  }
  
  // Set up event handlers
  function setupEventHandlers() {
    // ... existing code ...
  }
  
  // Return public API
  return {
    init: init
  };
})();

$(document).on('settingsChanged', function() {
    console.log('Dashboard detected settings change');
    updateDashboardStats();
});

function updateDashboardStats() {
    // ...existing code...
    
    $('#totalRevenue').text(AppSettings.formatCurrency(totalRevenue));
    $('#currentMonthRevenue').text(AppSettings.formatCurrency(monthlyRevenue));
    // ...other currency displays...
} 
// Dashboard module
const Dashboard = (function() {
  // Load Dashboard (available cars and active rentals)
  function loadDashboard() {
    console.log('Loading dashboard...');
    
    // Load all rentals to properly count active ones
    $.get('/api/rentals', function(rentals) {
      console.log('Rentals loaded:', rentals.length);
      
      const today = new Date();
      
      // Filter for active rentals - those that haven't been returned and are within their rental period
      const activeRentals = rentals.filter(rental => {
        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        
        return !rental.returnDate && today >= startDate && today <= endDate;
      });
      
      console.log('Active rentals count:', activeRentals.length);
      $('#activeRentalsCount').text(activeRentals.length);
      
      // Load cars to show available ones
      $.get('/api/cars', function(cars) {
        console.log('Cars loaded:', cars.length);
        
        // Get IDs of cars that are in active rentals
        const rentedCarIds = activeRentals.map(rental => {
          return rental.car?._id || rental.carId;
        });
        
        // Filter available cars (not in active rentals)
        const availableCars = cars.filter(car => !rentedCarIds.includes(car._id));
        
        // Update dashboard counts
        $('#totalFleet').text(cars.length);
        $('#availableCarsCount').text(availableCars.length);
        
        // Update active rentals list (if it exists on the dashboard)
        if ($('#activeRentalsList').length) {
          updateActiveRentalsList(activeRentals);
        }
        
        // Update available cars list (if it exists on the dashboard)
        if ($('#availableCarsContent').length) {
          updateAvailableCarsList(availableCars);
        }
      });
    });
  }

  // Load available cars (for Dashboard's available cars section)
  function loadAvailableCars() {
    // Get both cars and active rentals to cross-reference
    $.when(
      $.get('/api/cars'),
      $.get('/api/rentals/active')
    ).done(function(carsResponse, rentalsResponse) {
      const cars = carsResponse[0];
      const activeRentals = rentalsResponse[0];
      
      // Get IDs of cars that are currently rented
      const rentedCarIds = activeRentals.map(rental => rental.car._id);
      
      // Filter out rented cars
      const availableCars = cars.filter(car => !rentedCarIds.includes(car._id));
      
      let availableHtml = '<h4>Available Cars</h4>';
      if (availableCars.length === 0) {
        availableHtml += '<p>No cars available.</p>';
      } else {
        availableHtml += '<ul class="list-group">';
        availableCars.forEach(function(car) {
          availableHtml += `<li class="list-group-item">${car.make} ${car.model} (${car.year || ''})</li>`;
        });
        availableHtml += '</ul>';
      }
      $('#availableCarsContent').html(availableHtml);
    }).fail(function() {
      $('#availableCarsContent').html('<p class="text-danger">Failed to load available cars.</p>');
    });
  }

  // Add refresh method to be called after adding a rental
  function refreshDashboard() {
    loadDashboard();
  }

  // Public interface
  return {
    init: function() {
      loadDashboard();
      setupEventHandlers();
    },
    refreshDashboard: function() {
      loadDashboard();
    },
    loadSummaryStats: function() {
      // If you have this function
      loadSummaryStats();
    }
  };
})(); 
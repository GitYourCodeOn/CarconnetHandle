// Dashboard module
const Dashboard = (function() {
  // Load Dashboard (available cars and active rentals)
  function loadDashboard() {
    console.log('Loading dashboard...'); // Debug log
    
    // Load cars and rentals
    $.when(
        $.get('/api/cars'),
        $.get('/api/rentals/active')
    ).done(function(carsResponse, rentalsResponse) {
        console.log('Data received:', { cars: carsResponse[0], rentals: rentalsResponse[0] }); // Debug log
        
        const cars = carsResponse[0];
        const activeRentals = rentalsResponse[0];
        
        // Get IDs of cars that are currently rented
        const rentedCarIds = activeRentals.map(rental => rental.car._id);
        
        // Filter available cars (not in active rentals)
        const availableCars = cars.filter(car => !rentedCarIds.includes(car._id));
        
        // Update stats
        $('#totalFleet').text(cars.length);
        $('#activeRentals').text(activeRentals.length);
        $('#availableCars').text(availableCars.length);

        // Update available cars list
        let availableCarsHtml = '';
        if (availableCars.length === 0) {
            availableCarsHtml = '<div class="alert alert-info">No cars available at the moment</div>';
        } else {
            availableCarsHtml = '<div class="list-group">';
            availableCars.forEach(car => {
                availableCarsHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-1">${car.make} ${car.model} (${car.year || ''})</h5>
                                <small class="text-muted">Mileage: ${car.mileage} km</small>
                            </div>
                            <button class="btn btn-sm btn-success rent-now-btn" data-id="${car._id}">
                                Rent Now
                            </button>
                        </div>
                    </div>`;
            });
            availableCarsHtml += '</div>';
        }
        $('#availableCarsContent').html(availableCarsHtml);

        // Update active rentals list
        let activeRentalsHtml = '';
        if (activeRentals.length === 0) {
            activeRentalsHtml = '<div class="alert alert-info">No active rentals at the moment</div>';
        } else {
            activeRentalsHtml = '<div class="list-group">';
            activeRentals.forEach(rental => {
                const now = new Date().getTime();
                const start = new Date(rental.rentalDate).getTime();
                const end = new Date(rental.returnDate).getTime();
                const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100));
                const isCompleted = now >= end;
                
                // Calculate time remaining only if not completed
                let timeRemainingHtml = '';
                if (!isCompleted) {
                    const timeLeft = end - now;
                    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    
                    timeRemainingHtml = `
                        <small class="text-${timeLeft < 86400000 ? 'danger' : 'info'}">
                            Time Remaining: ${daysLeft}d ${hoursLeft}h ${minutesLeft}m
                        </small>`;
                }
                
                activeRentalsHtml += `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="mb-0">${rental.car && rental.car.make ? `${rental.car.make} ${rental.car.model} (${rental.car.year || ''})` : 'N/A'}</h5>
                            <span class="badge badge-${isCompleted ? 'danger' : 'success'}">
                                ${isCompleted ? 'Completed' : 'Active'}
                            </span>
                        </div>
                        <p class="mb-2">
                            <strong>Customer:</strong> ${rental.customerName}<br>
                            <strong>Start:</strong> ${new Date(rental.rentalDate).toLocaleString('en-GB')}<br>
                            <strong>End:</strong> ${new Date(rental.returnDate).toLocaleString('en-GB')}
                        </p>
                        <div class="progress mb-2">
                            <div class="progress-bar ${isCompleted ? 'bg-danger' : 'bg-success'}" 
                                role="progressbar" 
                                style="width: ${progress}%;" 
                                aria-valuenow="${progress}" 
                                aria-valuemin="0" 
                                aria-valuemax="100">
                                ${progress}%
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            ${timeRemainingHtml}
                            <div class="btn-group">
                                ${isCompleted ? `
                                    <button class="btn btn-danger btn-sm clear-rental-btn" data-id="${rental._id}" data-completed="true">
                                        Clear Rental
                                    </button>
                                    <button class="btn btn-info btn-sm extend-rental-btn" data-id="${rental._id}">
                                        Extend
                                    </button>
                                    <button class="btn btn-secondary btn-sm add-notes-btn" data-id="${rental._id}">
                                        Add Notes
                                    </button>
                                ` : `
                                    <button class="btn btn-success btn-sm complete-rental-btn" data-id="${rental._id}">
                                        Completed
                                    </button>
                                    <button class="btn btn-danger btn-sm overdue-rental-btn" data-id="${rental._id}">
                                        Overdue
                                    </button>
                                    <button class="btn btn-info btn-sm extend-rental-btn" data-id="${rental._id}">
                                        Extend
                                    </button>
                                    <button class="btn btn-secondary btn-sm add-notes-btn" data-id="${rental._id}">
                                        Add Notes
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>`;
            });
            activeRentalsHtml += '</div>';
        }
        $('#activeRentalsContent').html(activeRentalsHtml);
    }).fail(function(error) {
        console.error('Error loading dashboard:', error);
        $('#availableCarsContent').html('<div class="alert alert-danger">Failed to load available cars</div>');
        $('#activeRentalsContent').html('<div class="alert alert-danger">Failed to load active rentals</div>');
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

  return {
    loadDashboard: loadDashboard,
    loadAvailableCars: loadAvailableCars
  };
})(); 
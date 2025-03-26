// Data analysis module
const Data = (function() {
  // Initialize the data tab
  function initializeData() {
    console.log('Initializing Data module...');
    loadDataAnalytics();
    setupEventListeners();
    loadRentalLogs();
    setupSimpleEventHandlers();
  }

  // Load data analytics from localStorage or API
  function loadDataAnalytics() {
    // Get rentals from localStorage
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const cars = JSON.parse(localStorage.getItem('cars') || '[]');
    const customers = extractUniqueCustomers(rentals);
    
    updateRentalStatistics(rentals);
    updateCarUtilisation(cars, rentals);
    updateCustomerAnalysis(customers, rentals);
    updateRevenueAnalysis(rentals);
    
    // For demonstration, this would typically be more sophisticated
    // and might use actual chart libraries like Chart.js
    initializeDummyCharts();
  }

  // Extract unique customers from rentals
  function extractUniqueCustomers(rentals) {
    const uniqueCustomers = {};
    
    rentals.forEach(rental => {
      if (rental.customerName) {
        if (!uniqueCustomers[rental.customerName]) {
          uniqueCustomers[rental.customerName] = {
            name: rental.customerName,
            email: rental.customerEmail || '',
            phone: rental.customerPhone || '',
            rentalCount: 1,
            totalSpent: parseFloat(rental.totalCost) || 0
          };
        } else {
          uniqueCustomers[rental.customerName].rentalCount++;
          uniqueCustomers[rental.customerName].totalSpent += parseFloat(rental.totalCost) || 0;
        }
      }
    });
    
    return Object.values(uniqueCustomers);
  }

  // Update rental statistics section
  function updateRentalStatistics(rentals) {
    const today = new Date();
    const activeRentals = rentals.filter(rental => {
      const endDate = rental.endDate ? new Date(rental.endDate) : null;
      return endDate && endDate >= today;
    });
    
    // Calculate average rental duration
    let totalDays = 0;
    rentals.forEach(rental => {
      if (rental.startDate && rental.endDate) {
        const start = new Date(rental.startDate);
        const end = new Date(rental.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        totalDays += days;
      }
    });
    
    const avgDuration = rentals.length > 0 ? Math.round(totalDays / rentals.length) : 0;
    
    // Calculate revenue this month
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const thisMonthRentals = rentals.filter(rental => {
      const rentalDate = rental.startDate ? new Date(rental.startDate) : null;
      return rentalDate && 
             rentalDate.getMonth() === currentMonth && 
             rentalDate.getFullYear() === currentYear;
    });
    
    let monthlyRevenue = 0;
    thisMonthRentals.forEach(rental => {
      monthlyRevenue += parseFloat(rental.totalCost) || 0;
    });
    
    // Update the UI
    $('#totalRentalsCount').text(rentals.length);
    $('#activeRentalsCount').text(activeRentals.length);
    $('#avgRentalDuration').text(`${avgDuration} days`);
    $('#monthlyRevenue').text(`£${monthlyRevenue.toFixed(2)}`);
  }

  // Update car utilisation section
  function updateCarUtilisation(cars, rentals) {
    if (cars.length === 0) {
      $('#totalCarsCount').text('0');
      $('#utilisationRate').text('0%');
      $('#mostRentedCar').text('N/A');
      $('#leastRentedCar').text('N/A');
      return;
    }
    
    // Count rentals per car
    const carRentalCounts = {};
    cars.forEach(car => {
      carRentalCounts[car._id] = {
        count: 0,
        name: `${car.make} ${car.model}`
      };
    });
    
    rentals.forEach(rental => {
      if (rental.carId && carRentalCounts[rental.carId]) {
        carRentalCounts[rental.carId].count++;
      }
    });
    
    // Calculate utilisation
    const today = new Date();
    const activeRentals = rentals.filter(rental => {
      const endDate = rental.endDate ? new Date(rental.endDate) : null;
      return endDate && endDate >= today;
    });
    
    const utilisationRate = Math.round((activeRentals.length / cars.length) * 100);
    
    // Find most and least rented cars
    let mostRented = { count: -1, name: 'N/A' };
    let leastRented = { count: Infinity, name: 'N/A' };
    
    Object.values(carRentalCounts).forEach(car => {
      if (car.count > mostRented.count) {
        mostRented = car;
      }
      if (car.count < leastRented.count) {
        leastRented = car;
      }
    });
    
    // Update the UI
    $('#totalCarsCount').text(cars.length);
    $('#utilisationRate').text(`${utilisationRate}%`);
    $('#mostRentedCar').text(mostRented.name);
    $('#leastRentedCar').text(leastRented.name);
  }

  // Update customer analysis section
  function updateCustomerAnalysis(customers, rentals) {
    if (customers.length === 0) {
      $('#repeatCustomersBar').css('width', '0%').text('0%');
      $('#avgRentalsPerCustomer').text('0');
      $('#topCustomersList').html('<li class="list-group-item text-center text-muted">No customer data available</li>');
      return;
    }
    
    // Calculate repeat customers (customers with more than 1 rental)
    const repeatCustomers = customers.filter(customer => customer.rentalCount > 1);
    const repeatPercentage = Math.round((repeatCustomers.length / customers.length) * 100);
    
    // Calculate average rentals per customer
    const avgRentals = (rentals.length / customers.length).toFixed(1);
    
    // Sort customers by rental count for top customers
    customers.sort((a, b) => b.rentalCount - a.rentalCount);
    const topCustomers = customers.slice(0, 5);
    
    // Update the UI
    $('#repeatCustomersBar').css('width', `${repeatPercentage}%`).text(`${repeatPercentage}%`);
    $('#avgRentalsPerCustomer').text(avgRentals);
    
    if (topCustomers.length > 0) {
      let topCustomersHtml = '';
      topCustomers.forEach(customer => {
        topCustomersHtml += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${customer.name}
            <span class="badge badge-primary badge-pill">${customer.rentalCount} rentals</span>
          </li>
        `;
      });
      $('#topCustomersList').html(topCustomersHtml);
    }
  }

  // Update revenue analysis section
  function updateRevenueAnalysis(rentals) {
    let totalRevenue = 0;
    
    rentals.forEach(rental => {
      totalRevenue += parseFloat(rental.totalCost) || 0;
    });
    
    // Update the UI
    $('#totalRevenue').text(`£${totalRevenue.toFixed(2)}`);
  }

  // Initialize placeholder charts (in real app, would use Chart.js or similar)
  function initializeDummyCharts() {
    // For demonstration purposes
    $('#rentalTrendsChart').html(`
      <div class="alert alert-info">
        <i class="fas fa-info-circle mr-2"></i>
        Sample charts would be rendered here with real data using a library like Chart.js
      </div>
      <img src="https://via.placeholder.com/800x300?text=Monthly+Rental+Trends+Chart" class="img-fluid" alt="Sample chart">
    `);
    
    $('#monthlyRevenueChart').html(`
      <div class="alert alert-info">
        <i class="fas fa-info-circle mr-2"></i>
        Sample charts would be rendered here with real data
      </div>
      <img src="https://via.placeholder.com/400x200?text=Monthly+Revenue+Chart" class="img-fluid" alt="Sample chart">
    `);
  }

  // Set up event listeners for the data tab
  function setupEventListeners() {
    // Export buttons
    $('#exportRentalsCSV').click(function() {
      exportToCSV('rentals');
    });
    
    $('#exportCarsCSV').click(function() {
      exportToCSV('cars');
    });
    
    $('#exportCustomersCSV').click(function() {
      exportToCSV('customers');
    });
  }

  // Export data to CSV file
  function exportToCSV(dataType) {
    let data = [];
    let filename = '';
    let headers = [];
    
    switch(dataType) {
      case 'rentals':
        data = JSON.parse(localStorage.getItem('rentals') || '[]');
        filename = 'rentals-export.csv';
        headers = ['ID', 'Customer', 'Car', 'Start Date', 'End Date', 'Total Cost'];
        break;
      case 'cars':
        data = JSON.parse(localStorage.getItem('cars') || '[]');
        filename = 'cars-export.csv';
        headers = ['ID', 'Make', 'Model', 'Year', 'Registration', 'Mileage', 'Owner'];
        break;
      case 'customers':
        const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
        data = extractUniqueCustomers(rentals);
        filename = 'customers-export.csv';
        headers = ['Name', 'Email', 'Phone', 'Rental Count', 'Total Spent'];
        break;
    }
    
    if (data.length === 0) {
      alert(`No ${dataType} data available to export.`);
      return;
    }
    
    // Generate CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      let row = [];
      
      switch(dataType) {
        case 'rentals':
          row = [
            item._id || '',
            item.customerName || '',
            item.carName || '',
            item.startDate || '',
            item.endDate || '',
            item.totalCost || '0'
          ];
          break;
        case 'cars':
          row = [
            item._id || '',
            item.make || '',
            item.model || '',
            item.year || '',
            item.registration || '',
            item.mileage || '',
            item.ownerName || ''
          ];
          break;
        case 'customers':
          row = [
            item.name || '',
            item.email || '',
            item.phone || '',
            item.rentalCount || '0',
            item.totalSpent || '0'
          ];
          break;
      }
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function loadRentalLogs() {
    console.log('Loading rental logs...');
    $('#rentalLogsTable tbody').html('<tr><td colspan="9" class="text-center">Loading rentals...</td></tr>');
    
    fetch('/api/rentals')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Rental logs loaded:', data.length);
        if (data && data.length > 0) {
          updateRentalLogsTable(data);
        } else {
          $('#rentalLogsTable tbody').html('<tr><td colspan="9" class="text-center">No rentals found</td></tr>');
        }
      })
      .catch(error => {
        console.error('Error loading rental logs:', error);
        $('#rentalLogsTable tbody').html('<tr><td colspan="9" class="text-center text-danger">Failed to load rentals</td></tr>');
      });
  }

  function updateRentalLogsTable(rentals) {
    const tbody = $('#rentalLogsTable tbody');
    tbody.empty();

    rentals.forEach(rental => {
      const startDate = new Date(rental.rentalDate || rental.startDate);
      const endDate = new Date(rental.returnDate || rental.endDate);
      const today = new Date();
      
      // Status calculation
      let statusClass = 'badge-secondary';
      let statusText = 'Unknown';
      
      if (rental.returned) {
        statusClass = 'badge-success';
        statusText = 'Returned';
      } else if (today > endDate) {
        statusClass = 'badge-danger';
        statusText = 'Overdue';
      } else if (today >= startDate && today <= endDate) {
        statusClass = 'badge-primary';
        statusText = 'Active';
      } else if (today < startDate) {
        statusClass = 'badge-info';
        statusText = 'Upcoming';
      }

      // Car info
      let carInfo = 'Unknown Car';
      if (rental.car) {
        if (typeof rental.car === 'object') {
          carInfo = `${rental.car.make || ''} ${rental.car.model || ''} ${rental.car.registration ? `(${rental.car.registration})` : ''}`.trim();
        } else {
          carInfo = `Car #${rental.car}`;
        }
      }

      // Calculate duration
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 0;

      // Calculate time remaining
      let timeRemaining = '';
      if (!rental.returned) {
        const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        timeRemaining = remainingDays > 0 ? `${remainingDays} days` : 'Due today';
        if (remainingDays < 0) {
          timeRemaining = `${Math.abs(remainingDays)} days overdue`;
        }
      } else {
        timeRemaining = 'Completed';
      }

      const row = `
        <tr>
          <td>${carInfo}</td>
          <td>${rental.customerName || 'Unknown'}</td>
          <td>${rental.customerPhone || rental.customerEmail || ''}</td>
          <td>${startDate.toLocaleDateString()}</td>
          <td>${endDate.toLocaleDateString()}</td>
          <td>ZMW ${(rental.rentalFee || 0).toFixed(2)}</td>
          <td>${durationDays} days</td>
          <td>${timeRemaining}</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-sm btn-warning add-note-btn" data-id="${rental._id}">
              <i class="fas fa-plus-circle"></i> Note
            </button>
            <button class="btn btn-sm btn-info add-document-btn" data-id="${rental._id}">
              <i class="fas fa-upload"></i> Doc
            </button>
          </td>
        </tr>`;
      tbody.append(row);
    });
  }

  function setupSimpleEventHandlers() {
    // Note button click handler
    $('#rentalLogsTable').on('click', '.add-note-btn', function() {
        const rentalId = $(this).data('id');
        console.log('Note button clicked for rental:', rentalId);
        $('#dataAddNoteRentalId').val(rentalId);
        loadRentalNotes(rentalId);
        $('#dataAddNoteModal').modal('show');
    });

    // Save note handler with retry logic
    $('#dataSaveNoteBtn').on('click', function() {
        const rentalId = $('#dataAddNoteRentalId').val();
        const noteContent = $('#dataNoteContent').val().trim();
        
        if (!noteContent) {
            alert('Please enter a note');
            return;
        }

        console.log('Saving note for rental:', rentalId);
        
        // Add loading state
        $('#dataSaveNoteBtn').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...');
        
        const saveNote = function(retryCount = 0) {
            $.ajax({
                url: `/api/rentals/${rentalId}/notes`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    noteContent: noteContent,
                    author: 'User'
                }),
                success: function(response) {
                    console.log('Note saved successfully:', response);
                    $('#dataAddNoteModal').modal('hide');
                    $('#dataNoteContent').val('');
                    loadRentalLogs();
                },
                error: function(xhr, status, error) {
                    console.error('Failed to save note:', error);
                    if (xhr.status === 409 && retryCount < 3) {
                        // Refresh and retry
                        console.log('Version conflict, retrying...');
                        loadRentalLogs().then(() => {
                            setTimeout(() => saveNote(retryCount + 1), 1000);
                        });
                    } else {
                        alert('Failed to save note: ' + (xhr.responseJSON?.message || 'Server error'));
                    }
                },
                complete: function() {
                    if (xhr.status !== 409 || retryCount >= 3) {
                        $('#dataSaveNoteBtn').prop('disabled', false).html('Save Note');
                    }
                }
            });
        };

        saveNote();
    });

    // Function to load existing notes
    function loadRentalNotes(rentalId) {
        $.get(`/api/rentals/${rentalId}/notes`, function(notes) {
            const notesList = $('#dataAddNoteModal .existing-notes-list');
            notesList.empty();
            
            if (notes && notes.length > 0) {
                notes.forEach(note => {
                    const date = new Date(note.timestamp).toLocaleString();
                    notesList.append(`
                        <div class="note-entry mb-2 p-2 border-left border-primary">
                            <div class="note-content">${note.content}</div>
                            <small class="text-muted">Added on ${date}</small>
                        </div>
                    `);
                });
            } else {
                notesList.html('<p class="text-muted">No notes yet</p>');
            }
        });
    }

    // Add modal hidden event handler
    $('#dataAddNoteModal').on('hidden.bs.modal', function () {
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');
    });

    // Add close button handler
    $('#dataAddNoteModal .close, #dataAddNoteModal .btn-secondary').on('click', function() {
        $('#dataAddNoteModal').modal('hide');
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');
    });
  }

  // Return public methods
  return {
    initializeData: initializeData
  };
})(); 
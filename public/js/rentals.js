// Rentals module
const Rentals = (function() {
  // Initialize rentals tab
  function init() {
    loadRentals();
    setupEventHandlers();
  }

  // Load all rentals and display them in the table
  function loadRentals() {
    console.log('Loading rentals...');
    $.get('/api/rentals', function(rentals) {
      console.log('Rentals received:', rentals.length);
      updateRentalsTable(rentals);
    }).fail(function(error) {
      console.error('Failed to load rentals:', error);
      Main.showAlert('Failed to load rentals.', 'danger');
    });
  }

  // Update the rentals table with the latest data
  function updateRentalsTable(rentals) {
    let rows = '';
    
    rentals.forEach(function(rental) {
      // Determine rental status
      let statusClass = 'badge-secondary';
      let statusText = 'Unknown';
      
      const today = new Date();
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      
      if (rental.returnDate) {
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
      
      // Load car and customer details
      let carInfo = 'Loading...';
      let customerInfo = 'Loading...';
      
      if (rental.carDetails) {
        carInfo = `${rental.carDetails.make} ${rental.carDetails.model} (${rental.carDetails.registration || 'No Reg'})`;
      }
      
      if (rental.customerDetails) {
        customerInfo = rental.customerDetails.name;
      }
      
      rows += `
        <tr>
          <td>${carInfo}</td>
          <td>${customerInfo}</td>
          <td>${Main.formatDate(rental.startDate)}</td>
          <td>${Main.formatDate(rental.endDate)}</td>
          <td>${Main.formatMoney(rental.totalAmount)}</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
          <td>
            <div class="dropdown">
              <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
                Actions
              </button>
              <div class="dropdown-menu">
                <a class="dropdown-item view-rental-btn" href="#" data-id="${rental._id}">View Details</a>
                <a class="dropdown-item edit-rental-btn" href="#" data-id="${rental._id}">Edit</a>
                ${!rental.returnDate ? 
                  `<a class="dropdown-item return-rental-btn" href="#" data-id="${rental._id}">Mark Returned</a>` : ''}
                <div class="dropdown-divider"></div>
                <a class="dropdown-item delete-rental-btn" href="#" data-id="${rental._id}">Delete</a>
              </div>
            </div>
          </td>
        </tr>
      `;
    });
    
    $('#rentalsTable tbody').html(rows);
  }

  // Load rental details for view/edit
  function loadRentalDetails(rentalId, callback) {
    $.get(`/api/rentals/${rentalId}`, function(rental) {
      // Load car details
      $.get(`/api/cars/${rental.carId}`, function(car) {
        rental.carDetails = car;
        
        // Load customer details
        $.get(`/api/customers/${rental.customerId}`, function(customer) {
          rental.customerDetails = customer;
          
          if (typeof callback === 'function') {
            callback(rental);
          }
        });
      });
    });
  }

  // Calculate rental duration and total amount
  function calculateRental() {
    const startDate = new Date($('#rentalStartDate').val());
    const endDate = new Date($('#rentalEndDate').val());
    const dailyRate = parseFloat($('#rentalDailyRate').val());
    
    if (!startDate || !endDate || isNaN(dailyRate)) {
      $('#rentalDuration').val('');
      $('#rentalTotalAmount').val('');
      return;
    }
    
    // Calculate days difference
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    $('#rentalDuration').val(diffDays);
    $('#rentalTotalAmount').val((diffDays * dailyRate).toFixed(2));
  }

  // Helper function to validate and format dates
  function formatDateForAPI(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }

  // Setup event handlers for rentals tab
  function setupEventHandlers() {
    // Add rental button
    $('#addRentalBtn').click(function() {
      $('#addRentalModal').modal('show');
    });
    
    // View rental details
    $(document).on('click', '.view-rental-btn', function() {
      const rentalId = $(this).data('id');
      
      loadRentalDetails(rentalId, function(rental) {
        $('#rentalDetailsModal .modal-title').text('Rental Details');
        
        // Format the rental details for the modal
        const carInfo = rental.carDetails ? 
          `${rental.carDetails.make} ${rental.carDetails.model} (${rental.carDetails.registration || 'No Reg'})` : 'Unknown Car';
        
        const customerInfo = rental.customerDetails ? 
          rental.customerDetails.name : 'Unknown Customer';
        
        $('#rentalDetailsModal .modal-body').html(`
          <div class="row">
            <div class="col-md-6">
              <p><strong>Car:</strong> ${carInfo}</p>
              <p><strong>Customer:</strong> ${customerInfo}</p>
              <p><strong>Start Date:</strong> ${Main.formatDate(rental.startDate)}</p>
              <p><strong>End Date:</strong> ${Main.formatDate(rental.endDate)}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Duration:</strong> ${rental.duration} days</p>
              <p><strong>Daily Rate:</strong> ${Main.formatMoney(rental.dailyRate)}</p>
              <p><strong>Total Amount:</strong> ${Main.formatMoney(rental.totalAmount)}</p>
              <p><strong>Status:</strong> ${rental.returnDate ? 'Returned on ' + Main.formatDate(rental.returnDate) : 'Active'}</p>
            </div>
          </div>
          <hr>
          <h5>Additional Information</h5>
          <div class="row">
            <div class="col-md-12">
              <p><strong>Notes:</strong> ${rental.notes || 'No notes'}</p>
            </div>
          </div>
        `);
        
        // Set edit button ID
        $('#editRentalDetailsBtn').data('id', rentalId);
        
        // Show the modal
        $('#rentalDetailsModal').modal('show');
      });
    });
    
    // Edit rental button
    $(document).on('click', '.edit-rental-btn', function() {
      const rentalId = $(this).data('id');
      
      loadRentalDetails(rentalId, function(rental) {
        // Populate edit form
        $('#editRentalId').val(rentalId);
        $('#editRentalCarId').val(rental.carId);
        $('#editRentalCustomerId').val(rental.customerId);
        $('#editRentalStartDate').val(rental.startDate.split('T')[0]);
        $('#editRentalEndDate').val(rental.endDate.split('T')[0]);
        $('#editRentalDailyRate').val(rental.dailyRate);
        $('#editRentalDuration').val(rental.duration);
        $('#editRentalTotalAmount').val(rental.totalAmount);
        $('#editRentalNotes').val(rental.notes);
        
        // Show return date field if already returned
        if (rental.returnDate) {
          $('#editRentalReturnDate').val(rental.returnDate.split('T')[0]);
          $('#editRentalReturnDateGroup').show();
        } else {
          $('#editRentalReturnDate').val('');
          $('#editRentalReturnDateGroup').hide();
        }
        
        // Show the modal
        $('#editRentalModal').modal('show');
      });
    });
    
    // Return rental button
    $(document).on('click', '.return-rental-btn', function() {
      const rentalId = $(this).data('id');
      
      // Confirm return
      if (confirm('Are you sure you want to mark this rental as returned today?')) {
        const today = new Date().toISOString().split('T')[0];
        
        $.ajax({
          url: `/api/rentals/${rentalId}`,
          method: 'PATCH',
          data: JSON.stringify({ returnDate: today }),
          contentType: 'application/json',
          success: function() {
            loadRentals();
            Main.showAlert('Rental marked as returned', 'success');
          },
          error: function(error) {
            console.error('Error marking rental as returned:', error);
            Main.showAlert('Failed to mark rental as returned', 'danger');
          }
        });
      }
    });
    
    // Delete rental button
    $(document).on('click', '.delete-rental-btn', function() {
      const rentalId = $(this).data('id');
      
      if (confirm('Are you sure you want to delete this rental?')) {
        $.ajax({
          url: `/api/rentals/${rentalId}`,
          method: 'DELETE',
          success: function() {
            loadRentals();
            Main.showAlert('Rental deleted successfully', 'success');
          },
          error: function(error) {
            console.error('Error deleting rental:', error);
            Main.showAlert('Failed to delete rental', 'danger');
          }
        });
      }
    });
    
    // Add rental form submission
    $('#addRentalForm').submit(function(e) {
      e.preventDefault();
      
      // Get the required fields
      const car = $('select[name="car"]').val();
      const rentalFee = $('input[name="rentalFee"]').val();
      const startDate = $('input[name="rentalDate"]').val();
      const returnDate = $('input[name="returnDate"]').val();
      const customerName = $('input[name="customerName"]').val();
      const customerPhone = $('input[name="customerNumber"]').val();
      
      // Validate only the mandatory fields
      if (!car || !rentalFee || !startDate || !returnDate || !customerName || !customerPhone) {
        Main.showAlert('Please fill in all required fields: Car, Rental Fee, Dates, Customer Name, and Phone', 'danger');
        return;
      }
      
      // Prepare form data
      const formData = new FormData(document.getElementById('addRentalForm'));
      
      // Submit the form
      $.ajax({
        url: '/api/rentals',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
          $('#addRentalModal').modal('hide');
          Main.showAlert('Rental created successfully!', 'success');
          Rentals.loadRentals();
          document.getElementById('addRentalForm').reset();
        },
        error: function(xhr, status, error) {
          console.error('Error creating rental:', error);
          Main.showAlert('Failed to create rental: ' + (xhr.responseJSON?.message || error), 'danger');
        }
      });
    });
    
    // Calculate rental duration and total on date/rate change
    $('#rentalStartDate, #rentalEndDate, #rentalDailyRate').on('change', calculateRental);
    $('#editRentalStartDate, #editRentalEndDate, #editRentalDailyRate').on('change', function() {
      const startDate = new Date($('#editRentalStartDate').val());
      const endDate = new Date($('#editRentalEndDate').val());
      const dailyRate = parseFloat($('#editRentalDailyRate').val());
      
      if (!startDate || !endDate || isNaN(dailyRate)) {
        $('#editRentalDuration').val('');
        $('#editRentalTotalAmount').val('');
        return;
      }
      
      // Calculate days difference
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      $('#editRentalDuration').val(diffDays);
      $('#editRentalTotalAmount').val((diffDays * dailyRate).toFixed(2));
    });
    
    // Edit rental form submission
    $('#editRentalForm').submit(function(e) {
      e.preventDefault();
      
      const rentalId = $('#editRentalId').val();
      
      // Validate required fields
      const carId = $('#editRentalCarId').val();
      const customerId = $('#editRentalCustomerId').val();
      const startDateStr = $('#editRentalStartDate').val();
      const endDateStr = $('#editRentalEndDate').val();
      const dailyRate = parseFloat($('#editRentalDailyRate').val());
      
      if (!carId || !customerId || !startDateStr || !endDateStr || isNaN(dailyRate)) {
        Main.showAlert('Please fill in all required fields', 'danger');
        return;
      }
      
      // Format dates properly
      const startDate = formatDateForAPI(startDateStr);
      const endDate = formatDateForAPI(endDateStr);
      
      if (!startDate || !endDate) {
        Main.showAlert('Invalid date format', 'danger');
        return;
      }
      
      // Get form data
      const rentalData = {
        carId: carId,
        customerId: customerId,
        startDate: startDate,
        endDate: endDate,
        dailyRate: dailyRate,
        duration: $('#editRentalDuration').val(),
        totalAmount: $('#editRentalTotalAmount').val(),
        notes: $('#editRentalNotes').val()
      };
      
      // Add return date if present and valid
      const returnDateStr = $('#editRentalReturnDate').val();
      if (returnDateStr) {
        const returnDate = formatDateForAPI(returnDateStr);
        if (returnDate) {
          rentalData.returnDate = returnDate;
        }
      }
      
      // Submit the form
      $.ajax({
        url: `/api/rentals/${rentalId}`,
        method: 'PUT',
        data: JSON.stringify(rentalData),
        contentType: 'application/json',
        success: function() {
          // Close modal
          $('#editRentalModal').modal('hide');
          
          // Refresh rentals
          loadRentals();
          Main.showAlert('Rental updated successfully', 'success');
        },
        error: function(xhr, status, error) {
          console.error('Error updating rental:', xhr.responseText);
          Main.showAlert(`Failed to update rental: ${xhr.responseJSON?.message || error}`, 'danger');
        }
      });
    });
  }

  // Return public methods
  return {
    init: init,
    loadRentals: loadRentals,
    updateRentalsTable: updateRentalsTable
  };
})(); 
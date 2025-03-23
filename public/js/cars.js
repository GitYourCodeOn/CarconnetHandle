// Cars module
const Cars = (function() {
  // Get reminder color for the spanner button based on service due date
  function getReminderColor(car) {
    const today = new Date();
    const warningThreshold = 30; // 30 days for yellow warning
    const dangerThreshold = 7;   // 7 days for red warning
    
    // Check each reminder date
    let earliestDays = 365; // Default to a year if no reminders
    
    if (car.serviceDue) {
      const dueDate = new Date(car.serviceDue);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      earliestDays = Math.min(earliestDays, daysUntilDue);
    }
    
    if (car.taxDate) {
      const dueDate = new Date(car.taxDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      earliestDays = Math.min(earliestDays, daysUntilDue);
    }
    
    if (car.insuranceDate) {
      const dueDate = new Date(car.insuranceDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      earliestDays = Math.min(earliestDays, daysUntilDue);
    }
    
    if (car.tireChangeDate) {
      const dueDate = new Date(car.tireChangeDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      earliestDays = Math.min(earliestDays, daysUntilDue);
    }
    
    if (car.registrationDate) {
      const dueDate = new Date(car.registrationDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      earliestDays = Math.min(earliestDays, daysUntilDue);
    }
    
    // Determine color class based on earliest reminder
    if (earliestDays <= 0) {
      return 'bg-danger'; // Overdue
    } else if (earliestDays <= dangerThreshold) {
      return 'bg-danger'; // Due soon (red)
    } else if (earliestDays <= warningThreshold) {
      return 'bg-warning'; // Coming up (yellow)
    } else {
      return 'bg-success'; // All good (green)
    }
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  // Load cars and update dropdowns and the cars table with the spanner button.
  function loadCars() {
    console.log('Loading cars for dropdowns...');
    fetch('/api/cars')
      .then(response => response.json())
      .then(data => {
        console.log('Cars received:', data.length, 'cars');
        let rows = '';
        let options = '<option value="">Select a car</option>';
        data.forEach(function(car) {
          // Determine the spanner button color based on all reminder dates.
          const colorClass = getReminderColor(car);
          rows += `<tr>
            <td>${car.make}</td>
            <td>${car.model}</td>
            <td>${car.year || ''}</td>
            <td>${car.registration || ''}</td>
            <td>${car.mileage}</td>
            <td>${car.ownerName || ''}</td>
            <td>
              <button class="btn btn-sm spanner-btn ${colorClass} text-white" data-id="${car._id}" data-car='${JSON.stringify(car)}'>
                🔧
              </button>
            </td>
            <td>
              ${car.documents && car.documents.length ? 
                `<button class="btn btn-sm btn-info view-car-docs-btn" data-id="${car._id}">
                  <i class="fas fa-file mr-1"></i> View (${car.documents.length})
                </button>` : 
                `<button class="btn btn-sm btn-outline-secondary add-car-docs-btn" data-id="${car._id}">
                  <i class="fas fa-plus mr-1"></i> Add
                </button>`
              }
            </td>
            <td>
              <div class="dropdown">
                <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
                  Actions
                </button>
                <div class="dropdown-menu">
                  <a class="dropdown-item view-car-btn" href="#" data-id="${car._id}">View Details</a>
                  <a class="dropdown-item edit-car-btn" href="#" data-id="${car._id}">Edit</a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item delete-car-btn" href="#" data-id="${car._id}">Delete</a>
                </div>
              </div>
            </td>
          </tr>`;
          options += `<option value="${car._id}">${car.make} ${car.model} (${car.registration || ''})${car.colour ? ' - ' + car.colour : ''}</option>`;
        });
        $('#carsTable tbody').html(rows);
        // Update all car dropdowns (in rentals and finances)
        $('select[name="car"]').html(options);
        console.log('Updated car dropdowns with', data.length, 'options');
      })
      .catch(error => {
        console.error('Failed to load cars:', error);
        alert('Failed to load cars.');
      });
  }

  // Updates the cars table with the latest data.
  function updateCarsTable() {
    $.get('/api/cars', function(cars) {
      let rows = '';
      cars.forEach(function(car) {
        // Get reminder status color
        const colorClass = getReminderColor(car);
        
        // Count the number of reminders
        let reminderCount = 0;
        if (car.serviceDue) reminderCount++;
        if (car.taxDate) reminderCount++;
        if (car.insuranceDate) reminderCount++;
        if (car.registrationDate) reminderCount++;
        if (car.tireChangeDate) reminderCount++;
        if (car.customReminder) reminderCount++;
        
        // Count documents
        const documentsCount = car.documents ? car.documents.length : 0;
        
        rows += `<tr>
          <td>${car.make}</td>
          <td>${car.model}</td>
          <td>${car.year || ''}</td>
          <td>${car.registration || ''}</td>
          <td>${car.mileage}</td>
          <td>${car.ownerName || ''}</td>
          <td>
            <button class="btn btn-sm ${colorClass} text-white car-reminders-btn" data-id="${car._id}">
              ${reminderCount} <i class="fas fa-bell"></i>
            </button>
          </td>
          <td>
            ${documentsCount > 0 ? 
              `<button class="btn btn-sm btn-info view-car-docs-btn" data-id="${car._id}">
                <i class="fas fa-file mr-1"></i> View (${documentsCount})
              </button>` : 
              `<button class="btn btn-sm btn-outline-secondary add-car-docs-btn" data-id="${car._id}">
                <i class="fas fa-plus mr-1"></i> Add
              </button>`
            }
          </td>
          <td>
            <div class="dropdown">
              <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
                Actions
              </button>
              <div class="dropdown-menu">
                <a class="dropdown-item view-car-btn" href="#" data-id="${car._id}">View Details</a>
                <a class="dropdown-item edit-car-btn" href="#" data-id="${car._id}">Edit</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item delete-car-btn" href="#" data-id="${car._id}">Delete</a>
              </div>
            </div>
          </td>
        </tr>`;
      });
      $('#carsTable tbody').html(rows);
    });
  }

  // Set up event handlers for the cars tab
  function setupEventHandlers() {
    // View car details button
    $(document).on('click', '.view-car-btn', function() {
      const carId = $(this).data('id');
      $.get(`/api/cars/${carId}`, function(car) {
        $('#carDetailsModal .modal-title').text(`${car.make} ${car.model} Details`);
        $('#carDetailsModal .modal-body').html(`
          <div class="row">
            <div class="col-md-6">
              <p><strong>Make:</strong> ${car.make}</p>
              <p><strong>Model:</strong> ${car.model}</p>
              <p><strong>Year:</strong> ${car.year || 'N/A'}</p>
              <p><strong>Registration:</strong> ${car.registration || 'N/A'}</p>
              <p><strong>Mileage:</strong> ${car.mileage}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Owner:</strong> ${car.ownerName || 'N/A'}</p>
              <p><strong>Owner Contact:</strong> ${car.ownerContact || 'N/A'}</p>
              <p><strong>Owner Email:</strong> ${car.ownerEmail || 'N/A'}</p>
              <p><strong>Notes:</strong> ${car.notes || 'N/A'}</p>
            </div>
          </div>
          <hr>
          <h5>Reminders</h5>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Service Due:</strong> ${car.serviceDue ? formatDate(car.serviceDue) : 'Not set'}</p>
              <p><strong>Tax Due:</strong> ${car.taxDate ? formatDate(car.taxDate) : 'Not set'}</p>
              <p><strong>Insurance Due:</strong> ${car.insuranceDate ? formatDate(car.insuranceDate) : 'Not set'}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Registration Renewal:</strong> ${car.registrationDate ? formatDate(car.registrationDate) : 'Not set'}</p>
              <p><strong>Tire Change Due:</strong> ${car.tireChangeDate ? formatDate(car.tireChangeDate) : 'Not set'}</p>
              <p><strong>Custom Reminder:</strong> ${car.customReminderTitle ? `${car.customReminderTitle} (${formatDate(car.customReminderDate)})` : 'None'}</p>
            </div>
          </div>
        `);
        
        // Set edit button ID
        $('#editCarDetailsBtn').data('id', carId);
        
        // Show the modal
        $('#carDetailsModal').modal('show');
      });
    });
    
    // Edit car details button
    $(document).on('click', '#editCarDetailsBtn', function() {
      const carId = $('#editCarId').val();
      // Redirect or show edit form
      alert('Edit functionality would be implemented here for car ID: ' + carId);
    });
    
    // Delete car button
    $(document).on('click', '.delete-car-btn', function() {
      const carId = $(this).data('id');
      if (confirm('Are you sure you want to delete this car?')) {
        $.ajax({
          url: `/api/cars/${carId}`,
          method: 'DELETE',
          success: function() {
            updateCarsTable();
            showAlert('Car deleted successfully', 'success');
          },
          error: function(error) {
            console.error('Error deleting car:', error);
            showAlert('Failed to delete car', 'danger');
          }
        });
      }
    });

    // Add car form submission
    $('#addCarForm').submit(function(e) {
      e.preventDefault();
      
      // Create FormData object
      const formData = new FormData(this);
      
      // Submit the form
      $.ajax({
        url: '/api/cars',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
          console.log('Car added successfully:', response);
          
          // Reset form and refresh data
          $('#addCarForm')[0].reset();
          loadCars();
          showAlert('Car added successfully', 'success');
        },
        error: function(xhr, status, error) {
          console.error('Error adding car:', error);
          showAlert('Failed to add car: ' + (xhr.responseJSON?.message || error), 'danger');
        }
      });
    });
  }

  // Helper function to show alert/notification
  function showAlert(message, type = 'info') {
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
    
    // Append to alert container or create one if it doesn't exist
    if ($('#alertContainer').length === 0) {
      $('body').prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>');
    }
    
    const $alert = $(alertHtml);
    $('#alertContainer').append($alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
      $alert.alert('close');
    }, 5000);
  }

  // Initialize cars tab
  function initCars() {
    loadCars();
    setupEventHandlers();
  }

  return {
    loadCars: loadCars,
    updateCarsTable: updateCarsTable,
    setupEventHandlers: setupEventHandlers,
    initCars: initCars
  };
})(); 
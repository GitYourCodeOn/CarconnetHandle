// CarConnect Lusaka - Main JavaScript

// Global variables
let settings = {};
let activeTab = 'dashboard';

// Document Ready
$(document).ready(function() {
    // Initialize the application
    initApp();
    
    // Tab click event
    $('.nav-tabs a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
        
        // Get the tab ID
        const tabId = $(this).attr('href').substring(1);
        activeTab = tabId.replace('Tab', '');
        
        // Load tab content if not already loaded
        loadTabContent(activeTab);
        
        // Update URL hash
        window.location.hash = activeTab;
        
        // Store the active tab in localStorage
        localStorage.setItem('activeTab', activeTab);
    });
    
    // Check for URL hash on page load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if ($(`#${hash}Tab`).length) {
            $(`.nav-tabs a[href="#${hash}Tab"]`).tab('show');
            activeTab = hash;
            loadTabContent(activeTab);
        }
    } else {
        // Load default tab based on settings or localStorage
        const savedTab = localStorage.getItem('activeTab') || 'dashboard';
        $(`.nav-tabs a[href="#${savedTab}Tab"]`).tab('show');
        activeTab = savedTab;
        loadTabContent(activeTab);
    }
    
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Initialize popovers
    $('[data-toggle="popover"]').popover();
});

// Initialize application
function initApp() {
    // Load settings
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for data in localStorage
    checkLocalStorage();
}

// Load user settings
function loadSettings() {
    const savedSettings = localStorage.getItem('carConnectSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        applySettings();
    } else {
        // Default settings
        settings = {
            companyName: 'Car Connect Lusaka',
            currency: '£',
            dateFormat: 'DD/MM/YYYY',
            defaultPage: 'dashboard',
            enableEmailNotifications: false,
            emailAddress: '',
            reminderNotifications: true,
            rentalDueNotifications: true,
            reminderDays: 7,
            reminderCategories: ['Service', 'Insurance', 'Tax', 'Registration', 'Custom'],
            defaultReminderPriority: 'medium'
        };
        
        // Save default settings
        localStorage.setItem('carConnectSettings', JSON.stringify(settings));
    }
}

// Apply settings to UI
function applySettings() {
    // Set company name in header
    $('.app-title h1').text(settings.companyName);
    
    // Set currency symbol
    $('.currency-symbol').text(settings.currency);
    
    // Apply other settings
    if (settings.defaultPage && $(`#${settings.defaultPage}Tab`).length) {
        activeTab = settings.defaultPage;
    }
}

// Set up global event listeners
function setupEventListeners() {
    // Global search functionality
    $('#globalSearch').on('keyup', function(e) {
        if (e.key === 'Enter') {
            performGlobalSearch($(this).val());
        }
    });
    
    // Notification bell click
    $('#notificationBell').on('click', function() {
        loadNotifications();
    });
    
    // User profile dropdown
    $('#userProfile').on('click', function() {
        // Load user profile or show dropdown
    });
    
    // Window resize event
    $(window).on('resize', function() {
        adjustUIForScreenSize();
    });
    
    // Initial UI adjustment
    adjustUIForScreenSize();
}

// Check if data exists in localStorage
function checkLocalStorage() {
    // Check if cars data exists
    const cars = localStorage.getItem('cars');
    if (!cars) {
        localStorage.setItem('cars', JSON.stringify([]));
    }
    
    // Check if rentals data exists
    const rentals = localStorage.getItem('rentals');
    if (!rentals) {
        localStorage.setItem('rentals', JSON.stringify([]));
    }
    
    // Check if reminders data exists
    const reminders = localStorage.getItem('reminders');
    if (!reminders) {
        localStorage.setItem('reminders', JSON.stringify([]));
    }
}

// Load tab content via AJAX
function loadTabContent(tabName) {
    const tabContentDiv = $(`#${tabName}Tab`);
    
    // Only load content if the tab is empty
    if (tabContentDiv.children().length === 0) {
        showLoading(tabContentDiv);
        
        // Load content from HTML file
        $.ajax({
            url: `${tabName}.html`,
            type: 'GET',
            success: function(data) {
                tabContentDiv.html(data);
                hideLoading(tabContentDiv);
                
                // Initialize tab-specific functionality
                initializeTabFunctionality(tabName);
            },
            error: function(xhr, status, error) {
                console.error(`Error loading ${tabName} content:`, error);
                tabContentDiv.html(`
                    <div class="alert alert-danger mt-4">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        Error loading content. Please refresh the page and try again.
                    </div>
                `);
                hideLoading(tabContentDiv);
            }
        });
    } else {
        // Content already loaded, just initialize functionality
        initializeTabFunctionality(tabName);
    }
}

// Initialize tab-specific functionality
function initializeTabFunctionality(tabName) {
    switch(tabName) {
        case 'dashboard':
            if (typeof initializeDashboard === 'function') {
                initializeDashboard();
            }
            break;
        case 'cars':
            if (typeof initializeCars === 'function') {
                initializeCars();
            }
            break;
        case 'rentals':
            if (typeof initializeRentals === 'function') {
                initializeRentals();
            }
            break;
        case 'reminders':
            if (typeof initializeReminders === 'function') {
                initializeReminders();
            }
            break;
        case 'settings':
            if (typeof initializeSettings === 'function') {
                initializeSettings();
            }
            break;
    }
}

// Show loading spinner
function showLoading(element) {
    element.html(`
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p class="mt-2 text-muted">Loading content...</p>
        </div>
    `);
}

// Hide loading spinner
function hideLoading(element) {
    element.find('.loading-spinner').remove();
}

// Adjust UI based on screen size
function adjustUIForScreenSize() {
    const windowWidth = $(window).width();
    
    if (windowWidth < 768) {
        // Mobile adjustments
        $('.nav-tabs .nav-link').each(function() {
            const text = $(this).text().trim();
            const icon = $(this).find('i').clone();
            $(this).empty().append(icon);
            $(this).attr('title', text);
            $(this).tooltip({
                placement: 'bottom'
            });
        });
    } else {
        // Desktop adjustments
        $('.nav-tabs .nav-link').each(function() {
            $(this).tooltip('dispose');
        });
    }
}

// Perform global search
function performGlobalSearch(query) {
    if (!query || query.trim() === '') return;
    
    console.log(`Searching for: ${query}`);
    
    // Get data from localStorage
    const cars = JSON.parse(localStorage.getItem('cars') || '[]');
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    
    // Search in cars
    const matchedCars = cars.filter(car => 
        car.make.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.registration.toLowerCase().includes(query.toLowerCase()) ||
        (car.ownerName && car.ownerName.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Search in rentals
    const matchedRentals = rentals.filter(rental => 
        rental.customerName.toLowerCase().includes(query.toLowerCase()) ||
        rental.customerEmail.toLowerCase().includes(query.toLowerCase()) ||
        rental.customerNumber.includes(query) ||
        (rental.notes && rental.notes.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Search in reminders
    const matchedReminders = reminders.filter(reminder => 
        reminder.title.toLowerCase().includes(query.toLowerCase()) ||
        (reminder.description && reminder.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Display results
    showSearchResults(query, matchedCars, matchedRentals, matchedReminders);
}

// Display search results
function showSearchResults(query, cars, rentals, reminders) {
    // Create modal for search results
    const modal = $(`
        <div class="modal fade" id="searchResultsModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-search mr-2"></i>Search Results: "${query}"
                        </h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" id="searchResultTabs">
                            <li class="nav-item">
                                <a class="nav-link active" data-toggle="tab" href="#searchCarResults">
                                    Cars (${cars.length})
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-toggle="tab" href="#searchRentalResults">
                                    Rentals (${rentals.length})
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-toggle="tab" href="#searchReminderResults">
                                    Reminders (${reminders.length})
                                </a>
                            </li>
                        </ul>
                        <div class="tab-content mt-3" id="searchResultTabContent">
                            <div class="tab-pane fade show active" id="searchCarResults">
                                ${renderCarSearchResults(cars)}
                            </div>
                            <div class="tab-pane fade" id="searchRentalResults">
                                ${renderRentalSearchResults(rentals)}
                            </div>
                            <div class="tab-pane fade" id="searchReminderResults">
                                ${renderReminderSearchResults(reminders)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Remove any existing search results modal
    $('#searchResultsModal').remove();
    
    // Add to body and show
    $('body').append(modal);
    $('#searchResultsModal').modal('show');
}

// Render car search results
function renderCarSearchResults(cars) {
    if (cars.length === 0) {
        return `<div class="empty-state">
            <i class="fas fa-car"></i>
            <p>No cars found matching your search.</p>
        </div>`;
    }
    
    let html = `<div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Make & Model</th>
                    <th>Registration</th>
                    <th>Owner</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
            
    cars.forEach(car => {
        html += `<tr>
            <td>${car.make} ${car.model} (${car.year})</td>
            <td>${car.registration}</td>
            <td>${car.ownerName || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-info view-car-details" data-id="${car.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div>`;
    return html;
}

// Render rental search results
function renderRentalSearchResults(rentals) {
    if (rentals.length === 0) {
        return `<div class="empty-state">
            <i class="fas fa-calendar-alt"></i>
            <p>No rentals found matching your search.</p>
        </div>`;
    }
    
    let html = `<div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Car</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
            
    rentals.forEach(rental => {
        const car = getCar(rental.carId);
        const status = getRentalStatus(rental);
        
        html += `<tr>
            <td>${rental.customerName}</td>
            <td>${car ? `${car.make} ${car.model}` : 'Unknown'}</td>
            <td>${formatDate(rental.rentalDate)} - ${formatDate(rental.returnDate)}</td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">${status}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-info view-rental-details" data-id="${rental.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div>`;
    return html;
}

// Render reminder search results
function renderReminderSearchResults(reminders) {
    if (reminders.length === 0) {
        return `<div class="empty-state">
            <i class="fas fa-bell"></i>
            <p>No reminders found matching your search.</p>
        </div>`;
    }
    
    let html = `<div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
            
    reminders.forEach(reminder => {
        const status = getReminderStatus(reminder);
        
        html += `<tr>
            <td>${reminder.title}</td>
            <td>${formatDate(reminder.dueDate)}</td>
            <td>${reminder.type}</td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">${status}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-info view-reminder-details" data-id="${reminder.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div>`;
    return html;
}

// Get car by ID
function getCar(carId) {
    const cars = JSON.parse(localStorage.getItem('cars') || '[]');
    return cars.find(car => car.id === carId);
}

// Get rental status
function getRentalStatus(rental) {
    const now = new Date();
    const returnDate = new Date(rental.returnDate);
    
    if (rental.completed) {
        return 'Completed';
    } else if (now > returnDate) {
        return 'Overdue';
    } else {
        return 'Active';
    }
}

// Get reminder status
function getReminderStatus(reminder) {
    const now = new Date();
    const dueDate = new Date(reminder.dueDate);
    
    if (reminder.completed) {
        return 'Completed';
    } else if (now > dueDate) {
        return 'Overdue';
    } else {
        return 'Pending';
    }
}

// Format date according to settings
function formatDate(dateString) {
    const date = new Date(dateString);
    const format = settings.dateFormat || 'DD/MM/YYYY';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
    } else if (format === 'MM/DD/YYYY') {
        return `${month}/${day}/${year}`;
    } else {
        return `${year}-${month}-${day}`;
    }
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toast = $(`
        <div class="toast custom-toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="5000">
            <div class="toast-header bg-${type} text-white">
                <strong class="mr-auto">
                    <i class="fas ${getToastIcon(type)} mr-2"></i>${title}
                </strong>
                <button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `);
    
    // Create toast container if it doesn't exist
    if ($('.toast-container').length === 0) {
        $('body').append('<div class="toast-container"></div>');
    }
    
    // Add toast to container and show it
    $('.toast-container').append(toast);
    toast.toast('show');
    
    // Remove toast after it's hidden
    toast.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}

// Get icon for toast based on type
function getToastIcon(type) {
    switch(type) {
        case 'success':
            return 'fa-check-circle';
        case 'danger':
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Load modals
function loadModals() {
    if ($('#modalContainer').children().length === 0) {
        $.ajax({
            url: 'modals.html',
            type: 'GET',
            success: function(data) {
                $('#modalContainer').html(data);
            },
            error: function(xhr, status, error) {
                console.error('Error loading modals:', error);
            }
        });
    }
}

// ---------------------------
// Utility Functions
// ---------------------------

// Show alert messages to the user
function showAlert(message, type = 'info') {
  // Create alert HTML
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
  
  // Create alert container if it doesn't exist
  if (!$('#alertContainer').length) {
    $('body').append('<div id="alertContainer" style="position: fixed; top: 70px; right: 20px; z-index: 9999; width: 300px;"></div>');
  }
  
  // Add alert to container
  const $alert = $(alertHtml).appendTo('#alertContainer');
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    $alert.alert('close');
  }, 5000);
}

// Compute the color class based on the soonest upcoming reminder.
function getReminderColor(car) {
  const now = new Date();
  let minDiff = Infinity;
  const reminderDates = [];
  if (car.serviceDue) reminderDates.push(new Date(car.serviceDue));
  if (car.tireChangeDate) reminderDates.push(new Date(car.tireChangeDate));
  if (car.registrationDate) reminderDates.push(new Date(car.registrationDate));
  if (car.taxDate) reminderDates.push(new Date(car.taxDate));
  if (car.customReminder && car.customReminder.date) {
    reminderDates.push(new Date(car.customReminder.date));
  }
  reminderDates.forEach(d => {
    if (d > now) {
      const diffDays = (d - now) / (1000 * 60 * 60 * 24);
      if (diffDays < minDiff) {
        minDiff = diffDays;
      }
    }
  });
  if (minDiff === Infinity) {
    return "bg-success"; // No upcoming reminders set
  } else if (minDiff <= 7) {
    return "bg-danger";
  } else if (minDiff <= 30) {
    return "bg-warning";
  } else {
    return "bg-success";
  }
}

// ---------------------------
// Event Handlers
// ---------------------------
$(document).ready(function(){
  // Load rentals immediately on page load
  console.log('Document ready, loading rentals and cars...');
  
  // Initialize settings first
  loadSettings();
  
  // First load cars to populate all dropdowns
  $.get('/api/cars', function(cars) {
    console.log('Cars loaded on page init:', cars.length);
    
    // Store car data for future use
    window.carData = cars;
    
    // Create options HTML
    let options = '<option value="">Select Car</option>';
    cars.forEach(function(car) {
      options += `<option value="${car._id}">${car.make} ${car.model} (${car.registration || car.year || ''})</option>`;
    });
    
    // Store options HTML
    window.carOptions = options;
    
    // Update all car dropdowns in the page
    $('select[name="car"]').html(options);
    
    // Now load rentals after cars are loaded
    loadRentals();
  }).fail(function(error) {
    console.error('Failed to load cars on init:', error);
    alert('Failed to load car data. Please refresh the page.');
  });
  
  // Tab switching logic
  $('.nav-link').click(function(e){
    e.preventDefault();
    const target = $(this).data('target');
    $('.nav-link').removeClass('active');
    $(this).addClass('active');
    $('.tab-pane').removeClass('active');
    $(target).addClass('active');
    
    if(target === "#dashboardTab"){
      loadDashboard();
    } else if(target === "#carsTab"){
      updateCarsTable(); // use the renamed function for the cars tab
    } else if(target === "#rentalsTab"){
      // First load cars to ensure dropdown is populated
      $.get('/api/cars', function(cars) {
        console.log('Refreshing car dropdown for rentals tab with', cars.length, 'cars');
        
        // Create options HTML
        let options = '<option value="">Select Car</option>';
        cars.forEach(function(car) {
          options += `<option value="${car._id}">${car.make} ${car.model} (${car.registration || car.year || ''})</option>`;
        });
        
        // Update rental form car dropdown
        $('#addRentalForm select[name="car"]').html(options);
        
        // Then load rentals
        loadRentals();
      }).fail(function(error) {
        console.error('Failed to load cars for rentals tab:', error);
      });
    } else if(target === "#dataTab"){
      loadData();
    } else if(target === "#remindersTab"){
      loadReminders(); // load reminders data
    } else if(target === "#settingsTab"){
      loadSettings(); // load settings data
    }
  });
  
  // Handle Add Rental form submission
  $('#addRentalForm').submit(function(e) {
    e.preventDefault();
    
    // Create FormData object to handle file uploads
    const formData = new FormData(this);
    
    // Convert date fields to ISO format
    const rentalDate = new Date($('input[name="rentalDate"]').val()).toISOString();
    const returnDate = new Date($('input[name="returnDate"]').val()).toISOString();
    
    // Remove the original date fields and add the formatted ones
    formData.delete('rentalDate');
    formData.delete('returnDate');
    formData.append('rentalDate', rentalDate);
    formData.append('returnDate', returnDate);
    
    console.log('Submitting rental data with documents');
    
    $.ajax({
      url: '/api/rentals',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(response) {
        console.log('Rental created successfully:', response);
        $('#addRentalForm')[0].reset();
        $('#documentPreview').empty();
        loadDashboard();
        loadRentals();
        alert('Rental created successfully!');
      },
      error: function(xhr, status, error) {
        console.error('Error creating rental:', xhr.responseText);
        alert('Error creating rental: ' + (xhr.responseJSON?.error || error));
      }
    });
  });
});

// Main module for utility functions and global settings
const Main = (function() {
  // Application settings
  const settings = {
    currency: 'ZMW', // Default currency: Zambian Kwacha
    dateFormat: 'DD/MM/YYYY',
    theme: 'light'
  };

  // Format money amounts with currency symbol
  function formatMoney(amount) {
    return `${settings.currency} ${parseFloat(amount).toFixed(2)}`;
  }

  // Format date according to settings
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // UK format
  }

  // Generic function to show alerts/notifications
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
      $('body').prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999; width: 300px;"></div>');
    }
    
    const $alert = $(alertHtml);
    $('#alertContainer').append($alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
      $alert.alert('close');
    }, 5000);
  }

  // Export global utilities
  return {
    formatMoney: formatMoney,
    formatDate: formatDate,
    showAlert: showAlert,
    settings: settings
  };
})();

// Dashboard module
const Dashboard = (function() {
  // Initialize dashboard
  function init() {
    loadSummaryStats();
    loadRecentRentals();
    loadUpcomingReminders();
    setupEventHandlers();
  }

  // Refresh dashboard data
  function refresh() {
    loadSummaryStats();
    loadRecentRentals();
    loadUpcomingReminders();
  }

  // Load summary statistics for the dashboard
  function loadSummaryStats() {
    console.log('Loading dashboard summary stats...');
    
    // Get all rentals
    $.get('/api/rentals', function(rentals) {
      // Count active rentals
      const activeRentals = rentals.filter(rental => {
        return new Date(rental.endDate) >= new Date() && 
               (!rental.returnDate || new Date(rental.returnDate) >= new Date());
      });
      
      // Update dashboard stats
      $('#activeRentalsCount').text(activeRentals.length);
      $('#totalRentalsCount').text(rentals.length);
      
      // Calculate total revenue
      let totalRevenue = 0;
      rentals.forEach(rental => {
        totalRevenue += parseFloat(rental.totalAmount || 0);
      });
      
      $('#totalRevenue').text(Main.formatMoney(totalRevenue));
      
      // Calculate month's revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let monthRevenue = 0;
      rentals.forEach(rental => {
        const rentalDate = new Date(rental.startDate);
        if (rentalDate.getMonth() === currentMonth && rentalDate.getFullYear() === currentYear) {
          monthRevenue += parseFloat(rental.totalAmount || 0);
        }
      });
      
      $('#monthRevenue').text(Main.formatMoney(monthRevenue));
    });
    
    // Get cars count
    $.get('/api/cars', function(cars) {
      $('#totalCarsCount').text(cars.length);
      
      // Count available cars (not currently rented)
      $.get('/api/rentals', function(rentals) {
        const activeRentals = rentals.filter(rental => {
          return new Date(rental.endDate) >= new Date() && 
                 (!rental.returnDate || new Date(rental.returnDate) >= new Date());
        });
        
        // Get IDs of cars currently rented
        const rentedCarIds = activeRentals.map(rental => rental.carId);
        
        // Count available cars
        const availableCars = cars.filter(car => !rentedCarIds.includes(car._id));
        
        $('#availableCarsCount').text(availableCars.length);
      });
    });
    
    // Get customers count
    $.get('/api/customers', function(customers) {
      $('#customersCount').text(customers.length);
    });
  }

  // Load recent rentals for dashboard
  function loadRecentRentals() {
    $.get('/api/rentals?limit=5&sort=-startDate', function(rentals) {
      let rows = '';
      
      rentals.forEach(rental => {
        // Get status class
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
        
        // Get car and customer details
        const carInfo = rental.carDetails ? 
          `${rental.carDetails.make} ${rental.carDetails.model}` : 'Loading...';
        
        const customerInfo = rental.customerDetails ? 
          rental.customerDetails.name : 'Loading...';
        
        rows += `
          <tr>
            <td>${carInfo}</td>
            <td>${customerInfo}</td>
            <td>${Main.formatDate(rental.startDate)}</td>
            <td>${Main.formatDate(rental.endDate)}</td>
            <td>${Main.formatMoney(rental.totalAmount)}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
          </tr>
        `;
      });
      
      $('#recentRentalsTable tbody').html(rows);
    });
  }

  // Load upcoming reminders for dashboard
  function loadUpcomingReminders() {
    $.get('/api/reminders?upcoming=true&limit=5', function(reminders) {
      let rows = '';
      
      reminders.forEach(reminder => {
        // Determine reminder type badge
        let typeClass = 'badge-secondary';
        let typeText = reminder.type || 'General';
        
        if (reminder.type === 'service') {
          typeClass = 'badge-primary';
          typeText = 'Service';
        } else if (reminder.type === 'tax') {
          typeClass = 'badge-info';
          typeText = 'Tax';
        } else if (reminder.type === 'insurance') {
          typeClass = 'badge-warning';
          typeText = 'Insurance';
        } else if (reminder.type === 'registration') {
          typeClass = 'badge-success';
          typeText = 'Registration';
        }
        
        // Calculate days until due
        const today = new Date();
        const dueDate = new Date(reminder.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let urgencyClass = 'badge-success';
        if (daysUntilDue <= 0) {
          urgencyClass = 'badge-danger';
        } else if (daysUntilDue <= 7) {
          urgencyClass = 'badge-warning';
        }
        
        rows += `
          <tr>
            <td>${reminder.carDetails ? `${reminder.carDetails.make} ${reminder.carDetails.model}` : 'N/A'}</td>
            <td><span class="badge ${typeClass}">${typeText}</span></td>
            <td>${reminder.title}</td>
            <td>${Main.formatDate(reminder.dueDate)}</td>
            <td><span class="badge ${urgencyClass}">${daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue} days`}</span></td>
          </tr>
        `;
      });
      
      $('#upcomingRemindersTable tbody').html(rows);
    });
  }

  // Setup event handlers for dashboard
  function setupEventHandlers() {
    // Refresh dashboard button
    $('#refreshDashboardBtn').on('click', function() {
      refresh();
      Main.showAlert('Dashboard refreshed', 'info');
    });
    
    // Quick add buttons
    $('#quickAddRentalBtn').on('click', function() {
      $('#rentals-tab').tab('show');
      setTimeout(() => {
        $('#addRentalBtn').click();
      }, 500);
    });
    
    $('#quickAddCarBtn').on('click', function() {
      $('#cars-tab').tab('show');
      setTimeout(() => {
        $('#addCarBtn').click();
      }, 500);
    });
    
    $('#quickAddCustomerBtn').on('click', function() {
      $('#customers-tab').tab('show');
      setTimeout(() => {
        $('#addCustomerBtn').click();
      }, 500);
    });
  }

  return {
    init: init,
    refresh: refresh,
    loadSummaryStats: loadSummaryStats,
    loadRecentRentals: loadRecentRentals,
    loadUpcomingReminders: loadUpcomingReminders
  };
})(); 
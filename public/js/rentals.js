// Rentals module
const Rentals = (function() {
  // Initialize rentals tab
  function init() {
    loadRentals();
    setupEventHandlers();
  }

  // Load all rentals and display them in the table
  function loadRentals() {
    console.log('Loading rentals data...');
    // Show loading indicator
    $('#allRentalsTable tbody').html('<tr><td colspan="10" class="text-center">Loading rentals...</td></tr>');
    
    // Fetch rentals from API
    fetch('/api/rentals')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Rentals loaded:', data.length);
        if (data && data.length > 0) {
          updateRentalsTable(data);
        } else {
          $('#allRentalsTable tbody').html('<tr><td colspan="10" class="text-center">No rentals found</td></tr>');
        }
      })
      .catch(error => {
        console.error('Error loading rentals:', error);
        $('#allRentalsTable tbody').html('<tr><td colspan="10" class="text-center text-danger">Failed to load rentals</td></tr>');
      });
  }

  // Update the rentals table with the latest data
  function updateRentalsTable(rentals) {
    console.log('Updating rentals table with data:', rentals);
    const tableBody = $('#allRentalsTable tbody');
    tableBody.empty();
    
    if (!rentals || rentals.length === 0) {
      tableBody.html('<tr><td colspan="10" class="text-center">No rentals found</td></tr>');
      return;
    }
    
    rentals.forEach(function(rental) {
      // Determine rental status
      let statusClass = 'badge-secondary';
      let statusText = 'Unknown';
      
      const today = new Date();
      const startDate = new Date(rental.rentalDate || rental.startDate);
      const endDate = new Date(rental.returnDate || rental.endDate);
      
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
      
      // Handle car data - different possible structures
      let carInfo = 'Unknown Car';
      if (rental.car) {
        if (typeof rental.car === 'object') {
          // If car is populated object
          carInfo = `${rental.car.make || ''} ${rental.car.model || ''} ${rental.car.registration ? `(${rental.car.registration})` : ''}`;
        } else {
          // If car is just an ID
          carInfo = `Car #${rental.car}`;
        }
      }
      
      // Handle customer data
      let customerName = rental.customerName || 'Unknown';
      let customerContact = rental.customerNumber || rental.customerEmail || '';
      
      // Calculate duration
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 0;
      
      // Calculate time remaining (for active rentals)
      let timeRemaining = '';
      if (!rental.returned && today <= endDate) {
        const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        timeRemaining = remainingDays > 0 ? `${remainingDays} days` : 'Due today';
      } else if (!rental.returned && today > endDate) {
        const overdueDays = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
        timeRemaining = `${overdueDays} days overdue`;
      } else {
        timeRemaining = statusText;
      }
      
      // Format dates
      const formattedStartDate = startDate && !isNaN(startDate) ? startDate.toLocaleDateString() : 'Invalid date';
      const formattedEndDate = endDate && !isNaN(endDate) ? endDate.toLocaleDateString() : 'Invalid date';
      
      // Format fee
      const rentalFee = rental.rentalFee || rental.dailyRate || 0;
      const formattedFee = !isNaN(rentalFee) ? `ZMW ${parseFloat(rentalFee).toFixed(2)}` : 'ZMW -';
      
      // Handle documents/notes
      const hasDocuments = rental.documents && rental.documents.length > 0;
      const hasNotes = rental.note && rental.note.trim().length > 0;
      
      // Format status label for display
      const statusLabel = `<span class="badge badge-pill ${statusClass}">${statusText}</span>`;
      
      // Modified documents/notes column with action buttons
      const docsNotesHtml = `
        ${hasDocuments ? '<i class="fas fa-file-alt mr-2" title="Has documents"></i>' : ''}
        ${hasNotes ? '<i class="fas fa-sticky-note mr-2" title="Has notes"></i>' : ''}
        <div class="btn-group btn-group-sm mt-1">
          <button class="btn btn-outline-info btn-sm add-note-btn" data-id="${rental._id}">
            <i class="fas fa-plus-circle"></i> Add Note
          </button>
          <button class="btn btn-outline-secondary btn-sm add-document-btn" data-id="${rental._id}">
            <i class="fas fa-file-upload"></i> Add Doc
          </button>
        </div>
      `;
      
      // Modified actions column
      const actionsHtml = rental.returned 
          ? `<button class="btn btn-outline-secondary" disabled>
                <i class="fas fa-check"></i> Returned
             </button>`
          : `<div class="dropdown">
                <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">
                    Actions
                </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item mark-returned-btn" href="#" data-id="${rental._id}">Mark Returned</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item delete-rental-btn" href="#" data-id="${rental._id}">Delete</a>
                </div>
             </div>`;
      
      const row = `
        <tr data-rental-id="${rental._id}">
          <td>${carInfo}</td>
          <td>${customerName}</td>
          <td>${customerContact}</td>
          <td>${formattedStartDate}</td>
          <td>${formattedEndDate}</td>
          <td>${formattedFee}</td>
          <td>${durationDays} days</td>
          <td>
            ${timeRemaining}
            <div class="mt-1">${statusLabel}</div>
          </td>
          <td>${docsNotesHtml}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
      
      tableBody.append(row);
    });
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

    // Add Note button
    $(document).on('click', '.add-note-btn', function() {
      const rentalId = $(this).data('id');
      // Show note modal
      $('#addNoteRentalId').val(rentalId);
      $('#addNoteModal').modal('show');
    });

    // Add Document button
    $(document).on('click', '.add-document-btn', function() {
      const rentalId = $(this).data('id');
      $('#addDocumentsRentalId').val(rentalId);
      
      // Load existing documents for this rental
      $.get(`/api/rentals/${rentalId}/documents`, function(documents) {
        const docList = $('#existingDocumentsList');
        docList.empty();
        
        if (documents && documents.length > 0) {
          documents.forEach(doc => {
            docList.append(`
              <div class="existing-document">
                <a href="${doc.url}" target="_blank">${doc.name}</a>
                <small class="text-muted">(${new Date(doc.uploadDate).toLocaleString()})</small>
              </div>
            `);
          });
        } else {
          docList.html('<p class="text-muted">No documents attached yet</p>');
        }
      });
      
      $('#addDocumentsModal').modal('show');
    });

    // Handle document form submission with AJAX
    $('#addDocumentsForm').submit(function(e) {
      e.preventDefault();
      
      const rentalId = $('#addDocumentsRentalId').val();
      const formData = new FormData(this);
      
      $.ajax({
        url: `/api/rentals/${rentalId}/documents`,
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function(response) {
          $('#addDocumentsModal').modal('hide');
          Main.showAlert('Documents added successfully', 'success');
          // Refresh the rentals list to show updated document count
          Rentals.loadRentals();
        },
        error: function(xhr) {
          console.error('Error uploading documents:', xhr.responseText);
          Main.showAlert('Failed to upload documents: ' + (xhr.responseJSON?.error || 'Server error'), 'danger');
        }
      });
    });

    // Add note functionality
    $('#saveNoteBtn').on('click', function() {
      const rentalId = $('#addNoteRentalId').val();
      const noteContent = $('#noteContent').val().trim();
      
      if (!noteContent) {
        Main.showAlert('Please enter a note', 'warning');
        return;
      }
      
      // Log what we're sending for debugging
      console.log('Sending note data:', { noteContent, rentalId });
      
      $.ajax({
        url: `/api/rentals/${rentalId}/notes`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
          noteContent: noteContent,  // Changed from 'content' to 'noteContent'
          content: noteContent       // Also send as 'content' as a fallback
        }),
        success: function(response) {
          // Clear the input field
          $('#noteContent').val('');
          
          // Update the existing notes display
          loadRentalNotes(rentalId);
          
          Main.showAlert('Note added successfully', 'success');
        },
        error: function(xhr) {
          console.error('Error adding note:', xhr.responseText);
          Main.showAlert('Failed to add note: ' + (xhr.responseJSON?.message || 'Server error'), 'danger');
        }
      });
    });

    // Function to load notes for a rental
    function loadRentalNotes(rentalId) {
      $.get(`/api/rentals/${rentalId}/notes`, function(notes) {
        const notesList = $('.existing-notes-list');
        notesList.empty();
        
        if (notes && notes.length > 0) {
          notes.forEach(note => {
            const date = new Date(note.timestamp).toLocaleString();
            notesList.append(`
              <div class="note-entry mb-2 p-2 border-left border-primary">
                <div class="note-content">${note.content}</div>
                <small class="text-muted">Added on ${date} by ${note.author}</small>
              </div>
            `);
          });
        } else {
          notesList.html('<p class="text-muted">No notes have been added yet</p>');
        }
      });
    }

    // Update the mark returned click handler (around line 600)
    $(document).on('click', '.mark-returned-btn', function() {
      const rentalId = $(this).data('id');
      const row = $(this).closest('tr');
      
      // Store references in the modal
      $('#returnRentalId').val(rentalId);
      $('#returnRentalModal').data('row', row);
      
      // Reset the modal form
      $('#returnRentalForm')[0].reset();
      $('#returnRentalModal').modal('show');
    });

    // Update the return rental form submission (around line 654)
    $('#returnRentalForm').submit(function(e) {
      e.preventDefault();
      const rentalId = $('#returnRentalId').val();
      const row = $('#returnRentalModal').data('row');
      const rating = $('input[name="customerRating"]:checked').val();
      const comment = $('#returnComment').val();

      // Disable button during processing
      const submitBtn = $(this).find('button[type="submit"]');
      submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processing...');

      $.ajax({
        url: `/api/rentals/${rentalId}/return`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ 
          rating: rating,
          comment: comment 
        }),
        success: function() {
          // Update the UI directly
          row.find('.badge')
            .removeClass('badge-danger')
            .addClass('badge-success')
            .text('Returned');
          
          row.find('td:last-child').html(`
            <button class="btn btn-outline-secondary" disabled>
              <i class="fas fa-check"></i> Returned
            </button>
          `);

          $('#returnRentalModal').modal('hide');
          Main.showAlert('Rental marked as returned with customer rating', 'success');
        },
        error: function(error) {
          console.error('Error processing rental return:', error);
          Main.showAlert('Failed to process rental return', 'danger');
        },
        complete: function() {
          submitBtn.prop('disabled', false).html('Complete Return');
        }
      });
    });

    // Mark as Overdue
    $(document).on('click', '.mark-overdue-btn', function() {
      const rentalId = $(this).data('id');
      
      if (confirm('Are you sure you want to mark this rental as overdue?')) {
        $.ajax({
          url: `/api/rentals/${rentalId}/status`,
          method: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ status: 'overdue' }),
          success: function() {
            loadRentals();
            Main.showAlert('Rental marked as overdue', 'warning');
          },
          error: function(error) {
            console.error('Error marking rental as overdue:', error);
            Main.showAlert('Failed to update rental status', 'danger');
          }
        });
      }
    });

    // Apply rental filters
    $('#applyRentalFilters').on('click', function() {
      applyRentalFilters();
    });

    // Reset rental filters
    $('#resetRentalFilters').on('click', function() {
      $('#rentalStatusFilter').val('all');
      $('#rentalSearchFilter').val('');
      applyRentalFilters(); // Apply the reset filters
    });

    // Also filter when status is changed (for better UX)
    $('#rentalStatusFilter').on('change', function() {
      applyRentalFilters();
    });

    // Enable filtering as user types (optional, for better UX)
    $('#rentalSearchFilter').on('keyup', function() {
      if ($(this).val().length > 2 || $(this).val().length === 0) {
        applyRentalFilters();
      }
    });
  }

  // New separate function for applying filters
  function applyRentalFilters() {
    const statusFilter = $('#rentalStatusFilter').val();
    const searchQuery = $('#rentalSearchFilter').val().toLowerCase().trim();
    
    console.log('Filtering rentals by:', { status: statusFilter, search: searchQuery });
    
    let filteredCount = 0;
    const rows = $('#allRentalsTable tbody tr');
    
    rows.each(function() {
      const row = $(this);
      let visible = true;
      
      // Skip the "No rentals found" row
      if (row.find('td').length === 1 && row.find('td').attr('colspan')) {
        return;
      }
      
      // Status filtering
      if (statusFilter !== 'all') {
        const statusBadge = row.find('.badge').text().toLowerCase();
        
        switch(statusFilter) {
          case 'active':
            if (statusBadge !== 'active') visible = false;
            break;
          case 'returned':
            if (statusBadge !== 'returned') visible = false;
            break;
          case 'overdue':
            if (statusBadge !== 'overdue') visible = false;
            break;
        }
      }
      
      // Text search filtering
      if (searchQuery && visible) {
        const carText = row.find('td:nth-child(1)').text().toLowerCase();
        const customerText = row.find('td:nth-child(2)').text().toLowerCase();
        const contactText = row.find('td:nth-child(3)').text().toLowerCase();
        
        const matches = carText.includes(searchQuery) || 
                       customerText.includes(searchQuery) || 
                       contactText.includes(searchQuery);
        
        if (!matches) visible = false;
      }
      
      // Show/hide the row based on filter results
      if (visible) {
        row.show();
        filteredCount++;
      } else {
        row.hide();
      }
    });
    
    // Show a message if no results were found
    if (filteredCount === 0 && rows.length > 0) {
      // Only add the "no results" row if it doesn't already exist
      if ($('#allRentalsTable tbody tr.no-results').length === 0) {
        $('#allRentalsTable tbody').append(`
          <tr class="no-results">
            <td colspan="10" class="text-center">
              No rentals match your filter criteria. 
              <button class="btn btn-sm btn-link" id="clearFilters">Clear filters</button>
            </td>
          </tr>
        `);
        
        // Add event handler for the "Clear filters" button
        $('#clearFilters').on('click', function() {
          $('#rentalStatusFilter').val('all');
          $('#rentalSearchFilter').val('');
          applyRentalFilters();
        });
      }
    } else {
      // Remove the "no results" row if it exists
      $('#allRentalsTable tbody tr.no-results').remove();
    }
    
    console.log(`Filtered rentals: ${filteredCount} of ${rows.length} shown`);
  }

  // Return public methods
  return {
    init: init,
    loadRentals: loadRentals,
    updateRentalsTable: updateRentalsTable,
    applyRentalFilters: applyRentalFilters
  };
})(); 
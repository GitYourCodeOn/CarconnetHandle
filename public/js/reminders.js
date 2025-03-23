// Reminders.js - Reminders functionality
const Reminders = (function() {
    let remindersDataTable = null;

    function initializeReminders() {
        console.log('Initializing reminders tab...');
        
        // Load reminders data
        loadRemindersData();
        
        // Set up calendar if needed
        initializeReminderCalendar();
        
        // Set up event listeners
        setupRemindersEventListeners();
    }

    // Load all reminders data
    function loadRemindersData() {
        // Get data from localStorage
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const cars = JSON.parse(localStorage.getItem('cars') || '[]');
        const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
        
        // Process reminders to add related info
        const processedReminders = reminders.map(reminder => {
            let relatedToText = 'N/A';
            
            if (reminder.relatedType === 'car' && reminder.relatedTo) {
                const car = cars.find(c => c.id === reminder.relatedTo);
                if (car) {
                    relatedToText = `Car: ${car.make} ${car.model} (${car.registration || 'No Reg'})`;
                }
            } else if (reminder.relatedType === 'rental' && reminder.relatedTo) {
                const rental = rentals.find(r => r.id === reminder.relatedTo);
                if (rental) {
                    const car = cars.find(c => c.id === rental.carId);
                    const carText = car ? `${car.make} ${car.model}` : 'Unknown Car';
                    relatedToText = `Rental: ${rental.customerName} - ${carText}`;
                }
            }
            
            return {
                ...reminder,
                relatedToText,
                statusText: getReminderStatus(reminder)
            };
        });
        
        // Sort by due date and status
        processedReminders.sort((a, b) => {
            // Overdue first, then upcoming, then completed
            if (a.status !== b.status) {
                if (a.status === 'overdue') return -1;
                if (b.status === 'overdue') return 1;
                if (a.status === 'upcoming') return -1;
                if (b.status === 'upcoming') return 1;
            }
            
            // Then sort by due date
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Update UI with reminders
        updateRemindersTable(processedReminders);
        updateCarRemindersTable(processedReminders.filter(r => r.relatedType === 'car'));
        updateRentalRemindersTable(processedReminders.filter(r => r.relatedType === 'rental'));
        updateCustomRemindersTable(processedReminders.filter(r => r.relatedType === 'custom'));
        updateUrgentReminders(processedReminders);
    }

    // Update the main reminders table
    function updateRemindersTable(reminders) {
        const tableBody = $('#allRemindersTable tbody');
        tableBody.empty();
        
        if (reminders.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="8" class="text-center">No reminders found</td>
                </tr>
            `);
            return;
        }
        
        reminders.forEach(reminder => {
            const row = $(`
                <tr class="${reminder.statusText.toLowerCase() === 'overdue' ? 'table-danger' : ''}">
                    <td>${reminder.title}</td>
                    <td>${formatDate(reminder.dueDate)}</td>
                    <td>${reminder.type}</td>
                    <td>${reminder.category}</td>
                    <td>
                        <span class="badge badge-${getPriorityBadgeClass(reminder.priority)}">
                            ${reminder.priority}
                        </span>
                    </td>
                    <td>${reminder.relatedToText}</td>
                    <td>
                        <span class="status-badge ${reminder.statusText.toLowerCase()}">
                            ${reminder.statusText}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${reminder.statusText.toLowerCase() === 'completed' ? '' : `
                                <button class="btn btn-success complete-reminder" data-id="${reminder.id}" title="Mark Complete">
                                    <i class="fas fa-check"></i>
                                </button>
                            `}
                            <button class="btn btn-primary edit-reminder" data-id="${reminder.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-reminder" data-id="${reminder.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
    }

    // Update the car reminders table
    function updateCarRemindersTable(reminders) {
        const tableBody = $('#carRemindersTable tbody');
        tableBody.empty();
        
        if (reminders.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="7" class="text-center">No car reminders found</td>
                </tr>
            `);
            return;
        }
        
        reminders.forEach(reminder => {
            const row = $(`
                <tr class="${reminder.statusText.toLowerCase() === 'overdue' ? 'table-danger' : ''}">
                    <td>${reminder.relatedToText.replace('Car: ', '')}</td>
                    <td>${reminder.title}</td>
                    <td>${formatDate(reminder.dueDate)}</td>
                    <td>${reminder.type}</td>
                    <td>
                        <span class="badge badge-${getPriorityBadgeClass(reminder.priority)}">
                            ${reminder.priority}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${reminder.statusText.toLowerCase()}">
                            ${reminder.statusText}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${reminder.statusText.toLowerCase() === 'completed' ? '' : `
                                <button class="btn btn-success complete-reminder" data-id="${reminder.id}" title="Mark Complete">
                                    <i class="fas fa-check"></i>
                                </button>
                            `}
                            <button class="btn btn-primary edit-reminder" data-id="${reminder.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-reminder" data-id="${reminder.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
    }

    // Update the rental reminders table
    function updateRentalRemindersTable(reminders) {
        const tableBody = $('#rentalRemindersTable tbody');
        tableBody.empty();
        
        if (reminders.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="7" class="text-center">No rental reminders found</td>
                </tr>
            `);
            return;
        }
        
        reminders.forEach(reminder => {
            // Extract rental and car info from the relatedToText
            let rentalInfo = reminder.relatedToText.replace('Rental: ', '').split(' - ');
            let customer = rentalInfo[0] || 'Unknown';
            let car = rentalInfo[1] || 'Unknown';
            
            // Calculate days left
            const now = new Date();
            const dueDate = new Date(reminder.dueDate);
            const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            const row = $(`
                <tr class="${reminder.statusText.toLowerCase() === 'overdue' ? 'table-danger' : ''}">
                    <td>${reminder.title}</td>
                    <td>${customer}</td>
                    <td>${car}</td>
                    <td>${formatDate(reminder.dueDate)}</td>
                    <td class="${daysLeft <= 0 ? 'text-danger font-weight-bold' : daysLeft <= 3 ? 'text-warning font-weight-bold' : ''}">
                        ${daysLeft <= 0 ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                    </td>
                    <td>
                        <span class="status-badge ${reminder.statusText.toLowerCase()}">
                            ${reminder.statusText}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${reminder.statusText.toLowerCase() === 'completed' ? '' : `
                                <button class="btn btn-success complete-reminder" data-id="${reminder.id}" title="Mark Complete">
                                    <i class="fas fa-check"></i>
                                </button>
                            `}
                            <button class="btn btn-primary edit-reminder" data-id="${reminder.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-reminder" data-id="${reminder.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
    }

    // Update the custom reminders table
    function updateCustomRemindersTable(reminders) {
        const tableBody = $('#customRemindersTable tbody');
        tableBody.empty();
        
        if (reminders.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="6" class="text-center">No custom reminders found</td>
                </tr>
            `);
            return;
        }
        
        reminders.forEach(reminder => {
            const row = $(`
                <tr class="${reminder.statusText.toLowerCase() === 'overdue' ? 'table-danger' : ''}">
                    <td>${reminder.title}</td>
                    <td>${reminder.description || 'No description'}</td>
                    <td>${formatDate(reminder.dueDate)}</td>
                    <td>
                        <span class="badge badge-${getPriorityBadgeClass(reminder.priority)}">
                            ${reminder.priority}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${reminder.statusText.toLowerCase()}">
                            ${reminder.statusText}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${reminder.statusText.toLowerCase() === 'completed' ? '' : `
                                <button class="btn btn-success complete-reminder" data-id="${reminder.id}" title="Mark Complete">
                                    <i class="fas fa-check"></i>
                                </button>
                            `}
                            <button class="btn btn-primary edit-reminder" data-id="${reminder.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-reminder" data-id="${reminder.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
    }

    // Update urgent reminders section
    function updateUrgentReminders(reminders) {
        const container = $('#urgentReminders');
        container.empty();
        
        // Filter for urgent reminders - due within 7 days or overdue, and not completed
        const urgentReminders = reminders.filter(reminder => {
            if (reminder.completed) return false;
            
            const now = new Date();
            const dueDate = new Date(reminder.dueDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            return daysUntilDue <= 7;
        });
        
        if (urgentReminders.length === 0) {
            container.html(`
                <div class="empty-state text-center py-4">
                    <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                    <p class="text-muted">No urgent reminders at the moment</p>
                </div>
            `);
            return;
        }
        
        // Sort by due date
        urgentReminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        // Create reminder cards
        urgentReminders.forEach(reminder => {
            const now = new Date();
            const dueDate = new Date(reminder.dueDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            let cardClass = 'normal';
            if (daysUntilDue <= 0) {
                cardClass = 'urgent';
            } else if (daysUntilDue <= 3) {
                cardClass = 'warning';
            }
            
            const reminderCard = $(`
                <div class="reminder-card ${cardClass} mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="reminder-title">${reminder.title}</h5>
                                <p class="reminder-date">
                                    Due: ${formatDate(reminder.dueDate)} 
                                    (${daysUntilDue <= 0 ? 'Overdue!' : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left`})
                                </p>
                                <p class="mb-1 small">${reminder.relatedToText}</p>
                            </div>
                            <div>
                                <span class="badge badge-${getPriorityBadgeClass(reminder.priority)}">
                                    ${reminder.priority}
                                </span>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end mt-2">
                            <button class="btn btn-sm btn-success complete-reminder reminder-action" data-id="${reminder.id}">
                                <i class="fas fa-check mr-1"></i> Mark Complete
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            container.append(reminderCard);
        });
    }

    // Initialize reminder calendar
    function initializeReminderCalendar() {
        // This would typically use a calendar library like FullCalendar
        // For now, just display a message
        $('#reminderCalendar').html(`
            <div class="text-center py-4">
                <i class="far fa-calendar-alt fa-3x mb-3 text-info"></i>
                <p>Calendar view would be implemented here using a library like FullCalendar</p>
            </div>
        `);
    }

    // Set up event listeners
    function setupRemindersEventListeners() {
        // Mark reminder as complete
        $(document).on('click', '.complete-reminder', function() {
            const reminderId = $(this).data('id');
            markReminderComplete(reminderId);
        });
        
        // Edit reminder
        $(document).on('click', '.edit-reminder', function() {
            const reminderId = $(this).data('id');
            editReminder(reminderId);
        });
        
        // Delete reminder
        $(document).on('click', '.delete-reminder', function() {
            const reminderId = $(this).data('id');
            deleteReminder(reminderId);
        });
        
        // Add new reminder button
        $('#reminderModal').on('show.bs.modal', function() {
            // Reset form
            $(this).find('form')[0].reset();
            $(this).find('#reminderFormTitle').text('Add New Reminder');
            $(this).find('button[type="submit"]').text('Add Reminder');
            $(this).find('#reminderId').val('');
        });
        
        // Reminder form submission
        $('#reminderForm').on('submit', function(e) {
            e.preventDefault();
            saveReminder();
        });
        
        // Filter events
        $('#applyReminderFilters').on('click', function() {
            applyReminderFilters('all');
        });
        
        $('#resetReminderFilters').on('click', function() {
            resetReminderFilters('all');
        });
        
        $('#applyCarReminderFilters').on('click', function() {
            applyReminderFilters('car');
        });
        
        $('#resetCarReminderFilters').on('click', function() {
            resetReminderFilters('car');
        });
        
        $('#applyRentalReminderFilters').on('click', function() {
            applyReminderFilters('rental');
        });
        
        $('#resetRentalReminderFilters').on('click', function() {
            resetReminderFilters('rental');
        });
        
        $('#applyCustomReminderFilters').on('click', function() {
            applyReminderFilters('custom');
        });
        
        $('#resetCustomReminderFilters').on('click', function() {
            resetReminderFilters('custom');
        });
    }

    // Mark reminder as complete
    function markReminderComplete(reminderId) {
        // Get reminders data
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const reminderIndex = reminders.findIndex(r => r.id === reminderId);
        
        if (reminderIndex === -1) {
            showToast('Error', 'Reminder not found', 'danger');
            return;
        }
        
        // Update reminder status
        reminders[reminderIndex].completed = true;
        reminders[reminderIndex].completedDate = new Date().toISOString();
        
        // Save updated reminders
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        // Show success message
        showToast('Success', 'Reminder marked as complete', 'success');
        
        // Refresh reminders data
        loadRemindersData();
    }

    // Edit reminder
    function editReminder(reminderId) {
        // Get reminders data
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        const reminder = reminders.find(r => r.id === reminderId);
        
        if (!reminder) {
            showToast('Error', 'Reminder not found', 'danger');
            return;
        }
        
        // Make sure modals are loaded
        loadModals();
        
        // Wait for modals to be ready
        setTimeout(function() {
            const modal = $('#reminderModal');
            
            if (modal.length) {
                // Set form title
                modal.find('#reminderFormTitle').text('Edit Reminder');
                modal.find('button[type="submit"]').text('Update Reminder');
                
                // Set form fields
                modal.find('#reminderId').val(reminder.id);
                modal.find('#reminderTitle').val(reminder.title);
                modal.find('#reminderDueDate').val(reminder.dueDate.substr(0, 10));
                modal.find('#reminderType').val(reminder.type);
                modal.find('#reminderCategory').val(reminder.category);
                modal.find('#reminderPriority').val(reminder.priority);
                modal.find('#reminderDescription').val(reminder.description || '');
                
                // Related to fields
                if (reminder.relatedType === 'car') {
                    modal.find('#reminderRelatedCar').prop('checked', true);
                    modal.find('#reminderRelatedCarId').val(reminder.relatedTo);
                    modal.find('#carRelatedOptions').show();
                    modal.find('#rentalRelatedOptions').hide();
                } else if (reminder.relatedType === 'rental') {
                    modal.find('#reminderRelatedRental').prop('checked', true);
                    modal.find('#reminderRelatedRentalId').val(reminder.relatedTo);
                    modal.find('#carRelatedOptions').hide();
                    modal.find('#rentalRelatedOptions').show();
                } else {
                    modal.find('#reminderRelatedNone').prop('checked', true);
                    modal.find('#carRelatedOptions').hide();
                    modal.find('#rentalRelatedOptions').hide();
                }
                
                // Show modal
                modal.modal('show');
            } else {
                console.error('Reminder modal not found');
                showToast('Error', 'Could not display reminder form', 'danger');
            }
        }, 500);
    }

    // Delete reminder
    function deleteReminder(reminderId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
            return;
        }
        
        // Get reminders data
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        
        // Remove reminder
        const updatedReminders = reminders.filter(r => r.id !== reminderId);
        
        // Save updated reminders
        localStorage.setItem('reminders', JSON.stringify(updatedReminders));
        
        // Show success message
        showToast('Success', 'Reminder deleted successfully', 'success');
        
        // Refresh reminders data
        loadRemindersData();
    }

    // Save reminder (new or edit)
    function saveReminder() {
        const reminderId = $('#reminderId').val();
        const isEditing = reminderId !== '';
        
        // Gather form data
        const formData = {
            id: isEditing ? reminderId : generateId(),
            title: $('#reminderTitle').val(),
            dueDate: $('#reminderDueDate').val() + 'T00:00:00.000Z',
            type: $('#reminderType').val(),
            category: $('#reminderCategory').val(),
            priority: $('#reminderPriority').val(),
            description: $('#reminderDescription').val(),
            completed: false,
            createdAt: isEditing ? undefined : new Date().toISOString()
        };
        
        // Handle related entity
        const relatedType = $('input[name="reminderRelatedTo"]:checked').val();
        if (relatedType === 'car') {
            formData.relatedType = 'car';
            formData.relatedTo = $('#reminderRelatedCarId').val();
        } else if (relatedType === 'rental') {
            formData.relatedType = 'rental';
            formData.relatedTo = $('#reminderRelatedRentalId').val();
        } else {
            formData.relatedType = 'none';
            formData.relatedTo = null;
        }
        
        // Get existing reminders
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        
        // Update or add reminder
        if (isEditing) {
            const reminderIndex = reminders.findIndex(r => r.id === reminderId);
            if (reminderIndex !== -1) {
                // Preserve completion status and completed date if previously set
                if (reminders[reminderIndex].completed) {
                    formData.completed = true;
                    formData.completedDate = reminders[reminderIndex].completedDate;
                }
                
                // Preserve creation date
                formData.createdAt = reminders[reminderIndex].createdAt;
                
                // Update reminder
                reminders[reminderIndex] = formData;
            }
        } else {
            // Add new reminder
            reminders.push(formData);
        }
        
        // Save updated reminders
        localStorage.setItem('reminders', JSON.stringify(reminders));
        
        // Show success message
        showToast('Success', `Reminder ${isEditing ? 'updated' : 'added'} successfully`, 'success');
        
        // Close modal
        $('#reminderModal').modal('hide');
        
        // Refresh reminders data
        loadRemindersData();
    }

    // Apply reminder filters
    function applyReminderFilters(tabType) {
        const prefix = tabType === 'all' ? '' : `${tabType}Reminder`;
        const tableId = `#${tabType === 'all' ? 'all' : `${tabType}`}RemindersTable`;
        
        // Get filter values
        const statusFilter = $(`#${prefix}StatusFilter`).val();
        const typeFilter = tabType === 'all' ? $(`#${prefix}TypeFilter`).val() : null;
        const priorityFilter = tabType === 'custom' ? $(`#${prefix}PriorityFilter`).val() : null;
        const searchFilter = $(`#${prefix}SearchFilter`).val().toLowerCase();
        
        // Apply filters to table rows
        $(`${tableId} tbody tr`).each(function() {
            let show = true;
            
            // Status filter
            if (statusFilter !== 'all') {
                const status = $(this).find('.status-badge').text().toLowerCase();
                show = show && status === statusFilter;
            }
            
            // Type filter
            if (typeFilter && typeFilter !== 'all') {
                const type = $(this).find('td:nth-child(3)').text().toLowerCase();
                show = show && type === typeFilter;
            }
            
            // Priority filter
            if (priorityFilter && priorityFilter !== 'all') {
                const priority = $(this).find('.badge').text().toLowerCase();
                show = show && priority === priorityFilter;
            }
            
            // Search filter
            if (searchFilter) {
                const text = $(this).text().toLowerCase();
                show = show && text.includes(searchFilter);
            }
            
            // Show or hide row
            $(this).toggle(show);
        });
        
        // Check if any rows are visible
        const visibleRows = $(`${tableId} tbody tr:visible`).length;
        if (visibleRows === 0) {
            // Show no results message if none already exists
            if ($(`${tableId} tbody tr.no-results`).length === 0) {
                $(`${tableId} tbody`).append(`
                    <tr class="no-results">
                        <td colspan="8" class="text-center">No results match your filters</td>
                    </tr>
                `);
            }
        } else {
            // Remove no results message if it exists
            $(`${tableId} tbody tr.no-results`).remove();
        }
    }

    // Reset reminder filters
    function resetReminderFilters(tabType) {
        const prefix = tabType === 'all' ? '' : `${tabType}Reminder`;
        
        // Reset filter controls
        $(`#${prefix}StatusFilter`).val('all');
        if (tabType === 'all') {
            $(`#${prefix}TypeFilter`).val('all');
        }
        if (tabType === 'custom') {
            $(`#${prefix}PriorityFilter`).val('all');
        }
        $(`#${prefix}SearchFilter`).val('');
        
        // Show all rows
        const tableId = `#${tabType === 'all' ? 'all' : `${tabType}`}RemindersTable`;
        $(`${tableId} tbody tr`).show();
        $(`${tableId} tbody tr.no-results`).remove();
    }

    // Get priority badge class
    function getPriorityBadgeClass(priority) {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'secondary';
        }
    }

    // Making public methods accessible
    return {
        initializeReminders: initializeReminders,
        loadRemindersData: loadRemindersData,
        updateRemindersTable: updateRemindersTable,
        updateCarRemindersTable: updateCarRemindersTable,
        updateRentalRemindersTable: updateRentalRemindersTable,
        updateCustomRemindersTable: updateCustomRemindersTable,
        updateUrgentReminders: updateUrgentReminders,
        initializeReminderCalendar: initializeReminderCalendar,
        setupRemindersEventListeners: setupRemindersEventListeners,
        markReminderComplete: markReminderComplete,
        editReminder: editReminder,
        deleteReminder: deleteReminder,
        saveReminder: saveReminder,
        applyReminderFilters: applyReminderFilters,
        resetReminderFilters: resetReminderFilters,
        getPriorityBadgeClass: getPriorityBadgeClass
    };
})(); 
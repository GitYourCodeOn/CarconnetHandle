/**
 * Settings Module - Handles the settings UI and interactions
 */
const Settings = (function() {
    // Set up event handlers for the settings form
    function setupEventHandlers() {
        console.log('Setting up settings event handlers');
        
        // Load current settings into form fields
        loadSettingsIntoForm();
        
        // Set up tab navigation
        $('.settings-nav a').on('click', function(e) {
            e.preventDefault();
            $(this).tab('show');
        });
        
        // Handle general settings form submission
        $('#settingsForm').on('submit', function(e) {
            e.preventDefault();
            
            // Collect form values
            const newSettings = {
                companyName: $('#companyName').val(),
                currency: $('#currency').val(),
                currencyName: $('#currency option:selected').text(),
                dateFormat: $('#dateFormat').val(),
                defaultPage: $('#defaultPage').val()
            };
            
            // Save settings
            if (AppSettings.saveSettings(newSettings)) {
                showAlert('Settings saved successfully!', 'success');
                
                // Force update all currency displays
                setTimeout(function() {
                    AppSettings.updateCurrencyDisplays();
                }, 100);
            } else {
                showAlert('Failed to save settings. Please try again.', 'danger');
            }
        });
        
        // Handle notifications form submission
        $('#notificationsForm').on('submit', function(e) {
            e.preventDefault();
            
            const notificationSettings = {
                emailNotifications: $('#emailNotifications').prop('checked'),
                smsNotifications: $('#smsNotifications').prop('checked'),
                browserNotifications: $('#browserNotifications').prop('checked')
            };
            
            if (AppSettings.saveSettings(notificationSettings)) {
                showAlert('Notification settings saved successfully!', 'success', '#notifications-section');
            } else {
                showAlert('Failed to save notification settings.', 'danger', '#notifications-section');
            }
        });
        
        // Handle reminder settings form submission
        $('#reminderSettingsForm').on('submit', function(e) {
            e.preventDefault();
            
            const reminderSettings = {
                reminderDays: parseInt($('#reminderDays').val()),
                rentalDueReminders: $('#rentalDueReminders').prop('checked'),
                serviceReminders: $('#serviceReminders').prop('checked'),
                insuranceReminders: $('#insuranceReminders').prop('checked')
            };
            
            if (AppSettings.saveSettings(reminderSettings)) {
                showAlert('Reminder settings saved successfully!', 'success', '#reminder-section');
            } else {
                showAlert('Failed to save reminder settings.', 'danger', '#reminder-section');
            }
        });
        
        // Handle backup button
        $('#backupDataBtn').on('click', function() {
            backupData();
        });
        
        // Handle restore button
        $('#restoreDataBtn').on('click', function() {
            restoreData();
        });
        
        // Handle reset button
        $('#resetSettings').on('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to reset all settings to default?')) {
                if (AppSettings.resetSettings()) {
                    loadSettingsIntoForm();
                    showAlert('Settings have been reset to default values', 'info');
                } else {
                    showAlert('Failed to reset settings', 'danger');
                }
            }
        });
    }
    
    // Load current settings into the form
    function loadSettingsIntoForm() {
        const settings = AppSettings.getSettings();
        
        // General settings
        $('#companyName').val(settings.companyName || '');
        $('#currency').val(settings.currency || 'K');
        $('#dateFormat').val(settings.dateFormat || 'DD/MM/YYYY');
        $('#defaultPage').val(settings.defaultPage || 'dashboard');
        
        // Notification settings
        $('#emailNotifications').prop('checked', settings.emailNotifications || false);
        $('#smsNotifications').prop('checked', settings.smsNotifications || false);
        $('#browserNotifications').prop('checked', settings.browserNotifications || false);
        
        // Reminder settings
        $('#reminderDays').val(settings.reminderDays || 7);
        $('#rentalDueReminders').prop('checked', settings.rentalDueReminders !== false);
        $('#serviceReminders').prop('checked', settings.serviceReminders !== false);
        $('#insuranceReminders').prop('checked', settings.insuranceReminders !== false);
        
        console.log('Settings loaded into form:', settings);
    }
    
    // Create and download a backup file
    function backupData() {
        try {
            // Get all data from localStorage
            const backupData = {
                timestamp: new Date().toISOString(),
                settings: AppSettings.getSettings(),
                rentals: JSON.parse(localStorage.getItem('rentals') || '[]'),
                cars: JSON.parse(localStorage.getItem('cars') || '[]'),
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                revenue: JSON.parse(localStorage.getItem('revenue') || '[]'),
                expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
                reminders: JSON.parse(localStorage.getItem('reminders') || '[]')
            };
            
            // Convert to JSON string
            const dataStr = JSON.stringify(backupData, null, 2);
            
            // Create a download link
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const fileName = `carconnect_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('Backup created successfully!', 'success', '#backup-section');
        } catch (error) {
            console.error('Error creating backup:', error);
            showAlert('Failed to create backup: ' + error.message, 'danger', '#backup-section');
        }
    }
    
    // Restore data from a backup file
    function restoreData() {
        const fileInput = document.getElementById('restoreFile');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showAlert('Please select a backup file first', 'warning', '#backup-section');
            return;
        }
        
        const file = fileInput.files[0];
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showAlert('Invalid file type. Please select a JSON backup file', 'danger', '#backup-section');
            return;
        }
        
        if (!confirm('Warning: This will overwrite your current data. Are you sure you want to proceed?')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Validate backup data structure
                if (!backupData.settings || !backupData.timestamp) {
                    throw new Error('Invalid backup file format');
                }
                
                // Restore settings
                AppSettings.saveSettings(backupData.settings);
                
                // Restore other data
                if (backupData.rentals) localStorage.setItem('rentals', JSON.stringify(backupData.rentals));
                if (backupData.cars) localStorage.setItem('cars', JSON.stringify(backupData.cars));
                if (backupData.customers) localStorage.setItem('customers', JSON.stringify(backupData.customers));
                if (backupData.revenue) localStorage.setItem('revenue', JSON.stringify(backupData.revenue));
                if (backupData.expenses) localStorage.setItem('expenses', JSON.stringify(backupData.expenses));
                if (backupData.reminders) localStorage.setItem('reminders', JSON.stringify(backupData.reminders));
                
                showAlert('Data restored successfully! Reloading page...', 'success', '#backup-section');
                
                // Reload page after a delay to apply all restored settings
                setTimeout(function() {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Error restoring data:', error);
                showAlert('Failed to restore data: ' + error.message, 'danger', '#backup-section');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Show alert message in a specific container
    function showAlert(message, type = 'info', container = '#settingsAlerts') {
        const alert = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
        
        $(container).html(alert);
        
        // Auto dismiss after 5 seconds
        setTimeout(function() {
            $('.alert').alert('close');
        }, 5000);
    }
    
    // Initialize settings
    function init() {
        setupEventHandlers();
        
        // Do a manual currency update when first loading settings
        setTimeout(function() {
            AppSettings.updateCurrencyDisplays();
        }, 500);
    }
    
    // Return public API
    return {
        init: init
    };
})();

// Initialize settings when document is ready
$(document).ready(function() {
    Settings.init();
}); 
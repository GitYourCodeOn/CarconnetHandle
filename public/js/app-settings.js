/**
 * App Settings Manager - A unified system for handling application settings
 */
const AppSettings = (function() {
    // Default settings
    const DEFAULT_SETTINGS = {
        companyName: 'Car Connect Lusaka',
        currency: 'K',
        currencyName: 'Zambian Kwacha (K)',
        dateFormat: 'DD/MM/YYYY',
        defaultPage: 'dashboard'
    };
    
    // Current settings
    let currentSettings = {};
    
    // Load settings on initialization
    function init() {
        console.log('Initializing App Settings Manager');
        loadSettings();
        
        // Set up global event handlers
        $(document).on('settingsChanged', function(e, settings) {
            console.log('Settings changed event detected');
            applySettingsToUI();
        });
    }
    
    // Load settings from localStorage
    function loadSettings() {
        try {
            const storedSettings = localStorage.getItem('appSettings');
            if (storedSettings) {
                currentSettings = JSON.parse(storedSettings);
                console.log('Settings loaded from storage:', currentSettings);
            } else {
                console.log('No settings found, using defaults');
                currentSettings = {...DEFAULT_SETTINGS};
                saveSettings(currentSettings);
            }
            
            // Always apply settings after loading
            applySettingsToUI();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            currentSettings = {...DEFAULT_SETTINGS};
        }
        
        return currentSettings;
    }
    
    // Save settings to localStorage
    function saveSettings(newSettings) {
        try {
            // If partial settings provided, merge with current
            if (newSettings !== undefined) {
                currentSettings = {...currentSettings, ...newSettings};
            }
            
            localStorage.setItem('appSettings', JSON.stringify(currentSettings));
            console.log('Settings saved successfully:', currentSettings);
            
            // Apply new settings to UI
            applySettingsToUI();
            
            // Trigger global event for other modules
            $(document).trigger('settingsChanged', [currentSettings]);
            
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
    
    // Reset settings to default
    function resetSettings() {
        currentSettings = {...DEFAULT_SETTINGS};
        saveSettings();
        return true;
    }
    
    // Apply all current settings to UI elements
    function applySettingsToUI() {
        console.log('Applying settings to UI');
        
        // 1. Apply currency to all displays
        updateCurrencyDisplays();
        
        // 2. Apply company name if set
        if (currentSettings.companyName) {
            $('.company-name').text(currentSettings.companyName);
        }
        
        // 3. Apply other settings as needed
        // Add more UI updates here as needed
    }
    
    // Update all currency displays with current currency symbol - more comprehensive
    function updateCurrencyDisplays() {
        const currencySymbol = currentSettings.currency || DEFAULT_SETTINGS.currency;
        console.log('Updating currency displays to:', currencySymbol);
        
        // Method 1: Update elements with the currency-display class
        $('.currency-display').each(function() {
            const value = parseFloat($(this).data('value') || 0).toFixed(2);
            $(this).text(`${currencySymbol} ${value}`);
        });
        
        // Method 2: Update specific finance elements by ID
        updateFinanceDisplays(currencySymbol);
        
        // Method 3: Update dashboard revenue elements
        updateDashboardDisplays(currencySymbol);
        
        // Method 4: Update currency symbols in input groups and other places
        $('.currency-symbol').text(currencySymbol);
        
        // Method 5: Find and replace all £ symbols in the dashboard and other places
        replaceCurrencyInText('£', currencySymbol);
        replaceCurrencyInText('$', currencySymbol);
        replaceCurrencyInText('€', currencySymbol);
        replaceCurrencyInText('ZMW', currencySymbol);
        replaceCurrencyInText('K', currencySymbol);
        
        // Method 6: Update data attributes for rentals and other tables
        updateDataTablesWithCurrency(currencySymbol);
    }
    
    // New function specifically for dashboard elements
    function updateDashboardDisplays(symbol) {
        // Update the dashboard revenue elements
        if ($('#totalRevenue').length) {
            const value = $('#totalRevenue').text().replace(/[^0-9.]/g, '') || '0.00';
            $('#totalRevenue').text(`${symbol} ${parseFloat(value).toFixed(2)}`);
            // Also store as data attribute for future updates
            $('#totalRevenue').attr('data-value', parseFloat(value));
        }
        
        if ($('#monthlyRevenue').length) {
            const value = $('#monthlyRevenue').text().replace(/[^0-9.]/g, '') || '0.00';
            $('#monthlyRevenue').text(`${symbol} ${parseFloat(value).toFixed(2)}`);
            // Also store as data attribute for future updates
            $('#monthlyRevenue').attr('data-value', parseFloat(value));
        }
    }
    
    // Helper function to find and replace currency symbols in text
    function replaceCurrencyInText(oldSymbol, newSymbol) {
        // Find elements that contain the old currency symbol but don't have special classes
        $('h1, h2, h3, h4, h5, h6, p, span, td, th, div:not(.no-currency-replace)').each(function() {
            const $el = $(this);
            if ($el.children().length === 0) { // Only target elements without children
                const text = $el.text();
                if (text.includes(oldSymbol)) {
                    const newText = text.replace(
                        new RegExp(`${oldSymbol}\\s*(\\d+(?:\\.\\d+)?)`, 'g'), 
                        `${newSymbol} $1`
                    );
                    $el.text(newText);
                }
            }
        });
    }
    
    // Update DataTables with new currency
    function updateDataTablesWithCurrency(symbol) {
        // If using DataTables, you can redraw them here
        if ($.fn.DataTable) {
            $.fn.DataTable.tables({ visible: true, api: true }).draw();
        }
        
        // For the rental logs and other tables
        $('#rentalLogsTable, #allRentalsTable').find('td:contains("£"), td:contains("$"), td:contains("€"), td:contains("ZMW")').each(function() {
            const $cell = $(this);
            const text = $cell.text();
            // Match currency format like "£ 123.45" or "$ 67.89"
            const matches = text.match(/([£$€ZMW])\s*(\d+(?:\.\d+)?)/);
            if (matches) {
                $cell.text(text.replace(matches[0], `${symbol} ${matches[2]}`));
            }
        });
    }
    
    // Update finance displays with current currency
    function updateFinanceDisplays(symbol) {
        // Update specific finance elements
        if ($('#totalRevenueValue').length) {
            const value = parseFloat($('#totalRevenueValue').data('value') || 0).toFixed(2);
            $('#totalRevenueValue').text(`${symbol} ${value}`);
        }
        
        if ($('#totalExpensesValue').length) {
            const value = parseFloat($('#totalExpensesValue').data('value') || 0).toFixed(2);
            $('#totalExpensesValue').text(`${symbol} ${value}`);
        }
        
        if ($('#netProfitValue').length) {
            const value = parseFloat($('#netProfitValue').data('value') || 0).toFixed(2);
            $('#netProfitValue').text(`${symbol} ${value}`);
        }
    }
    
    // Format currency using current settings
    function formatCurrency(amount) {
        return `${currentSettings.currency} ${parseFloat(amount).toFixed(2)}`;
    }
    
    // Get current settings or a specific setting
    function getSettings(key) {
        if (key) {
            return currentSettings[key] || DEFAULT_SETTINGS[key];
        }
        return {...currentSettings};
    }
    
    // Public API
    return {
        init: init,
        loadSettings: loadSettings,
        saveSettings: saveSettings,
        resetSettings: resetSettings,
        getSettings: getSettings,
        formatCurrency: formatCurrency,
        updateCurrencyDisplays: updateCurrencyDisplays
    };
})();

// Initialize the settings manager when the document is ready
$(document).ready(function() {
    AppSettings.init();
}); 
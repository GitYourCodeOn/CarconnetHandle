// Global application object that manages the entire application state
const App = (function() {
    // Default settings
    const defaultSettings = {
        companyName: 'Car Connect Lusaka',
        currency: 'K', // Zambian Kwacha
        currencySymbol: 'K',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        language: 'en-GB',
        reminderDays: 7,
        defaultRentalDuration: 7,
        darkMode: false,
        emailNotifications: false
    };

    // Initialize app state
    let appState = {
        settings: loadSettings(),
        currentTab: 'dashboard'
    };

    // Load settings from localStorage
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        } catch (e) {
            console.error('Error loading settings:', e);
            return defaultSettings;
        }
    }

    // Save settings to localStorage
    function saveSettings(settings) {
        try {
            appState.settings = { ...appState.settings, ...settings };
            localStorage.setItem('appSettings', JSON.stringify(appState.settings));
            applySettings();
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    }

    // Apply all settings to the UI
    function applySettings() {
        // Apply dark mode
        if (appState.settings.darkMode) {
            $('body').addClass('dark-mode');
        } else {
            $('body').removeClass('dark-mode');
        }

        // Update all currency displays
        updateCurrencyDisplays();

        // Publish settings changed event
        $(document).trigger('settingsChanged', [appState.settings]);
    }

    // Update all currency displays
    function updateCurrencyDisplays() {
        const symbol = appState.settings.currencySymbol;
        
        // Update elements with .currency-value class
        $('.currency-value').each(function() {
            const value = parseFloat($(this).data('value') || 0).toFixed(2);
            $(this).text(`${symbol} ${value}`);
        });

        // Update specific elements in different modules
        updateFinanceDisplays();
        updateRentalDisplays();
    }

    // Update finance page currency displays
    function updateFinanceDisplays() {
        const symbol = appState.settings.currencySymbol;
        
        if ($('#totalRevenueValue').length) {
            const totalRevenue = parseFloat($('#totalRevenueValue').data('value') || 0).toFixed(2);
            $('#totalRevenueValue').text(`${symbol} ${totalRevenue}`);
        }
        
        if ($('#totalExpensesValue').length) {
            const totalExpenses = parseFloat($('#totalExpensesValue').data('value') || 0).toFixed(2);
            $('#totalExpensesValue').text(`${symbol} ${totalExpenses}`);
        }
        
        if ($('#netProfitValue').length) {
            const netProfit = parseFloat($('#netProfitValue').data('value') || 0).toFixed(2);
            $('#netProfitValue').text(`${symbol} ${netProfit}`);
        }
    }

    // Update rental displays
    function updateRentalDisplays() {
        const symbol = appState.settings.currencySymbol;
        
        // Implemented when rentals are rendered
    }

    // Format currency with current symbol
    function formatCurrency(amount) {
        return `${appState.settings.currencySymbol} ${parseFloat(amount).toFixed(2)}`;
    }

    // Initialize the application
    function init() {
        console.log('Initializing application...');
        
        // Apply initial settings
        applySettings();
        
        // Setup global event listeners
        setupGlobalEvents();
        
        console.log('Application initialized with settings:', appState.settings);
    }

    // Set up global event listeners
    function setupGlobalEvents() {
        // Tab switching
        $('.nav-link[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            appState.currentTab = $(e.target).attr('id').replace('-tab', '');
            console.log('Current tab changed to:', appState.currentTab);
        });
    }

    // Public API
    return {
        init: init,
        getSettings: function() { return { ...appState.settings }; },
        getSetting: function(key) { return appState.settings[key]; },
        saveSettings: saveSettings,
        formatCurrency: formatCurrency,
        applySettings: applySettings
    };
})();

// Initialize the application when DOM is ready
$(document).ready(function() {
    App.init();
}); 
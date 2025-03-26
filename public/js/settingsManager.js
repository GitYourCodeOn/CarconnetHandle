const SettingsManager = (function() {
    const defaultSettings = {
        currency: 'ZMW',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        language: 'en-GB',
        darkMode: false,
        emailNotifications: true
    };

    // Load settings from localStorage or use defaults
    let settings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;

    // Apply settings to the UI
    function applySettings() {
        // Update currency displays
        $('.currency-display').each(function() {
            const value = $(this).text().replace(/[^0-9.]/g, '');
            $(this).text(`${settings.currency}${value}`);
        });

        // Update other UI elements based on settings
        if (settings.darkMode) {
            $('body').addClass('dark-mode');
        } else {
            $('body').removeClass('dark-mode');
        }
    }

    // Get a setting value
    function getSetting(key) {
        return settings[key] || defaultSettings[key];
    }

    // Update a setting
    function updateSetting(key, value) {
        settings[key] = value;
        localStorage.setItem('appSettings', JSON.stringify(settings));
        applySettings();
    }

    // Update multiple settings at once
    function updateSettings(newSettings) {
        settings = { ...settings, ...newSettings };
        localStorage.setItem('appSettings', JSON.stringify(settings));
        applySettings();
    }

    // Initialize settings on page load
    $(document).ready(function() {
        applySettings();
    });

    return {
        getSetting,
        updateSetting,
        updateSettings,
        applySettings
    };
})(); 
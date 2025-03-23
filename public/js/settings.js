// Settings module
const Settings = (function() {
  // Load settings from local storage or defaults
  function loadSettings() {
    // Set default values
    window.currencySymbol = localStorage.getItem('currencySymbol') || '£';
    window.dateFormat = localStorage.getItem('dateFormat') || 'en-GB';
    window.timeFormat = localStorage.getItem('timeFormat') || '24h';
    window.language = localStorage.getItem('language') || 'en-GB';
    window.reminderDays = parseInt(localStorage.getItem('reminderDays') || '7');
    window.defaultRentalDuration = parseInt(localStorage.getItem('defaultRentalDuration') || '7');
    window.darkMode = localStorage.getItem('darkMode') === 'true';
    window.emailNotifications = localStorage.getItem('emailNotifications') === 'true';
    
    // Apply dark mode if enabled
    if (window.darkMode) {
      $('body').addClass('dark-mode');
      $('#darkModeSetting').prop('checked', true);
    } else {
      $('body').removeClass('dark-mode');
      $('#darkModeSetting').prop('checked', false);
    }
    
    // Set currency symbol in relevant places
    $('.currency-symbol').text(window.currencySymbol);
    
    // Set form values
    $('#currencySetting').val(window.currencySymbol);
    $('#dateFormatSetting').val(window.dateFormat);
    $('#timeFormatSetting').val(window.timeFormat);
    $('#languageSetting').val(window.language);
    $('#reminderDaysSetting').val(window.reminderDays);
    $('#defaultRentalDurationSetting').val(window.defaultRentalDuration);
    $('#emailNotificationsSetting').prop('checked', window.emailNotifications);
    
    // Load company info if available
    const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
    $('#companyNameSetting').val(companyInfo.name || '');
    $('#companyPhoneSetting').val(companyInfo.phone || '');
    $('#companyEmailSetting').val(companyInfo.email || '');
    $('#companyWebsiteSetting').val(companyInfo.website || '');
    $('#companyAddressSetting').val(companyInfo.address || '');
  }
  
  // Set up event handlers for settings
  function setupEventHandlers() {
    // Save global settings
    $('#globalSettingsForm').submit(function(e) {
      e.preventDefault();
      
      // Get values from form
      const currencySymbol = $('#currencySetting').val();
      const dateFormat = $('#dateFormatSetting').val();
      const timeFormat = $('#timeFormatSetting').val();
      const language = $('#languageSetting').val();
      const reminderDays = $('#reminderDaysSetting').val();
      const defaultRentalDuration = $('#defaultRentalDurationSetting').val();
      const darkMode = $('#darkModeSetting').prop('checked');
      const emailNotifications = $('#emailNotificationsSetting').prop('checked');
      
      // Save to local storage
      localStorage.setItem('currencySymbol', currencySymbol);
      localStorage.setItem('dateFormat', dateFormat);
      localStorage.setItem('timeFormat', timeFormat);
      localStorage.setItem('language', language);
      localStorage.setItem('reminderDays', reminderDays);
      localStorage.setItem('defaultRentalDuration', defaultRentalDuration);
      localStorage.setItem('darkMode', darkMode);
      localStorage.setItem('emailNotifications', emailNotifications);
      
      // Apply dark mode immediately
      if (darkMode) {
        $('body').addClass('dark-mode');
      } else {
        $('body').removeClass('dark-mode');
      }
      
      // Update global variables
      window.currencySymbol = currencySymbol;
      window.dateFormat = dateFormat;
      window.timeFormat = timeFormat;
      window.language = language;
      window.reminderDays = parseInt(reminderDays);
      window.defaultRentalDuration = parseInt(defaultRentalDuration);
      window.darkMode = darkMode;
      window.emailNotifications = emailNotifications;
      
      // Update currency symbol in UI
      $('.currency-symbol').text(currencySymbol);
      
      showAlert('Settings saved successfully', 'success');
    });
    
    // Save company info
    $('#companyInfoForm').submit(function(e) {
      e.preventDefault();
      
      // Get values from form
      const companyInfo = {
        name: $('#companyNameSetting').val(),
        phone: $('#companyPhoneSetting').val(),
        email: $('#companyEmailSetting').val(),
        website: $('#companyWebsiteSetting').val(),
        address: $('#companyAddressSetting').val()
      };
      
      // Save to local storage
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      
      showAlert('Company information saved', 'success');
    });
    
    // Backup data
    $('#backupDataBtn').click(function() {
      // Collect all data from localStorage
      const backupData = {
        settings: {
          currencySymbol: localStorage.getItem('currencySymbol'),
          dateFormat: localStorage.getItem('dateFormat'),
          timeFormat: localStorage.getItem('timeFormat'),
          language: localStorage.getItem('language'),
          reminderDays: localStorage.getItem('reminderDays'),
          defaultRentalDuration: localStorage.getItem('defaultRentalDuration'),
          darkMode: localStorage.getItem('darkMode'),
          emailNotifications: localStorage.getItem('emailNotifications')
        },
        companyInfo: JSON.parse(localStorage.getItem('companyInfo') || '{}')
      };
      
      // Convert to JSON and create download link
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carconnect_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showAlert('Backup created successfully', 'success');
    });
    
    // Restore data
    $('#restoreDataBtn').click(function() {
      const file = $('#restoreFileSetting')[0].files[0];
      if (!file) {
        showAlert('Please select a backup file first', 'warning');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const backupData = JSON.parse(e.target.result);
          
          // Restore settings
          if (backupData.settings) {
            for (const key in backupData.settings) {
              if (backupData.settings[key] !== null) {
                localStorage.setItem(key, backupData.settings[key]);
              }
            }
          }
          
          // Restore company info
          if (backupData.companyInfo) {
            localStorage.setItem('companyInfo', JSON.stringify(backupData.companyInfo));
          }
          
          // Reload settings
          loadSettings();
          
          showAlert('Data restored successfully', 'success');
        } catch (error) {
          console.error('Error restoring data:', error);
          showAlert('Error restoring data: ' + error.message, 'danger');
        }
      };
      reader.readAsText(file);
    });
  }
  
  return {
    loadSettings: loadSettings,
    setupEventHandlers: setupEventHandlers
  };
})(); 
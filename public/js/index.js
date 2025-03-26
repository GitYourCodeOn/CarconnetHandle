// Add this to your existing index.js or a similar file that controls tab changes
$(document).ready(function() {
    // Force currency update when switching tabs
    $('.nav-link[data-toggle="tab"]').on('shown.bs.tab', function() {
        console.log('Tab changed, updating currency displays');
        if (typeof AppSettings !== 'undefined') {
            AppSettings.updateCurrencyDisplays();
        }
    });
}); 
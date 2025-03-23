// Finances module for car rental system
const Finances = (function() {
    // Initialize finances tab
    function initializeFinances() {
        console.log('Initializing finances tab...');
        
        // Load financial data
        loadFinancialData();
        
        // Set up event listeners
        setupFinancesEventListeners();
    }
    
    // Load financial data
    function loadFinancialData() {
        // Get data from localStorage or API
        const revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        // Update UI with financial data
        updateFinancialOverview(revenue, expenses);
        updateRevenueTable(revenue);
        updateExpensesTable(expenses);
        updateCharts(revenue, expenses);
    }
    
    // Update financial overview
    function updateFinancialOverview(revenue, expenses) {
        const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0;
        
        $('#totalRevenueValue').text(`£${totalRevenue.toFixed(2)}`);
        $('#totalExpensesValue').text(`£${totalExpenses.toFixed(2)}`);
        $('#netProfitValue').text(`£${netProfit.toFixed(2)}`);
        $('#profitMarginValue').text(`${profitMargin}%`);
    }
    
    // Update revenue table
    function updateRevenueTable(revenue) {
        const tableBody = $('#revenueTable tbody');
        tableBody.empty();
        
        if (revenue.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center">No revenue entries found</td>
                </tr>
            `);
            return;
        }
        
        // Sort by date (most recent first)
        revenue.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate total for current filter
        let totalAmount = 0;
        
        revenue.forEach(entry => {
            totalAmount += parseFloat(entry.amount);
            
            const row = $(`
                <tr>
                    <td>${formatDate(entry.date)}</td>
                    <td>${entry.description}</td>
                    <td>${entry.category}</td>
                    <td>£${parseFloat(entry.amount).toFixed(2)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-primary edit-revenue" data-id="${entry.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-revenue" data-id="${entry.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
        
        // Update total
        $('#revenueTotalValue').text(`£${totalAmount.toFixed(2)}`);
    }
    
    // Update expenses table
    function updateExpensesTable(expenses) {
        const tableBody = $('#expenseTable tbody');
        tableBody.empty();
        
        if (expenses.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center">No expense entries found</td>
                </tr>
            `);
            return;
        }
        
        // Sort by date (most recent first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate total for current filter
        let totalAmount = 0;
        
        expenses.forEach(entry => {
            totalAmount += parseFloat(entry.amount);
            
            const row = $(`
                <tr>
                    <td>${formatDate(entry.date)}</td>
                    <td>${entry.description}</td>
                    <td>${entry.category}</td>
                    <td>£${parseFloat(entry.amount).toFixed(2)}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-primary edit-expense" data-id="${entry.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-expense" data-id="${entry.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
        
        // Update total
        $('#expenseTotalValue').text(`£${totalAmount.toFixed(2)}`);
    }
    
    // Update charts
    function updateCharts(revenue, expenses) {
        // This would typically use a charting library like Chart.js
        // For now, we'll just display placeholders
        
        // Update expense categories chart placeholder
        if (expenses.length === 0) {
            $('#expenseCategoriesChart').html(`
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <i class="fas fa-chart-pie fa-3x mb-3 text-muted"></i>
                        <p class="text-muted">Chart will display once data is available</p>
                    </div>
                </div>
            `);
        } else {
            $('#expenseCategoriesChart').html(`
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <i class="fas fa-chart-pie fa-3x mb-3 text-primary"></i>
                        <p>Expense Categories Chart would be displayed here using a charting library</p>
                    </div>
                </div>
            `);
        }
        
        // Update revenue by car chart placeholder
        if (revenue.length === 0) {
            $('#carRevenueChart').html(`
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <i class="fas fa-chart-bar fa-3x mb-3 text-muted"></i>
                        <p class="text-muted">Chart will display once data is available</p>
                    </div>
                </div>
            `);
        } else {
            $('#carRevenueChart').html(`
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <i class="fas fa-chart-bar fa-3x mb-3 text-secondary"></i>
                        <p>Revenue by Car Chart would be displayed here using a charting library</p>
                    </div>
                </div>
            `);
        }
    }
    
    // Set up event listeners
    function setupFinancesEventListeners() {
        // Period filter changes
        $('#revenueFilterPeriod').on('change', function() {
            const value = $(this).val();
            if (value === 'custom') {
                $('#customRevenuePeriod').removeClass('d-none');
            } else {
                $('#customRevenuePeriod').addClass('d-none');
                // Apply period filter
                applyRevenueFilter(value);
            }
        });
        
        $('#expenseFilterPeriod').on('change', function() {
            const value = $(this).val();
            if (value === 'custom') {
                $('#customExpensePeriod').removeClass('d-none');
            } else {
                $('#customExpensePeriod').addClass('d-none');
                // Apply period filter
                applyExpenseFilter(value);
            }
        });
        
        // Custom date filters
        $('#revenueStartDate, #revenueEndDate').on('change', function() {
            if ($('#revenueStartDate').val() && $('#revenueEndDate').val()) {
                applyRevenueCustomDateFilter();
            }
        });
        
        $('#expenseStartDate, #expenseEndDate').on('change', function() {
            if ($('#expenseStartDate').val() && $('#expenseEndDate').val()) {
                applyExpenseCustomDateFilter();
            }
        });
        
        // Report generation
        $('#reportPeriod').on('change', function() {
            const value = $(this).val();
            if (value === 'custom') {
                $('#customReportPeriod').removeClass('d-none');
            } else {
                $('#customReportPeriod').addClass('d-none');
            }
        });
        
        $('#generateReport').on('click', function() {
            generateFinancialReport();
        });
        
        // Add revenue/expense buttons
        $(document).on('click', '[data-toggle="modal"][data-target="#addRevenueModal"]', function() {
            prepareAddRevenueModal();
        });
        
        $(document).on('click', '[data-toggle="modal"][data-target="#addExpenseModal"]', function() {
            prepareAddExpenseModal();
        });
        
        // Edit revenue/expense buttons
        $(document).on('click', '.edit-revenue', function() {
            const entryId = $(this).data('id');
            editRevenue(entryId);
        });
        
        $(document).on('click', '.edit-expense', function() {
            const entryId = $(this).data('id');
            editExpense(entryId);
        });
        
        // Delete revenue/expense buttons
        $(document).on('click', '.delete-revenue', function() {
            const entryId = $(this).data('id');
            deleteRevenue(entryId);
        });
        
        $(document).on('click', '.delete-expense', function() {
            const entryId = $(this).data('id');
            deleteExpense(entryId);
        });
    }
    
    // Apply revenue filter by period
    function applyRevenueFilter(period) {
        const revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
        let filteredRevenue = [];
        
        const today = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                filteredRevenue = revenue.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= startDate && entryDate <= endLastMonth;
                });
                updateRevenueTable(filteredRevenue);
                return;
            case 'thisQuarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                break;
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                // Show all
                updateRevenueTable(revenue);
                return;
        }
        
        filteredRevenue = revenue.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= today;
        });
        
        updateRevenueTable(filteredRevenue);
    }
    
    // Apply expense filter by period
    function applyExpenseFilter(period) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        let filteredExpenses = [];
        
        const today = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                filteredExpenses = expenses.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= startDate && entryDate <= endLastMonth;
                });
                updateExpensesTable(filteredExpenses);
                return;
            case 'thisQuarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                break;
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                // Show all
                updateExpensesTable(expenses);
                return;
        }
        
        filteredExpenses = expenses.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= today;
        });
        
        updateExpensesTable(filteredExpenses);
    }
    
    // Apply custom date filter for revenue
    function applyRevenueCustomDateFilter() {
        const startDate = new Date($('#revenueStartDate').val());
        const endDate = new Date($('#revenueEndDate').val());
        endDate.setHours(23, 59, 59); // Set to end of day
        
        const revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
        
        const filteredRevenue = revenue.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        });
        
        updateRevenueTable(filteredRevenue);
    }
    
    // Apply custom date filter for expenses
    function applyExpenseCustomDateFilter() {
        const startDate = new Date($('#expenseStartDate').val());
        const endDate = new Date($('#expenseEndDate').val());
        endDate.setHours(23, 59, 59); // Set to end of day
        
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        
        const filteredExpenses = expenses.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        });
        
        updateExpensesTable(filteredExpenses);
    }
    
    // Generate financial report
    function generateFinancialReport() {
        const reportType = $('#reportType').val();
        const reportPeriod = $('#reportPeriod').val();
        const reportFormat = $('#reportFormat').val();
        
        // This would typically generate an actual report
        // For now, just display a placeholder
        $('#reportPreview').html(`
            <div class="alert alert-info">
                <h4 class="alert-heading">Report Preview</h4>
                <p>A ${reportType} report for the period "${reportPeriod}" would be generated here in ${reportFormat} format.</p>
                <hr>
                <p class="mb-0">In a production environment, this would generate an actual report with financial data.</p>
            </div>
        `);
    }
    
    // Prepare add revenue modal
    function prepareAddRevenueModal() {
        // This would typically set up a modal for adding revenue
        // For implementation, you would need to create the actual modal in modals.html
        console.log('Preparing add revenue modal');
    }
    
    // Prepare add expense modal
    function prepareAddExpenseModal() {
        // This would typically set up a modal for adding expenses
        // For implementation, you would need to create the actual modal in modals.html
        console.log('Preparing add expense modal');
    }
    
    // Edit revenue entry
    function editRevenue(entryId) {
        // This would typically open a modal with the revenue entry details for editing
        console.log('Editing revenue entry with ID:', entryId);
    }
    
    // Edit expense entry
    function editExpense(entryId) {
        // This would typically open a modal with the expense entry details for editing
        console.log('Editing expense entry with ID:', entryId);
    }
    
    // Delete revenue entry
    function deleteRevenue(entryId) {
        if (confirm('Are you sure you want to delete this revenue entry? This action cannot be undone.')) {
            const revenue = JSON.parse(localStorage.getItem('revenue') || '[]');
            const updatedRevenue = revenue.filter(entry => entry.id !== entryId);
            localStorage.setItem('revenue', JSON.stringify(updatedRevenue));
            
            // Update UI
            loadFinancialData();
            
            // Show success message
            showToast('Success', 'Revenue entry deleted successfully', 'success');
        }
    }
    
    // Delete expense entry
    function deleteExpense(entryId) {
        if (confirm('Are you sure you want to delete this expense entry? This action cannot be undone.')) {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const updatedExpenses = expenses.filter(entry => entry.id !== entryId);
            localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
            
            // Update UI
            loadFinancialData();
            
            // Show success message
            showToast('Success', 'Expense entry deleted successfully', 'success');
        }
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    // Return public methods
    return {
        initializeFinances: initializeFinances,
        loadFinancialData: loadFinancialData,
        updateFinancialOverview: updateFinancialOverview,
        setupFinancesEventListeners: setupFinancesEventListeners
    };
})(); 
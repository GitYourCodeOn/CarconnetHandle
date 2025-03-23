// Marketing module for car rental system
const Marketing = (function() {
    // Initialize marketing tab
    function initializeMarketing() {
        console.log('Initializing marketing tab...');
        
        // Load marketing data
        loadMarketingData();
        
        // Set up event listeners
        setupMarketingEventListeners();
    }
    
    // Load marketing data
    function loadMarketingData() {
        // Get data from localStorage or API
        const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        
        // Update UI with promotions
        updatePromotionsTable(promotions);
    }
    
    // Update promotions table
    function updatePromotionsTable(promotions) {
        const tableBody = $('#promotionsTable tbody');
        tableBody.empty();
        
        if (promotions.length === 0) {
            tableBody.append(`
                <tr>
                    <td colspan="8" class="text-center">No active promotions found</td>
                </tr>
            `);
            return;
        }
        
        promotions.forEach(promotion => {
            const startDate = new Date(promotion.startDate);
            const endDate = new Date(promotion.endDate);
            const today = new Date();
            
            let status = 'Active';
            if (today < startDate) {
                status = 'Scheduled';
            } else if (today > endDate) {
                status = 'Expired';
            }
            
            const row = $(`
                <tr>
                    <td>${promotion.code}</td>
                    <td>${promotion.type}</td>
                    <td>${promotion.value}${promotion.type === 'Percentage Discount' ? '%' : ''}</td>
                    <td>${formatDate(promotion.startDate)}</td>
                    <td>${formatDate(promotion.endDate)}</td>
                    <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                    <td>${promotion.usageCount || 0}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-primary edit-promotion" data-id="${promotion.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-promotion" data-id="${promotion.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
    }
    
    // Set up marketing event listeners
    function setupMarketingEventListeners() {
        // Email form submission
        $('#sendEmailForm').on('submit', function(e) {
            e.preventDefault();
            sendEmail();
        });
        
        // Generate promotion code
        $('#generatePromoCode').on('click', function() {
            generatePromoCode();
        });
        
        // Promotion form submission
        $('#createPromotionForm').on('submit', function(e) {
            e.preventDefault();
            savePromotion();
        });
        
        // Marketing material generation
        $('.generate-material').on('click', function() {
            const materialType = $(this).data('type');
            generateMarketingMaterial(materialType);
        });
        
        // Email template selection
        $('#emailTemplate').on('change', function() {
            updateEmailTemplate($(this).val());
        });
        
        // Recipient selection
        $('input[name="recipients"]').on('change', function() {
            if ($(this).val() === 'specific') {
                $('#customerSelection').removeClass('d-none');
            } else {
                $('#customerSelection').addClass('d-none');
            }
        });
    }
    
    // Send email to customers
    function sendEmail() {
        // Get form data
        const templateType = $('#emailTemplate').val();
        const subject = $('#emailSubject').val();
        const content = $('#emailContent').val();
        const recipientType = $('input[name="recipients"]:checked').val();
        
        let recipientIds = [];
        if (recipientType === 'specific') {
            // Get selected customer IDs
            $('.customer-checkbox:checked').each(function() {
                recipientIds.push($(this).data('id'));
            });
        }
        
        // Save email to history (for demonstration)
        const emails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
        emails.push({
            id: generateId(),
            template: templateType,
            subject: subject,
            content: content,
            recipientType: recipientType,
            recipientIds: recipientIds,
            sentAt: new Date().toISOString()
        });
        localStorage.setItem('sentEmails', JSON.stringify(emails));
        
        // Show success message
        showToast('Success', 'Email sent successfully', 'success');
        
        // Reset form
        $('#sendEmailForm')[0].reset();
        $('#customerSelection').addClass('d-none');
    }
    
    // Generate unique promotion code
    function generatePromoCode() {
        // Generate random alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Set code to input field
        $('#promotionCode').val(code);
    }
    
    // Save promotion
    function savePromotion() {
        // Get form data
        const formData = {
            id: generateId(),
            type: $('#promotionType').val(),
            value: $('#promotionValue').val(),
            startDate: $('#promotionStartDate').val(),
            endDate: $('#promotionEndDate').val(),
            code: $('#promotionCode').val(),
            description: $('#promotionDescription').val(),
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
        
        // Validate end date is after start date
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            showToast('Error', 'End date must be after start date', 'danger');
            return;
        }
        
        // Save promotion
        const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
        promotions.push(formData);
        localStorage.setItem('promotions', JSON.stringify(promotions));
        
        // Show success message
        showToast('Success', 'Promotion created successfully', 'success');
        
        // Reset form and update table
        $('#createPromotionForm')[0].reset();
        updatePromotionsTable(promotions);
    }
    
    // Generate marketing material
    function generateMarketingMaterial(type) {
        // This would typically generate the actual material
        // For demonstration, just show a success message
        showToast('Success', `${type} has been generated successfully`, 'success');
    }
    
    // Update email template when selected
    function updateEmailTemplate(templateType) {
        let subject = '';
        let content = '';
        
        // Set default content based on template
        switch (templateType) {
            case 'welcome':
                subject = 'Welcome to Our Car Rental Service';
                content = 'Dear Customer,\n\nWelcome to our car rental service! We are excited to have you as our customer and look forward to serving you.\n\nBest regards,\nCar Rental Team';
                break;
            case 'reminder':
                subject = 'Your Rental is Due Soon';
                content = 'Dear Customer,\n\nThis is a friendly reminder that your car rental is due for return soon. Please ensure timely return to avoid additional charges.\n\nBest regards,\nCar Rental Team';
                break;
            case 'confirmation':
                subject = 'Return Confirmation';
                content = 'Dear Customer,\n\nThank you for returning your rental vehicle. We hope you enjoyed our service and look forward to seeing you again soon.\n\nBest regards,\nCar Rental Team';
                break;
            case 'thankyou':
                subject = 'Thank You for Your Business';
                content = 'Dear Customer,\n\nThank you for choosing our car rental service. We value your business and hope to serve you again in the future.\n\nBest regards,\nCar Rental Team';
                break;
            case 'promotion':
                subject = 'Special Promotion for You';
                content = 'Dear Customer,\n\nWe are pleased to offer you a special promotion for your next rental. Use code SPECIAL10 to get 10% off your next booking.\n\nBest regards,\nCar Rental Team';
                break;
            case 'custom':
                // Leave empty for custom emails
                break;
        }
        
        // Update form fields
        $('#emailSubject').val(subject);
        $('#emailContent').val(content);
    }
    
    // Helper function to generate unique ID
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    // Return public methods
    return {
        initializeMarketing: initializeMarketing,
        loadMarketingData: loadMarketingData,
        updatePromotionsTable: updatePromotionsTable,
        setupMarketingEventListeners: setupMarketingEventListeners
    };
})(); 
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signatureForm');
    const copyButton = document.getElementById('copyButton');
    
    // Elements in the signature
    const sigName = document.getElementById('sig-name');
    const sigTitle = document.getElementById('sig-title');
    const sigEmail = document.getElementById('sig-email');
    const sigPhone = document.getElementById('sig-phone');
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = 'alert';
    alertElement.style.display = 'none';
    document.querySelector('.signature-container').appendChild(alertElement);
    
    // Function to show alert
    function showAlert(message, type = 'success') {
        alertElement.textContent = message;
        alertElement.className = `alert ${type}`;
        alertElement.style.display = 'block';
        
        // Hide alert after 3 seconds
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 3000);
    }
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const title = document.getElementById('title').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        
        // Check if at least one field is filled
        if (!name && !title && !phone && !email) {
            showAlert('Please fill at least one field to generate a signature.', 'error');
            return;
        }
        
        // Update signature elements with form values or hide if empty
        if (name) {
            const fontElement = sigName.querySelector('font');
            fontElement.textContent = name;
            sigName.style.display = 'block';
        } else {
            sigName.style.display = 'none';
        }
        
        if (title) {
            const fontElement = sigTitle.querySelector('font');
            fontElement.textContent = title;
            sigTitle.style.display = 'block';
        } else {
            sigTitle.style.display = 'none';
        }
        
        if (phone) {
            const fontElement = sigPhone.querySelector('font');
            const cleanedPhone = phone.replace(/[^\d+]/g, '');
            fontElement.textContent = phone;
            sigPhone.href = `tel:${cleanedPhone}`;
            sigPhone.parentElement.style.display = 'block';
        } else {
            sigPhone.parentElement.style.display = 'none';
        }
        
        if (email) {
            const fontElement = sigEmail.querySelector('font');
            fontElement.textContent = email;
            sigEmail.href = `mailto:${email}`;
            sigEmail.parentElement.style.display = 'block';
        } else {
            sigEmail.parentElement.style.display = 'none';
        }
        
        // Website is always shown and fixed to cyclicmaterials.earth
        // No need to update it as it's already set in the HTML
        
        // Show success message
        showAlert('Signature generated successfully!');
    });
    
    // Copy signature to clipboard
    copyButton.addEventListener('click', function() {
        const signatureDiv = document.getElementById('signature');
        
        // Create a range and select the signature content
        const range = document.createRange();
        range.selectNode(signatureDiv);
        
        // Clear any existing selections
        window.getSelection().removeAllRanges();
        
        // Select the signature
        window.getSelection().addRange(range);
        
        // Copy to clipboard
        try {
            document.execCommand('copy');
            showAlert('Signature copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showAlert('Failed to copy signature. Please select and copy manually.', 'error');
        }
        
        // Clear selection
        window.getSelection().removeAllRanges();
    });
});





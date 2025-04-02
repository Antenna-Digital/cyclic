document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signatureForm');
    const copyButton = document.getElementById('copyButton');
    
    // Elements in the signature
    const sigName = document.getElementById('sig-name');
    const sigTitle = document.getElementById('sig-title');
    const sigEmail = document.getElementById('sig-email');
    const sigWebsite = document.getElementById('sig-website');
    const sigLinkedin = document.getElementById('sig-linkedin');
    
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
        const email = document.getElementById('email').value;
        const linkedin = document.getElementById('linkedin').value;
        
        // Check if at least one field is filled
        if (!name && !title && !email && !linkedin) {
            showAlert('Please fill at least one field to generate a signature.', 'error');
            return;
        }
        
        // Update signature elements with form values or hide if empty
        if (name) {
            // Only update the text content, preserving all styling
            sigName.textContent = name;
            sigName.style.display = 'block';
        } else {
            sigName.style.display = 'none';
        }
        
        if (title) {
            // Only update the text content, preserving all styling
            sigTitle.textContent = title;
            sigTitle.style.display = 'block';
        } else {
            sigTitle.style.display = 'none';
        }
        
        if (email) {
            // Get the email link and its span
            const emailLink = sigEmail.querySelector('a');
            const emailSpan = emailLink.querySelector('span');
            
            // Update the link href
            emailLink.href = `mailto:${email}`;
            
            // Update the span content
            emailSpan.textContent = email;
            
            // Ensure color is set on both link and span
            emailLink.style.color = "#120E17";
            emailSpan.style.color = "#120E17";
            
            // Show the email element
            sigEmail.style.display = 'block';
        } else {
            sigEmail.style.display = 'none';
        }
        
        // Website is always shown and fixed to globalindustryhub.org
        // No need to update it as it's already set in the HTML
        
        // Find the LinkedIn container paragraph (parent of the link)
        const linkedinContainer = sigLinkedin.parentElement;
        
        if (linkedin && linkedin.trim() !== '') {
            sigLinkedin.href = linkedin;
            sigLinkedin.style.color = "#120E17";
            sigLinkedin.setAttribute("color", "#120E17");
            linkedinContainer.style.display = 'block';
        } else {
            // Hide the entire LinkedIn section if no URL is provided
            linkedinContainer.style.display = 'none';
        }
        
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





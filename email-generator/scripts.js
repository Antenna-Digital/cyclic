document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signatureForm');
    const signatureDiv = document.getElementById('signature');
    const copyButton = document.getElementById('copyButton');
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const title = document.getElementById('title').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const linkedin = document.getElementById('linkedin').value;
        
        // Create signature HTML
        const signatureHTML = `
            <table style="font-family: Arial, sans-serif; color: #333333; font-size: 14px;">
                <tr>
                    <td style="vertical-align: top; padding-right: 15px;">
                        <img src="https://cdn.prod.website-files.com/67a0c5fefed4e777aea3272f/67a4ef2398073801e01677d3_GIH_Favicon256.png" alt="Company Logo" width="80" style="display: block;">
                    </td>
                    <td style="border-left: 2px solid #cccccc; padding-left: 15px;">
                        <p style="margin: 0; font-weight: bold; font-size: 16px;">${name}</p>
                        <p style="margin: 0; color: #666666; font-style: italic;">${title}</p>
                        <p style="margin: 8px 0 0 0;"><a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a></p>
                        <p style="margin: 3px 0 0 0;">${phone}</p>
                        <p style="margin: 3px 0 0 0;"><a href="${linkedin}" style="color: #0066cc; text-decoration: none;">LinkedIn Profile</a></p>
                    </td>
                </tr>
            </table>
        `;
        
        // Update signature div
        signatureDiv.innerHTML = signatureHTML;
    });
    
    // Copy signature to clipboard
    copyButton.addEventListener('click', function() {
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
            alert('Signature copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy signature. Please select and copy manually.');
        }
        
        // Clear selection
        window.getSelection().removeAllRanges();
    });
});





document.addEventListener('DOMContentLoaded', () => {

    const reconForm = document.getElementById('recon-form');
    if (reconForm) {
        const spinner = document.getElementById('loading-spinner');
        reconForm.addEventListener('submit', () => {
            if (spinner) spinner.style.display = 'block';
        });
    }

    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
        selectAllCheckbox.addEventListener('change', (e) => {
            platformCheckboxes.forEach(checkbox => {
                if (!checkbox.disabled) {
                    checkbox.checked = e.target.checked;
                }
            });
        });
    }

    const scrapeForm = document.getElementById('scrape-form');
    if (scrapeForm) {
        const spinner = document.getElementById('scraping-spinner');
        scrapeForm.addEventListener('submit', () => {
            if (spinner) spinner.style.display = 'block';
        });
    }

    const modal = document.getElementById('metadata-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBody = document.getElementById('modal-body');
    const analyzeButtons = document.querySelectorAll('.analyze-image-btn');

    const openModal = () => {
        if (modal) modal.style.display = 'flex';
    };

    const closeModal = () => {
        if (modal) modal.style.display = 'none';
    };

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    const handleImageAnalysis = async (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const imageUrl = button.dataset.imageUrl;
        const profileId = button.dataset.profileId;

        if (!imageUrl || !profileId) {
            alert('Error: Image URL or Profile ID is missing.');
            return;
        }

        modalBody.innerHTML = '<div class="spinner" style="display: block;"></div><p style="text-align: center;">Analyzing image, please wait...</p>';
        openModal();

        try {
            const response = await fetch('/recon/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profileId, imageUrl }),
            });

            if (!response.ok) {
                throw new Error('Analysis request failed.');
            }

            const result = await response.json();
            
            let resultHtml = '<h4>Analysis Results</h4>';
            
            if (result.data.status && result.data.status.includes('no_exif_data')) {
                resultHtml += '<p>No EXIF metadata found in this image.</p>';
            } else if (result.data.status === 'error') {
                 resultHtml += `<p>An error occurred: ${result.data.message}</p>`;
            } else {
                resultHtml += '<table class="metadata-table">';
                for (const [key, value] of Object.entries(result.data)) {
                    if (key === 'GPS' && typeof value === 'object') {
                        resultHtml += `<tr><td>Map Link</td><td><a href="${value.map_url}" target="_blank">View on Google Maps</a></td></tr>`;
                    } else {
                        resultHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
                    }
                }
                resultHtml += '</table>';
            }
            modalBody.innerHTML = resultHtml;

        } catch (error) {
            console.error('Fetch error:', error);
            modalBody.innerHTML = '<p style="color: #f8d7da;">An error occurred while communicating with the server. Please try again.</p>';
        }
    };

    analyzeButtons.forEach(button => {
        button.addEventListener('click', handleImageAnalysis);
    });
});
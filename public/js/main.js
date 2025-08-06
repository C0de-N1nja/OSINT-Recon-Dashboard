document.addEventListener('DOMContentLoaded', () => {

    const reconForm = document.getElementById('recon-form');
    if (reconForm) {
        const spinner = document.getElementById('loading-spinner');
        reconForm.addEventListener('submit', () => {
            if (spinner) spinner.style.display = 'block';
        });
    }

    const scrapeForm = document.getElementById('scrape-form');
    if (scrapeForm) {
        const spinner = document.getElementById('scraping-spinner');
        scrapeForm.addEventListener('submit', () => {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, imageUrl }),
            });

            if (!response.ok) {
                throw new Error('Analysis request failed on the server.');
            }

            const result = await response.json();
            
            let resultHtml = '<h4>Analysis Results</h4>';
            
            const analysisData = result.data;
            let hasExif = false;

            if (analysisData && analysisData.status !== 'error' && analysisData.status !== 'no_exif_data' && analysisData.status !== 'no_relevant_data_found') {
                hasExif = true;
                resultHtml += '<p>The following EXIF metadata was found in the image:</p>';
                resultHtml += '<table class="metadata-table">';
                for (const [key, value] of Object.entries(analysisData)) {
                    if (key === 'GPS' && typeof value === 'object') {
                        resultHtml += `<tr><td>Map Link</td><td><a href="${value.map_url}" target="_blank" rel="noopener noreferrer">View on Google Maps</a></td></tr>`;
                    } else {
                        resultHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
                    }
                }
                resultHtml += '</table>';
            } else {
                resultHtml += '<p>No direct EXIF metadata was found in this image. This is common for social media sites.</p>';
            }

            resultHtml += '<hr style="margin: 15px 0;"><h4>Investigation Pivots</h4>';

            if (imageUrl.startsWith('http')) {
                const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
                resultHtml += `<a href="${searchUrl}" target="_blank" class="button-link" style="background-color: #4285F4; margin-top: 10px;">
                                <i class="fa-brands fa-google"></i> Search for this Image with Google Lens
                               </a>`;
            } else {
                resultHtml += '<p>Reverse image search is not available for this type of embedded image because it does not have a public URL.</p>';
            }

            modalBody.innerHTML = resultHtml;

        } catch (error) {
            console.error('Fetch error:', error);
            modalBody.innerHTML = '<p style="color: #f8d7da;">An error occurred while communicating with the server. Please try again.</p>';
        }
    };

    const analyzeDomainButtons = document.querySelectorAll('.analyze-domain-btn');

    const handleDomainAnalysis = async (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const websiteUrl = button.dataset.websiteUrl;
        const profileId = button.dataset.profileId;

        if (!websiteUrl || !profileId) {
            alert('Error: Website URL or Profile ID is missing.');
            return;
        }

        modalBody.innerHTML = '<div class="spinner" style="display: block;"></div><p style="text-align: center;">Analyzing domain, please wait...</p>';
        openModal();

        try {
            const response = await fetch('/recon/analyze-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, websiteUrl }),
            });

            if (!response.ok) {
                throw new Error('Domain analysis request failed.');
            }

            const result = await response.json();
            const analysisData = result.data;

            let resultHtml = `<h4>Analysis for: ${analysisData.domain}</h4>`;

            // Display WHOIS Info
            if (analysisData.whois && !analysisData.whois.error) {
                resultHtml += '<h5>WHOIS Information</h5><table class="metadata-table">';
                for (const [key, value] of Object.entries(analysisData.whois)) {
                    resultHtml += `<tr><td>${key.replace(/_/g, ' ').toUpperCase()}</td><td>${Array.isArray(value) ? value.join(', ') : value}</td></tr>`;
                }
                resultHtml += '</table>';
            } else {
                 resultHtml += '<p>No WHOIS information found.</p>';
            }

            // Display DNS Info
            if (analysisData.dns && Object.keys(analysisData.dns).length > 0) {
                 resultHtml += '<h5 style="margin-top: 15px;">DNS Records</h5><table class="metadata-table">';
                 for (const [key, value] of Object.entries(analysisData.dns)) {
                    resultHtml += `<tr><td>${key}</td><td>${value.join('<br>')}</td></tr>`;
                }
                resultHtml += '</table>';
            } else {
                resultHtml += '<p>No common DNS records found.</p>';
            }

            modalBody.innerHTML = resultHtml;

        } catch (error) {
            console.error('Domain analysis fetch error:', error);
            modalBody.innerHTML = '<p style="color: #f8d7da;">An error occurred while communicating with the server. Please try again.</p>';
        }
    };

    analyzeDomainButtons.forEach(button => {
        button.addEventListener('click', handleDomainAnalysis);
    });

    analyzeButtons.forEach(button => {
        button.addEventListener('click', handleImageAnalysis);
    });
});
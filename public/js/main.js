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

    const graphContainer = document.getElementById('relationship-graph');
    if (graphContainer) {
        try {
            // Read and parse the graph data embedded in the HTML
            const graphDataString = graphContainer.dataset.graphData;
            const graphData = JSON.parse(graphDataString);

            // Check if we are in "print mode" for the PDF export
            const urlParams = new URLSearchParams(window.location.search);
            const isPrintMode = urlParams.get('print') === 'true';

            // Define the visual options for the graph
            const options = {
                nodes: {
                    shape: 'dot',
                    size: 20,
                    font: {
                        size: 14,
                        color: '#ffffff'
                    },
                    borderWidth: 2,
                },
                edges: {
                    width: 1,
                    color: {
                        color: '#848484',
                        highlight: '#00aaff'
                    },
                    arrows: {
                      to: { enabled: true, scaleFactor: 0.5 }
                    },
                    font: {
                        size: 10,
                        align: 'middle'
                    }
                },
                physics: {
                    // If in print mode, disable physics. Otherwise, enable them.
                    enabled: !isPrintMode, 
                    solver: 'forceAtlas2Based',
                    forceAtlas2Based: {
                        gravitationalConstant: -50,
                        centralGravity: 0.01,
                        springLength: 100,
                        springConstant: 0.08,
                        avoidOverlap: 0.5
                    }
                },
                groups: {
                    target: { color: { background: '#ff4c4c', border: '#ff7878' }, size: 30 },
                    platform: { color: { background: '#00aaff', border: '#59caff' }, shape: 'icon', icon: { face: 'FontAwesome', code: '\uf0ac', size: 50, color: '#FFFFFF' } },
                    person: { color: { background: '#f0ad4e', border: '#f5c986' }, shape: 'icon', icon: { face: 'FontAwesome', code: '\uf007', size: 50, color: '#FFFFFF' } },
                    org: { color: { background: '#5cb85c', border: '#89d489' }, shape: 'icon', icon: { face: 'FontAwesome', code: '\uf1ad', size: 50, color: '#FFFFFF' } },
                    gpe: { color: { background: '#5bc0de', border: '#89d8eb' }, shape: 'icon', icon: { face: 'FontAwesome', code: '\uf57d', size: 50, color: '#FFFFFF' } }
                },
                interaction: {
                    hover: true
                }
            };

            // Create the graph instance
            const network = new vis.Network(graphContainer, graphData, options);

            if (!isPrintMode) {
                setTimeout(() => {
                    network.setOptions({ physics: false });
                }, 3000);
            }

        } catch (error) {
            console.error('Failed to parse or render graph data:', error);
            graphContainer.innerHTML = '<p style="color: #f8d7da;">Error rendering relationship graph.</p>';
        }
    }

    const monitorBtn = document.getElementById('monitor-btn');
    if (monitorBtn) {
        monitorBtn.addEventListener('click', async (event) => {
            const button = event.currentTarget;
            const profileId = button.dataset.profileId;
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enabling...';

            try {
                const response = await fetch(`/recon/profile/${profileId}/monitor`, { method: 'POST' });
                const result = await response.json();
                if (result.success && result.isMonitoring) {
                    button.innerHTML = '<i class="fa-solid fa-check"></i> Monitoring Active';
                } else {
                    button.innerHTML = '<i class="fa-solid fa-times"></i> Error';
                }
            } catch (err) {
                console.error("Failed to enable monitoring:", err);
                button.innerHTML = '<i class="fa-solid fa-times"></i> Error';
            }
        });
    }

});
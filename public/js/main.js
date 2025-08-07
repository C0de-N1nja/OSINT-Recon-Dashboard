document.addEventListener('DOMContentLoaded', () => {
    const profileId = document.body.dataset.profileId || (document.getElementById('monitor-btn') ? document.getElementById('monitor-btn').dataset.profileId : null);

    // --- MODAL & LOADER ---
    const mainModal = document.getElementById('metadata-modal');
    const terminalModal = document.getElementById('terminal-loader-modal');
    const mainModalCloseBtn = document.getElementById('modal-close-btn');
    const mainModalBody = document.getElementById('modal-body');
    const mainModalTitle = document.querySelector('#metadata-modal h3');

    const openModal = () => mainModal.style.display = 'flex';
    const closeModal = () => mainModal.style.display = 'none';

    if (mainModalCloseBtn) mainModalCloseBtn.addEventListener('click', closeModal);
    if (mainModal) mainModal.addEventListener('click', (e) => e.target === mainModal && closeModal());

    const showTerminalLoader = (title, messages) => {
        if (!terminalModal) return;
        const titleEl = terminalModal.querySelector('.terminal-title');
        const outputEl = terminalModal.querySelector('.terminal-output');
        titleEl.textContent = title;
        outputEl.innerHTML = '';
        terminalModal.style.display = 'flex';

        let i = 0;
        function typeMessage() {
            if (i < messages.length) {
                const p = document.createElement('p');
                p.innerHTML = messages[i];
                outputEl.appendChild(p);
                outputEl.scrollTop = outputEl.scrollHeight;
                i++;
                setTimeout(typeMessage, Math.random() * 150 + 50);
            }
        }
        typeMessage();
    };

    const hideTerminalLoader = () => {
        if (terminalModal) terminalModal.style.display = 'none';
    };
    
    // --- API CALL HELPER ---
    const apiPost = async (url, body) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API POST request to ${url} failed:`, error);
            return { error: true, message: error.message };
        }
    };
    
    // --- PAGE-SPECIFIC INITIALIZATION ---
    if (document.querySelector('.report-container')) {
        initProfilePage(profileId);
    }
    if (document.getElementById('recon-form')) {
        initHomePage();
    }
    if (document.getElementById('scrape-form')) {
        initIntermediatePage();
    }

    // --- INITIALIZATION FUNCTIONS ---
    function initHomePage() {
        const reconForm = document.getElementById('recon-form');
        reconForm.addEventListener('submit', () => {
            const username = reconForm.querySelector('input[name="username"]').value;
            showTerminalLoader('Initializing Scan...', [
                `> Target locked: <span class="data-font">${username}</span>`,
                '> Executing command: ./username_tracker.py',
                '> Pinging social networks... (This may take a moment)',
                '> Compiling results... <span class="cursor">|</span>'
            ]);
        });
    }

    function initIntermediatePage() {
        const scrapeForm = document.getElementById('scrape-form');
        scrapeForm.addEventListener('submit', () => {
            const selectedPlatforms = [...scrapeForm.querySelectorAll('input[name="platforms"]:checked')].map(cb => cb.value).join(', ');
            showTerminalLoader('Initiating Deep Scrape...', [
                '> Accessing scraping modules...',
                `> Platforms selected: <span class="data-font">${selectedPlatforms || 'None'}</span>`,
                '> Launching headless browsers...',
                '> This process involves advanced analysis and can take several minutes.',
                '> Executing... <span class="cursor">|</span>'
            ]);
        });

        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
            selectAllCheckbox.addEventListener('change', (e) => {
                platformCheckboxes.forEach(checkbox => {
                    if (!checkbox.disabled) checkbox.checked = e.target.checked;
                });
            });
        }
    }

    function initProfilePage(profileId) {
        // Sticky Nav Logic
        const navLinks = document.querySelectorAll('#report-nav-list a');
        const sections = [...navLinks].map(link => document.querySelector(link.getAttribute('href')));
        
        const onScroll = () => {
            const scrollPosition = window.scrollY + 150;
            sections.forEach(section => {
                if (section && scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${section.id}`);
                    });
                }
            });
        };
        window.addEventListener('scroll', onScroll);

        // Action Buttons
        document.querySelector('.action-buttons').addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
        
            const action = button.dataset.action;
            switch(action) {
                case 'export-json': window.location.href = `/profile/${profileId}/export/json`; break;
                case 'export-pdf': window.open(`/profile/${profileId}/export/pdf`, '_blank'); break;
                case 'view-history': handleHistory(profileId); break;
                case 'hunt-leaks': handleLeakHunt(profileId); break;
            }
        });

        // Event Listeners for Analysis buttons
        document.querySelectorAll('.analyze-image-btn').forEach(btn => btn.addEventListener('click', (e) => handleImageAnalysis(e.currentTarget, profileId)));
        document.querySelectorAll('.analyze-domain-btn').forEach(btn => btn.addEventListener('click', (e) => handleDomainAnalysis(e.currentTarget, profileId)));
        
        // Relationship Graph
        renderGraph();

        // Monitor button
        const monitorBtn = document.getElementById('monitor-btn');
        if (monitorBtn) {
            monitorBtn.addEventListener('click', async () => {
                monitorBtn.disabled = true;
                monitorBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enabling...';
                const result = await apiPost(`/recon/profile/${profileId}/monitor`, {});
                if (result.success && result.isMonitoring) {
                    monitorBtn.innerHTML = '<i class="fa-solid fa-check"></i> Monitoring';
                    document.querySelector('.summary-stat:not(.active):not([class*="risk"])').textContent = 'ACTIVE';
                    document.querySelector('.summary-stat:not(.active):not([class*="risk"])').classList.add('active');
                } else {
                    monitorBtn.innerHTML = '<i class="fa-solid fa-times"></i> Error';
                }
            });
        }
    }

    // --- HANDLER FUNCTIONS ---
    async function handleHistory(profileId) {
        mainModalTitle.textContent = 'Profile Change History';
        mainModalBody.innerHTML = '<div class="spinner" style="display: block;"></div>';
        openModal();

        const response = await fetch(`/recon/profile/${profileId}/history`);
        const historyEvents = await response.json();
        let html = '';
        if (historyEvents.length === 0) {
            html = '<p class="no-results">No changes have been recorded for this profile yet.</p>';
        } else {
            historyEvents.forEach(event => {
                html += `
                    <div class="history-event">
                        <div class="history-meta">
                            <strong>${new Date(event.timestamp).toLocaleString()}</strong> - 
                            <span class="data-font">${event.platform} / ${event.field}</span>
                        </div>
                        <div class="history-change">
                            <span class="history-old">${event.oldValue || '<em>(empty)</em>'}</span>
                            →
                            <span class="history-new">${event.newValue || '<em>(empty)</em>'}</span>
                        </div>
                    </div>
                `;
            });
        }
        mainModalBody.innerHTML = html;
    }

    async function handleLeakHunt(profileId) {
        mainModalTitle.textContent = 'Pastebin Leak Hunt';
        mainModalBody.innerHTML = '<div class="spinner" style="display: block;"></div>';
        openModal();
        
        const result = await apiPost('/recon/hunt-for-leaks', { profileId });
        let html = '';
        if (result.error || (result.leaks_found && result.leaks_found.length === 0)) {
            html = `<p class="no-results">No public leaks found for the target's identifiers on Pastebin.</p>`;
        } else {
             html += '<p>Found potential leaks on the following pages:</p>';
             result.leaks_found.forEach(leak => {
                html += `
                    <div class="history-event">
                        <a href="${leak.url}" target="_blank" rel="noopener noreferrer">${leak.url} <i class="fa-solid fa-arrow-up-right-from-square fa-xs"></i></a>
                    </div>
                `;
            });
        }
        mainModalBody.innerHTML = html;
    }

    async function handleImageAnalysis(button, profileId) {
        const imageUrl = button.dataset.imageUrl;
        mainModalTitle.textContent = 'Image Metadata Analysis';
        mainModalBody.innerHTML = '<div class="spinner" style="display: block;"></div>';
        openModal();

        const result = await apiPost('/recon/analyze-image', { profileId, imageUrl });
        let html = '<h4>Analysis Results</h4>';

        if (result.error || result.data?.status === 'error') {
            html += '<p class="no-results">An error occurred during analysis.</p>';
        } else if (result.data?.status?.includes('no_')) {
            html += '<p class="no-results">No EXIF metadata was found in this image. This is common for social media sites.</p>';
        } else {
             html += '<table class="metadata-table">';
             for (const [key, value] of Object.entries(result.data)) {
                 if (key === 'GPS' && typeof value === 'object') {
                     html += `<tr><td>Map Link</td><td><a href="${value.map_url}" target="_blank" rel="noopener noreferrer">View on Google Maps</a></td></tr>`;
                 } else {
                     html += `<tr><td>${key}</td><td>${value}</td></tr>`;
                 }
             }
             html += '</table>';
        }
        html += '<hr style="margin: 15px 0; border-color: var(--color-border);"><h4>Investigation Pivots</h4>';
        const searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
        html += `<a href="${searchUrl}" target="_blank" class="button-link" style="background-color: #4285F4; margin-top: 10px;">
                    <i class="fa-brands fa-google"></i> Search with Google Lens
                 </a>`;
        mainModalBody.innerHTML = html;
    }

    async function handleDomainAnalysis(button, profileId) {
        const websiteUrl = button.dataset.websiteUrl;
        mainModalTitle.textContent = 'Domain Intelligence';
        mainModalBody.innerHTML = '<div class="spinner" style="display: block;"></div>';
        openModal();

        const result = await apiPost('/recon/analyze-domain', { profileId, websiteUrl });
        const data = result.data;
        let html = `<h4>Analysis for: <span class="data-font">${data.domain}</span></h4>`;

        if (data.whois && !data.whois.error) {
            html += '<h5>WHOIS Information</h5><table class="metadata-table">';
            for (const [key, value] of Object.entries(data.whois)) {
                html += `<tr><td>${key.replace(/_/g, ' ').toUpperCase()}</td><td>${Array.isArray(value) ? value.join(', ') : value}</td></tr>`;
            }
            html += '</table>';
        }

        if (data.dns && Object.keys(data.dns).length > 0) {
            html += '<h5 style="margin-top: 15px;">DNS Records</h5><table class="metadata-table">';
            for (const [key, value] of Object.entries(data.dns)) {
                html += `<tr><td>${key}</td><td>${value.join('<br>')}</td></tr>`;
            }
            html += '</table>';
        }
        mainModalBody.innerHTML = html;
    }

    function renderGraph() {
        const container = document.getElementById('relationship-graph');
        if (!container) return;
        try {
            const data = JSON.parse(container.dataset.graphData);
                        const options = {
                nodes: {
                    shape: 'dot', size: 20,
                    font: { size: 14, color: '#EAEAEA', face: 'Fira Code' },
                    borderWidth: 2,
                },
                edges: {
                    width: 1,
                    color: { color: '#8899A6', highlight: '#00aaff' },
                    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    font: { align: 'middle', color: '#8899A6', size: 12 }
                },
                physics: { enabled: true, solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, avoidOverlap: 0.5 } },
                groups: {
                    target: { color: { background: '#00ffaa', border: '#00ffaa' }, size: 30 }, // Phosphor Green
                    platform: { color: { background: '#00aaff', border: '#00aaff' } }, // Tron Blue
                    person: { color: { background: '#FFBF00', border: '#FFBF00' } }, // Amber
                    org: { color: { background: '#5cb85c', border: '#89d489' } },
                    gpe: { color: { background: '#5bc0de', border: '#89d8eb' } }
                },
                interaction: { hover: true }
            };
            const network = new vis.Network(container, data, options);
            setTimeout(() => network.setOptions({ physics: false }), 3000);
        } catch (e) {
            console.error('Failed to render graph:', e);
            container.innerHTML = '<p class="no-results">Error rendering relationship graph.</p>';
        }
    }
});
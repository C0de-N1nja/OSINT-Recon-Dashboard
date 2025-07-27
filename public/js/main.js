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
});
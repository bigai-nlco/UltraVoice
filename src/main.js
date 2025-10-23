// Main JavaScript file for UltraVoice demo

// Initialize the application
async function init() {
    console.log('🎵 Initializing UltraVoice Demo...');
    showLoading();
    
    // Load dataset
    const samples = await loadDataset();
    console.log('📊 Dataset loaded, total samples:', samples.length);
    
    if (samples.length === 0) {
        console.error('❌ No samples loaded! Please check:');
        console.error('1. Are you running from a local server? (e.g., python3 -m http.server 8000)');
        console.error('2. Is the audios/selected_data.jsonl file in the correct location?');
        showError('Failed to load dataset. Please run from a local server.');
        return;
    }
    
    // Organize and render data
    console.log('🔄 Organizing data by dimensions...');
    const organizedData = organizeDataByDimensions();
    console.log('✓ Organized data:', organizedData);
    
    renderDimensions(organizedData);
    console.log('✓ Rendering complete!');
    
    hideLoading();
}

// Show loading state
function showLoading() {
    const container = document.getElementById('dimensions-container');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">Loading dataset samples...</p>
        </div>
    `;
}

// Hide loading state
function hideLoading() {
    // Loading is replaced by content
}

// Show error message
function showError(message) {
    const container = document.getElementById('dimensions-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 1rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="color: #fca5a5; margin-bottom: 1rem;">Error Loading Dataset</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${message}</p>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 0.5rem; text-align: left; max-width: 600px; margin: 0 auto;">
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>To fix this, run:</strong></p>
                <code style="color: #10b981; display: block; padding: 0.5rem; background: rgba(0, 0, 0, 0.3); border-radius: 0.3rem;">
                    cd /path/to/UltraVoice100K<br>
                    python3 -m http.server 8000
                </code>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Then open: <code style="color: #06b6d4;">http://localhost:8000</code></p>
            </div>
        </div>
    `;
}

// Render all dimensions
function renderDimensions(organizedData) {
    const container = document.getElementById('dimensions-container');
    container.innerHTML = '';
    
    for (const [dimKey, dimData] of Object.entries(organizedData)) {
        // Skip if no subtypes with data
        if (Object.keys(dimData.subtypes).length === 0) continue;
        
        const dimensionCard = createDimensionCard(dimKey, dimData);
        container.appendChild(dimensionCard);
    }
}

// Create dimension card
function createDimensionCard(dimKey, dimData) {
    const config = dimData.config;
    const subtypesCount = Object.keys(dimData.subtypes).length;
    const totalSamples = Object.values(dimData.subtypes).reduce((sum, samples) => sum + samples.length, 0);
    
    const card = document.createElement('div');
    card.className = 'dimension-card';
    
    const header = document.createElement('div');
    header.className = 'dimension-header';
    header.innerHTML = `
        <div class="dimension-title-group">
            <div class="dimension-icon" style="background: ${config.gradient}">
                ${config.icon}
            </div>
            <div>
                <div class="dimension-name">${config.name}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.2rem;">
                    ${config.description}
                </div>
            </div>
        </div>
        <div class="dimension-count">
            ${subtypesCount} sub-types • ${totalSamples} samples
        </div>
        <div class="dimension-toggle">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'dimension-content';
    
    // Create subtype cards
    for (const [subtype, samples] of Object.entries(dimData.subtypes)) {
        const subtypeCard = createSubtypeCard(dimKey, subtype, samples);
        content.appendChild(subtypeCard);
    }
    
    // Toggle functionality
    header.addEventListener('click', () => {
        header.classList.toggle('active');
        content.classList.toggle('active');
    });
    
    card.appendChild(header);
    card.appendChild(content);
    
    return card;
}

// Create subtype card
function createSubtypeCard(dimension, subtype, samples) {
    const card = document.createElement('div');
    card.className = 'subtype-card';
    
    const header = document.createElement('div');
    header.className = 'subtype-header';
    header.innerHTML = `
        <div class="subtype-name">
            <i class="fas fa-folder"></i>
            ${formatSubtypeName(subtype, dimension)}
            <span class="subtype-badge">${samples.length}</span>
        </div>
        <div class="subtype-toggle">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'subtype-content';
    
    // Create sample cards
    samples.forEach((sample, index) => {
        const sampleCard = createSampleCard(sample, index + 1, dimension, subtype);
        content.appendChild(sampleCard);
    });
    
    // Toggle functionality
    header.addEventListener('click', () => {
        header.classList.toggle('active');
        content.classList.toggle('active');
    });
    
    card.appendChild(header);
    card.appendChild(content);
    
    return card;
}

// Create sample card
function createSampleCard(sample, index, dimension, subtype) {
    const card = document.createElement('div');
    card.className = 'sample-card';
    
    // Construct audio paths from JSONL data using demo paths
    const instructionAudioPath = getAudioPath(sample.demo_instruction_wav_path || sample.instruction_wav_path);
    const responseAudioPath = getAudioPath(sample.demo_response_wav_path || sample.response_wav_path);
    
    // Debug log
    if (index === 1) {
        console.log(`Audio paths for sample ${sample.index}:`, {
            instruction: instructionAudioPath,
            response: responseAudioPath
        });
    }
    
    card.innerHTML = `
        <div class="sample-header">
            <div class="sample-index">${index}</div>
            <div class="sample-title">Sample #${sample.index}</div>
        </div>
        
        <!-- Instruction Audio -->
        <div class="audio-section">
            <div class="audio-label">
                <i class="fas fa-microphone"></i>
                Instruction Audio
            </div>
            <div class="audio-player-wrapper">
                <audio controls preload="metadata">
                    <source src="${instructionAudioPath}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
            <div class="text-content instruction-text">
                "${sample.instruction_text}"
            </div>
        </div>
        
        <!-- Response Audio -->
        <div class="audio-section">
            <div class="audio-label">
                <i class="fas fa-volume-up"></i>
                Response Audio
            </div>
            <div class="audio-player-wrapper">
                <audio controls preload="metadata">
                    <source src="${responseAudioPath}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
            <div class="text-content response-text">
                "${sample.response_text}"
            </div>
        </div>
        
        <!-- Style Description -->
        <div class="style-description">
            <i class="fas fa-palette"></i>
            Style: ${sample.style_description}
        </div>
    `;
    
    return card;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // Press 'E' to expand all
    if (e.key === 'e' || e.key === 'E') {
        document.querySelectorAll('.dimension-header').forEach(header => {
            if (!header.classList.contains('active')) {
                header.click();
            }
        });
    }
    
    // Press 'C' to collapse all
    if (e.key === 'c' || e.key === 'C') {
        document.querySelectorAll('.dimension-header').forEach(header => {
            if (header.classList.contains('active')) {
                header.click();
            }
        });
    }
});

// Add helpful tooltip
window.addEventListener('load', () => {
    console.log('%c🎵 UltraVoice Demo Loaded Successfully! 🎵', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%cKeyboard shortcuts:', 'color: #06b6d4; font-size: 14px;');
    console.log('%c  E - Expand all dimensions', 'color: #cbd5e1;');
    console.log('%c  C - Collapse all dimensions', 'color: #cbd5e1;');
});

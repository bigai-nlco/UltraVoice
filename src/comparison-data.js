// Comparison data for Base vs SFT model
// This file loads the inference results for comparison

// Load comparison data from embedded dataset
function loadComparisonData() {
    // Use embedded data if available
    if (window.EMBEDDED_COMPARISON_DATA && window.EMBEDDED_COMPARISON_DATA.length > 0) {
        console.log('📊 Using embedded comparison data:', window.EMBEDDED_COMPARISON_DATA.length, 'samples');
        return Promise.resolve(window.EMBEDDED_COMPARISON_DATA);
    }
    
    // Fallback: try to fetch from JSONL file
    console.log('⚠️ Embedded data not found, attempting to fetch from JSONL...');
    return fetch('./audios/inference_results/slected_data.jsonl')
        .then(response => response.text())
        .then(text => {
            if (!text || text.trim() === '') {
                console.warn('⚠️  slected_data.jsonl is empty');
                return [];
            }
            
            const lines = text.trim().split('\n');
            const samples = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    console.error('Error parsing line:', line, e);
                    return null;
                }
            }).filter(sample => sample !== null);
            
            console.log('📊 Loaded comparison samples from JSONL:', samples.length);
            return samples;
        })
        .catch(error => {
            console.error('❌ Error loading comparison data:', error);
            return [];
        });
}

// Render comparison table
async function renderComparisonTable() {
    console.log('🔄 Loading comparison data...');
    
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody) {
        console.error('❌ Comparison tbody not found');
        return;
    }
    
    // Show loading
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 3rem;">
                <div class="spinner"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Loading comparison data...</p>
            </td>
        </tr>
    `;
    
    const samples = await loadComparisonData();
    
    if (samples.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <p style="color: var(--text-secondary);">No comparison data available</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Clear loading
    tbody.innerHTML = '';
    
    // Group samples by dimension for better organization
    // Order matches the DIMENSIONS_CONFIG in data.js
    const dimensionOrder = ['emotion', 'speed', 'volume', 'accent', 'language', 'composite'];
    const groupedSamples = {};
    
    samples.forEach(sample => {
        // Normalize dimension names: description/combination -> composite
        let dim = sample.split_type;
        if (dim === 'description' || dim === 'combination') {
            dim = 'composite';
        }
        if (!groupedSamples[dim]) {
            groupedSamples[dim] = [];
        }
        groupedSamples[dim].push(sample);
    });
    
    // Render samples in order with rowspan for dimensions
    dimensionOrder.forEach(dimension => {
        if (groupedSamples[dimension]) {
            const dimSamples = groupedSamples[dimension];
            dimSamples.forEach((sample, index) => {
                const row = createComparisonRow(
                    sample, 
                    index === 0 ? dimension : null,
                    index === 0 ? dimSamples.length : 0
                );
                tbody.appendChild(row);
            });
        }
    });
    
    console.log('✓ Comparison table rendered!');
    
    // Initialize tooltip positioning after rendering
    initializeTooltipPositions();
}

// Initialize tooltip positions based on element location
function initializeTooltipPositions() {
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const audioWrapper = row.querySelector('.query-audio-wrapper[data-tooltip]');
        if (audioWrapper) {
            // First data row (first dimension's first sub-dimension) should always show tooltip below
            // We consider the first row of each dimension group
            const isFirstRow = index === 0;
            
            if (isFirstRow) {
                // First row always shows tooltip below
                audioWrapper.classList.add('tooltip-bottom');
                audioWrapper.setAttribute('data-tooltip-fixed', 'true');
            } else {
                // Other rows can be dynamic
                audioWrapper.addEventListener('mouseenter', function() {
                    if (!this.getAttribute('data-tooltip-fixed')) {
                        updateTooltipPosition(this);
                    }
                });
            }
        }
    });
    
    // Update positions on scroll (for fixed headers or when scrolling)
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            rows.forEach(row => {
                const wrapper = row.querySelector('.query-audio-wrapper[data-tooltip]');
                if (wrapper && wrapper.matches(':hover') && !wrapper.getAttribute('data-tooltip-fixed')) {
                    updateTooltipPosition(wrapper);
                }
            });
        }, 100);
    }, { passive: true });
}

// Update tooltip position based on viewport location
function updateTooltipPosition(wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // If element is in the top portion of viewport or doesn't have enough space above
    if (rect.top < 200 || rect.top < viewportHeight * 0.3) {
        wrapper.classList.add('tooltip-bottom');
    } else {
        wrapper.classList.remove('tooltip-bottom');
    }
}

// Create a comparison table row
function createComparisonRow(sample, showDimension, rowspan) {
    const row = document.createElement('tr');
    
    // File naming pattern: {split_type}_{sub_type}_ultrachat_{index}.wav
    const instructionPath = `./audios/inference_results/instructions/ultrachat_${sample.index}.wav`;
    const basePath = `./audios/inference_results/base/${sample.split_type}_${sample.sub_type}_ultrachat_${sample.index}.wav`;
    const sftPath = `./audios/inference_results/sft/${sample.split_type}_${sample.sub_type}_ultrachat_${sample.index}.wav`;
    
    // Format dimension name
    const dimensionName = formatDimensionName(sample.split_type);
    const subdimensionName = formatSubdimensionName(sample.sub_type);
    
    // Only add dimension cell for first row of each dimension with rowspan
    const dimensionCell = showDimension ? `
        <td class="dimension-cell" rowspan="${rowspan}">
            ${dimensionName}
        </td>
    ` : '';
    
    row.innerHTML = `
        ${dimensionCell}
        <td>
            <span class="subdimension-cell">
                <i class="fas ${getSubdimensionIcon(sample.split_type, sample.sub_type)}"></i>
                ${subdimensionName}
            </span>
        </td>
        <td class="audio-query-cell">
            <div class="query-audio-wrapper" ${sample.instruction_text ? `data-tooltip="${escapeHtml(sample.instruction_text)}"` : ''}>
                <audio controls preload="metadata">
                    <source src="${instructionPath}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </td>
        <td class="model-output-cell">
            <div class="model-audio-wrapper">
                <audio controls preload="metadata">
                    <source src="${basePath}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </td>
        <td class="model-output-cell">
            <div class="model-audio-wrapper">
                <audio controls preload="metadata">
                    <source src="${sftPath}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </td>
    `;
    
    return row;
}

// Format dimension name for display
function formatDimensionName(dimension) {
    // Normalize dimension names
    if (dimension === 'description' || dimension === 'combination') {
        dimension = 'composite';
    }
    
    const names = {
        'accent': 'Accent',
        'emotion': 'Emotion',
        'speed': 'Speed',
        'volume': 'Volume',
        'language': 'Language',
        'composite': 'Composite'
    };
    return names[dimension] || dimension.charAt(0).toUpperCase() + dimension.slice(1);
}

// Format subdimension name for display
function formatSubdimensionName(subdimension) {
    // Handle accent codes (consistent with paper: AU, CA, GB, IN, SG, ZA)
    const accentNames = {
        'AU': 'Australia',
        'CA': 'Canada',
        'GB': 'United Kingdom',
        'IN': 'India',
        'SG': 'Singapore',
        'ZA': 'South Africa'
    };
    
    if (accentNames[subdimension]) {
        return accentNames[subdimension];
    }
    
    // Capitalize first letter for others
    return subdimension.charAt(0).toUpperCase() + subdimension.slice(1);
}

// Get icon for subdimension
function getSubdimensionIcon(dimension, subdimension) {
    // Normalize dimension names
    if (dimension === 'description' || dimension === 'combination') {
        dimension = 'composite';
    }
    
    if (dimension === 'emotion') {
        const emotionIcons = {
            'happy': 'fa-smile',
            'sad': 'fa-frown',
            'angry': 'fa-angry',
            'neutral': 'fa-meh',
            'surprised': 'fa-surprise',
            'fearful': 'fa-grimace',
            'disgusted': 'fa-dizzy'
        };
        return emotionIcons[subdimension] || 'fa-circle';
    } else if (dimension === 'speed') {
        const speedIcons = {
            'fast': 'fa-forward',
            'normal': 'fa-play',
            'slow': 'fa-step-forward'
        };
        return speedIcons[subdimension] || 'fa-circle';
    } else if (dimension === 'volume') {
        const volumeIcons = {
            'high': 'fa-volume-up',
            'normal': 'fa-volume-down',
            'low': 'fa-volume-off'
        };
        return volumeIcons[subdimension] || 'fa-circle';
    } else if (dimension === 'language') {
        return 'fa-language';
    } else if (dimension === 'accent') {
        return 'fa-globe';
    } else if (dimension === 'composite') {
        return 'fa-layer-group';
    }
    return 'fa-circle';
}

// Escape HTML to prevent XSS in tooltips
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize comparison table when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderComparisonTable);
} else {
    renderComparisonTable();
}


// Data structure for UltraVoice dimensions
const DIMENSIONS_CONFIG = {
    emotion: {
        name: 'Emotion',
        icon: '😊',
        description: 'Control emotional expression in speech',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        subtypes: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted']
    },
    speed: {
        name: 'Speed',
        icon: '⚡',
        description: 'Adjust speech rate and tempo',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        subtypes: ['slow', 'normal', 'fast']
    },
    volume: {
        name: 'Volume',
        icon: '🔊',
        description: 'Modulate speech volume levels',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        subtypes: ['low', 'normal', 'high']
    },
    accent: {
        name: 'Accent',
        icon: '🌍',
        description: 'Different regional accents',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        subtypes: ['AU', 'CA', 'GB', 'IN', 'SG', 'ZA']
    },
    language: {
        name: 'Language',
        icon: '🗣️',
        description: 'Multi-lingual speech synthesis',
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        subtypes: ['chinese', 'korean', 'japanese']
    },
    composite: {
        name: 'Composite',
        icon: '🎨',
        description: 'Combined style dimensions',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        subtypes: ['en']
    },
    // Legacy aliases for backward compatibility
    description: {
        name: 'Composite',
        icon: '🎨',
        description: 'Combined style dimensions',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        subtypes: ['en']
    },
    combination: {
        name: 'Composite',
        icon: '🎨',
        description: 'Combined style dimensions',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        subtypes: ['en']
    }
};

// Accent labels mapping (consistent with paper)
const ACCENT_LABELS = {
    'AU': 'Australia',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'IN': 'India',
    'SG': 'Singapore',
    'ZA': 'South Africa'
};

// Function to format subtype name for display
function formatSubtypeName(subtype, dimension) {
    // Normalize dimension names
    if (dimension === 'description' || dimension === 'combination') {
        dimension = 'composite';
    }
    
    if (dimension === 'accent') {
        return ACCENT_LABELS[subtype.toUpperCase()] || subtype;
    }
    if (dimension === 'composite') {
        return subtype === 'en' ? 'English' : subtype;
    }
    return subtype.charAt(0).toUpperCase() + subtype.slice(1);
}

// Function to get audio path
function getAudioPath(relativePath) {
    // The paths in the JSONL are already relative from the project root
    return `audios/${relativePath}`;
}

// Embedded dataset - loaded directly without needing a server
// This allows the demo to work when opening index.html directly in a browser
let datasetSamples = null;

// Function to load embedded dataset
async function loadDataset() {
    try {
        // Try to fetch from file first (for server mode)
        try {
            const response = await fetch('audios/selected_data.jsonl');
            if (response.ok) {
                const text = await response.text();
                const lines = text.trim().split('\n').filter(line => line.trim());
                datasetSamples = lines.map(line => JSON.parse(line));
                console.log(`✓ Loaded ${datasetSamples.length} samples from file`);
                return datasetSamples;
            }
        } catch (fetchError) {
            console.log('⚠️ Could not fetch file, using embedded data');
        }
        
        // Fallback to embedded data
        if (window.EMBEDDED_DATASET) {
            datasetSamples = window.EMBEDDED_DATASET;
            console.log(`✓ Loaded ${datasetSamples.length} samples from embedded data`);
            console.log('Sample data structure:', datasetSamples[0]);
            return datasetSamples;
        } else {
            throw new Error('No embedded dataset found');
        }
    } catch (error) {
        console.error('✗ Error loading dataset:', error);
        return [];
    }
}

// Function to get samples by dimension and subtype
function getSamplesByDimensionSubtype(dimension, subtype) {
    return datasetSamples.filter(sample => 
        sample.split_type === dimension && 
        sample.sub_type === subtype &&
        sample.demo_selected === true
    ).slice(0, 3); // Get first 3 samples
}

// Function to organize data by dimensions
function organizeDataByDimensions() {
    const organized = {};
    
    for (const [dimKey, dimConfig] of Object.entries(DIMENSIONS_CONFIG)) {
        organized[dimKey] = {
            config: dimConfig,
            subtypes: {}
        };
        
        dimConfig.subtypes.forEach(subtype => {
            const samples = getSamplesByDimensionSubtype(dimKey, subtype);
            if (samples.length > 0) {
                organized[dimKey].subtypes[subtype] = samples;
            }
        });
    }
    
    return organized;
}


/**
 * SYNAPSE — Medical Ontology Alignment Engine
 * Frontend Application Logic (v1.6 - High Contrast & Stability)
 */

// ─── STATE ──────────────────────────────────────────────────
const state = {
    ontologies: [
        { id: 'SNOMEDCT', name: 'SNOMED CT', active: true, color: '#8B75FF' },
        { id: 'ICD10CM', name: 'ICD-10-CM', active: true, color: '#00F0FF' },
        { id: 'ICD11MMS', name: 'ICD-11', active: true, color: '#22DA7B' },
        { id: 'LOINC', name: 'LOINC', active: true, color: '#FFB020' },
        { id: 'RXNORM', name: 'RxNorm', active: true, color: '#FF4D6D' },
        { id: 'MESH', name: 'MeSH', active: true, color: '#E91E63' },
        { id: 'NCIT', name: 'NCI Thesaurus', active: false, color: '#9C27B0' },
        { id: 'HP', name: 'HPO', active: false, color: '#3F51B5' },
        { id: 'DOID', name: 'Disease Ontology (DOID)', active: false, color: '#FF6B6B' },
        { id: 'MONDO', name: 'Mondo', active: false, color: '#4ECDC4' },
        { id: 'ORDO', name: 'Orphanet (ORDO)', active: false, color: '#C7F464' },
        { id: 'CHEBI', name: 'ChEBI', active: false, color: '#A0B1C6' },
        { id: 'ATC', name: 'WHO ATC', active: false, color: '#C44D58' },
        { id: 'VANDF', name: 'VANDF', active: false, color: '#4A90E2' },
        { id: 'GO', name: 'Gene Ontology (GO)', active: false, color: '#50E3C2' },
        { id: 'HGNC', name: 'HGNC', active: false, color: '#F8E71C' },
        { id: 'FMA', name: 'FMA (Anatomy)', active: false, color: '#7ED321' },
        { id: 'MP', name: 'Mammalian Phenotype (MP)', active: false, color: '#BD10E0' },
        { id: 'WHO-ART', name: 'WHO-ART', active: false, color: '#9013FE' },
        { id: 'ICPC2P', name: 'ICPC-2 PLUS', active: false, color: '#8A9A9A' }
    ],
    selectedSource: null,
    autoMatches: [],
    history: [],
    stats: { maps: 0, exports: 0 },
    currentExport: { format: 'json', content: '' }
};

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    renderOntologyChips();
    populateOntologySelects();
    initEventListeners();
});

function initEventListeners() {
    document.getElementById('start-btn').onclick = () => document.getElementById('hero-screen').classList.add('hidden');

    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchView(btn.dataset.view);
        };
    });

    let searchTimeout;
    document.getElementById('main-search').oninput = (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length > 1) searchTimeout = setTimeout(() => performSearch(query), 400);
    };

    document.getElementById('run-batch').onclick = runBatch;
    document.getElementById('download-btn').onclick = downloadExport;
    document.getElementById('close-export').onclick = () => document.getElementById('export-modal').classList.add('hidden');
    
    // Global Clear
    document.getElementById('global-clear-btn').onclick = clearSession;
}

function clearSession() {
    state.selectedSource = null;
    state.autoMatches = [];
    
    // Reset Inputs
    document.getElementById('main-search').value = '';
    document.getElementById('batch-input').value = '';
    
    // Clear Outputs
    document.getElementById('results-area').innerHTML = '';
    document.getElementById('output-area').innerHTML = '';
    
    // Show Empty State
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('content-panels').classList.add('hidden');
    
    // Update Stats
    updateStats();
}

function switchView(view) {
    document.getElementById('alignment-view').classList.toggle('hidden', view !== 'alignment');
    document.getElementById('batch-view').classList.toggle('hidden', view !== 'batch');
}

// ─── DEPLOYMENT CONFIGURATION ───
// Backend deployed to Hugging Face Spaces
const API_BASE = 'https://johniskros-synapse-engine.hf.space';

// ─── API HELPERS ───
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint.startsWith('/api') ? endpoint : '/api' + endpoint}`, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err);
        return { error: true, message: err.message };
    }
}

// ─── SEARCH & HIERARCHY ─────────────────────────────────────
async function performSearch(query) {
    const area = document.getElementById('results-area');
    area.innerHTML = '';

    const activeOnts = state.ontologies.filter(o => o.active);
    const searches = activeOnts.map(async ont => {
        const results = await apiFetch(`/search?q=${encodeURIComponent(query)}&ontology=${ont.id}`);
        return { ont, results: Array.isArray(results) ? results : [] };
    });

    const all = await Promise.all(searches);
    all.forEach(group => {
        if (group.results.length === 0) return;
        const groupEl = document.createElement('div');
        groupEl.innerHTML = `<div class="section-label">${group.ont.name}</div>`;
        group.results.forEach(res => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:0.6rem;">
                    <span class="code" style="color:var(--text-secondary)">${res.id}</span>
                    <span style="border:1px solid ${group.ont.color}; color:${group.ont.color}; font-size:0.65rem; padding:0.1rem 0.5rem; border-radius:100px; font-family:'Fira Code', monospace; font-weight:500;">${group.ont.name}</span>
                </div>
                <div style="font-family:Outfit; font-size:1.2rem; font-weight:700; color:var(--text-primary);">${res.label}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${res.meta || ''}</div>
            `;
            card.onclick = () => selectSource(res, group.ont);
            groupEl.appendChild(card);
        });
        area.appendChild(groupEl);
    });
}

async function selectSource(concept, ont) {
    state.selectedSource = { ...concept, ontology: ont.name, ontId: ont.id, color: ont.color };
    state.autoMatches = [];
    
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('content-panels').classList.remove('hidden');
    
    // Ensure the top Anatomy panel is visible (might be hidden by batch mode)
    document.getElementById('top-anatomy-card').style.display = 'block';

    document.getElementById('selected-title').innerText = concept.label;
    document.getElementById('selected-id').innerText = `${ont.name} : ${concept.id}`;
    
    document.getElementById('parent-list').innerHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">Querying Lineage...</div>';
    document.getElementById('child-list').innerHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">Querying Children...</div>';
    document.getElementById('output-area').innerHTML = `<div style="padding:1.5rem; color:var(--accent-signal); font-family:Outfit; font-weight:800; font-size:0.9rem; letter-spacing:0.1em; text-transform:uppercase; display:flex; align-items:center; gap:0.5rem;"><svg class="synapse-icon"><use href="#icon-synapse"></use></svg> Firing Auto-Align Signals...</div>`;

    const data = await fetchHierarchyData(concept.uri, ont.id);
    renderHierarchyToDOM(data, 'parent-list', 'child-list');
    
    await triggerAutoMatch(state.selectedSource);
}

async function fetchHierarchyData(uri, ontId) {
    return await apiFetch(`/hierarchy?uri=${encodeURIComponent(uri)}&ontology=${ontId}`);
}

function renderHierarchyToDOM(data, parentElId, childElId) {
    const pList = document.getElementById(parentElId);
    if(pList) {
        pList.innerHTML = '';
        if (data.parents && data.parents.length > 0) {
            data.parents.forEach(p => { pList.innerHTML += `<div class="h-item parent"><span class="h-label">${p.label}</span> <span class="code h-code">${p.id}</span></div>`; });
        } else pList.innerHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">Root Concept</div>';
    }

    const cList = document.getElementById(childElId);
    if(cList) {
        cList.innerHTML = '';
        if (data.children && data.children.length > 0) {
            data.children.forEach(c => { cList.innerHTML += `<div class="h-item child"><span class="h-label">${c.label}</span> <span class="code h-code">${c.id}</span></div>`; });
        } else cList.innerHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">No sub-concepts found</div>';
    }
}

function generateHierarchyHTML(data) {
    let pHTML = '';
    if (data.parents && data.parents.length > 0) {
        data.parents.forEach(p => { pHTML += `<div class="h-item parent"><span class="h-label">${p.label}</span> <span class="code h-code">${p.id}</span></div>`; });
    } else pHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">Root Concept</div>';

    let cHTML = '';
    if (data.children && data.children.length > 0) {
        data.children.forEach(c => { cHTML += `<div class="h-item child"><span class="h-label">${c.label}</span> <span class="code h-code">${c.id}</span></div>`; });
    } else cHTML = '<div class="code" style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem;">No sub-concepts found</div>';
    
    return { pHTML, cHTML };
}

async function triggerAutoMatch(source, targets = null, isBatch = false) {
    const outputArea = document.getElementById('output-area');
    const targetOnts = targets || state.ontologies.filter(o => o.active && o.id !== source.ontId);

    for (const ont of targetOnts) {
        if (!ont) continue;
        const status = document.createElement('div');
        status.style.fontSize = '0.8rem'; status.style.color = 'var(--text-secondary)'; status.style.padding = '0.5rem 1.5rem';
        status.innerText = `Searching ${ont.name}...`;
        outputArea.appendChild(status);

        const matches = await apiFetch(`/search?q=${encodeURIComponent(source.label)}&ontology=${ont.id}`);
        if (Array.isArray(matches) && matches.length > 0) {
            // Prioritize exact matches for better clinical accuracy
            const best = matches.find(m => m.label.toLowerCase() === source.label.toLowerCase()) || matches[0];
            let alignment = await alignConcepts(source, { ...best, ontology: ont.name, color: ont.color });
            
            if (!alignment || alignment.error || alignment.confidence === undefined) {
                alignment = { confidence: 50, mapping_type: 'lexical', explanation: 'Score estimated via lexical analysis (AI service unavailable).' };
            }

            const match = { source, target: { ...best, ontology: ont.name, color: ont.color }, alignment };
            state.autoMatches.push(match);
            renderAlignmentResult(match);
            status.remove();
        } else {
            status.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem; padding:0 1.5rem;">${ont.name}: NO MATCH FOUND</span>`;
        }
    }
    updateStats();
    if (!isBatch) renderExportButton();
}

async function alignConcepts(src, trg) {
    const prompt = `ALIGNMENT: SOURCE [${src.ontology}] ${src.id} "${src.label}" | TARGET [${trg.ontology}] ${trg.id} "${trg.label}". Respond with JSON: {"confidence":0-100, "mapping_type":"equivalent|broader|narrower", "explanation":"..."}`;
    return await apiFetch('/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) });
}

function renderAlignmentResult(match) {
    const area = document.getElementById('output-area');
    const card = document.createElement('div');
    card.className = 'result-card';
    const conf = match.alignment.confidence || 0;
    const color = conf > 80 ? 'var(--accent-success)' : conf > 50 ? 'var(--accent-fire)' : 'var(--accent-warn)';
    
    card.innerHTML = `
        <div class="confidence-badge" style="color:${color}">${conf}%</div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.6rem; font-family:Fira Code; text-transform:uppercase; letter-spacing:0.1em; font-weight:500;">${match.target.ontology}</div>
        <div style="font-family:Outfit; font-size:1.3rem; font-weight:700; margin-right:4rem; line-height:1.2; color:var(--text-primary); overflow-wrap:break-word; word-break:break-word;">${match.target.label}</div>
        <div class="code" style="font-size:0.8rem; color:${color}; margin:0.8rem 0; overflow-wrap:break-word; word-break:break-word;">${match.target.id}</div>
        <div style="height:1px; background:var(--border-subtle); margin:1.2rem 0;"></div>
        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; font-weight:400; overflow-wrap:break-word;">${match.alignment.explanation}</p>
    `;
    area.appendChild(card);
    
    const hist = document.getElementById('signal-history');
    const hItem = document.createElement('div');
    hItem.style.padding = '0.4rem 0';
    hItem.style.borderBottom = '1px solid var(--border-subtle)';
    hItem.innerHTML = `<span style="color:var(--accent-fire); font-weight:500;">${match.source.id}</span> <span style="color:var(--text-muted)">→</span> <span style="color:${match.target.color}; font-weight:500;">${match.target.id}</span> <span style="color:var(--text-muted); font-size:0.65rem; float:right;">${conf}%</span>`;
    hist.prepend(hItem);
}

function renderExportButton() {
    if (document.getElementById('final-export-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'final-export-btn'; btn.className = 'btn-action'; btn.style.margin = '1.5rem'; btn.style.width = 'calc(100% - 3rem)'; btn.innerHTML = '<svg class="synapse-icon"><use href="#icon-synapse"></use></svg> Export Clinical Bundle';
    btn.onclick = () => showExportModal();
    document.getElementById('output-area').appendChild(btn);
}

function renderBatchConceptCard(src, data) {
    const area = document.getElementById('output-area');
    const { pHTML, cHTML } = generateHierarchyHTML(data);
    
    const card = document.createElement('div');
    card.style.background = 'var(--bg-void)';
    card.style.border = '1px solid var(--accent-signal)';
    card.style.borderRadius = '8px';
    card.style.padding = '1.5rem';
    card.style.margin = '1.5rem 1.5rem 0.5rem 1.5rem';
    
    card.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
            <div style="font-family:Outfit; font-size:1.3rem; font-weight:700; color:var(--text-primary); overflow-wrap:break-word;">[SOURCE] ${src.label}</div>
            <div class="code" style="color:var(--accent-fire); font-size:0.75rem; border:1px solid var(--border-subtle); padding:0.2rem 0.6rem; border-radius:4px; align-self:flex-start; overflow-wrap:break-word;">${src.ontology} : ${src.id}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
            <div style="min-width:0;">
                <div style="font-family:Outfit; font-size:0.75rem; font-weight:700; color:var(--accent-warn); text-transform:uppercase; margin-bottom:0.5rem; letter-spacing:0.05em;">Parent Lineage</div>
                <div class="hierarchy-list">${pHTML}</div>
            </div>
            <div style="min-width:0;">
                <div style="font-family:Outfit; font-size:0.75rem; font-weight:700; color:var(--accent-fire); text-transform:uppercase; margin-bottom:0.5rem; letter-spacing:0.05em;">Sub-Concepts</div>
                <div class="hierarchy-list">${cHTML}</div>
            </div>
        </div>
    `;
    area.appendChild(card);
}

// ─── BATCH ENGINE ───
async function runBatch() {
    const srcId = document.getElementById('batch-src').value;
    const trgId = document.getElementById('batch-trg').value;
    const text = document.getElementById('batch-input').value;
    if (!srcId || !text) return;

    // Split by comma OR newline to handle both formats robustly
    const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);
    state.autoMatches = [];
    const srcOnt = state.ontologies.find(o => o.id === srcId);
    const runBtn = document.getElementById('run-batch');
    
    runBtn.innerText = 'Processing Signal Stream...';
    runBtn.style.opacity = '0.7';
    runBtn.disabled = true;

    // Setup Right Panel for Batch Run
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('content-panels').classList.remove('hidden');
    document.getElementById('top-anatomy-card').style.display = 'none';
    document.getElementById('output-area').innerHTML = '';

    for (const line of lines) {
        const sources = await apiFetch(`/search?q=${encodeURIComponent(line)}&ontology=${srcId}`);
        if (sources?.length) {
            // Prioritize exact match for source concept selection
            const bestSrc = sources.find(s => s.label.toLowerCase() === line.toLowerCase()) || sources[0];
            const src = { ...bestSrc, ontology: srcOnt.name, ontId: srcOnt.id, color: srcOnt.color };
            
            // Fetch hierarchy and inject anatomy card
            const data = await fetchHierarchyData(src.uri, src.ontId);
            renderBatchConceptCard(src, data);

            const targets = trgId === 'ALL' ? state.ontologies.filter(o => o.active && o.id !== srcId) : [state.ontologies.find(o => o.id === trgId)];
            await triggerAutoMatch(src, targets, true);
        }
    }
    runBtn.innerHTML = '<svg class="synapse-icon"><use href="#icon-synapse"></use></svg> Fire Batch Alignment Stream';
    runBtn.style.opacity = '1';
    runBtn.disabled = false;
    
    renderExportButton();
    showExportModal();
}

// ─── EXPORT ───
function showExportModal() {
    document.getElementById('export-modal').classList.remove('hidden');
    const sidebar = document.getElementById('format-sidebar');
    sidebar.innerHTML = '';
    ['json', 'csv', 'fhir', 'sssom'].forEach(f => {
        const b = document.createElement('button');
        b.className = 'nav-tab'; b.style.width = '100%'; b.style.textAlign = 'left'; b.innerText = f.toUpperCase();
        if(f === state.currentExport.format) b.classList.add('active');
        b.onclick = () => renderExport(f);
        sidebar.appendChild(b);
    });
    renderExport('json');
}

function renderExport(format) {
    state.currentExport.format = format;
    
    document.querySelectorAll('#format-sidebar .nav-tab').forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase() === format);
    });

    let out = '';
    if (format === 'json') {
        out = JSON.stringify(state.autoMatches, null, 2);
    } else if (format === 'csv') {
        out = "Source_Ontology,Source_Code,Source_Label,Target_Ontology,Target_Code,Target_Label,Match_Type,Confidence,Explanation\n" + 
              state.autoMatches.map(m => `"${m.source.ontology}","${m.source.id}","${m.source.label}","${m.target.ontology}","${m.target.id}","${m.target.label}","${m.alignment.mapping_type}",${m.alignment.confidence},"${(m.alignment.explanation || '').replace(/"/g, '""')}"`).join('\n');
    } else if (format === 'fhir') {
        // FHIR ConceptMap Resource
        const conceptMap = {
            resourceType: "ConceptMap",
            status: "active",
            title: "Synapse Generated Alignment",
            group: []
        };
        
        // Group by Source Ontology to Target Ontology
        const groups = {};
        state.autoMatches.forEach(m => {
            const key = `${m.source.ontology}_${m.target.ontology}`;
            if (!groups[key]) groups[key] = { source: m.source.ontology, target: m.target.ontology, element: [] };
            groups[key].element.push({
                code: m.source.id,
                display: m.source.label,
                target: [{
                    code: m.target.id,
                    display: m.target.label,
                    equivalence: m.alignment.mapping_type,
                    comment: `Confidence: ${m.alignment.confidence}%. ${m.alignment.explanation}`
                }]
            });
        });
        conceptMap.group = Object.values(groups);
        out = JSON.stringify(conceptMap, null, 2);
    } else if (format === 'sssom') {
        // Simple Standard for Sharing Ontological Mappings (SSSOM)
        const header = "subject_id\tsubject_label\tpredicate_id\tobject_id\tobject_label\tmatch_type\tconfidence\tmapping_justification\n";
        const rows = state.autoMatches.map(m => {
            const subj = `${m.source.ontId}:${m.source.id}`;
            const obj = `${m.target.ontId}:${m.target.id}`;
            let pred = "skos:exactMatch";
            if(m.alignment.mapping_type === 'broader') pred = "skos:broadMatch";
            if(m.alignment.mapping_type === 'narrower') pred = "skos:narrowMatch";
            
            return `${subj}\t${m.source.label}\t${pred}\t${obj}\t${m.target.label}\tLexical/AI\t${(m.alignment.confidence/100).toFixed(2)}\t${m.alignment.explanation.replace(/\n|\t/g, ' ')}`;
        }).join('\n');
        out = header + rows;
    }

    document.getElementById('export-preview').innerText = out;
    document.getElementById('export-preview').className = `language-${format === 'sssom' || format === 'csv' ? 'csv' : 'json'}`;
    state.currentExport.content = out;
    Prism.highlightElement(document.getElementById('export-preview'));
}

function downloadExport() {
    const blob = new Blob([state.currentExport.content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `synapse_export_${Date.now()}.${state.currentExport.format}`; a.click();
    state.stats.exports++; updateStats();
}

// ─── UTILS ───
function initParticles() {
    const canvas = document.getElementById('particle-canvas'); const ctx = canvas.getContext('2d'); let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    for(let i=0; i<40; i++) particles.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-0.5)*0.2, vy:(Math.random()-0.5)*0.2});
    function animate() {
        ctx.clearRect(0,0,canvas.width, canvas.height); ctx.fillStyle = '#1C2433';
        particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>canvas.width)p.vx*=-1; if(p.y<0||p.y>canvas.height)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill(); });
        requestAnimationFrame(animate);
    }
    animate();
}
function renderOntologyChips() {
    const container = document.getElementById('ontology-chips'); container.innerHTML = '';
    state.ontologies.forEach(ont => {
        const chip = document.createElement('div'); chip.className = `chip ${ont.active ? 'active' : ''}`;
        chip.innerHTML = `<div class="chip-dot"></div><span>${ont.name}</span>`;
        chip.onclick = () => { ont.active = !ont.active; chip.classList.toggle('active'); };
        container.appendChild(chip);
    });
}
function populateOntologySelects() {
    const s1 = document.getElementById('batch-src'); const s2 = document.getElementById('batch-trg');
    if (!s1 || !s2) return;
    state.ontologies.forEach(o => { const opt = `<option value="${o.id}">${o.name}</option>`; s1.innerHTML += opt; s2.innerHTML += opt; });
}
function updateStats() {
    const el = document.getElementById('session-stats');
    if (el) el.innerText = `${state.autoMatches.length} Synapses · ${state.stats.exports} Exports`;
}

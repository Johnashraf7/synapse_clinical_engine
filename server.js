/**
 * SYNAPSE — Medical Ontology Alignment Engine
 * Backend API Proxy Server (v1.5 - Robust Hierarchy)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Constants
const BIOPORTAL_KEY = '8b5b7825-538d-40e0-9e9e-5ab9274a9aeb';
const POLLINATIONS_URL = 'https://text.pollinations.ai/';

// ─── Helper: Safe fetch ────────────────────────────────────
async function safeFetch(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─── UNIFIED SEARCH ENDPOINT ───────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    let { q, ontology } = req.query;
    if (!q || !ontology) return res.status(400).json({ error: 'Missing parameters' });

    const acronymMap = { 'ICD11': 'ICD11MMS', 'ICD-11': 'ICD11MMS', 'ICD10': 'ICD10CM', 'ICD-10-CM': 'ICD10CM', 'HPO': 'HP' };
    const targetOntology = acronymMap[ontology] || ontology;

    const url = `https://data.bioontology.org/search?q=${encodeURIComponent(q)}&apikey=${BIOPORTAL_KEY}&ontologies=${encodeURIComponent(targetOntology)}&pagesize=10&include=prefLabel,notation,semanticType,definition`;
    
    const response = await safeFetch(url);
    if (!response.ok) throw new Error(`BioPortal error: ${response.status}`);
    
    const data = await response.json();
    res.json((data.collection || []).map(item => ({
        id: item.notation || item['@id'].split('/').pop(),
        label: item.prefLabel,
        meta: item.semanticType?.join(', ') || item.definition?.[0] || '',
        uri: item['@id']
    })));
  } catch (err) {
    res.status(502).json({ error: 'Search service unavailable' });
  }
});

// ─── HIERARCHY ENDPOINT (Fixed for correct BioPortal paths) ──
app.get('/api/hierarchy', async (req, res) => {
  try {
    const { uri, ontology } = req.query;
    if (!uri || !ontology) return res.status(400).json({ error: 'Missing parameters' });

    // Correct BioPortal Class API Path: /ontologies/{ONT}/classes/{URI}/parents
    const encodedUri = encodeURIComponent(uri);
    const baseUrl = `https://data.bioontology.org/ontologies/${ontology}/classes/${encodedUri}`;
    
    const parentsUrl = `${baseUrl}/parents?apikey=${BIOPORTAL_KEY}`;
    const childrenUrl = `${baseUrl}/children?apikey=${BIOPORTAL_KEY}`;

    console.log(`[Hierarchy] Fetching for ${ontology} / ${uri}`);

    const [pRes, cRes] = await Promise.all([
      safeFetch(parentsUrl).then(r => r.ok ? r.json() : []).catch(() => []),
      safeFetch(childrenUrl).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    const parentsData = Array.isArray(pRes) ? pRes : (pRes.collection || []);
    const childrenData = Array.isArray(cRes) ? cRes : (cRes.collection || []);

    res.json({
      parents: parentsData.slice(0, 5).map(i => ({ id: i.notation || i['@id'].split('/').pop(), label: i.prefLabel })),
      children: childrenData.slice(0, 10).map(i => ({ id: i.notation || i['@id'].split('/').pop(), label: i.prefLabel }))
    });
  } catch (err) {
    console.error('[Hierarchy Error]', err.message);
    res.status(502).json({ error: 'Hierarchy unavailable' });
  }
});

// ─── AI ALIGNMENT ──────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  try {
    const response = await safeFetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages: req.body.messages, private: true })
    });
    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) res.json(JSON.parse(jsonMatch[0]));
    else throw new Error('No JSON');
  } catch (err) {
    res.status(502).json({ error: 'AI Error' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`⚡ SYNAPSE v1.5 running at http://localhost:${PORT}`));

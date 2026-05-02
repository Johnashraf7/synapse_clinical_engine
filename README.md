---
title: Synapse Engine
emoji: 🏥
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
---

# Synapse Clinical Engine 🧬

[![Vercel Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://synapse-clinical-engine.vercel.app/)
[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97_Backend-Hugging_Face-yellow)](https://johniskros-synapse-engine.hf.space)

**Synapse** is an open-source, AI-assisted medical ontology alignment engine. It is designed to instantly resolve, map, and translate clinical terminologies across different standard networks using deep semantic matching. 

Whether you are migrating legacy health records, normalizing clinical trial data, or mapping local vocabularies, Synapse automates the heavy lifting.

## 🛠️ Core Features

*   **AI-Assisted Alignment**: Goes beyond basic string matching. Synapse uses advanced generative AI models to contextually map terms, providing a mapping type (e.g., equivalent, broader, narrower) and a clinical explanation for the match, alongside a confidence score.
*   **Batch Signal Processing**: Map massive lists of clinical terms instantly. Drop them in as a comma or newline-separated list, and the engine streams the alignments automatically.
*   **Clinical Anatomy Visualization**: Instantly view the parent lineage and child sub-concepts for any selected term to verify its place in the clinical hierarchy.
*   **Production-Ready Exports**: Generate interoperable Clinical Bundles in a single click. Synapse exports natively to **JSON, CSV, FHIR (ConceptMap resource), and SSSOM** formats for immediate EHR integration.
*   **Fully Decoupled Architecture**: Features a robust Node.js API that can be deployed anywhere (default Hugging Face Spaces) and a lightning-fast, zero-auth vanilla JavaScript frontend.

## 🌐 Supported Ontologies (21+)

The engine integrates directly with the BioPortal API to support native cross-mapping between:

*   **Core Clinical & Billing**: SNOMED CT, ICD-10-CM, ICD-11, LOINC, RxNorm
*   **Genetics & Phenotypes**: GO, HGNC, HPO, MP 
*   **Diseases & Rare Conditions**: DOID, Mondo, Orphanet (ORDO)
*   **Drugs & Chemicals**: ChEBI, WHO ATC, VANDF
*   **Research & Primary Care**: MeSH, NCI Thesaurus, WHO-ART, ICPC-2 PLUS, FMA

## 🚀 Live Demo

The engine is completely public and requires zero authentication to use. 
**Access the live dashboard here:** [https://synapse-clinical-engine.vercel.app](https://synapse-clinical-engine.vercel.app)

## 💻 Tech Stack

*   **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (ES6+).
*   **Backend**: Node.js, Express.js.
*   **APIs**: NCBO BioPortal API, Pollinations AI (Deep Semantic Matching).
*   **Deployment**: Vercel (Frontend), Hugging Face Spaces (Backend/API).

## 📥 Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Johnashraf7/synapse_clinical_engine.git
   cd synapse_clinical_engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Johnashraf7/synapse_clinical_engine/issues).

## 📝 License
This project is open-source and available under the MIT License.


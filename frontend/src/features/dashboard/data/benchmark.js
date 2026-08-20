export const DEFAULT_RUN = 'run2'

export const PIPELINE = {
  testCases: 24,
  embeddingModel: 'all-MiniLM-L6-v2',
  vectorStore: 'ChromaDB',
  reranker: 'ms-marco-MiniLM-L-6-v2',
  topK: 3,
  similarityThreshold: 0.20,
  chunkSize: 1000,
  chunkOverlap: 150,
}

export const RUN_OPTIONS = [
  { id: 'run1', label: 'Run 1 · Baseline (Dense only, Top-5)' },
  { id: 'run2', label: 'Run 2 · Tuned Hybrid + Reranker (Current)' },
  { id: 'run3', label: 'Run 3 · Strict Similarity Gate (0.45 Threshold)' },
]

export const SAMPLE_QUERY = 'What is the first-line steroid treatment for an acute relapse of MS?'

export const RETRIEVED_CHUNKS = [
  {
    chunkId: 'CH-MS-P29',
    title: 'Multiple Sclerosis: Management of MS in Primary and Secondary Care',
    source: 'multiple-sclerosis.pdf',
    topic: 'Immunology',
    page: 29,
    section: 'Relapse Management',
    score: 57,
    text: 'Offer oral methylprednisolone 0.5 g daily for 5 days to treat people with an acute relapse of multiple sclerosis. Do not offer oral steroids at lower doses for treating an acute relapse. Intravenous steroids are reserved when oral treatment is not tolerated or hospital admission is necessary.',
  },
  {
    chunkId: 'CH-MS-P28',
    title: 'Multiple Sclerosis: Management of MS in Primary and Secondary Care',
    source: 'multiple-sclerosis.pdf',
    topic: 'Immunology',
    page: 28,
    section: 'Relapse Assessment',
    score: 48,
    text: 'Assess for potential infection or pseudo-relapse before initiating acute steroid therapy. Confirm that the worsening of symptoms represents a true inflammatory event lasting more than 24 hours in the absence of fever or infection.',
  },
  {
    chunkId: 'CH-MS-P20',
    title: 'Multiple Sclerosis: Management of MS in Primary and Secondary Care',
    source: 'multiple-sclerosis.pdf',
    topic: 'Immunology',
    page: 20,
    section: 'Pharmacological Interventions',
    score: 44,
    text: 'Ensure appropriate gastroprotection is considered when prescribing short courses of high-dose corticosteroids in patients with increased risk of gastrointestinal ulceration.',
  },
]

export const DOCUMENTS = [
  {
    id: 'doc-dep',
    short: 'Depression Guidelines',
    title: 'Depression with a Chronic Physical Health Problem',
    pages: 42,
    sections: 12,
    chunksOk: 148,
    chunksDegraded: 6,
  },
  {
    id: 'doc-ms',
    short: 'MS Clinical Guidelines',
    title: 'Multiple Sclerosis Management',
    pages: 58,
    sections: 16,
    chunksOk: 212,
    chunksDegraded: 8,
  },
]

const BASELINE_KPI = {
  precisionAt5: 0.62,
  citationAccuracy: 0.71,
  unsupportedClaimRate: 0.17,
  correctRefusalRate: 0.67,
}

export function getBaselineKpi() {
  return BASELINE_KPI
}

const RUN_DATA = {
  run1: {
    caption: 'Dense semantic search only, no BM25 fusion or reranker cross-encoder.',
    kpi: {
      precisionAt5: 0.62,
      citationAccuracy: 0.71,
      unsupportedClaimRate: 0.17,
      correctRefusalRate: 0.67,
    },
    kpiTrend: {
      precisionAt5: [0.62, 0.62, 0.62, 0.62],
      citationAccuracy: [0.71, 0.71, 0.71, 0.71],
      unsupportedClaimRate: [0.17, 0.17, 0.17, 0.17],
      correctRefusalRate: [0.67, 0.67, 0.67, 0.67],
    },
    precisionAtK: {
      'Dense Baseline': [
        { k: 1, value: 0.75 },
        { k: 3, value: 0.68 },
        { k: 5, value: 0.62 },
        { k: 10, value: 0.51 },
      ],
    },
    strategies: [
      { name: 'Dense Search', p3: 0.68, p5: 0.62, recall5: 0.70 },
      { name: 'Keyword (BM25)', p3: 0.61, p5: 0.55, recall5: 0.65 },
    ],
    chunkSweep: [
      { size: 250, precision: 0.49, latency: 1100 },
      { size: 500, precision: 0.58, latency: 1250 },
      { size: 1000, precision: 0.62, latency: 1420 },
      { size: 1500, precision: 0.55, latency: 1680 },
    ],
    categories: [
      { name: 'Treatment & Regimen', precision: 0.71, citation: 0.78 },
      { name: 'Symptom & Diagnosis', precision: 0.65, citation: 0.72 },
      { name: 'Adversarial / Out of Scope', precision: 0.54, citation: 0.63 },
    ],
    similarity: [
      { bin: 0.1, count: 12 },
      { bin: 0.2, count: 28 },
      { bin: 0.3, count: 45 },
      { bin: 0.4, count: 62 },
      { bin: 0.5, count: 31 },
      { bin: 0.6, count: 18 },
    ],
    confidence: [
      { label: 'Supported', value: 16 },
      { label: 'Low Confidence', value: 5 },
      { label: 'Unsafe / Blocked', value: 3 },
    ],
    funnel: [
      { stage: 'Total Intake', value: 24 },
      { stage: 'Guardrail Passed', value: 21 },
      { stage: 'Similarity Cleared', value: 18 },
      { stage: 'Answer Generated', value: 16 },
    ],
    failures: [
      { name: 'Ambiguous Query Miss', value: 4 },
      { name: 'Diluted Context Chunks', value: 3 },
      { name: 'Over-refusal', value: 1 },
    ],
    citationsBySource: [
      { name: 'multiple-sclerosis.pdf', value: 42 },
      { name: 'depression-with-a-chronic-physical-health-problem.pdf', value: 38 },
      { name: 'who-control.pdf', value: 2 },
    ],
  },

  run2: {
    caption: 'Hybrid (Dense + BM25) with cross-encoder reranker and reasoning effort disabled.',
    kpi: {
      precisionAt5: 0.74,
      citationAccuracy: 0.83,
      unsupportedClaimRate: 0.09,
      correctRefusalRate: 0.83,
    },
    kpiTrend: {
      precisionAt5: [0.62, 0.65, 0.69, 0.74],
      citationAccuracy: [0.71, 0.75, 0.79, 0.83],
      unsupportedClaimRate: [0.17, 0.14, 0.11, 0.09],
      correctRefusalRate: [0.67, 0.72, 0.78, 0.83],
    },
    precisionAtK: {
      'Hybrid + Reranker': [
        { k: 1, value: 0.88 },
        { k: 3, value: 0.81 },
        { k: 5, value: 0.74 },
        { k: 10, value: 0.63 },
      ],
      'Dense Baseline': [
        { k: 1, value: 0.75 },
        { k: 3, value: 0.68 },
        { k: 5, value: 0.62 },
        { k: 10, value: 0.51 },
      ],
    },
    strategies: [
      { name: 'Hybrid + Rerank (Current)', p3: 0.81, p5: 0.74, recall5: 0.86 },
      { name: 'Dense Search', p3: 0.68, p5: 0.62, recall5: 0.70 },
      { name: 'Keyword (BM25)', p3: 0.61, p5: 0.55, recall5: 0.65 },
    ],
    chunkSweep: [
      { size: 250, precision: 0.55, latency: 1400 },
      { size: 500, precision: 0.69, latency: 1650 },
      { size: 1000, precision: 0.74, latency: 1880 },
      { size: 1500, precision: 0.66, latency: 2100 },
    ],
    categories: [
      { name: 'Treatment & Regimen', precision: 0.84, citation: 0.89 },
      { name: 'Symptom & Diagnosis', precision: 0.78, citation: 0.82 },
      { name: 'Adversarial / Out of Scope', precision: 0.69, citation: 0.79 },
    ],
    similarity: [
      { bin: 0.1, count: 6 },
      { bin: 0.2, count: 18 },
      { bin: 0.3, count: 42 },
      { bin: 0.4, count: 78 },
      { bin: 0.5, count: 46 },
      { bin: 0.6, count: 24 },
    ],
    confidence: [
      { label: 'Supported', value: 20 },
      { label: 'Low Confidence', value: 2 },
      { label: 'Unsafe / Blocked', value: 2 },
    ],
    funnel: [
      { stage: 'Total Intake', value: 24 },
      { stage: 'Guardrail Passed', value: 22 },
      { stage: 'Similarity Cleared', value: 21 },
      { stage: 'Answer Generated', value: 20 },
    ],
    failures: [
      { name: 'Ambiguous Query Miss', value: 2 },
      { name: 'Diluted Context Chunks', value: 1 },
      { name: 'Over-refusal', value: 1 },
    ],
    citationsBySource: [
      { name: 'multiple-sclerosis.pdf', value: 54 },
      { name: 'depression-with-a-chronic-physical-health-problem.pdf', value: 48 },
      { name: 'who-control.pdf', value: 0 },
    ],
  },

  run3: {
    caption: 'High similarity cutoff (0.45) — low unsupported claim rate with higher refusal trade-off.',
    kpi: {
      precisionAt5: 0.81,
      citationAccuracy: 0.89,
      unsupportedClaimRate: 0.04,
      correctRefusalRate: 0.92,
    },
    kpiTrend: {
      precisionAt5: [0.62, 0.70, 0.76, 0.81],
      citationAccuracy: [0.71, 0.79, 0.84, 0.89],
      unsupportedClaimRate: [0.17, 0.11, 0.07, 0.04],
      correctRefusalRate: [0.67, 0.76, 0.85, 0.92],
    },
    precisionAtK: {
      'Strict Threshold': [
        { k: 1, value: 0.92 },
        { k: 3, value: 0.86 },
        { k: 5, value: 0.81 },
        { k: 10, value: 0.69 },
      ],
    },
    strategies: [
      { name: 'Strict Gate', p3: 0.86, p5: 0.81, recall5: 0.72 },
      { name: 'Hybrid + Rerank', p3: 0.81, p5: 0.74, recall5: 0.86 },
    ],
    chunkSweep: [
      { size: 1000, precision: 0.81, latency: 1900 },
    ],
    categories: [
      { name: 'Treatment & Regimen', precision: 0.89, citation: 0.92 },
      { name: 'Symptom & Diagnosis', precision: 0.84, citation: 0.88 },
      { name: 'Adversarial / Out of Scope', precision: 0.88, citation: 0.94 },
    ],
    similarity: [
      { bin: 0.2, count: 8 },
      { bin: 0.3, count: 24 },
      { bin: 0.4, count: 52 },
      { bin: 0.5, count: 68 },
      { bin: 0.6, count: 32 },
    ],
    confidence: [
      { label: 'Supported', value: 17 },
      { label: 'Low Confidence', value: 1 },
      { label: 'Unsafe / Blocked', value: 6 },
    ],
    funnel: [
      { stage: 'Total Intake', value: 24 },
      { stage: 'Guardrail Passed', value: 22 },
      { stage: 'Similarity Cleared', value: 18 },
      { stage: 'Answer Generated', value: 17 },
    ],
    failures: [
      { name: 'Over-refusal (High Threshold)', value: 4 },
      { name: 'Ambiguous Query Miss', value: 1 },
    ],
    citationsBySource: [
      { name: 'multiple-sclerosis.pdf', value: 46 },
      { name: 'depression-with-a-chronic-physical-health-problem.pdf', value: 41 },
      { name: 'who-control.pdf', value: 0 },
    ],
  },
}

export function loadBenchmark(runId = DEFAULT_RUN) {
  return RUN_DATA[runId] || RUN_DATA[DEFAULT_RUN]
}
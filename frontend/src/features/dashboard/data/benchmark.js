/**
 * Evaluation data for the benchmark dashboard.
 *
 * Right now every number below is a placeholder shaped exactly like the real
 * pipeline output, so the UI can be built and demoed before the evaluation
 * harness finishes. When the harness is ready, replace the body of
 * loadBenchmark() with a fetch — nothing else in the dashboard needs to change,
 * because every panel reads from the object this function returns.
 *
 * The constants (chunk size, overlap, top-K, the 0.76 similarity gate) and the
 * four source documents mirror the ingestion script so the two never disagree.
 */

export const PIPELINE = {
  chunkSize: 800,
  chunkOverlap: 150,
  topK: 4,
  similarityThreshold: 0.76,
  embeddingModel: 'FastEmbed · bge-small-en-v1.5',
  vectorStore: 'Chroma · cosine',
  testCases: 24,
}

export const DOCUMENTS = [
  {
    id: 'USPSTF-MDD-2022',
    title: 'USPSTF Screening for Depression & Suicide Risk in Youth',
    short: 'USPSTF 2022',
    publisher: 'US Preventive Services Task Force',
    pages: 19,
    sections: 12,
    chunksOk: 96,
    chunksDegraded: 31,
  },
  {
    id: 'JIAO-NEUROIMMUN-2025',
    title: 'Neuroimmune Mechanisms in Major Depressive Disorder',
    short: 'Neuroimmune MDD',
    publisher: 'Journal of Neuroinflammation',
    pages: 28,
    sections: 21,
    chunksOk: 184,
    chunksDegraded: 6,
  },
  {
    id: 'CHIARPENELLO-YOGA-2024',
    title: 'Psychoneuroimmunology of Mind-Body Interventions in Depression',
    short: 'Mind-body PNI',
    publisher: 'Brain Behavior & Immunity',
    pages: 16,
    sections: 14,
    chunksOk: 121,
    chunksDegraded: 4,
  },
  {
    id: 'WHO-DRUGINFO-2006',
    title: 'WHO Drug Information — Safety & Regulatory Updates',
    short: 'WHO Drug Info',
    publisher: 'World Health Organization',
    pages: 24,
    sections: 18,
    chunksOk: 143,
    chunksDegraded: 12,
  },
]

/* ---------------------------------------------------------------------------
   Runs. Each one is a full evaluation sweep over the 24-question test set, so
   the run picker at the top of the dashboard can re-scope every panel at once.
   --------------------------------------------------------------------------- */

const RUNS = {
  baseline: {
    id: 'baseline',
    label: 'Run 1 · Baseline',
    caption: 'Semantic-only retrieval, 800-char chunks, no reranking.',
    kpi: {
      precisionAt5: 0.62,
      citationAccuracy: 0.71,
      unsupportedClaimRate: 0.17,
      correctRefusalRate: 0.67,
      medianLatencyMs: 940,
    },
    // A 7-point history for the stat-tile sparklines, oldest first.
    kpiTrend: {
      precisionAt5: [0.44, 0.47, 0.51, 0.55, 0.58, 0.6, 0.62],
      citationAccuracy: [0.52, 0.56, 0.61, 0.64, 0.67, 0.69, 0.71],
      unsupportedClaimRate: [0.34, 0.3, 0.27, 0.24, 0.21, 0.19, 0.17],
      correctRefusalRate: [0.42, 0.48, 0.53, 0.58, 0.61, 0.64, 0.67],
    },
    precisionAtK: {
      'Semantic only': [
        { k: 1, value: 0.71 },
        { k: 3, value: 0.66 },
        { k: 5, value: 0.62 },
        { k: 10, value: 0.48 },
      ],
      'Hybrid + rerank': [
        { k: 1, value: 0.75 },
        { k: 3, value: 0.7 },
        { k: 5, value: 0.65 },
        { k: 10, value: 0.52 },
      ],
    },
    strategies: [
      { name: 'Semantic', p3: 0.66, p5: 0.62, recall5: 0.7 },
      { name: 'BM25', p3: 0.54, p5: 0.49, recall5: 0.58 },
      { name: 'Hybrid', p3: 0.69, p5: 0.64, recall5: 0.76 },
      { name: 'Hybrid + rerank', p3: 0.7, p5: 0.65, recall5: 0.78 },
    ],
    chunkSweep: [
      { size: 400, precision: 0.58, latency: 720 },
      { size: 600, precision: 0.63, latency: 810 },
      { size: 800, precision: 0.62, latency: 940 },
      { size: 1000, precision: 0.55, latency: 1180 },
    ],
    similarity: [
      { bin: 0.5, count: 3 },
      { bin: 0.55, count: 5 },
      { bin: 0.6, count: 8 },
      { bin: 0.65, count: 12 },
      { bin: 0.7, count: 17 },
      { bin: 0.75, count: 21 },
      { bin: 0.8, count: 16 },
      { bin: 0.85, count: 9 },
      { bin: 0.9, count: 4 },
    ],
    confidence: [
      { label: 'High', value: 8 },
      { label: 'Medium', value: 7 },
      { label: 'Low', value: 5 },
      { label: 'Insufficient evidence', value: 4 },
    ],
    funnel: [
      { stage: 'Queries received', value: 24 },
      { stage: 'Passed input risk check', value: 22 },
      { stage: 'Cleared similarity gate', value: 18 },
      { stage: 'Generated with citations', value: 18 },
      { stage: 'All claims verified', value: 15 },
    ],
    categories: [
      { name: 'Direct', precision: 0.78, citation: 0.84 },
      { name: 'Multi-chunk', precision: 0.58, citation: 0.66 },
      { name: 'Ambiguous', precision: 0.49, citation: 0.61 },
      { name: 'Out-of-scope', precision: 0.67, citation: 0.7 },
    ],
    citationsBySource: [
      { name: 'Neuroimmune MDD', value: 34 },
      { name: 'Mind-body PNI', value: 26 },
      { name: 'USPSTF 2022', value: 19 },
      { name: 'WHO Drug Info', value: 8 },
    ],
    failures: [
      { name: 'Retrieved wrong section', value: 9 },
      { name: 'Missing surrounding context', value: 7 },
      { name: 'Degraded text in chunk', value: 6 },
      { name: 'Claim not traceable to chunk', value: 5 },
      { name: 'Answered an out-of-scope query', value: 3 },
    ],
  },

  tuned: {
    id: 'tuned',
    label: 'Run 2 · Tuned retrieval',
    caption: 'Hybrid retrieval, 600-char chunks, reference blocks dropped.',
    kpi: {
      precisionAt5: 0.74,
      citationAccuracy: 0.83,
      unsupportedClaimRate: 0.09,
      correctRefusalRate: 0.83,
      medianLatencyMs: 1020,
    },
    kpiTrend: {
      precisionAt5: [0.62, 0.64, 0.67, 0.69, 0.71, 0.73, 0.74],
      citationAccuracy: [0.71, 0.74, 0.76, 0.78, 0.8, 0.82, 0.83],
      unsupportedClaimRate: [0.17, 0.16, 0.14, 0.13, 0.11, 0.1, 0.09],
      correctRefusalRate: [0.67, 0.7, 0.73, 0.76, 0.79, 0.81, 0.83],
    },
    precisionAtK: {
      'Semantic only': [
        { k: 1, value: 0.79 },
        { k: 3, value: 0.74 },
        { k: 5, value: 0.68 },
        { k: 10, value: 0.54 },
      ],
      'Hybrid + rerank': [
        { k: 1, value: 0.88 },
        { k: 3, value: 0.81 },
        { k: 5, value: 0.74 },
        { k: 10, value: 0.59 },
      ],
    },
    strategies: [
      { name: 'Semantic', p3: 0.74, p5: 0.68, recall5: 0.77 },
      { name: 'BM25', p3: 0.61, p5: 0.55, recall5: 0.64 },
      { name: 'Hybrid', p3: 0.79, p5: 0.72, recall5: 0.85 },
      { name: 'Hybrid + rerank', p3: 0.81, p5: 0.74, recall5: 0.88 },
    ],
    chunkSweep: [
      { size: 400, precision: 0.66, latency: 700 },
      { size: 600, precision: 0.74, latency: 790 },
      { size: 800, precision: 0.71, latency: 910 },
      { size: 1000, precision: 0.62, latency: 1150 },
    ],
    similarity: [
      { bin: 0.5, count: 1 },
      { bin: 0.55, count: 2 },
      { bin: 0.6, count: 4 },
      { bin: 0.65, count: 7 },
      { bin: 0.7, count: 11 },
      { bin: 0.75, count: 19 },
      { bin: 0.8, count: 24 },
      { bin: 0.85, count: 18 },
      { bin: 0.9, count: 10 },
    ],
    confidence: [
      { label: 'High', value: 12 },
      { label: 'Medium', value: 6 },
      { label: 'Low', value: 3 },
      { label: 'Insufficient evidence', value: 3 },
    ],
    funnel: [
      { stage: 'Queries received', value: 24 },
      { stage: 'Passed input risk check', value: 23 },
      { stage: 'Cleared similarity gate', value: 21 },
      { stage: 'Generated with citations', value: 21 },
      { stage: 'All claims verified', value: 20 },
    ],
    categories: [
      { name: 'Direct', precision: 0.89, citation: 0.93 },
      { name: 'Multi-chunk', precision: 0.72, citation: 0.8 },
      { name: 'Ambiguous', precision: 0.61, citation: 0.74 },
      { name: 'Out-of-scope', precision: 0.83, citation: 0.85 },
    ],
    citationsBySource: [
      { name: 'Neuroimmune MDD', value: 41 },
      { name: 'Mind-body PNI', value: 33 },
      { name: 'USPSTF 2022', value: 24 },
      { name: 'WHO Drug Info', value: 6 },
    ],
    failures: [
      { name: 'Retrieved wrong section', value: 4 },
      { name: 'Missing surrounding context', value: 3 },
      { name: 'Degraded text in chunk', value: 5 },
      { name: 'Claim not traceable to chunk', value: 2 },
      { name: 'Answered an out-of-scope query', value: 1 },
    ],
  },
}

export const RUN_OPTIONS = [
  { id: 'tuned', label: 'Run 2 · Tuned retrieval' },
  { id: 'baseline', label: 'Run 1 · Baseline' },
]

export const DEFAULT_RUN = 'tuned'

/**
 * The one place the dashboard talks to its data source.
 * Swap the body for a fetch when the evaluation API exists — every panel reads
 * from what this returns, so no other file changes.
 */
export function loadBenchmark(runId = DEFAULT_RUN) {
  return RUNS[runId] ?? RUNS[DEFAULT_RUN]
}

/** Deltas on the stat tiles are always measured against the baseline run. */
export function getBaselineKpi() {
  return RUNS.baseline.kpi
}

/* ---------------------------------------------------------------------------
   Evidence panel — the retrieved chunks for one worked example. The shape
   matches the metadata the ingestion script writes onto every vector entry.
   --------------------------------------------------------------------------- */

export const SAMPLE_QUERY =
  'Does chronic inflammation play a causal role in major depressive disorder?'

export const RETRIEVED_CHUNKS = [
  {
    rank: 1,
    score: 0.891,
    documentName: 'Neuroimmune Mechanisms in Major Depressive Disorder',
    sectionTitle: 'Inflammatory Cytokines and Mood Regulation',
    pageNumber: 7,
    chunkId: 'JIAO-NEUROIMMUN-2025-P07-CH03',
    textQuality: 'ok',
    excerpt:
      'Elevated peripheral IL-6 and TNF-alpha concentrations have been observed consistently in patients meeting criteria for major depressive disorder, and remain elevated independently of antidepressant exposure.',
  },
  {
    rank: 2,
    score: 0.847,
    documentName: 'Neuroimmune Mechanisms in Major Depressive Disorder',
    sectionTitle: 'HPA Axis Dysregulation',
    pageNumber: 11,
    chunkId: 'JIAO-NEUROIMMUN-2025-P11-CH01',
    textQuality: 'ok',
    excerpt:
      'Sustained glucocorticoid exposure reduces hippocampal neurogenesis; the resulting loss of negative feedback maintains a low-grade inflammatory state closely associated with depressive symptom severity.',
  },
  {
    rank: 3,
    score: 0.802,
    documentName: 'Psychoneuroimmunology of Mind-Body Interventions in Depression',
    sectionTitle: 'Inflammatory Markers as Outcome Measures',
    pageNumber: 5,
    chunkId: 'CHIARPENELLO-YOGA-2024-P05-CH02',
    textQuality: 'ok',
    excerpt:
      'Across the trials reviewed, mind-body interventions were associated with a measurable reduction in CRP and IL-6, alongside improvement on standard depression rating scales.',
  },
  {
    rank: 4,
    score: 0.719,
    documentName: 'USPSTF Screening for Depression & Suicide Risk in Youth',
    sectionTitle: 'Rationale for Screening',
    pageNumber: 3,
    chunkId: 'USPSTF-MDD-2022-P03-CH04',
    textQuality: 'degraded',
    excerpt:
      'The recommendation statement addresses screening for MDD and does not address the biological mechanisms underlying the condition.',
  },
]

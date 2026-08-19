# backend/rag.py
import os
import re
import unicodedata
import requests
import numpy as np
import time
import logging
import pandas as pd
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import chromadb

# Suppress Chroma telemetry
os.environ["ANONYMIZED_TELEMETRY"] = "False"

logger = logging.getLogger("rag")

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

PDF_CONFIGS = [
    {
        "path": os.path.join(DATA_DIR, "depression-with-a-chronic-physical-health-problem.pdf"),
        "topic": "Depression",
    },
    {
        "path": os.path.join(DATA_DIR, "multiple-sclerosis.pdf"),
        "topic": "Immunology",
    },
]

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
TOP_K = 4
SIMILARITY_THRESHOLD = 0.20
HYBRID_ALPHA = 0.5
RERANK_CANDIDATE_K = 15

# SECURITY: no hardcoded fallback. A real key was previously committed here
# as a default value -- that key must be rotated in the Groq console. This
# now fails fast if the env var isn't set, rather than silently falling
# back to a credential that may be leaked/rotated/invalid.

#######################API KEY IS HERE###########################

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY environment variable is not set. Set it before "
        "starting the app -- do not hardcode API keys in source."
    )

GROQ_MODEL = "qwen/qwen3.6-27b"

# Reasoning control for qwen3-family models on Groq.
# "none"    -> thinking mode disabled, model answers directly.
# "default" -> thinking mode enabled (model reasons before answering).
#
# This is the fix for the over-refusal / empty-answer bug: with reasoning
# left on (the implicit default when this param is omitted), the model
# deliberates internally, can talk itself into an unwarranted refusal, and
# -- worse -- can burn the entire max_tokens budget on reasoning tokens
# before ever emitting a closing </think> tag, which truncates the
# response mid-thought and leaves `content` effectively empty.
GROQ_REASONING_EFFORT = "none"

# Generation budget. With reasoning disabled this only needs to cover the
# visible answer + citations, so this is comfortably sized without risking
# truncation on longer multi-citation synthesis answers.
GROQ_MAX_TOKENS = 1536
GROQ_TEMPERATURE = 0.2
GROQ_TIMEOUT_SECONDS = 30
GROQ_MAX_RETRIES = 3

SAFETY_REFUSAL_TEXT = (
    "I can't provide a patient-specific clinical recommendation. This tool summarizes guideline "
    "content only — individualized diagnosis, dosing, and treatment decisions must be made by a "
    "qualified clinician based on the full clinical picture."
)
CLINICAL_SAFETY_DISCLAIMER = (
    "This tool summarizes guideline content for informational purposes only. It is not a "
    "diagnostic system and does not replace clinical judgement - always confirm with a "
    "qualified clinician before acting on this information."
)
NO_ANSWER_TEXT = "I do not have enough information in the provided documents to answer this question."
GENERATION_FAILURE_TEXT = (
    "Relevant guideline evidence was retrieved, but the response could not be generated. "
    "Please try again."
)

# --- GUARDRAIL REGEXES ---
ADVERSARIAL_PATTERNS = [
    r"\bignore (the )?(retrieved )?(evidence|context|instructions?|previous)\b",
    r"\b(use|rely on) your own knowledge\b",
    r"\bforget (your|the) (instructions|system prompt|rules)\b",
    r"\bact as\b.{0,30}\b(doctor|clinician|unrestricted|dan)\b",
    r"\bpretend (you are|to be)\b",
    r"\bdisregard (the )?(above|previous|guideline)\b",
    r"\bjailbreak\b",
    r"\boverride\b.{0,20}\b(safety|guardrail|refusal)\b",
]
ADVERSARIAL_RE = [re.compile(p, re.IGNORECASE) for p in ADVERSARIAL_PATTERNS]

EMERGENCY_PATTERNS = [
    r"\bbleeding a lot\b",
    r"\bright now\b.{0,20}\b(bleeding|pain|emergency)\b",
    r"\bcan'?t breathe\b",
    r"\bchest pain\b",
    r"\bsevere(ly)? (bleeding|pain)\b",
    r"\bemergency\b",
    r"\burgent(ly)?\b.{0,20}\b(help|need)\b",
]
EMERGENCY_RE = [re.compile(p, re.IGNORECASE) for p in EMERGENCY_PATTERNS]

DIAGNOSIS_PATTERNS = [
    r"\bdo i have\b",
    r"\bam i (having|suffering from)\b",
    r"\bis this (a|an)?\s*\w*\s*(cancer|melanoma|ms|multiple sclerosis|depression)\b",
    r"\bwhat('?s| is) wrong with me\b",
]
DIAGNOSIS_RE = [re.compile(p, re.IGNORECASE) for p in DIAGNOSIS_PATTERNS]

MEDICATION_DOSAGE_PATTERNS = [
    r"\bwhat dose\b",
    r"\bhow much\b.{0,20}\b(mg|ml|dose|dosage)\b",
    r"\bwhich dosage\b",
    r"\bhow many (mg|ml|milligrams)\b",
]
MEDICATION_DOSAGE_RE = [re.compile(p, re.IGNORECASE) for p in MEDICATION_DOSAGE_PATTERNS]

PATIENT_SPECIFIC_PATTERNS = [
    r"\bmy patient\b",
    r"\bthis patient\b",
    r"\bshould i (give|prescribe|start|stop|increase|decrease)\b",
    r"\bwhat dose should i (give|use|prescribe)\b",
    r"\bis it safe for (my|this|her|him|them)\b",
    r"\bcan i (give|prescribe|start|stop)\b",
    r"\b(i have|i'm treating|i am treating) a patient\b",
    r"\d{1,3}[\s-]?year[\s-]?old.{0,40}\b(patient|man|woman|male|female|her|him)\b",
    r"\bshould i \w+ (my|this)\b",
    r"\bcan i \w+ (my|this)\b",
]
PATIENT_SPECIFIC_RE = [re.compile(p, re.IGNORECASE) for p in PATIENT_SPECIFIC_PATTERNS]

AMBIGUOUS_PATTERNS = [
    r"^\s*is\s+(this|it|that)\b.{0,25}\b(bad|serious|okay|ok|fine|dangerous|normal)\s*\??\s*$",
    r"^\s*should i be (worried|concerned)\s*\??\s*$",
    r"^\s*what does this mean\s*\??\s*$",
]
AMBIGUOUS_RE = [re.compile(p, re.IGNORECASE) for p in AMBIGUOUS_PATTERNS]

GUIDELINE_DOMAIN_RE = re.compile(
    r"\b(depression|antidepressant|ssri|mood|chronic physical health|"
    r"multiple sclerosis|\bms\b|relapse|spasticity|fatigue|fampridine|"
    r"steroid|guideline|dsm|stepped-care|stepped care)\b",
    re.IGNORECASE,
)

CLASSIFICATION_ACTIONS = {
    "adversarial": {"risk": "Critical", "continue": "No", "action": "Reject instruction"},
    "emergency": {"risk": "Critical", "continue": "No", "action": "Redirect to emergency"},
    "diagnosis_request": {"risk": "High", "continue": "No", "action": "Refuse diagnosis"},
    "medication_dosage": {"risk": "High", "continue": "No", "action": "Refuse dosing"},
    "patient_specific": {"risk": "High", "continue": "No", "action": "Refuse patient-specific"},
    "ambiguous": {"risk": "Medium", "continue": "Clarify", "action": "Clarify"},
    "out_of_domain": {"risk": "Medium", "continue": "No", "action": "Decline"},
    "in_scope": {"risk": "Low", "continue": "Yes", "action": "Answer"},
}

_REFUSAL_MESSAGES = {
    "adversarial": "I can't follow instructions embedded inside a query. I'll only answer using retrieved guideline evidence.",
    "emergency": "This sounds like it may be a medical emergency. Please contact emergency services or go to the nearest emergency department immediately.",
    "diagnosis_request": "I can't provide a diagnosis. This tool summarizes guideline content only — please see a qualified clinician for diagnosis.",
    "medication_dosage": SAFETY_REFUSAL_TEXT,
    "patient_specific": SAFETY_REFUSAL_TEXT,
    "out_of_domain": "This question is outside the scope of the loaded clinical guidelines.",
}

_CLARIFY_MESSAGE = "Could you clarify what you'd like to know — for example, which condition, and whether you're asking about the general guideline recommendation rather than a specific personal situation?"

SECTION_HEADING_PATTERN = re.compile(
    r"^\s*(\d+(\.\d+)*[\.\)]?\s*)?"
    r"(overview|who is it for\??|context|"
    r"terms used in this guideline|"
    r"recommendations?|rationale( and impact)?|"
    r"why the committee made (this|these) recommendations?|"
    r"clinical considerations?|"
    r"evidence (summary|synthesis)|screening|risk factors?|"
    r"treatment|implementation|"
    r"update information|about this guideline|"
    r"abstract|introduction|background|"
    r"methods?|methodology|results?|findings?|discussion|"
    r"conclusions?|limitations?|summary|references?|"
    r"acknowledg(e)?ments?)"
    r"\s*[:\.\?]?\s*$",
    re.IGNORECASE,
)

SYSTEM_PROMPT = (
    "You are an expert clinical guideline AI assistant. "
    "Retrieval and relevance filtering have already happened before the CONTEXT excerpts reached "
    "you -- do not re-judge whether the context is sufficient or relevant. Treat every excerpt as "
    "material you should use.\n\n"
    "Your objective is to read the provided CONTEXT excerpts and write a complete, clear, and "
    "informative answer to the user's QUESTION, in your own words.\n\n"
    "FORMAT -- follow this exactly:\n"
    "- Write in flowing paragraph prose, the way a clinician would explain this to a colleague. "
    "2-4 short paragraphs is typical.\n"
    "- Do NOT use bullet points, numbered lists, or headers of any kind.\n"
    "- Do NOT use markdown bold/italics (no ** or _). Plain sentences only.\n"
    "- Do NOT restate or mirror the excerpts' own headings/structure (e.g. 'Key Considerations:', "
    "'Dose Restrictions:'). Weave that content into ordinary sentences instead.\n"
    "- Lead with the direct, concrete answer to the question in the first sentence or two, then "
    "add supporting detail and caveats afterward.\n\n"
    "SYNTHESIS:\n"
    "- Do not copy excerpt sentences verbatim; explain the recommendations in your own words.\n"
    "- Combine related facts from different excerpts into single sentences where it reads "
    "naturally, rather than presenting one citation per fragment.\n\n"
    "CITATIONS:\n"
    "- Cite every distinct clinical fact using this exact format: "
    "[source | section | page | chunk_id].\n"
    "- Place one citation at the end of the sentence that contains the fact, not after every "
    "clause. If several consecutive sentences draw from the same excerpt, a single citation at "
    "the end of that passage is enough -- do not repeat the same citation multiple times in a "
    "row.\n\n"
    "SCOPE:\n"
    "- If the question asks about a specific drug, dose, or duration and the context contains it, "
    "state it plainly and cite it -- this is reporting what the guideline says, not prescribing "
    "to an individual patient.\n"
    "- Only respond with the single phrase 'NOT_IN_CONTEXT' if none of the excerpts address the "
    "question at all; if the context is merely partial, answer with what is available and note "
    "what isn't covered.\n\n"
    "Do not output internal thinking or <think> tags. Output only the final answer."
)

# --- EMBEDDINGS & RETRIEVAL INITIALIZATION ---
print("Initializing sentence-transformers embedding model...")
embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

print("Initializing cross-encoder reranker...")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def normalize_whitespace(text):
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text.strip()


def extract_pdf_pages(pdf_path):
    if not os.path.exists(pdf_path):
        return []
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        pages.append({"page_num": i + 1, "text": text.strip()})
    return pages


def build_full_text_with_offsets(pages):
    full_text = ""
    page_offsets = []
    section_offsets = []
    current_section = "Overview"
    section_offsets.append((0, current_section))

    for p in pages:
        start = len(full_text)
        for line in p["text"].split("\n"):
            if SECTION_HEADING_PATTERN.match(line.strip()):
                current_section = line.strip().title()
                section_offsets.append((len(full_text), current_section))
            full_text += line + "\n"
        full_text += "\n"
        end = len(full_text)
        page_offsets.append((start, end, p["page_num"]))

    return full_text, page_offsets, section_offsets


def page_for_offset(offset, page_offsets):
    for start, end, page_num in page_offsets:
        if start <= offset < end:
            return page_num
    return page_offsets[-1][2] if page_offsets else 1


def section_for_offset(offset, section_offsets):
    section = section_offsets[0][1]
    for start, name in section_offsets:
        if start <= offset:
            section = name
        else:
            break
    return section


def chunk_document(full_text, page_offsets, section_offsets, source, topic):
    chunks = []
    text_len = len(full_text)
    start = 0
    chunk_idx = 0

    while start < text_len:
        end = min(start + CHUNK_SIZE, text_len)
        if end < text_len:
            boundary = full_text.rfind(". ", start + int(CHUNK_SIZE * 0.5), end)
            if boundary != -1:
                end = boundary + 1

        raw_chunk = full_text[start:end]
        chunk_text = normalize_whitespace(raw_chunk)

        if chunk_text:
            chunks.append({
                "chunk_id": f"{source}::chunk_{chunk_idx}",
                "source": source,
                "topic": topic,
                "page": page_for_offset(start, page_offsets),
                "section": section_for_offset(start, section_offsets),
                "text": chunk_text,
            })
            chunk_idx += 1

        if end >= text_len:
            break
        start = end - CHUNK_OVERLAP

    return chunks


def embed_texts(texts):
    embeddings = embedding_model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return np.array(embeddings, dtype="float32")


# Load & Index Chunks
all_chunks = []
for cfg in PDF_CONFIGS:
    if os.path.exists(cfg["path"]):
        src_name = os.path.basename(cfg["path"])
        pgs = extract_pdf_pages(cfg["path"])
        f_txt, p_offs, s_offs = build_full_text_with_offsets(pgs)
        c_list = chunk_document(f_txt, p_offs, s_offs, src_name, cfg["topic"])
        all_chunks.extend(c_list)
        print(f"Loaded {len(c_list)} chunks from {src_name}")

# Build BM25 Index
bm25_corpus = [c["text"].lower().split() for c in all_chunks]
bm25_index = BM25Okapi(bm25_corpus) if bm25_corpus else None

# Build ChromaDB Vector Index
chroma_client = chromadb.Client()
try:
    chroma_client.delete_collection("clinical_chunks")
except Exception:
    pass

collection = chroma_client.create_collection(
    name="clinical_chunks",
    metadata={"hnsw:space": "cosine"},
)

if all_chunks:
    chunk_embeddings = embed_texts([c["text"] for c in all_chunks])
    collection.add(
        ids=[c["chunk_id"] for c in all_chunks],
        embeddings=chunk_embeddings.tolist(),
        metadatas=[{
            "source": c["source"],
            "page": str(c["page"]),
            "topic": c["topic"],
            "section": str(c.get("section", "Overview")),
        } for c in all_chunks],
        documents=[c["text"] for c in all_chunks],
    )
    print(f"ChromaDB & BM25 Ready: {len(all_chunks)} chunks indexed.")
else:
    print("Warning: PDFs missing in backend/data/")


# --- HYBRID RETRIEVAL & RERANKING ---
def bm25_search(query, top_k=RERANK_CANDIDATE_K):
    if not bm25_index:
        return []
    scores = bm25_index.get_scores(query.lower().split())
    ranked_idx = scores.argsort()[::-1][:top_k]
    return [(all_chunks[i], float(scores[i])) for i in ranked_idx]


def minmax_normalize(values):
    lo, hi = min(values), max(values)
    if hi - lo < 1e-9:
        return [0.0 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def retrieve(query, top_k=TOP_K, similarity_threshold=SIMILARITY_THRESHOLD):
    if not all_chunks:
        return []

    chunks_by_id = {c["chunk_id"]: c for c in all_chunks}
    candidate_k = max(top_k, RERANK_CANDIDATE_K)
    query_embedding = embed_texts([query])[0].tolist()
    results = collection.query(query_embeddings=[query_embedding], n_results=candidate_k)

    sem_scores = {}
    if results and results.get("ids") and len(results["ids"][0]) > 0:
        for chunk_id, distance in zip(results["ids"][0], results["distances"][0]):
            sem_scores[chunk_id] = 1.0 - distance

    if not sem_scores or max(sem_scores.values()) < similarity_threshold:
        return []

    keyword_hits = bm25_search(query, top_k=candidate_k)
    kw_scores = {c["chunk_id"]: s for c, s in keyword_hits}

    sem_norm = dict(zip(sem_scores, minmax_normalize(list(sem_scores.values()))))
    kw_norm = dict(zip(kw_scores, minmax_normalize(list(kw_scores.values())))) if kw_scores else {}

    all_ids = set(sem_norm) | set(kw_norm)
    blended = sorted(
        all_ids,
        key=lambda cid: -(HYBRID_ALPHA * sem_norm.get(cid, 0.0) + (1 - HYBRID_ALPHA) * kw_norm.get(cid, 0.0)),
    )
    rerank_pool = [chunks_by_id[cid] for cid in blended[:candidate_k]]

    pairs = [(query, c["text"]) for c in rerank_pool]
    rerank_scores = reranker.predict(pairs)
    reranked = sorted(zip(rerank_pool, rerank_scores), key=lambda x: -x[1])

    retrieved = []
    for chunk, r_score in reranked[:top_k]:
        c = dict(chunk)
        c["similarity"] = sem_scores.get(chunk["chunk_id"], 0.0)
        c["rerank_score"] = float(r_score)
        retrieved.append(c)
    return retrieved


# --- GENERATION ---
def clean_generated_answer(answer):
    """
    Strip stray <think>...</think> content if it ever slips through despite
    reasoning being disabled at the API level (defense in depth).

    Returns (cleaned_text, was_truncated_mid_think). The truncated flag lets
    the caller distinguish "model produced no real answer because the
    response got cut off mid-reasoning" from "model produced a genuinely
    empty answer" -- the old version conflated these, which meant a
    truncated response silently became an empty string and looked like a
    clean failure with no diagnostic signal.
    """
    if not answer:
        return "", False

    answer = answer.strip()
    truncated_mid_think = False

    if "<think>" in answer:
        if "</think>" in answer:
            answer = answer.split("</think>", 1)[1].strip()
        else:
            # Reasoning started but never closed -- almost certainly ran out
            # of max_tokens mid-thought. There is no usable answer here.
            truncated_mid_think = True
            answer = ""

    answer = answer.replace("```text", "").replace("```", "").strip()
    return answer, truncated_mid_think


def fix_broken_citations(answer_text, retrieved_chunks):
    chunks_by_id = {c["chunk_id"]: c for c in retrieved_chunks}
    chunks_by_suffix = {c["chunk_id"].split("::")[-1]: c for c in retrieved_chunks}
    pattern = r"[\[【]([^\|\]】]+)\s*\|\s*([^\|\]】]+)\s*\|\s*([^\|\]】]+)\s*\|\s*([^\]】]+)[\]】]"

    def repl(m):
        src, sec, pg, cid = [x.strip() for x in m.groups()]
        if cid == "chunk_id":
            return ""
        real = chunks_by_id.get(cid) or chunks_by_suffix.get(cid.split("::")[-1])
        if real is None:
            return m.group(0)
        return f"[{real['source']} | {real.get('section', 'Overview')} | {real['page']} | {real['chunk_id']}]"

    return re.sub(pattern, repl, answer_text)


def generate_answer(query, retrieved_chunks, max_retries=GROQ_MAX_RETRIES):
    blocks = []
    for i, c in enumerate(retrieved_chunks, start=1):
        sec = c.get("section") or "Overview"
        blocks.append(
            f"[{i}] source={c['source']} | section={sec} | page={c['page']} | chunk_id={c['chunk_id']}\n{c['text']}"
        )
    context_block = "\n\n".join(blocks)

    user_message = (
        f"CONTEXT EXCERPTS:\n{context_block}\n\n"
        f"QUESTION:\n{query}\n\n"
        "INSTRUCTION:\n"
        "Synthesize the relevant clinical facts from the context above into a helpful, complete response answering the question. "
        "Write it as flowing paragraphs, not bullet points or headers -- explain the key treatments, regimens, and "
        "considerations the way you'd talk a colleague through it. Include the citation tag "
        "[source | section | page | chunk_id] at the end of the sentence containing each fact, without repeating the "
        "same citation back-to-back."
    )

    for attempt in range(max_retries):
        try:
            print(f"[Groq LLM] Generating via {GROQ_MODEL} (attempt {attempt + 1})...")
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": GROQ_TEMPERATURE,
                    "max_tokens": GROQ_MAX_TOKENS,
                    # This is the core fix: disable Qwen3.6's thinking mode.
                    # Without it, the model reasons before answering and can
                    # (a) talk itself into an unwarranted refusal, or
                    # (b) consume the entire token budget on reasoning and
                    #     truncate before emitting a visible answer.
                    "reasoning_effort": GROQ_REASONING_EFFORT,
                },
                timeout=GROQ_TIMEOUT_SECONDS,
            )

            if response.status_code == 200:
                data = response.json()
                choice = data.get("choices", [{}])[0]
                raw_ans = choice.get("message", {}).get("content", "")
                finish_reason = choice.get("finish_reason")

                if finish_reason == "length":
                    logger.warning(
                        "Groq response truncated (finish_reason=length) on attempt %d; "
                        "consider raising GROQ_MAX_TOKENS.",
                        attempt + 1,
                    )

                cleaned, truncated_mid_think = clean_generated_answer(raw_ans)

                if cleaned.strip().upper() == "NOT_IN_CONTEXT":
                    return NO_ANSWER_TEXT

                if cleaned:
                    return cleaned

                if truncated_mid_think:
                    logger.warning(
                        "Attempt %d truncated mid-reasoning with no visible "
                        "answer; retrying.",
                        attempt + 1,
                    )
                    continue

            if response.status_code == 429:
                time.sleep(2 * (attempt + 1))
                continue

            print(f"[Groq Error] {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Groq Exception] {str(e)}")
            time.sleep(1)

    return GENERATION_FAILURE_TEXT


def classify_input_risk(query):
    if any(p.search(query) for p in ADVERSARIAL_RE):
        return "adversarial"
    if any(p.search(query) for p in EMERGENCY_RE):
        return "emergency"
    if any(p.search(query) for p in DIAGNOSIS_RE):
        return "diagnosis_request"
    if any(p.search(query) for p in MEDICATION_DOSAGE_RE):
        return "medication_dosage"
    if any(p.search(query) for p in PATIENT_SPECIFIC_RE):
        return "patient_specific"
    if any(p.search(query) for p in AMBIGUOUS_RE):
        return "ambiguous"
    return "in_scope"


# --- MAIN PIPELINE CALLED BY FLASK ---
def query_rag(prompt: str, mode: str = "Research") -> dict:
    category = classify_input_risk(prompt)

    if category == "adversarial":
        return {
            "answer": "I cannot follow prompt overrides or instructions inside user queries. I only synthesize evidence from the provided medical guidelines.",
            "sources": [],
        }
    if category == "emergency":
        return {
            "answer": "This sounds like a potential medical emergency. Please contact emergency medical services or visit the nearest emergency department immediately.",
            "sources": [],
        }
    if category in ("diagnosis_request", "medication_dosage", "patient_specific"):
        return {
            "answer": SAFETY_REFUSAL_TEXT,
            "sources": [],
        }
    if category == "ambiguous":
        return {
            "answer": "Could you please clarify your question? For example, specify whether you are asking about Multiple Sclerosis or Depression clinical guidelines.",
            "sources": [],
        }

    # Step 1: Retrieval
    retrieved = retrieve(prompt, top_k=TOP_K, similarity_threshold=SIMILARITY_THRESHOLD)
    if not retrieved:
        return {
            "answer": NO_ANSWER_TEXT,
            "sources": [],
        }

    # Step 2: Generation
    raw_answer = generate_answer(prompt, retrieved)
    answer = fix_broken_citations(raw_answer, retrieved).strip()

    if answer not in (SAFETY_REFUSAL_TEXT, NO_ANSWER_TEXT, GENERATION_FAILURE_TEXT):
        answer = f"{answer}\n\n{CLINICAL_SAFETY_DISCLAIMER}"

    formatted_sources = [
        {
            "title": c["source"].replace("-", " ").replace(".pdf", "").title(),
            "detail": f"{c['topic']} Guideline • Page {c['page']}",
            "section": c.get("section") or "Overview",
            "page": int(c["page"]) if str(c["page"]).isdigit() else c["page"],
            "chunkId": c["chunk_id"].split("::")[-1].upper(),
            "score": int(round(c["similarity"] * 100)),
        }
        for c in retrieved
    ]

    return {
        "answer": answer,
        "sources": formatted_sources,
    }
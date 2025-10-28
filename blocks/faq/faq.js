/* eslint-disable no-console */
/**
 * /blocks/faq/faq.js
 * Minimal robustes UE-Update (flache Feld-Edits, kein /answer/value)
 */

// GraphQL-Endpunkt (belasse deine URL wie benötigt)
const GRAPHQL_ENDPOINT = 'https://author-p130407-e1279066.adobeaemcloud.com/graphql/execute.json/securbank/FAQListbyTag;tag=securbank:banking/savings-accounts/transactions';

/**
 * Ermittelt das Tag aus dem Block (optional).
 * Fallback, falls nichts gesetzt ist.
 */
function getUETag(block) {
  return (block && block.dataset && block.dataset.tag) || 'defaultTag';
}

/**
 * Erkennung: Läuft die Seite gerade im Universal Editor?
 * (einfacher Heuristik-Check über Query-Param)
 */
function isUE() {
  try {
    return new URLSearchParams(window.location.search).has('aue');
  } catch (e) {
    return false;
  }
}

/**
 * Baut ein einzelnes FAQ-Item (frage/antwort) und instrumentiert
 * die Felder für den Universal Editor *flach* (ohne Sub-Properties).
 */
function createFaqItem(faq, fragmentPath) {
  const item = document.createElement('div');
  item.className = 'faq-item';
  // ⚠️ WICHTIG: KEINE data-aue-Attribute am Container setzen!

  // URN der CF-Resource (master Variation)
  const cfResourceUrn = `urn:aemconnection:${fragmentPath}/jcr:content/data/master`;

  // QUESTION (Plain Text – Feld-Ebene)
  const questionBtn = document.createElement('button');
  questionBtn.className = 'faq-question';
  questionBtn.textContent = faq?.question || '';
  questionBtn.setAttribute('aria-expanded', isUE() ? 'true' : 'false');
  questionBtn.setAttribute('data-aue-resource', cfResourceUrn);
  questionBtn.setAttribute('data-aue-prop', 'question');
  questionBtn.setAttribute('data-aue-type', 'text'); // Plain-Text editieren

  // ANSWER (Plain Text – Feld-Ebene)
  const answerPanel = document.createElement('div');
  answerPanel.className = 'faq-answer';
  answerPanel.setAttribute('data-aue-resource', cfResourceUrn);
  answerPanel.setAttribute('data-aue-prop', 'answer');
  answerPanel.setAttribute('data-aue-type', 'text'); // Plain-Text editieren

  // WICHTIG: Nur Textknoten, kein innerHTML, keine <p>-Tags
  const plain = (faq && faq.answer && faq.answer.plaintext) ? faq.answer.plaintext : '';
  answerPanel.replaceChildren(document.createTextNode(plain));

  // UE: standardmäßig geöffnet, sonst Akkordeon-Logik
  const expandedByDefault = isUE();
  answerPanel.hidden = !expandedByDefault;

  // Toggle expand/collapse (nur außerhalb des UE relevant)
  questionBtn.addEventListener('click', () => {
    const expanded = questionBtn.getAttribute('aria-expanded') === 'true';
    questionBtn.setAttribute('aria-expanded', String(!expanded));
    answerPanel.hidden = expanded;
  });

  item.appendChild(questionBtn);
  item.appendChild(answerPanel);
  return item;
}

/**
 * Standard-Entry für den Block
 */
export default async function decorate(block) {
  const tag = getUETag(block);
  // Wenn dein Endpunkt bereits ;tag=... enthält, kannst du das Query-Param weglassen.
  // Hier belassen wir es, falls eure Backend-Logik darauf reagiert.
  const url = `${GRAPHQL_ENDPOINT}?tag=${encodeURIComponent(tag)}`;

  let faqs = [];
  try {
    const resp = await fetch(url, { headers: { 'Cache-Control': 'no-store' } });
    if (!resp.ok) throw new Error(`GraphQL error ${resp.status}`);
    const data = await resp.json();
    faqs = data?.data?.faqList?.items || [];
  } catch (e) {
    console.error('Unable to load FAQs:', e);
    block.innerHTML = '<div class="faq-error">Unable to load FAQs.</div>';
    return;
  }

  if (!faqs.length) {
    block.innerHTML = '<div class="faq-empty">No FAQs found for this tag.</div>';
    return;
  }

  // Block leeren und Items einfügen
  block.textContent = '';
  faqs.forEach((faq) => {
    const item = createFaqItem(faq, faq._path);
    block.appendChild(item);
  });
}

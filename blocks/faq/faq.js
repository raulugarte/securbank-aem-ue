// /blocks/faq/faq.js

const GRAPHQL_ENDPOINT = 'https://author-p130407-e1279066.adobeaemcloud.com/graphql/execute.json/securbank/FAQListbyTag';

function getUETag(block) {
  // Read tag from block dataset, fallback as needed
  return block.dataset.tag || 'defaultTag';
}

function createFaqItem(faq, fragmentPath, authorHost) {
  // Instrumentation for Universal Editor: block resource (full CF), per-field editing
  const item = document.createElement('div');
  item.className = 'faq-item';
  item.setAttribute('data-aue-resource', `urn:aemconnection:${fragmentPath}/jcr:content/data/master`);
  item.setAttribute('data-aue-type', 'reference');

  // UE: question is an editable field (use the API name: 'question')
  const questionBtn = document.createElement('button');
  questionBtn.className = 'faq-question';
  questionBtn.textContent = faq.question || '';
  questionBtn.setAttribute('aria-expanded', 'false');
  questionBtn.setAttribute('data-aue-prop', 'question');

  // UE: answer is an editable field (use the API name: 'answer')
  const answerPanel = document.createElement('div');
  answerPanel.className = 'faq-answer';
  answerPanel.setAttribute('data-aue-prop', 'answer');
  answerPanel.setAttribute('data-aue-type', 'richtext');
  answerPanel.innerHTML = faq.answer?.html || `<p>${faq.answer?.plaintext || ''}</p>`;
  answerPanel.hidden = true;

  // Toggle expand/collapse
  questionBtn.addEventListener('click', () => {
    const expanded = questionBtn.getAttribute('aria-expanded') === 'true';
    questionBtn.setAttribute('aria-expanded', String(!expanded));
    answerPanel.hidden = expanded;
  });

  item.appendChild(questionBtn);
  item.appendChild(answerPanel);
  return item;
}

export default async function decorate(block) {
  const tag = getUETag(block);
  const url = `${GRAPHQL_ENDPOINT}?tag=${encodeURIComponent(tag)}`;
  let faqs = [];
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    faqs = data?.data?.faqList?.items || [];
  } catch (e) {
    block.innerHTML = '<div class="faq-error">Unable to load FAQs.</div>';
    return;
  }
  if (!faqs.length) {
    block.innerHTML = '<div class="faq-empty">No FAQs found for this tag.</div>';
    return;
  }

  faqs.forEach(faq => {
    const item = createFaqItem(faq, faq._path, '');
    block.appendChild(item);
  });
}

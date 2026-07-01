export interface Flashcard {
  id: string;
  heading: string;
  englishQuestion: string;
  englishAnswer: string;
  thaiExplanation: string;
  sourceSlug: string;
  sourceTitle: string;
}

const HEADING_RE = /^##\s+(.+)$/gm;
const QA_BLOCK_RE =
  /\*\*English Question:\*\*\s*([\s\S]*?)\n\s*\n\*\*English Answer:\*\*\s*([\s\S]*?)\n\s*\n\*\*Thai Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\n|$)/g;

/**
 * Extracts Q&A flashcards out of the "**English Question:** / **English Answer:** /
 * **Thai Explanation:**" convention used throughout the vault's Interview Notes.
 */
export function parseFlashcards(rawBody: string, sourceSlug: string, sourceTitle: string): Flashcard[] {
  const headings = [...rawBody.matchAll(HEADING_RE)].map((m) => ({
    index: m.index ?? 0,
    text: m[1].trim(),
  }));

  const cards: Flashcard[] = [];
  let cardNumber = 0;
  let match: RegExpExecArray | null;
  QA_BLOCK_RE.lastIndex = 0;

  while ((match = QA_BLOCK_RE.exec(rawBody))) {
    const [, question, answer, thai] = match;
    const startIndex = match.index;

    let heading = sourceTitle;
    for (const h of headings) {
      if (h.index <= startIndex) heading = h.text;
      else break;
    }

    cards.push({
      id: `${sourceSlug}-${cardNumber++}`,
      heading,
      englishQuestion: question.trim(),
      englishAnswer: answer.trim(),
      thaiExplanation: thai.trim(),
      sourceSlug,
      sourceTitle,
    });
  }

  return cards;
}

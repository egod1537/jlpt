const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
const contentPattern = /[\p{Script=Han}\p{Script=Katakana}A-Za-z0-9]/u;
const leadingPunctuationPattern = /^[、。！？]+/;

function segmentIntoPhrases(text) {
  const phrases = [];

  for (const item of segmenter.segment(text)) {
    const segment = item.segment;

    if (segment.length === 0) {
      continue;
    }

    if (contentPattern.test(segment) && phrases.length > 0) {
      phrases.push(segment);
    } else if (phrases.length > 0) {
      phrases[phrases.length - 1] += segment;
    } else {
      phrases.push(segment);
    }
  }

  return phrases;
}

function splitLongestUnprotectedPhrase(phrases, answer) {
  let selectedIndex = -1;
  let selectedLength = 0;

  phrases.forEach((phrase, index) => {
    const length = [...phrase].length;

    if (!phrase.includes(answer) && length > selectedLength && length > 1) {
      selectedIndex = index;
      selectedLength = length;
    }
  });

  if (selectedIndex < 0) {
    return false;
  }

  const phrase = phrases[selectedIndex];
  const characters = [...phrase];
  const splitIndex = Math.ceil(characters.length / 2);

  phrases.splice(
    selectedIndex,
    1,
    characters.slice(0, splitIndex).join(""),
    characters.slice(splitIndex).join(""),
  );
  return true;
}

function buildPhrases(sentence, answer) {
  const answerIndex = sentence.indexOf(answer);

  if (answerIndex < 0) {
    throw new Error(`Sentence does not contain answer: ${answer}`);
  }

  const before = segmentIntoPhrases(sentence.slice(0, answerIndex));
  const after = segmentIntoPhrases(sentence.slice(answerIndex + answer.length));
  let answerPhrase = answer;
  const leadingPunctuation = after[0]?.match(leadingPunctuationPattern)?.[0] ?? "";

  if (leadingPunctuation.length > 0) {
    answerPhrase += leadingPunctuation;
    after[0] = after[0].slice(leadingPunctuation.length);

    if (after[0].length === 0) {
      after.shift();
    }
  }

  const phrases = [...before, answerPhrase, ...after];

  while (phrases.length < 4 && splitLongestUnprotectedPhrase(phrases, answer)) {
    // Four selectable pieces are required by the quiz format.
  }

  if (phrases.length < 4) {
    throw new Error(`Unable to build four phrases: ${sentence}`);
  }

  return phrases;
}

function scorePieces(pieces) {
  const lengths = pieces.map((piece) => [...piece].length);
  const averageLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;

  return (
    Math.max(...lengths) * 20 +
    lengths.reduce(
      (score, length) =>
        score +
        (length - averageLength) ** 2 +
        (length > 10 ? (length - 10) ** 2 * 20 : 0) +
        (length < 2 ? 100 : 0),
      0,
    )
  );
}

function partitionPhrases(phrases) {
  let bestPieces;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let first = 1; first < phrases.length - 2; first += 1) {
    for (let second = first + 1; second < phrases.length - 1; second += 1) {
      for (let third = second + 1; third < phrases.length; third += 1) {
        const pieces = [
          phrases.slice(0, first).join(""),
          phrases.slice(first, second).join(""),
          phrases.slice(second, third).join(""),
          phrases.slice(third).join(""),
        ];
        const score = scorePieces(pieces);

        if (score < bestScore) {
          bestPieces = pieces;
          bestScore = score;
        }
      }
    }
  }

  if (bestPieces === undefined) {
    throw new Error("Unable to partition sentence-order phrases.");
  }

  return bestPieces;
}

export function buildCompactSentenceOrder(sentence, answer) {
  const phrases = buildPhrases(sentence, answer);
  const answerPhraseIndex = phrases.findIndex((phrase) => phrase.includes(answer));
  let startIndex = answerPhraseIndex;
  let endIndex = answerPhraseIndex + 1;
  let selectedLength = [...phrases[answerPhraseIndex]].length;

  while (
    (endIndex - startIndex < 7 || selectedLength < 20) &&
    (startIndex > 0 || endIndex < phrases.length)
  ) {
    const leftLength =
      startIndex > 0 ? [...phrases[startIndex - 1]].length : Number.POSITIVE_INFINITY;
    const rightLength =
      endIndex < phrases.length ? [...phrases[endIndex]].length : Number.POSITIVE_INFINITY;
    const selectLeft =
      (leftLength <= rightLength && startIndex > 0) || endIndex >= phrases.length;
    const nextLength = selectLeft ? leftLength : rightLength;

    if (endIndex - startIndex >= 4 && selectedLength + nextLength > 30) {
      break;
    }

    if (selectLeft) {
      startIndex -= 1;
      selectedLength += leftLength;
    } else {
      endIndex += 1;
      selectedLength += rightLength;
    }
  }

  while (endIndex - startIndex < 4) {
    if (startIndex > 0) {
      startIndex -= 1;
    } else {
      endIndex += 1;
    }
  }

  const prefix = phrases.slice(0, startIndex).join("");
  const suffix = phrases.slice(endIndex).join("");
  const pieces = partitionPhrases(phrases.slice(startIndex, endIndex));

  if (`${prefix}${pieces.join("")}${suffix}` !== sentence) {
    throw new Error(`Compacted pieces do not reconstruct sentence: ${sentence}`);
  }

  return {
    prefix,
    suffix,
    pieces,
    sentenceWithBlanks: `${prefix}${prefix ? " " : ""}____ ____ ____ ____${
      suffix ? ` ${suffix}` : ""
    }`,
  };
}

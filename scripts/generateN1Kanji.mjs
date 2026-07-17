import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const WORDS_PATH = "src/data/vocabulary/n1Words.json";
const OUTPUT_PATH = "src/data/vocabulary/n1Kanji.json";
const REPORT_PATH = "src/data/vocabulary/n1Kanji.report.json";
const HANJA_PATH = "/usr/share/libhangul/hanja/hanja.txt";
const UNIHAN_VARIANTS_PATH = "/usr/share/unicode/Unihan_Variants.txt.bz2";

const MANUAL_MEANINGS = new Map([
  ["込", { sound: "입", meanings: ["들어가다", "안으로 넣다"] }],
]);

const VARIANT_OVERRIDES = new Map([
  ["乗", "乘"],
  ["伝", "傳"],
  ["倹", "儉"],
  ["労", "勞"],
  ["厳", "嚴"],
  ["図", "圖"],
  ["圧", "壓"],
  ["増", "增"],
  ["売", "賣"],
  ["実", "實"],
  ["巻", "卷"],
  ["広", "廣"],
  ["廃", "廢"],
  ["弾", "彈"],
  ["従", "從"],
  ["応", "應"],
  ["恵", "惠"],
  ["悩", "惱"],
  ["悪", "惡"],
  ["戦", "戰"],
  ["抜", "拔"],
  ["挙", "擧"],
  ["捜", "搜"],
  ["撃", "擊"],
  ["栄", "榮"],
  ["検", "檢"],
  ["楽", "樂"],
  ["様", "樣"],
  ["権", "權"],
  ["歯", "齒"],
  ["気", "氣"],
  ["潜", "潛"],
  ["沢", "澤"],
  ["清", "淸"],
  ["済", "濟"],
  ["渉", "涉"],
  ["渋", "澁"],
  ["満", "滿"],
  ["焼", "燒"],
  ["犠", "犧"],
  ["発", "發"],
  ["砕", "碎"],
  ["稲", "稻"],
  ["穏", "穩"],
  ["粋", "粹"],
  ["粛", "肅"],
  ["経", "經"],
  ["装", "裝"],
  ["継", "繼"],
  ["続", "續"],
  ["総", "總"],
  ["縦", "縱"],
  ["繊", "纖"],
  ["舗", "鋪"],
  ["蔵", "藏"],
  ["観", "觀"],
  ["転", "轉"],
  ["軽", "輕"],
  ["遅", "遲"],
  ["即", "卽"],
  ["鉱", "鑛"],
  ["陥", "陷"],
  ["雑", "雜"],
  ["飲", "飮"],
  ["駄", "馱"],
  ["騒", "騷"],
  ["概", "槪"],
]);

function loadHanjaEntries() {
  const entries = new Map();

  readFileSync(HANJA_PATH, "utf8")
    .split(/\n/)
    .forEach((line) => {
      if (line.length === 0 || line.startsWith("#")) {
        return;
      }

      const [sound, hanja, meaning = ""] = line.split(":");

      if ([...hanja].length !== 1 || !/^[가-힣]+$/.test(sound)) {
        return;
      }

      const item = { sound, meaning };
      entries.set(hanja, [...(entries.get(hanja) ?? []), item]);
    });

  return entries;
}

function loadVariantMap() {
  const variants = new Map();
  const variantText = execFileSync("bzcat", [UNIHAN_VARIANTS_PATH], {
    encoding: "utf8",
    maxBuffer: 20_000_000,
  });

  variantText.split(/\n/).forEach((line) => {
    if (line.length === 0 || line.startsWith("#")) {
      return;
    }

    const [code, field, value] = line.split(/\t/);

    if (!field.includes("Variant")) {
      return;
    }

    const char = fromUnicodeCode(code);
    const relatedChars = [...value.matchAll(/U\+([0-9A-F]+)/g)].map((match) =>
      String.fromCodePoint(Number.parseInt(match[1], 16)),
    );

    variants.set(char, [...(variants.get(char) ?? []), ...relatedChars]);
  });

  return variants;
}

function fromUnicodeCode(code) {
  return String.fromCodePoint(Number.parseInt(code.replace("U+", ""), 16));
}

function getVariantCandidates(char, variants, seen = new Set()) {
  if (seen.has(char)) {
    return [];
  }

  seen.add(char);

  const override = VARIANT_OVERRIDES.get(char);
  const directVariants = [
    ...(override === undefined ? [] : [override]),
    ...(variants.get(char) ?? []),
  ];

  return directVariants.flatMap((variant) => [
    variant,
    ...getVariantCandidates(variant, variants, seen),
  ]);
}

function getResolvedHanja(char, entries, variants) {
  const manual = MANUAL_MEANINGS.get(char);

  if (manual !== undefined) {
    return {
      meaningSource: "manual",
      meanings: manual.meanings,
      sounds: [manual.sound],
      variant: null,
    };
  }

  const directEntries = entries.get(char) ?? [];
  const directWithMeaning = directEntries.filter((entry) => entry.meaning.length > 0);

  if (directWithMeaning.length > 0) {
    const directResolved = toResolvedHanja(directWithMeaning, "direct", null);

    if (directResolved.meanings.length > 0) {
      return directResolved;
    }
  }

  for (const variant of getVariantCandidates(char, variants)) {
    const variantEntries = (entries.get(variant) ?? []).filter(
      (entry) => entry.meaning.length > 0,
    );

    if (variantEntries.length > 0) {
      const variantResolved = toResolvedHanja(variantEntries, "variant", variant);

      if (variantResolved.meanings.length > 0) {
        return variantResolved;
      }
    }
  }

  const soundOnly = directEntries.map((entry) => entry.sound);

  return {
    meaningSource: "missing",
    meanings: [],
    sounds: uniqueValues(soundOnly),
    variant: null,
  };
}

function toResolvedHanja(entries, meaningSource, variant) {
  const sounds = uniqueValues(entries.map((entry) => entry.sound));
  const meanings = uniqueValues(
    entries.flatMap((entry) => cleanMeaning(entry.meaning, sounds)),
  );

  return {
    meaningSource,
    meanings,
    sounds,
    variant,
  };
}

function cleanMeaning(meaning, sounds) {
  return meaning
    .split(",")
    .map((part) =>
      sounds
        .reduce(
          (nextPart, sound) => nextPart.replace(new RegExp(`\\s*${sound}$`, "u"), ""),
          part,
        )
        .replace(/.*[의와] (本字|略字|俗字|譌字|同字).*$/u, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((part) => part.length > 0 && !/[一-龯]/u.test(part));
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function getSourceWords(words, char) {
  return uniqueValues(
    words
      .filter((word) => word.jp.includes(char))
      .map((word) => word.jp),
  );
}

function buildKanjiCards() {
  const words = JSON.parse(readFileSync(WORDS_PATH, "utf8"));
  const entries = loadHanjaEntries();
  const variants = loadVariantMap();
  const seen = new Set();
  const kanjiChars = [];

  words.forEach((word) => {
    [...word.jp].forEach((char) => {
      if (!/[一-龯]/u.test(char) || seen.has(char)) {
        return;
      }

      seen.add(char);
      kanjiChars.push(char);
    });
  });

  const cards = kanjiChars.map((char, index) => {
    const resolved = getResolvedHanja(char, entries, variants);
    const sourceWords = getSourceWords(words, char);

    return {
      n: index + 1,
      jp: char,
      rd: resolved.sounds.join("/"),
      kr: resolved.meanings.join(", "),
      examples: sourceWords.slice(0, 8),
      sourceWordCount: sourceWords.length,
      ...(resolved.variant === null ? {} : { variantOf: resolved.variant }),
      ...(resolved.meaningSource === "missing" ? { needsReview: true } : {}),
      qualityFlags:
        resolved.meaningSource === "direct"
          ? []
          : [`meaning-source-${resolved.meaningSource}`],
    };
  });

  const report = {
    cardCount: cards.length,
    sourceWordCount: words.length,
    missingMeaningCount: cards.filter((card) => card.kr.length === 0).length,
    needsReviewCount: cards.filter((card) => card.needsReview).length,
    variantBackfillCount: cards.filter((card) =>
      card.qualityFlags.includes("meaning-source-variant"),
    ).length,
    manualBackfillCount: cards.filter((card) =>
      card.qualityFlags.includes("meaning-source-manual"),
    ).length,
    sourceFiles: {
      hanja: HANJA_PATH,
      unihanVariants: UNIHAN_VARIANTS_PATH,
      words: WORDS_PATH,
    },
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(cards, null, 2)}\n`);
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`generated ${cards.length} N1 kanji cards`);
  console.log(`missing meanings ${report.missingMeaningCount}`);
  console.log(`wrote ${OUTPUT_PATH}`);
  console.log(`wrote ${REPORT_PATH}`);
}

buildKanjiCards();

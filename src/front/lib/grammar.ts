import { importedGrammarPoints, importedGrammarSets } from "@/lib/imported-grammar";

export type GrammarExample = {
  japanese: string;
  korean: string;
};

export type GrammarPoint = {
  id: string;
  pattern: string;
  reading: string;
  meaning: string;
  connection: string[];
  explanation: string;
  caution?: string;
  examples: GrammarExample[];
  keywords: string[];
  notesMarkdown?: string;
  sourceFile?: string;
};

export type GrammarChapter = {
  id: string;
  title: string;
  description: string;
  pointIds: string[];
};

export type GrammarSetType = "flashcard" | "book";

export type GrammarSet = {
  id: string;
  title: string;
  description: string;
  level: string;
  type: GrammarSetType;
  pointIds: string[];
  markdown?: string;
  sourceFile?: string;
  sortOrder?: number;
};

const coreGrammarPoints: GrammarPoint[] = [
  {
    id: "wo-kawakiri-ni",
    pattern: "～を皮切りに",
    reading: "～をかわきりに",
    meaning: "～을 시작으로, ～을 필두로",
    connection: ["명사 + を皮切りに（して）", "명사 + を皮切りとして"],
    explanation: "하나의 사건을 출발점으로 같은 종류의 일이 잇달아 이어지거나 범위가 넓어질 때 쓴다.",
    caution: "한 번으로 끝나는 일보다 뒤에 전개·확대가 이어지는 문맥에 잘 어울린다.",
    examples: [
      { japanese: "東京公演を皮切りに、全国十都市を回る予定だ。", korean: "도쿄 공연을 시작으로 전국 열 개 도시를 돌 예정이다." },
      { japanese: "この発表を皮切りに、各社が新製品を公開した。", korean: "이 발표를 필두로 각 회사가 신제품을 공개했다." },
    ],
    keywords: ["시작", "전개", "확대"],
  },
  {
    id: "wo-motte",
    pattern: "～をもって",
    reading: "～をもって",
    meaning: "～으로써, ～을 기하여",
    connection: ["명사 + をもって", "시간 명사 + をもって"],
    explanation: "수단·근거를 격식 있게 나타내거나, 특정 시점을 경계로 일이 끝남을 공식적으로 알릴 때 쓴다.",
    caution: "일상 대화의 도구에는 보통 で가 자연스럽고, 공지·문서 같은 격식 있는 문맥에서 자주 보인다.",
    examples: [
      { japanese: "本日の受付をもって、募集を締め切ります。", korean: "오늘 접수를 끝으로 모집을 마감합니다." },
      { japanese: "結果をもって実力を証明した。", korean: "결과로써 실력을 증명했다." },
    ],
    keywords: ["기한", "수단", "격식"],
  },
  {
    id: "ni-itaru-made",
    pattern: "～に至るまで",
    reading: "～にいたるまで",
    meaning: "～에 이르기까지, 심지어 ～까지",
    connection: ["명사 + に至るまで"],
    explanation: "범위가 예상보다 넓고 세세한 곳까지 미친다는 점을 강조한다.",
    examples: [
      { japanese: "企画から販売後の対応に至るまで、彼女が責任を負った。", korean: "기획부터 판매 후 대응에 이르기까지 그녀가 책임졌다." },
      { japanese: "部屋の隅々に至るまで、丁寧に掃除されている。", korean: "방 구석구석에 이르기까지 꼼꼼히 청소되어 있다." },
    ],
    keywords: ["범위", "도달", "강조"],
  },
  {
    id: "taritomo",
    pattern: "～たりとも",
    reading: "～たりとも",
    meaning: "단 ～라도, 한 ～도",
    connection: ["수량 표현 + たりとも", "명사 + たりとも"],
    explanation: "아주 작은 단위조차 예외로 허용하지 않는다는 강한 의지를 나타낸다.",
    caution: "뒤에는 주로 부정 표현이 온다.",
    examples: [
      { japanese: "一秒たりとも無駄にはできない。", korean: "단 1초도 낭비할 수 없다." },
      { japanese: "何人たりとも、規則を破ることは許されない。", korean: "그 누구라도 규칙을 어기는 것은 허용되지 않는다." },
    ],
    keywords: ["최소", "예외", "부정"],
  },
  {
    id: "zuniwa-okanai",
    pattern: "～ずにはおかない",
    reading: "～ずにはおかない",
    meaning: "반드시 ～하게 만들다, 기어코 ～하고야 말다",
    connection: ["동사 ない형의 ない 제거 + ずにはおかない", "する → せずにはおかない"],
    explanation: "어떤 힘이나 상황이 반드시 결과를 일으키거나, 말하는 사람이 끝내 행동을 관철한다는 뜻이다.",
    caution: "단순히 참을 수 없다는 ～ずにはいられない와 달리, 결과를 반드시 일으킨다는 데 초점이 있다.",
    examples: [
      { japanese: "彼の演説は、聞く者の心を動かさずにはおかない。", korean: "그의 연설은 듣는 이의 마음을 반드시 움직이게 한다." },
      { japanese: "真相を知った以上、責任者を追及せずにはおかない。", korean: "진상을 안 이상 책임자를 기어코 추궁하고야 말겠다." },
    ],
    keywords: ["필연", "의지", "결과"],
  },
  {
    id: "wo-yoginaku-sareru",
    pattern: "～を余儀なくされる",
    reading: "～をよぎなくされる",
    meaning: "어쩔 수 없이 ～하게 되다, ～을 강요당하다",
    connection: ["명사 + を余儀なくされる"],
    explanation: "외부 사정 때문에 본인의 의지와 상관없이 불가피한 선택을 하게 됨을 격식 있게 나타낸다.",
    examples: [
      { japanese: "大雪のため、計画の変更を余儀なくされた。", korean: "폭설 때문에 계획 변경을 피할 수 없었다." },
      { japanese: "資金不足で、研究の中断を余儀なくされた。", korean: "자금 부족으로 연구 중단을 강요당했다." },
    ],
    keywords: ["불가피", "강제", "외부 사정"],
  },
  {
    id: "ni-katakunai",
    pattern: "～にかたくない",
    reading: "～にかたくない",
    meaning: "～하기 어렵지 않다, 쉽게 ～할 수 있다",
    connection: ["동사 사전형 + にかたくない", "명사 + にかたくない"],
    explanation: "상상·이해·추측처럼 머릿속으로 판단하는 일이 어렵지 않다고 말하는 문어적 표현이다.",
    caution: "想像する・理解する・察する 같은 제한된 동사·명사와 주로 결합한다.",
    examples: [
      { japanese: "突然職を失った彼の不安は想像にかたくない。", korean: "갑자기 직장을 잃은 그의 불안은 쉽게 상상할 수 있다." },
      { japanese: "現場が混乱したことは察するにかたくない。", korean: "현장이 혼란스러웠음은 어렵지 않게 짐작할 수 있다." },
    ],
    keywords: ["상상", "판단", "문어"],
  },
  {
    id: "dewa-arumai-shi",
    pattern: "～ではあるまいし",
    reading: "～ではあるまいし",
    meaning: "～도 아닐 텐데, ～도 아니고",
    connection: ["명사 + ではあるまいし", "명사 + じゃあるまいし"],
    explanation: "그런 입장이나 상황도 아닌데 그에 어울리지 않는 행동을 한다며 비판하거나 타이른다.",
    examples: [
      { japanese: "子どもではあるまいし、自分のことは自分で決めなさい。", korean: "아이도 아닐 텐데 자기 일은 스스로 결정해라." },
      { japanese: "初対面ではあるまいし、そんなに緊張しなくてもいい。", korean: "초면도 아니니 그렇게 긴장하지 않아도 된다." },
    ],
    keywords: ["비판", "충고", "아니다"],
  },
  {
    id: "made-mo-nai",
    pattern: "～までもない",
    reading: "～までもない",
    meaning: "～할 필요까지는 없다, ～할 것도 없다",
    connection: ["동사 사전형 + までもない", "명사 + は言うまでもなく"],
    explanation: "너무 당연하거나 간단해서 굳이 그 행동을 할 필요가 없다고 말한다.",
    examples: [
      { japanese: "簡単な計算だから、電卓を使うまでもない。", korean: "간단한 계산이라 계산기를 쓸 필요까지는 없다." },
      { japanese: "結果は見るまでもなく明らかだった。", korean: "결과는 볼 것도 없이 명백했다." },
    ],
    keywords: ["불필요", "당연", "판단"],
  },
  {
    id: "naradewa",
    pattern: "～ならでは",
    reading: "～ならでは",
    meaning: "～만의, ～이기에 가능한",
    connection: ["명사 + ならでは（の + 명사）"],
    explanation: "그 대상만이 지닌 고유한 장점이나 특징을 높이 평가할 때 쓴다.",
    caution: "뒤 명사를 꾸밀 때는 ならではの 형태가 된다.",
    examples: [
      { japanese: "老舗ならではの丁寧な仕事が光る。", korean: "오랜 전통의 가게만이 보여 줄 수 있는 꼼꼼한 솜씨가 돋보인다." },
      { japanese: "この土地ならではの景色を楽しんだ。", korean: "이 지역에서만 볼 수 있는 풍경을 즐겼다." },
    ],
    keywords: ["고유", "특징", "평가"],
  },
  {
    id: "ni-hikikae",
    pattern: "～にひきかえ",
    reading: "～にひきかえ",
    meaning: "～과는 대조적으로, ～과 달리",
    connection: ["명사 + にひきかえ", "보통형 + の + にひきかえ"],
    explanation: "두 대상의 차이가 크다는 화자의 평가를 담아 서로 대조한다.",
    examples: [
      { japanese: "兄が社交的なのにひきかえ、弟は物静かだ。", korean: "형이 사교적인 것과 대조적으로 동생은 말수가 적다." },
      { japanese: "去年の猛暑にひきかえ、今年の夏は涼しい。", korean: "작년의 폭염과 달리 올해 여름은 선선하다." },
    ],
    keywords: ["대조", "차이", "평가"],
  },
  {
    id: "soba-kara",
    pattern: "～そばから",
    reading: "～そばから",
    meaning: "～하자마자 곧, ～하는 족족",
    connection: ["동사 사전형·た형 + そばから"],
    explanation: "한 행동이 끝나자마자 반대 결과가 반복해서 생겨 허탈하거나 곤란함을 나타낸다.",
    caution: "한 번뿐인 사건보다 같은 일이 되풀이되는 문맥에서 자연스럽다.",
    examples: [
      { japanese: "新しい単語を覚えたそばから忘れてしまう。", korean: "새 단어를 외우는 족족 잊어버린다." },
      { japanese: "片づけるそばから、子どもがおもちゃを広げる。", korean: "치우자마자 아이가 장난감을 늘어놓는다." },
    ],
    keywords: ["직후", "반복", "곤란"],
  },
];

export const grammarPoints: GrammarPoint[] = [...coreGrammarPoints, ...importedGrammarPoints];

export const grammarChapters: GrammarChapter[] = [
  {
    id: "range-and-start",
    title: "1. 시작과 범위",
    description: "사건의 출발점, 도달 범위, 예외 없는 한계를 표현합니다.",
    pointIds: ["wo-kawakiri-ni", "wo-motte", "ni-itaru-made", "taritomo"],
  },
  {
    id: "inevitability",
    title: "2. 필연과 불가피",
    description: "강한 의지나 외부 상황이 피할 수 없는 결과로 이어짐을 표현합니다.",
    pointIds: ["zuniwa-okanai", "wo-yoginaku-sareru"],
  },
  {
    id: "judgment",
    title: "3. 판단과 평가",
    description: "상황을 추측하거나 필요성을 판단하고, 고유한 가치를 평가합니다.",
    pointIds: ["ni-katakunai", "dewa-arumai-shi", "made-mo-nai", "naradewa"],
  },
  {
    id: "contrast-and-repeat",
    title: "4. 대조와 반복",
    description: "두 대상을 선명하게 대비하거나 직후에 반복되는 일을 나타냅니다.",
    pointIds: ["ni-hikikae", "soba-kara"],
  },
];

export const grammarPointById = new Map(grammarPoints.map((point) => [point.id, point]));

const coreGrammarSets: GrammarSet[] = [
  {
    id: "n1-range-cards",
    title: "시작과 범위",
    description: "출발점, 도달 범위, 예외 없는 한계를 카드로 익힙니다.",
    level: "N1",
    type: "flashcard",
    pointIds: ["wo-kawakiri-ni", "wo-motte", "ni-itaru-made", "taritomo"],
  },
  {
    id: "n1-inevitability-cards",
    title: "필연과 불가피",
    description: "강한 의지와 피할 수 없는 결과를 나타내는 문형입니다.",
    level: "N1",
    type: "flashcard",
    pointIds: ["zuniwa-okanai", "wo-yoginaku-sareru"],
  },
  {
    id: "n1-judgment-cards",
    title: "판단과 평가",
    description: "추측, 필요성, 고유한 가치를 판단하는 문형입니다.",
    level: "N1",
    type: "flashcard",
    pointIds: ["ni-katakunai", "dewa-arumai-shi", "made-mo-nai", "naradewa"],
  },
  {
    id: "n1-contrast-cards",
    title: "대조와 반복",
    description: "차이를 선명하게 대비하고 반복되는 일을 표현합니다.",
    level: "N1",
    type: "flashcard",
    pointIds: ["ni-hikikae", "soba-kara"],
  },
  {
    id: "n1-core-book",
    title: "N1 핵심 문형 노트",
    description: "네 개 장과 예문을 한 권의 문법 노트처럼 이어 읽습니다.",
    level: "N1",
    type: "book",
    pointIds: grammarPoints.map((point) => point.id),
  },
];

export const grammarSets: GrammarSet[] = [...coreGrammarSets, ...importedGrammarSets].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

export const grammarSetById = new Map(grammarSets.map((set) => [set.id, set]));

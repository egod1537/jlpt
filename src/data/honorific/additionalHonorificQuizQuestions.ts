import type { HonorificQuizQuestion } from "../../types/honorific";

type HonorificQuizSpec = Omit<HonorificQuizQuestion, "id">;

interface MappingSpec {
  standard: string;
  kind: "존경어" | "겸양어";
  answer: string;
  distractors: [string, string, string];
  note?: string;
}

interface ContrastSpec {
  standard: string;
  meaning: string;
  respectful: string;
  humble: string;
  normal: string;
  respectfulSubject: string;
  humbleSubject: string;
}

interface SentencePair {
  respectful: HonorificQuizSpec;
  humble: HonorificQuizSpec;
}

function rotateChoices(
  choices: readonly string[],
  questionIndex: number,
): string[] {
  const offset = questionIndex % choices.length;
  return [...choices.slice(offset), ...choices.slice(0, offset)];
}

const mappingSpecs: MappingSpec[] = [
  { standard: "行く", kind: "존경어", answer: "いらっしゃる", distractors: ["参る", "伺う", "いたす"] },
  { standard: "行く", kind: "존경어", answer: "おいでになる", distractors: ["お目にかかる", "上がる", "承る"], note: "おいでになる도 行く·来る·いる의 존경 표현으로 쓸 수 있다." },
  { standard: "来る", kind: "존경어", answer: "いらっしゃる", distractors: ["参る", "おる", "申す"] },
  { standard: "来る", kind: "존경어", answer: "お見えになる", distractors: ["拝見する", "ご覧に入れる", "頂戴する"], note: "상대방이 모습을 보이며 오는 상황에 お見えになる를 쓴다." },
  { standard: "来る", kind: "존경어", answer: "お越しになる", distractors: ["伺う", "差し上げる", "存じ上げる"], note: "お越しになる는 상대방의 방문이나 이동을 높이는 표현이다." },
  { standard: "いる", kind: "존경어", answer: "いらっしゃる", distractors: ["おる", "参る", "ございます"] },
  { standard: "いる", kind: "존경어", answer: "おいでになる", distractors: ["存じる", "申す", "拝借する"] },
  { standard: "食べる", kind: "존경어", answer: "召し上がる", distractors: ["いただく", "頂戴する", "なさる"] },
  { standard: "飲む", kind: "존경어", answer: "召し上がる", distractors: ["参る", "承る", "いたす"] },
  { standard: "する", kind: "존경어", answer: "なさる", distractors: ["いたす", "申す", "伺う"] },
  { standard: "言う", kind: "존경어", answer: "おっしゃる", distractors: ["申す", "申し上げる", "存じる"] },
  { standard: "見る", kind: "존경어", answer: "ご覧になる", distractors: ["拝見する", "お目にかかる", "ご覧に入れる"] },
  { standard: "選ぶ", kind: "존경어", answer: "お選びになる", distractors: ["拝借する", "お目にかける", "頂戴する"] },
  { standard: "会う", kind: "존경어", answer: "お会いになる", distractors: ["お目にかかる", "伺う", "承る"] },
  { standard: "思う", kind: "존경어", answer: "思し召す", distractors: ["存じる", "申す", "おる"] },
  { standard: "知っている", kind: "존경어", answer: "ご存知だ", distractors: ["存じ上げている", "存じている", "承っている"] },
  { standard: "聞く", kind: "존경어", answer: "お聞きになる", distractors: ["伺う", "承る", "拝見する"] },
  { standard: "訪ねる", kind: "존경어", answer: "お訪ねになる", distractors: ["伺う", "上がる", "参る"] },
  { standard: "くれる", kind: "존경어", answer: "くださる", distractors: ["いただく", "差し上げる", "頂戴する"] },
  { standard: "～です", kind: "존경어", answer: "～でいらっしゃる", distractors: ["～でございます", "～と申す", "～でおる"] },
  { standard: "동사＋ている", kind: "존경어", answer: "동사＋ていらっしゃる", distractors: ["동사＋ておる", "동사＋て参る", "동사＋ていたす"] },
  { standard: "동사＋てください", kind: "존경어", answer: "お＋동사 ます형 어간＋ください", distractors: ["동사＋ておる", "동사＋て参る", "동사＋て申す"] },
  { standard: "行く", kind: "겸양어", answer: "参る", distractors: ["いらっしゃる", "お越しになる", "おいでになる"] },
  { standard: "来る", kind: "겸양어", answer: "参る", distractors: ["お見えになる", "いらっしゃる", "くださる"] },
  { standard: "いる", kind: "겸양어", answer: "おる", distractors: ["いらっしゃる", "おいでになる", "なさる"] },
  { standard: "食べる", kind: "겸양어", answer: "いただく", distractors: ["召し上がる", "おっしゃる", "ご覧になる"] },
  { standard: "飲む", kind: "겸양어", answer: "いただく", distractors: ["召し上がる", "なさる", "くださる"] },
  { standard: "する", kind: "겸양어", answer: "いたす", distractors: ["なさる", "いらっしゃる", "おっしゃる"] },
  { standard: "言う (상대에게 말씀드리다)", kind: "겸양어", answer: "申し上げる", distractors: ["おっしゃる", "申す", "承る"], note: "말을 전달받는 상대가 분명할 때 申し上げる를 쓴다." },
  { standard: "言う (자기 발화를 낮추다)", kind: "겸양어", answer: "申す", distractors: ["おっしゃる", "申し上げる", "ご覧になる"], note: "자기 이름이나 의견을 정중하게 말할 때 申す를 쓴다." },
  { standard: "見る", kind: "겸양어", answer: "拝見する", distractors: ["ご覧になる", "お見えになる", "お目にかかる"] },
  { standard: "会う", kind: "겸양어", answer: "お目にかかる", distractors: ["お会いになる", "お目にかける", "ご覧に入れる"] },
  { standard: "見せる", kind: "겸양어", answer: "ご覧に入れる", distractors: ["ご覧になる", "拝見する", "お会いになる"] },
  { standard: "見せる", kind: "겸양어", answer: "お目にかける", distractors: ["お目にかかる", "お見えになる", "お聞きになる"] },
  { standard: "思う", kind: "겸양어", answer: "存じる", distractors: ["思し召す", "ご存知だ", "おっしゃる"] },
  { standard: "知っている (사람을 알다)", kind: "겸양어", answer: "存じ上げている", distractors: ["ご存知だ", "存じている", "お会いになる"] },
  { standard: "知っている (사실을 알다)", kind: "겸양어", answer: "存じている", distractors: ["ご存知だ", "存じ上げている", "お聞きになる"] },
  { standard: "借りる", kind: "겸양어", answer: "拝借する", distractors: ["拝見する", "承る", "頂戴する"] },
  { standard: "聞く・尋ねる", kind: "겸양어", answer: "伺う", distractors: ["お聞きになる", "おっしゃる", "ご覧になる"] },
  { standard: "聞く・引き受ける", kind: "겸양어", answer: "承る", distractors: ["お聞きになる", "伺う", "申す"], note: "承る는 용건이나 주문을 듣고 맡는 격식 있는 표현이다." },
  { standard: "質問する", kind: "겸양어", answer: "伺う", distractors: ["おっしゃる", "なさる", "お聞きになる"] },
  { standard: "訪問する", kind: "겸양어", answer: "伺う", distractors: ["お越しになる", "お訪ねになる", "いらっしゃる"] },
  { standard: "訪問する", kind: "겸양어", answer: "上がる", distractors: ["お見えになる", "おいでになる", "くださる"], note: "상대의 집이나 장소에 찾아가는 상황에서 上がる를 겸양 표현으로 쓸 수 있다." },
  { standard: "あげる", kind: "겸양어", answer: "差し上げる", distractors: ["くださる", "いただく", "頂戴する"] },
  { standard: "もらう", kind: "겸양어", answer: "いただく", distractors: ["くださる", "差し上げる", "召し上がる"] },
  { standard: "もらう", kind: "겸양어", answer: "頂戴する", distractors: ["おっしゃる", "なさる", "ご覧になる"] },
  { standard: "～です", kind: "겸양어", answer: "～でございます", distractors: ["～でいらっしゃる", "～なさいます", "～くださいます"] },
  { standard: "ある", kind: "겸양어", answer: "ございます", distractors: ["いらっしゃいます", "おります", "まいります"] },
  { standard: "동사＋ている", kind: "겸양어", answer: "동사＋ておる", distractors: ["동사＋ていらっしゃる", "동사＋てくださる", "동사＋てなさる"] },
  { standard: "동사＋ていく", kind: "겸양어", answer: "동사＋て参る", distractors: ["동사＋ていらっしゃる", "동사＋ておっしゃる", "동사＋てくださる"] },
];

const contrastSpecs: ContrastSpec[] = [
  { standard: "行く・来る", meaning: "가다·오다", respectful: "いらっしゃる", humble: "参る", normal: "行く", respectfulSubject: "사장님", humbleSubject: "저" },
  { standard: "いる", meaning: "있다", respectful: "いらっしゃる", humble: "おる", normal: "いる", respectfulSubject: "선생님", humbleSubject: "저희 직원" },
  { standard: "食べる・飲む", meaning: "먹다·마시다", respectful: "召し上がる", humble: "いただく", normal: "食べる", respectfulSubject: "손님", humbleSubject: "저" },
  { standard: "する", meaning: "하다", respectful: "なさる", humble: "いたす", normal: "する", respectfulSubject: "교수님", humbleSubject: "제가" },
  { standard: "言う", meaning: "말하다", respectful: "おっしゃる", humble: "申し上げる", normal: "言う", respectfulSubject: "부장님", humbleSubject: "제가 고객님께" },
  { standard: "見る", meaning: "보다", respectful: "ご覧になる", humble: "拝見する", normal: "見る", respectfulSubject: "고객님", humbleSubject: "제가 선생님의 자료를" },
  { standard: "会う", meaning: "만나다", respectful: "お会いになる", humble: "お目にかかる", normal: "会う", respectfulSubject: "회장님", humbleSubject: "제가 회장님을" },
  { standard: "思う", meaning: "생각하다", respectful: "思し召す", humble: "存じる", normal: "思う", respectfulSubject: "폐하", humbleSubject: "저" },
  { standard: "知っている", meaning: "알고 있다", respectful: "ご存知だ", humble: "存じ上げている", normal: "知っている", respectfulSubject: "선생님", humbleSubject: "제가 그분을" },
  { standard: "聞く", meaning: "듣다·묻다", respectful: "お聞きになる", humble: "伺う", normal: "聞く", respectfulSubject: "사장님", humbleSubject: "제가 담당자께" },
  { standard: "訪問する", meaning: "방문하다", respectful: "お訪ねになる", humble: "伺う", normal: "訪問する", respectfulSubject: "교수님", humbleSubject: "제가 교수님 댁을" },
  { standard: "주고받기", meaning: "주다·받다", respectful: "くださる", humble: "差し上げる", normal: "あげる", respectfulSubject: "선생님이 저에게", humbleSubject: "제가 선생님께" },
  { standard: "～です", meaning: "~입니다", respectful: "～でいらっしゃる", humble: "～でございます", normal: "～です", respectfulSubject: "저분", humbleSubject: "저희 회사" },
  { standard: "동사＋ている", meaning: "~하고 있다", respectful: "동사＋ていらっしゃる", humble: "동사＋ておる", normal: "동사＋ている", respectfulSubject: "선생님", humbleSubject: "저" },
];

const sentencePairs: SentencePair[] = [
  {
    respectful: {
      context: "교수님이 다음 주 교토에 가십니다.",
      prompt: "「教授は来週、京都へ（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいます", "まいります", "伺います", "おります"],
      answer: "いらっしゃいます",
      explanation: "교수님의 行く를 높이므로 いらっしゃいます를 쓴다.",
    },
    humble: {
      context: "제가 다음 주 교토에 갑니다.",
      prompt: "「私が来週、京都へ（　　）。」에 알맞은 표현은?",
      choices: ["まいります", "いらっしゃいます", "お越しになります", "くださいます"],
      answer: "まいります",
      explanation: "자신의 行く를 낮추는 겸양어 II는 参ります이다.",
    },
  },
  {
    respectful: {
      context: "고객님이 오후 세 시에 오십니다.",
      prompt: "「お客様は午後三時に（　　）。」에 알맞은 표현은?",
      choices: ["お見えになります", "拝見します", "まいります", "頂戴します"],
      answer: "お見えになります",
      explanation: "상대방이 오는 상황을 높여 お見えになります라고 할 수 있다.",
    },
    humble: {
      context: "제가 세 시쯤 찾아가겠습니다.",
      prompt: "「三時ごろ、私がそちらへ（　　）。」에 알맞은 표현은?",
      choices: ["伺います", "お見えになります", "いらっしゃいます", "なさいます"],
      answer: "伺います",
      explanation: "상대의 장소로 찾아가는 자신의 행동은 伺います로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "과장님은 지금 회의실에 계십니다.",
      prompt: "「課長は今、会議室に（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいます", "おります", "ございます", "いたします"],
      answer: "いらっしゃいます",
      explanation: "윗사람의 いる는 いらっしゃる로 높인다.",
    },
    humble: {
      context: "담당 직원은 접수처에 있습니다.",
      prompt: "「担当の者は受付に（　　）。」에 알맞은 표현은?",
      choices: ["おります", "いらっしゃいます", "お越しになります", "ご覧になります"],
      answer: "おります",
      explanation: "자기 측 사람의 いる를 낮춰 おります라고 한다.",
    },
  },
  {
    respectful: {
      context: "손님이 일본 요리를 드십니다.",
      prompt: "「お客様は日本料理を（　　）。」에 알맞은 표현은?",
      choices: ["召し上がります", "いただきます", "いたします", "承ります"],
      answer: "召し上がります",
      explanation: "상대방의 食べる는 召し上がる로 높인다.",
    },
    humble: {
      context: "그러면 저도 조금 먹겠습니다.",
      prompt: "「では、私も少し（　　）。」에 알맞은 표현은?",
      choices: ["いただきます", "召し上がります", "おっしゃいます", "ご覧になります"],
      answer: "いただきます",
      explanation: "자신이 먹거나 마시는 행동을 정중히 낮출 때 いただきます를 쓴다.",
    },
  },
  {
    respectful: {
      context: "사장님이 직접 확인하십니다.",
      prompt: "「社長が直接、確認（　　）。」에 알맞은 표현은?",
      choices: ["なさいます", "いたします", "申します", "まいります"],
      answer: "なさいます",
      explanation: "사장님의 する를 높이는 존경어는 なさる이다.",
    },
    humble: {
      context: "확인은 제가 하겠습니다.",
      prompt: "「確認は私が（　　）。」에 알맞은 표현은?",
      choices: ["いたします", "なさいます", "いらっしゃいます", "くださいます"],
      answer: "いたします",
      explanation: "자신의 する를 낮추는 겸양어 II는 いたす이다.",
    },
  },
  {
    respectful: {
      context: "선생님이 중요한 말씀을 하셨습니다.",
      prompt: "「先生が大切なことを（　　）。」에 알맞은 표현은?",
      choices: ["おっしゃいました", "申しました", "申し上げました", "伺いました"],
      answer: "おっしゃいました",
      explanation: "선생님의 言う는 おっしゃる로 높인다.",
    },
    humble: {
      context: "제가 고객님께 감사 인사를 드렸습니다.",
      prompt: "「お客様にお礼を（　　）。」에 알맞은 표현은?",
      choices: ["申し上げました", "おっしゃいました", "ご覧になりました", "召し上がりました"],
      answer: "申し上げました",
      explanation: "존경하는 상대에게 말씀드리는 행위는 申し上げる로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "부장님이 새 기획서를 보셨습니다.",
      prompt: "「部長は新しい企画書を（　　）。」에 알맞은 표현은?",
      choices: ["ご覧になりました", "拝見しました", "お目にかかりました", "頂戴しました"],
      answer: "ご覧になりました",
      explanation: "부장님의 見る는 ご覧になる로 높인다.",
    },
    humble: {
      context: "보내 주신 사진을 잘 보았습니다.",
      prompt: "「お送りいただいた写真を（　　）。」에 알맞은 표현은?",
      choices: ["拝見しました", "ご覧になりました", "お見えになりました", "なさいました"],
      answer: "拝見しました",
      explanation: "상대가 보낸 것을 보는 자신의 행동은 拝見する로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "고객님께서 세 가지 중 하나를 고르십니다.",
      prompt: "「お客様が三つの中から一つを（　　）。」에 알맞은 표현은?",
      choices: ["お選びになります", "拝借します", "差し上げます", "承ります"],
      answer: "お選びになります",
      explanation: "일반 동사 選ぶ는 お＋ます형 어간＋になる로 높일 수 있다.",
    },
    humble: {
      context: "제가 고객님을 위해 알맞은 상품을 골라 드립니다.",
      prompt: "「私がお客様に合う商品を（　　）。」에 알맞은 표현은?",
      choices: ["お選びします", "お選びになります", "ご覧になります", "お越しになります"],
      answer: "お選びします",
      explanation: "자신의 행동이 상대를 향할 때 お＋ます형 어간＋する로 낮출 수 있다.",
    },
  },
  {
    respectful: {
      context: "회장님이 내일 거래처 대표를 만나십니다.",
      prompt: "「会長は明日、取引先の代表に（　　）。」에 알맞은 표현은?",
      choices: ["お会いになります", "お目にかかります", "拝見します", "伺います"],
      answer: "お会いになります",
      explanation: "회장님의 会う를 높여 お会いになります라고 한다.",
    },
    humble: {
      context: "어제 회장님을 처음 뵈었습니다.",
      prompt: "「昨日、初めて会長に（　　）。」에 알맞은 표현은?",
      choices: ["お目にかかりました", "お会いになりました", "お目にかけました", "お見えになりました"],
      answer: "お目にかかりました",
      explanation: "존경하는 사람을 만나는 자신의 행동은 お目にかかる로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "고객님께서 이 작품을 어떻게 생각하시는지 묻습니다.",
      prompt: "「お客様はこの作品をどう（　　）か。」에 알맞은 표현은?",
      choices: ["思し召します", "存じます", "申します", "承ります"],
      answer: "思し召します",
      explanation: "격식 높은 상황에서 상대방의 思う를 思し召す로 높일 수 있다.",
    },
    humble: {
      context: "저는 그 방법이 가장 좋다고 생각합니다.",
      prompt: "「その方法が最善だと（　　）。」에 알맞은 표현은?",
      choices: ["存じます", "思し召します", "ご存知です", "おっしゃいます"],
      answer: "存じます",
      explanation: "자신의 思う를 낮추고 정중히 말할 때 存じます를 쓴다.",
    },
  },
  {
    respectful: {
      context: "선생님은 이미 결과를 알고 계십니다.",
      prompt: "「先生はもう結果を（　　）。」에 알맞은 표현은?",
      choices: ["ご存知です", "存じております", "存じ上げております", "伺っております"],
      answer: "ご存知です",
      explanation: "상대방의 知っている는 ご存知だ로 높인다.",
    },
    humble: {
      context: "저는 다나카 선생님을 예전부터 알고 있습니다.",
      prompt: "「田中先生は以前から（　　）。」에 알맞은 표현은?",
      choices: ["存じ上げております", "ご存知です", "お会いになります", "承っております"],
      answer: "存じ上げております",
      explanation: "존경하는 사람을 알고 있다는 뜻에는 存じ上げております가 자연스럽다.",
    },
  },
  {
    respectful: {
      context: "사장님이 제 설명을 들으셨습니다.",
      prompt: "「社長は私の説明を（　　）。」에 알맞은 표현은?",
      choices: ["お聞きになりました", "伺いました", "承りました", "申しました"],
      answer: "お聞きになりました",
      explanation: "사장님의 聞く를 높여 お聞きになりました라고 한다.",
    },
    humble: {
      context: "일정에 관해 담당자에게 여쭤보겠습니다.",
      prompt: "「日程について担当者に（　　）。」에 알맞은 표현은?",
      choices: ["伺います", "お聞きになります", "おっしゃいます", "ご覧になります"],
      answer: "伺います",
      explanation: "상대에게 묻는 자신의 행동은 伺う로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "교수님이 연구소를 방문하셨습니다.",
      prompt: "「教授が研究所を（　　）。」에 알맞은 표현은?",
      choices: ["お訪ねになりました", "伺いました", "上がりました", "まいりました"],
      answer: "お訪ねになりました",
      explanation: "교수님의 訪ねる를 높여 お訪ねになりました라고 한다.",
    },
    humble: {
      context: "내일 교수님 연구실을 찾아뵙겠습니다.",
      prompt: "「明日、教授の研究室に（　　）。」에 알맞은 표현은?",
      choices: ["伺います", "お訪ねになります", "お越しになります", "いらっしゃいます"],
      answer: "伺います",
      explanation: "존경하는 상대의 장소를 방문하는 자신의 행동은 伺う로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "선생님이 추천서를 써 주셨습니다.",
      prompt: "「先生が推薦状を書いて（　　）。」에 알맞은 표현은?",
      choices: ["くださいました", "いただきました", "差し上げました", "頂戴しました"],
      answer: "くださいました",
      explanation: "상대방이 나를 위해 해 준 행동은 ～てくださる로 높인다.",
    },
    humble: {
      context: "제가 선생님께 자료를 보내 드리겠습니다.",
      prompt: "「私が先生に資料を送って（　　）。」에 알맞은 표현은?",
      choices: ["差し上げます", "くださいます", "いただきます", "召し上がります"],
      answer: "差し上げます",
      explanation: "자신이 상대에게 무엇을 해 드리는 방향은 ～て差し上げる로 나타낼 수 있다.",
    },
  },
  {
    respectful: {
      context: "저분은 새로 오신 교장 선생님입니다.",
      prompt: "「あちらの方は新しい校長先生で（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいます", "ございます", "おります", "まいります"],
      answer: "いらっしゃいます",
      explanation: "존경 대상의 ～です는 ～でいらっしゃいます로 높인다.",
    },
    humble: {
      context: "이쪽은 저희 회사의 안내 데스크입니다.",
      prompt: "「こちらは弊社の案内窓口で（　　）。」에 알맞은 표현은?",
      choices: ["ございます", "いらっしゃいます", "なさいます", "くださいます"],
      answer: "ございます",
      explanation: "자기 측 사물이나 안내 표현의 ～です는 ～でございます로 정중히 낮춘다.",
    },
  },
  {
    respectful: {
      context: "선생님이 지금 학생들과 이야기하고 계십니다.",
      prompt: "「先生は今、学生と話して（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいます", "おります", "まいります", "いたします"],
      answer: "いらっしゃいます",
      explanation: "상대방의 ～ている는 ～ていらっしゃる로 높인다.",
    },
    humble: {
      context: "저는 현재 서울 지사에서 일하고 있습니다.",
      prompt: "「私は現在、ソウル支社で働いて（　　）。」에 알맞은 표현은?",
      choices: ["おります", "いらっしゃいます", "くださいます", "なさいます"],
      answer: "おります",
      explanation: "자신의 ～ている는 ～ております로 낮추어 말한다.",
    },
  },
  {
    respectful: {
      context: "손님에게 잠시 기다려 달라고 정중히 부탁합니다.",
      prompt: "「少々（　　）ください。」에 알맞은 표현은?",
      choices: ["お待ち", "待っており", "お待ちになり", "伺い"],
      answer: "お待ち",
      explanation: "～てください의 존경·정중한 부탁은 お＋ます형 어간＋ください로 만든다.",
    },
    humble: {
      context: "앞으로도 서비스 개선을 계속해 나가겠습니다.",
      prompt: "「今後もサービスの改善に努めて（　　）。」에 알맞은 표현은?",
      choices: ["まいります", "いらっしゃいます", "くださいます", "召し上がります"],
      answer: "まいります",
      explanation: "자기 측의 지속적인 행동을 겸손하게 말할 때 ～てまいります를 쓴다.",
    },
  },
  {
    respectful: {
      context: "고객님이 어떤 상품을 원하시는지 묻습니다.",
      prompt: "「どの商品を（　　）か。」에 알맞은 표현은?",
      choices: ["お求めになります", "お求めします", "拝借します", "頂戴します"],
      answer: "お求めになります",
      explanation: "일반 동사 求める는 お＋ます형 어간＋になる로 높일 수 있다.",
    },
    humble: {
      context: "제가 고객님의 짐을 맡아 드리겠습니다.",
      prompt: "「お荷物を（　　）します。」에 알맞은 표현은?",
      choices: ["お預かり", "お預かりになり", "ご覧", "お越し"],
      answer: "お預かり",
      explanation: "자신이 상대를 위해 하는 행동은 お＋ます형 어간＋する로 낮춘다.",
    },
  },
  {
    respectful: {
      context: "부장님이 회의 자료를 읽고 계십니다.",
      prompt: "「部長は会議資料を読んで（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいます", "おります", "まいります", "ございます"],
      answer: "いらっしゃいます",
      explanation: "윗사람의 진행 중인 행동은 ～ていらっしゃいます로 높인다.",
    },
    humble: {
      context: "담당자는 지금 확인하고 있습니다.",
      prompt: "「担当者がただ今確認して（　　）。」에 알맞은 표현은?",
      choices: ["おります", "いらっしゃいます", "なさいます", "くださいます"],
      answer: "おります",
      explanation: "자기 측 담당자의 행동은 ～ております로 낮춰 말한다.",
    },
  },
  {
    respectful: {
      context: "선생님이 제 이름을 기억하고 계셨습니다.",
      prompt: "「先生は私の名前を覚えて（　　）。」에 알맞은 표현은?",
      choices: ["いらっしゃいました", "おりました", "まいりました", "いたしました"],
      answer: "いらっしゃいました",
      explanation: "선생님의 ～ている를 높여 ～ていらっしゃいました라고 한다.",
    },
    humble: {
      context: "말씀하신 내용은 잘 기억하고 있습니다.",
      prompt: "「お話の内容はよく覚えて（　　）。」에 알맞은 표현은?",
      choices: ["おります", "いらっしゃいます", "お越しになります", "召し上がります"],
      answer: "おります",
      explanation: "자신의 상태를 낮춰 覚えております라고 한다.",
    },
  },
  {
    respectful: {
      context: "사장님이 회의 날짜를 정하셨습니다.",
      prompt: "「社長が会議の日をお決めに（　　）。」에 알맞은 표현은?",
      choices: ["なりました", "しました", "いたしました", "まいりました"],
      answer: "なりました",
      explanation: "お＋ます형 어간＋になる는 일반 동사의 대표적인 존경어 패턴이다.",
    },
    humble: {
      context: "제가 곧 안내해 드리겠습니다.",
      prompt: "「私がすぐにご案内（　　）。」에 알맞은 표현은?",
      choices: ["いたします", "なさいます", "いらっしゃいます", "お見えになります"],
      answer: "いたします",
      explanation: "ご案内いたします는 자신의 안내 행위를 낮추는 겸양 표현이다.",
    },
  },
  {
    respectful: {
      context: "선생님이 질문에 답해 주셨습니다.",
      prompt: "「先生が質問に答えて（　　）。」에 알맞은 표현은?",
      choices: ["くださいました", "いただきました", "差し上げました", "申しました"],
      answer: "くださいました",
      explanation: "상대방이 나를 위해 한 행동은 ～てくださいました로 높인다.",
    },
    humble: {
      context: "선생님께 질문에 답해 주시도록 부탁드렸습니다.",
      prompt: "「先生に質問に答えて（　　）。」에 알맞은 표현은?",
      choices: ["いただきました", "くださいました", "差し上げました", "召し上がりました"],
      answer: "いただきました",
      explanation: "상대방에게 어떤 행동을 받아 혜택을 입었다는 뜻은 ～ていただく로 나타낸다.",
    },
  },
  {
    respectful: {
      context: "고객님이 신청서를 작성하십니다.",
      prompt: "「お客様が申込書をお書きに（　　）。」에 알맞은 표현은?",
      choices: ["なります", "します", "いたします", "おります"],
      answer: "なります",
      explanation: "お書きになる는 書く의 규칙적인 존경 표현이다.",
    },
    humble: {
      context: "제가 고객님의 성함을 적어 두겠습니다.",
      prompt: "「お名前をお書き（　　）。」에 알맞은 표현은?",
      choices: ["いたします", "になります", "くださいます", "いらっしゃいます"],
      answer: "いたします",
      explanation: "お書きいたします는 자신의 쓰는 행동을 낮춘 표현이다.",
    },
  },
];

const mappingQuestions: HonorificQuizSpec[] = mappingSpecs.map((spec) => ({
  context: `특별 경어 형태 확인 · ${spec.kind}`,
  prompt: `「${spec.standard}」의 ${spec.kind}로 가장 알맞은 것은?`,
  choices: [spec.answer, ...spec.distractors],
  answer: spec.answer,
  explanation:
    spec.note ??
    `「${spec.standard}」의 대표적인 ${spec.kind} 표현은 「${spec.answer}」이다.`,
}));

const contrastQuestions: HonorificQuizSpec[] = contrastSpecs.flatMap(
  (spec, index) => {
    const classificationTarget =
      index % 2 === 0 ? spec.respectful : spec.humble;
    const classificationAnswer =
      index % 2 === 0
        ? "상대방의 행동을 높이는 존경어"
        : "자신이나 자기 측의 행동을 낮추는 겸양어";

    return [
      {
        context: `${spec.respectfulSubject}의 ‘${spec.meaning}’ 행동을 표현합니다.`,
        prompt: `「${spec.standard}」를 존경어로 바르게 바꾼 것은?`,
        choices: [spec.respectful, spec.humble, spec.normal, "ございます"],
        answer: spec.respectful,
        explanation: `존경 대상의 행동이므로 「${spec.respectful}」를 쓴다.`,
      },
      {
        context: `${spec.humbleSubject}의 ‘${spec.meaning}’ 행동을 표현합니다.`,
        prompt: `「${spec.standard}」를 겸양어로 바르게 바꾼 것은?`,
        choices: [spec.humble, spec.respectful, spec.normal, "ございます"],
        answer: spec.humble,
        explanation: `자신이나 자기 측의 행동이므로 「${spec.humble}」로 낮춘다.`,
      },
      {
        context: "존경어와 겸양어의 방향을 구별합니다.",
        prompt: `「${classificationTarget}」의 역할로 알맞은 것은?`,
        choices: [
          classificationAnswer,
          index % 2 === 0
            ? "자신이나 자기 측의 행동을 낮추는 겸양어"
            : "상대방의 행동을 높이는 존경어",
          "친한 사이에서만 쓰는 반말",
          "과거의 완료를 나타내는 문법",
        ],
        answer: classificationAnswer,
        explanation:
          index % 2 === 0
            ? `「${classificationTarget}」는 존경 대상의 행동을 높이는 존경어이다.`
            : `「${classificationTarget}」는 자신이나 자기 측의 행동을 낮추는 겸양어이다.`,
      },
    ];
  },
);

const sentenceQuestions: HonorificQuizSpec[] = sentencePairs.flatMap((pair) => [
  pair.respectful,
  pair.humble,
]);

const additionalSpecs: HonorificQuizSpec[] = [
  ...mappingQuestions,
  ...contrastQuestions,
  ...sentenceQuestions,
];

const EXPECTED_ADDITIONAL_QUESTION_COUNT = 138;

if (additionalSpecs.length !== EXPECTED_ADDITIONAL_QUESTION_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_ADDITIONAL_QUESTION_COUNT} additional honorific questions, received ${additionalSpecs.length}.`,
  );
}

export const additionalHonorificQuizQuestions: HonorificQuizQuestion[] =
  additionalSpecs.map((spec, index) => ({
    ...spec,
    id: `honorific-${String(index + 13).padStart(3, "0")}`,
    choices: rotateChoices(spec.choices, index),
  }));

import type { GrammarItem } from "../../types/grammar";

export const n2Grammar: GrammarItem[] = [
  {
    "id": "n2-001",
    "no": 1,
    "noLabel": "1",
    "level": "N2",
    "expression": "あげく",
    "connection": "Vた+あげく / Nの+あげく",
    "meaningKo": "~한 끝에, 결국 ~하고 말았다",
    "nuanceKo": "오랜 고민·고생·논의 끝에 나온 결과. 보통 부정적 결과.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-050",
      "n2-059"
    ],
    "similarExpressionNames": [
      "すえ（に）"
    ],
    "warningKo": "부정적 결과에만 씀. 좋은 결과엔 すえに를 쓸 것.",
    "examples": [
      {
        "id": "n2-001-ex-1",
        "japanese": "太郎はお金のことや友人の問題でさんざん親に心配をかけたあげく、とうとう家を出てしまった。",
        "korean": "타로는 돈 문제와 친구 문제로 부모에게 실컷 걱정을 끼친 끝에, 결국 집을 나가 버렸다."
      },
      {
        "id": "n2-001-ex-2",
        "japanese": "この問題については、長時間にわたる議論のあげく、結論は先送りされた。",
        "korean": "이 문제는 장시간 논의 끝에 결론이 미뤄졌다."
      }
    ],
    "tags": [
      "結果",
      "悪い結果"
    ],
    "blankChoiceForms": [
      {
        "formId": "past-verb",
        "label": "Vた + あげく",
        "text": "したあげく",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "오랜 과정 뒤 부정적 결과"
      },
      {
        "formId": "noun-no",
        "label": "Nの + あげく",
        "text": "議論のあげく",
        "requiredContext": "명사 과정이 필요한 문장",
        "note": "논의·고민 끝의 부정적 결과"
      }
    ]
  },
  {
    "id": "n2-002",
    "no": 2,
    "noLabel": "2",
    "level": "N2",
    "expression": "あまり",
    "connection": "V普通形+あまり / いA+あまり / なAな+あまり / Nの+あまり",
    "meaningKo": "지나치게 ~해서, 너무 ~한 나머지",
    "nuanceKo": "감정·상태가 너무 강해서 평소와 다른 결과가 나옴.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-001",
      "n2-059"
    ],
    "similarExpressionNames": [
      "ばかりに"
    ],
    "warningKo": "あまり는 '지나침', ばかりに는 '그것 때문에 나쁜 결과'. 원인의 성격이 다름.",
    "examples": [
      {
        "id": "n2-002-ex-1",
        "japanese": "合格の知らせを聞いて、彼女はうれしさのあまり泣き出した。",
        "korean": "합격 소식을 듣고 그녀는 너무 기쁜 나머지 울음을 터뜨렸다."
      },
      {
        "id": "n2-002-ex-2",
        "japanese": "試験の問題は易しかったのに、考えすぎたあまり間違えてしまった。",
        "korean": "시험 문제는 쉬웠는데 지나치게 생각한 나머지 틀렸다."
      }
    ],
    "tags": [
      "原因",
      "程度",
      "結果"
    ],
    "blankChoiceForms": [
      {
        "formId": "dictionary-verb",
        "label": "V辞書形 + あまり",
        "text": "するあまり",
        "requiredContext": "앞에 동사 사전형 의미가 필요한 문장",
        "note": "지나친 감정·상태가 원인"
      },
      {
        "formId": "past-verb",
        "label": "Vた + あまり",
        "text": "したあまり",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "지나친 행위 뒤 예상 밖 결과"
      }
    ]
  },
  {
    "id": "n2-003",
    "no": 3,
    "noLabel": "3",
    "level": "N2",
    "expression": "以上（は）",
    "connection": "V普通形+以上（は） / Nである+以上（は）",
    "meaningKo": "~한 이상은, ~인 이상은",
    "nuanceKo": "앞 조건이 성립하므로 뒤의 책임·의무가 당연함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-007",
      "n2-028",
      "n2-059"
    ],
    "similarExpressionNames": [
      "上は",
      "からには"
    ],
    "warningKo": "以上は는 조건 강조, 上は는 각오·결심이 더 강함. 뒤에 의지·명령이 옴.",
    "examples": [
      {
        "id": "n2-003-ex-1",
        "japanese": "約束した以上、守るべきだと思う。",
        "korean": "약속한 이상 지켜야 한다고 생각한다."
      },
      {
        "id": "n2-003-ex-2",
        "japanese": "学生である以上、勉強を第一にしなさい。",
        "korean": "학생인 이상 공부를 최우선으로 하세요."
      }
    ],
    "tags": [
      "条件",
      "責任",
      "義務"
    ],
    "blankChoiceForms": [
      {
        "formId": "past-verb",
        "label": "Vた + 以上は",
        "text": "した以上は",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "책임·의무·각오 문맥"
      },
      {
        "formId": "noun-dearu",
        "label": "Nである + 以上は",
        "text": "学生である以上は",
        "requiredContext": "명사 조건 문맥",
        "note": "신분·입장에 따른 의무"
      }
    ]
  },
  {
    "id": "n2-004",
    "no": 4,
    "noLabel": "4",
    "level": "N2",
    "expression": "一方（で）",
    "connection": "V普通形+一方（で） / いA+一方（で）",
    "meaningKo": "~하는 한편으로, ~인 반면에",
    "nuanceKo": "서로 다른 두 측면을 대조.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "反面",
      "ながら"
    ],
    "warningKo": "一方で는 동일 주어에도, 다른 주어에도 쓸 수 있음. 반면 ながら는 역접.",
    "examples": [
      {
        "id": "n2-004-ex-1",
        "japanese": "いい親は厳しく叱る一方で、誉めることも忘れない。",
        "korean": "좋은 부모는 엄하게 꾸짖는 한편 칭찬도 잊지 않는다."
      },
      {
        "id": "n2-004-ex-2",
        "japanese": "一人暮らしは寂しさを感じることが多い一方、気楽なよさもある。",
        "korean": "혼자 사는 것은 외로움도 많지만 편한 장점도 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-005",
    "no": 5,
    "noLabel": "5",
    "level": "N2",
    "expression": "（た）上で",
    "connection": "Vた+上で / Nの+上で",
    "meaningKo": "~한 후에, ~한 다음에",
    "nuanceKo": "앞 행동을 완료한 뒤 그 결과를 바탕으로 뒤 행동을 함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てから",
      "次第"
    ],
    "warningKo": "「た上で」는 '완료 후 판단', 単なる순서(てから)와 달리 결과를 바탕으로 하는 뉘앙스.",
    "examples": [
      {
        "id": "n2-005-ex-1",
        "japanese": "詳しいことはお目にかかった上で、説明いたします。",
        "korean": "자세한 것은 직접 뵌 후 설명드리겠습니다."
      },
      {
        "id": "n2-005-ex-2",
        "japanese": "どの大学を受験するか、両親との相談の上で、決めます。",
        "korean": "어느 대학을 볼지는 부모님과 상담한 후 정하겠습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-006",
    "no": 6,
    "noLabel": "6",
    "level": "N2",
    "expression": "上で",
    "connection": "V辞書形+上で / Nの+上で",
    "meaningKo": "~하는 데 있어서, ~함에 있어",
    "nuanceKo": "어떤 목적·행위에서 중요한 조건이나 관점을 말함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "において",
      "にあたって"
    ],
    "warningKo": "5번と6번 上で는 접속 형태가 다름. Vた+上で vs V辞書形+上で로 의미가 달라짐.",
    "examples": [
      {
        "id": "n2-006-ex-1",
        "japanese": "食料品の保存の上で、次のことに注意してください。",
        "korean": "식료품 보관에 있어서 다음 사항에 주의해 주세요."
      },
      {
        "id": "n2-006-ex-2",
        "japanese": "今度の企画を成功させる上で、ぜひ皆の協力が必要なのだ。",
        "korean": "이번 기획을 성공시키는 데 모두의 협력이 필요하다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-007",
    "no": 7,
    "noLabel": "7",
    "level": "N2",
    "expression": "上は",
    "connection": "V辞書形+上は / Vた+上は",
    "meaningKo": "~한 이상은",
    "nuanceKo": "결심·각오가 강함. 이렇게 된 이상 당연히 해야 한다.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [
      "n2-003",
      "n2-028"
    ],
    "similarExpressionNames": [
      "以上（は）",
      "からには"
    ],
    "warningKo": "上は는 문어적·격식체. 회화에서 以上は 선호.",
    "examples": [
      {
        "id": "n2-007-ex-1",
        "japanese": "親元を離れる上は、十分な覚悟をするべきだ。",
        "korean": "부모 곁을 떠나는 이상 충분한 각오를 해야 한다."
      },
      {
        "id": "n2-007-ex-2",
        "japanese": "実行する上は、十分な準備が必要だ。",
        "korean": "실행하는 이상 충분한 준비가 필요하다."
      }
    ],
    "tags": [
      "条件",
      "責任",
      "義務",
      "文語"
    ],
    "blankChoiceForms": [
      {
        "formId": "dictionary-verb",
        "label": "V辞書形 + 上は",
        "text": "する上は",
        "requiredContext": "앞에 동사 사전형 의미가 필요한 문장",
        "note": "각오·결심이 강한 문어체"
      },
      {
        "formId": "past-verb",
        "label": "Vた + 上は",
        "text": "した上は",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "이미 정한 이상 책임지는 문맥"
      }
    ]
  },
  {
    "id": "n2-008",
    "no": 8,
    "noLabel": "8",
    "level": "N2",
    "expression": "得る（うる）",
    "connection": "Vます形語幹+得る / Vます形語幹+得ない",
    "meaningKo": "~할 수 있다, ~할 가능성이 있다",
    "nuanceKo": "능력보다 가능성. 그런 일이 일어날 수도 있음.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ことができる"
    ],
    "warningKo": "「うる」=가능성, 「える」=활용형. あり得る가 아닌 ありうる(文語), ありえる(회화) 구분.",
    "examples": [
      {
        "id": "n2-008-ex-1",
        "japanese": "この事故はいつでも起こり得ることとして十分注意が必要だ。",
        "korean": "이 사고는 언제든 일어날 수 있는 일로 충분한 주의가 필요하다."
      },
      {
        "id": "n2-008-ex-2",
        "japanese": "彼が事件の現場にいたなんて、そんなことはあり得ない。",
        "korean": "그가 사건 현장에 있었다니 그런 일은 있을 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-009",
    "no": 9,
    "noLabel": "9",
    "level": "N2",
    "expression": "おそれがある",
    "connection": "V辞書形+おそれがある / Nの+おそれがある",
    "meaningKo": "~할 우려가 있다",
    "nuanceKo": "좋지 않은 가능성에 대한 경고. 공지·뉴스체.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "かもしれない",
      "かねない"
    ],
    "warningKo": "공식 문서·방송에서 씀. かねない는 비판적 가능성, おそれ는 중립적 경고.",
    "examples": [
      {
        "id": "n2-009-ex-1",
        "japanese": "この地震による津波のおそれはありません。",
        "korean": "이 지진으로 인한 쓰나미 우려는 없습니다."
      },
      {
        "id": "n2-009-ex-2",
        "japanese": "この薬は副作用のおそれがあるので、医者の指示に従って飲んでください。",
        "korean": "이 약은 부작용 우려가 있으니 의사의 지시에 따라 복용하세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-010",
    "no": 10,
    "noLabel": "10",
    "level": "N2",
    "expression": "折（に）",
    "connection": "V辞書形+折に / Vた+折に / Nの+折に",
    "meaningKo": "~할 때, ~하는 기회에",
    "nuanceKo": "정중하고 딱딱한 표현. 기회가 있을 때.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "際に",
      "機会があれば"
    ],
    "warningKo": "매우 딱딱한 경어 표현. 비즈니스 메일이나 편지에서 자주 등장.",
    "examples": [
      {
        "id": "n2-010-ex-1",
        "japanese": "このことは今度お目にかかった折に詳しくお話しいたします。",
        "korean": "이 일은 다음에 뵈었을 때 자세히 말씀드리겠습니다."
      },
      {
        "id": "n2-010-ex-2",
        "japanese": "先月北海道に行った折、偶然昔の友達に会った。",
        "korean": "지난달 홋카이도에 갔을 때 우연히 옛 친구를 만났다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-011",
    "no": 11,
    "noLabel": "11",
    "level": "N2",
    "expression": "甲斐があって",
    "connection": "Vた+甲斐があって / Nの+甲斐があって",
    "meaningKo": "~한 보람이 있어서",
    "nuanceKo": "노력·시간·돈을 들인 결과 좋은 성과가 나옴.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけあって"
    ],
    "warningKo": "甲斐がある는 '노력에 보람', だけあって는 '그만한 이유가 있어 납득'. 초점이 다름.",
    "examples": [
      {
        "id": "n2-011-ex-1",
        "japanese": "この子は教えたことはすぐ覚えるので、教えがいがある。",
        "korean": "이 아이는 가르친 것을 바로 외우므로 가르칠 보람이 있다."
      },
      {
        "id": "n2-011-ex-2",
        "japanese": "時間とお金を使って遠くまで来たかいもなく、名物の桜はほとんど散ってしまっていた。",
        "korean": "시간과 돈을 들여 멀리 왔지만 보람도 없이 벚꽃은 거의 져 있었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-012",
    "no": 12,
    "noLabel": "12",
    "level": "N2",
    "expression": "かぎり（は）",
    "connection": "V辞書形+かぎり / Vている+かぎり",
    "meaningKo": "~하는 한, ~인 한",
    "nuanceKo": "조건이 유지되는 동안 뒤 내용도 성립.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "間は",
      "ないかぎり"
    ],
    "warningKo": "「かぎり」는 조건 유지, 「間は」는 단순 기간. 의지 표현 여부로 구별.",
    "examples": [
      {
        "id": "n2-012-ex-1",
        "japanese": "小川氏がこの学校の校長でいるかぎり、校則は変えられないだろう。",
        "korean": "오가와 씨가 이 학교 교장으로 있는 한 교칙은 바뀌지 않을 것이다."
      },
      {
        "id": "n2-012-ex-2",
        "japanese": "体が丈夫なかぎり、思い切り社会活動をしたいものだ。",
        "korean": "몸이 건강한 한 마음껏 사회활동을 하고 싶다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-013",
    "no": 13,
    "noLabel": "13",
    "level": "N2",
    "expression": "かぎり（한계）",
    "connection": "V辞書形+かぎり / V可能形+かぎり",
    "meaningKo": "~할 수 있는 한, ~하는 한",
    "nuanceKo": "가능한 범위 내에서 최대한.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "できるだけ",
      "なるべく"
    ],
    "warningKo": "「力のかぎり」처럼 명사에도 붙음. 가능한 최대를 강조하는 의지적 표현.",
    "examples": [
      {
        "id": "n2-013-ex-1",
        "japanese": "さあ、いよいよ明日は入学試験だ。力のかぎり頑張ってみよう。",
        "korean": "자, 드디어 내일은 입학시험이다. 힘껏 노력해 보자."
      },
      {
        "id": "n2-013-ex-2",
        "japanese": "できるかぎりのことはいたしますから。",
        "korean": "가능한 한의 일은 하겠습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-014",
    "no": 14,
    "noLabel": "14",
    "level": "N2",
    "expression": "かぎりだ",
    "connection": "いA+かぎりだ / なAな+かぎりだ",
    "meaningKo": "너무 ~하다, ~하기 그지없다",
    "nuanceKo": "감정의 정도가 매우 큼. 문어적.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てたまらない",
      "てならない"
    ],
    "warningKo": "문어체 감탄. い형용사·な형용사에만 접속. 동사엔 쓸 수 없음.",
    "examples": [
      {
        "id": "n2-014-ex-1",
        "japanese": "明日彼が3年ぶりにアフリカから帰ってくる。うれしいかぎりだ。",
        "korean": "내일 그가 3년 만에 아프리카에서 돌아온다. 너무 기쁘다."
      },
      {
        "id": "n2-014-ex-2",
        "japanese": "この頃若い人ははっきりと自己主張する。うらやましいかぎりだ。",
        "korean": "요즘 젊은 사람들은 자기주장이 뚜렷하다. 부럽기 그지없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-015",
    "no": 15,
    "noLabel": "15",
    "level": "N2",
    "expression": "かぎりでは",
    "connection": "V辞書形+かぎりでは / Vた+かぎりでは",
    "meaningKo": "~의 한도 내에서는, ~하는 바로는",
    "nuanceKo": "자신이 알고 있거나 조사한 범위 안에서 판단.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "によると",
      "ところによると"
    ],
    "warningKo": "「かぎりでは」는 자신의 경험·조사 범위, 「によると」는 외부 정보 출처.",
    "examples": [
      {
        "id": "n2-015-ex-1",
        "japanese": "ちょっと話したかぎりでは、彼はいつもとまったくかわらないように思えた。",
        "korean": "잠깐 이야기해 본 바로는 그는 평소와 전혀 다르지 않아 보였다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-016",
    "no": 16,
    "noLabel": "16",
    "level": "N2",
    "expression": "かける",
    "connection": "Vます形語幹+かける",
    "meaningKo": "~하다가 말다, 막 ~하려고 하다",
    "nuanceKo": "동작이 시작되었지만 완료되지 않음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ところ（だった）",
      "かけ"
    ],
    "warningKo": "「かけの」로 명사 수식도 됨(食べかけのパン). 완료되지 않은 상태 강조.",
    "examples": [
      {
        "id": "n2-016-ex-1",
        "japanese": "母は夕食を作りかけて、長電話をしている。",
        "korean": "어머니는 저녁을 만들다 말고 긴 전화를 하고 있다."
      },
      {
        "id": "n2-016-ex-2",
        "japanese": "こんなところに食べかけのりんごを置いて、あの子はどこへ行ったのだろう。",
        "korean": "이런 곳에 먹다 만 사과를 두고 그 아이는 어디로 간 걸까."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-017",
    "no": 17,
    "noLabel": "17",
    "level": "N2",
    "expression": "がたい",
    "connection": "Vます形語幹+がたい",
    "meaningKo": "~하기 어렵다, ~할 수 없다",
    "nuanceKo": "심리적·도덕적·감정적으로 하기 어려움. 딱딱한 표현.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にくい",
      "づらい"
    ],
    "warningKo": "がたい는 심리적·도덕적 불가, にくい는 물리적 어려움. 「信じがたい」◎, 「信じにくい」△.",
    "examples": [
      {
        "id": "n2-017-ex-1",
        "japanese": "あの元気な太郎が病気になるなんて信じがたいことです。",
        "korean": "그 건강한 타로가 병에 걸리다니 믿기 어려운 일입니다."
      },
      {
        "id": "n2-017-ex-2",
        "japanese": "弱い者をいじめるとは許しがたい行為だ。",
        "korean": "약자를 괴롭히다니 용서하기 어려운 행위다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-018",
    "no": 18,
    "noLabel": "18",
    "level": "N2",
    "expression": "が~だけに",
    "connection": "NがNだけに / 普通形+だけに",
    "meaningKo": "~가 ~인 만큼",
    "nuanceKo": "앞의 성질·상황 때문에 뒤 결과가 더 강하게 느껴짐.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけに"
    ],
    "warningKo": "「歳が歳だけに」처럼 동일 명사 반복 패턴. 주로 나이·지위 등 상황 강조에 씀.",
    "examples": [
      {
        "id": "n2-018-ex-1",
        "japanese": "母は今年93歳になった。今は元気だが、歳が歳だけに、病気をすると心配だ。",
        "korean": "어머니는 올해 93세다. 지금은 건강하지만 나이가 나이인 만큼 병에 걸리면 걱정된다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-019",
    "no": 19,
    "noLabel": "19",
    "level": "N2",
    "expression": "がち",
    "connection": "Vます形語幹+がち / N+がち",
    "meaningKo": "자주 ~하다, ~하기 쉽다",
    "nuanceKo": "좋지 않은 경향이 자주 나타남.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "っぽい",
      "やすい"
    ],
    "warningKo": "がち는 나쁜 경향, やすい는 중립적 경향. 「病気がち」는 O, 「成功がち」는 X.",
    "examples": [
      {
        "id": "n2-019-ex-1",
        "japanese": "田中さんは留守がちだから、電話してもいないことが多い。",
        "korean": "다나카 씨는 집을 자주 비워서 전화해도 없는 일이 많다."
      },
      {
        "id": "n2-019-ex-2",
        "japanese": "環境破壊の問題は自分の目に迫ってこないと、無関心になりがちである。",
        "korean": "환경 파괴 문제는 눈앞에 닥치지 않으면 무관심해지기 쉽다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-020",
    "no": 20,
    "noLabel": "20",
    "level": "N2",
    "expression": "（か）と思うと",
    "connection": "Vた+かと思うと / V辞書形+かと思うと",
    "meaningKo": "~했다고 생각한 순간, ~하자마자",
    "nuanceKo": "앞 동작 직후 바로 뒤 동작이 일어남. 빠른 변화에 놀람.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たとたん",
      "か~ないかのうちに"
    ],
    "warningKo": "話者の놀람이 포함됨. たとたん보다 더 시간 간격이 짧음.",
    "examples": [
      {
        "id": "n2-020-ex-1",
        "japanese": "あの子はやっと勉強を始めたと思ったら、もう居眠りをしている。",
        "korean": "그 아이는 겨우 공부를 시작했다 싶더니 벌써 졸고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-021",
    "no": 21,
    "noLabel": "21",
    "level": "N2",
    "expression": "か~ないかのうちに",
    "connection": "V辞書形+か+Vない形+ないかのうちに",
    "meaningKo": "~하자마자, 채 ~되기도 전에",
    "nuanceKo": "거의 동시에 일어나는 빠른 변화.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たとたん",
      "やいなや"
    ],
    "warningKo": "「鳴ったか鳴らないかのうちに」처럼 동사를 반복. 거의 동시 발생 강조.",
    "examples": [
      {
        "id": "n2-021-ex-1",
        "japanese": "彼はいつも終了のベルが鳴ったか鳴らないかのうちに、教室を飛び出していく。",
        "korean": "그는 항상 종료 벨이 울리자마자 교실을 뛰쳐나간다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-022",
    "no": 22,
    "noLabel": "22",
    "level": "N2",
    "expression": "かねない",
    "connection": "Vます形語幹+かねない",
    "meaningKo": "~할 수도 있다, ~하게 될 수도 있다",
    "nuanceKo": "나쁜 결과가 생길 가능성.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "かもしれない",
      "おそれがある"
    ],
    "warningKo": "화자가 나쁜 결과를 경고할 때 씀. 주어는 제3자의 행동인 경우가 많음.",
    "examples": [
      {
        "id": "n2-022-ex-1",
        "japanese": "そんな乱暴な運転をしたら事故を起こしかねないよ。",
        "korean": "그렇게 난폭하게 운전하면 사고를 낼 수도 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-023",
    "no": 23,
    "noLabel": "23",
    "level": "N2",
    "expression": "かねる",
    "connection": "Vます形語幹+かねる",
    "meaningKo": "~하기 어렵다, ~할 수 없다",
    "nuanceKo": "정중하게 거절하거나 곤란함을 표현.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にくい",
      "がたい"
    ],
    "warningKo": "완곡한 거절·사양. 비즈니스 일본어에서 매우 자주 등장. 「しかねます」형태로 자주 씀.",
    "examples": [
      {
        "id": "n2-023-ex-1",
        "japanese": "ただ今のご説明では、私どもとしては納得しかねます。",
        "korean": "지금 설명만으로는 저희로서는 납득하기 어렵습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-024",
    "no": 24,
    "noLabel": "24",
    "level": "N2",
    "expression": "かのように",
    "connection": "普通形+かのように / Nである+かのように",
    "meaningKo": "~인 것처럼",
    "nuanceKo": "실제는 아니지만 그렇게 보임.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ように",
      "らしい"
    ],
    "warningKo": "실제는 아닌 가상 상황을 표현. 「まるで～かのように」형태가 전형적.",
    "examples": [
      {
        "id": "n2-024-ex-1",
        "japanese": "4月になって雪が降るなんて、まるで冬が戻ってきたかのようです。",
        "korean": "4월에 눈이 오다니 마치 겨울이 돌아온 것 같다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-025",
    "no": 25,
    "noLabel": "25",
    "level": "N2",
    "expression": "からいうと",
    "connection": "N+からいうと",
    "meaningKo": "~만 본다면, ~를 생각하면",
    "nuanceKo": "특정 관점에서 판단.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からして",
      "からすると"
    ],
    "warningKo": "「からいうと」는 관점 제시, 「からすると」는 특정 입장에서의 판단. 미묘하게 다름.",
    "examples": [
      {
        "id": "n2-025-ex-1",
        "japanese": "教師の私の立場からいうと、試験はあまり多くない方がいいのです。",
        "korean": "교사인 제 입장에서 보면 시험은 너무 많지 않은 편이 좋습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-026",
    "no": 26,
    "noLabel": "26",
    "level": "N2",
    "expression": "からして",
    "connection": "N+からして",
    "meaningKo": "우선 ~부터",
    "nuanceKo": "대표 예시 하나만 봐도 전체가 그렇다는 느낌.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からいうと",
      "からみると"
    ],
    "warningKo": "예시 하나로 전체를 대표. 비판적 뉘앙스가 강함. 「名前からしておかしい」처럼 씀.",
    "examples": [
      {
        "id": "n2-026-ex-1",
        "japanese": "この職場には時間を守らない人が多い。係長からしてよく遅刻する。",
        "korean": "이 직장에는 시간을 안 지키는 사람이 많다. 계장부터 자주 지각한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-027",
    "no": 27,
    "noLabel": "27",
    "level": "N2",
    "expression": "からすると",
    "connection": "N+からすると",
    "meaningKo": "~입장에서 본다면",
    "nuanceKo": "어떤 입장·관점에서 판단.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からいうと",
      "にしたら"
    ],
    "warningKo": "「からすると」와 「にしたら」는 거의 같은 의미. にしたら는 특정 인물에 한정.",
    "examples": [
      {
        "id": "n2-027-ex-1",
        "japanese": "米を作る農家からすると、涼しい夏はあまりありがたくないことだ。",
        "korean": "쌀 농가 입장에서 보면 서늘한 여름은 별로 달갑지 않다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-028",
    "no": 28,
    "noLabel": "28",
    "level": "N2",
    "expression": "からといって",
    "connection": "普通形+からといって",
    "meaningKo": "~라고 해서",
    "nuanceKo": "앞 이유만으로 뒤 결론이 반드시 성립하지 않음.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-003",
      "n2-054",
      "n2-059"
    ],
    "similarExpressionNames": [
      "からには",
      "ので"
    ],
    "warningKo": "「からといって」뒤에는 반드시 부정·제한 표현이 옴. 「とは限らない」「わけではない」와 짝.",
    "examples": [
      {
        "id": "n2-028-ex-1",
        "japanese": "アメリカに住んでいたからといって、英語がうまいとは限らない。",
        "korean": "미국에 살았다고 해서 영어를 잘한다고는 할 수 없다."
      }
    ],
    "tags": [
      "理由",
      "否定",
      "制限"
    ],
    "blankChoiceForms": [
      {
        "formId": "plain-form",
        "label": "普通形 + からといって",
        "text": "からといって",
        "requiredContext": "앞말이 보통형으로 이미 끝난 문장",
        "note": "뒤에 부정·제한 표현이 옴"
      },
      {
        "formId": "past-verb",
        "label": "Vた + からといって",
        "text": "したからといって",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "그 이유만으로는 성립하지 않음"
      }
    ]
  },
  {
    "id": "n2-029",
    "no": 29,
    "noLabel": "29",
    "level": "N2",
    "expression": "気味",
    "connection": "Vます形語幹+気味 / N+気味",
    "meaningKo": "왠지 ~한 느낌, 약간 ~기미",
    "nuanceKo": "좋지 않은 상태가 약간 있음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "がち",
      "っぽい"
    ],
    "warningKo": "부정적 경향 소량. 「疲れ気味」처럼 상태 명사나 Vます형에 붙음. 「嬉しい気味」는 X.",
    "examples": [
      {
        "id": "n2-029-ex-1",
        "japanese": "今日はちょっと風邪気味なので、早めに帰らせてください。",
        "korean": "오늘은 조금 감기 기운이 있어서 일찍 돌아가게 해 주세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-030",
    "no": 30,
    "noLabel": "30",
    "level": "N2",
    "expression": "きらいがある",
    "connection": "V辞書形+きらいがある / Nの+きらいがある",
    "meaningKo": "~하는 경향이 있다",
    "nuanceKo": "바람직하지 않은 경향을 지적.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "がち",
      "傾向がある"
    ],
    "warningKo": "문어적·지적 표현. 주로 비판적 평가에서 씀. 회화에서는 거의 안 씀.",
    "examples": [
      {
        "id": "n2-030-ex-1",
        "japanese": "あの人の話はいつも大げさになるきらいがある。",
        "korean": "저 사람 이야기는 항상 과장되는 경향이 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-031",
    "no": 31,
    "noLabel": "31",
    "level": "N2",
    "expression": "きり",
    "connection": "Vた+きり / N+きり",
    "meaningKo": "~인 채, ~한 채",
    "nuanceKo": "그 뒤로 상태가 계속됨. 기대한 변화가 없음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "まま",
      "っぱなし"
    ],
    "warningKo": "「会ったきり」= 그 후 연락 없음. まま는 단순 상태 유지, きり는 변화 없음을 한탄.",
    "examples": [
      {
        "id": "n2-031-ex-1",
        "japanese": "彼女には去年一度会ったきりです。",
        "korean": "그녀와는 작년에 한 번 만난 것이 전부입니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-032",
    "no": 32,
    "noLabel": "32",
    "level": "N2",
    "expression": "きる/きれる/きれない",
    "connection": "Vます形語幹+きる/きれる/きれない",
    "meaningKo": "완전히 ~하다 / 다 ~할 수 없다",
    "nuanceKo": "끝까지 완료하거나 한계까지 도달.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "しまう",
      "抜く"
    ],
    "warningKo": "「きれない」는 한계 초과. 「信じきれない」처럼 심리 동사에도 씀.",
    "examples": [
      {
        "id": "n2-032-ex-1",
        "japanese": "5冊まである長い小説を夏休み中に全部読みきった。",
        "korean": "5권짜리 긴 소설을 여름방학 중에 전부 다 읽었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-033",
    "no": 33,
    "noLabel": "33",
    "level": "N2",
    "expression": "くせに",
    "connection": "普通形+くせに / Nの+くせに",
    "meaningKo": "~인 주제에, ~이면서",
    "nuanceKo": "비난·불만. 상대를 깎아내리는 느낌.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "のに",
      "ながら"
    ],
    "warningKo": "비난·불만의 감정 포함. 중립적 역접 のに와 달리 화자 감정이 강함. 격식체에선 X.",
    "examples": [
      {
        "id": "n2-033-ex-1",
        "japanese": "今度入社した人は、新人のくせに挨拶もしない。",
        "korean": "이번에 입사한 사람은 신입 주제에 인사도 하지 않는다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-034",
    "no": 34,
    "noLabel": "34",
    "level": "N2",
    "expression": "くらいなら",
    "connection": "V辞書形+くらいなら",
    "meaningKo": "~정도라면, 차라리 ~겠다",
    "nuanceKo": "앞 상황보다 뒤 선택이 낫다는 비교.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "より～ほうがいい",
      "ものなら"
    ],
    "warningKo": "「死ぬくらいなら」같은 극단 비교도 가능. 뒤에는 화자가 선호하는 대안이 옴.",
    "examples": [
      {
        "id": "n2-034-ex-1",
        "japanese": "自由がなくなるくらいなら、一生独身でいる方がいい。",
        "korean": "자유가 없어질 정도라면 평생 독신으로 있는 편이 낫다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-035",
    "no": 35,
    "noLabel": "35",
    "level": "N2",
    "expression": "げ",
    "connection": "いA語幹+げ / なA語幹+げ",
    "meaningKo": "~인 듯한, ~인 듯이",
    "nuanceKo": "겉으로 보이는 분위기·기색.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "そう",
      "らしい"
    ],
    "warningKo": "「悲しげ」처럼 형용사 어간에 붙어 외관 기색을 나타냄. 「悲しそう」는 더 직접적 추측.",
    "examples": [
      {
        "id": "n2-035-ex-1",
        "japanese": "会議の後、彼はいかにも不満ありげな顔をしている。",
        "korean": "회의 후 그는 정말 불만 있는 듯한 표정을 하고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-036",
    "no": 36,
    "noLabel": "36",
    "level": "N2",
    "expression": "ことか",
    "connection": "普通形+ことか",
    "meaningKo": "얼마나 ~했는지",
    "nuanceKo": "감탄·강한 감정.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ことだろう",
      "ものか"
    ],
    "warningKo": "「なんと～ことか」형태가 전형. 문어적 감탄. 의문문처럼 보이지만 감탄임.",
    "examples": [
      {
        "id": "n2-036-ex-1",
        "japanese": "1点差で優勝を逃したとは、なんと残念なことか。",
        "korean": "1점 차로 우승을 놓치다니 얼마나 아쉬운 일인가."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-037",
    "no": 37,
    "noLabel": "37",
    "level": "N2",
    "expression": "ことだ（감탄）",
    "connection": "いA+ことだ / なAな+ことだ",
    "meaningKo": "정말 ~하다",
    "nuanceKo": "감탄.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ものだ",
      "ことか"
    ],
    "warningKo": "形容詞에만 붙는 감탄 용법. 동사엔 붙을 수 없음.",
    "examples": [
      {
        "id": "n2-037-ex-1",
        "japanese": "ここで遊んだのは、もう30年も前のことだ。懐かしいことだ。",
        "korean": "여기서 놀았던 것은 벌써 30년 전 일이다. 정말 그립다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-038",
    "no": 38,
    "noLabel": "38",
    "level": "N2",
    "expression": "ことだ（충고）",
    "connection": "V辞書形+ことだ / Vない形+ことだ",
    "meaningKo": "~해야 한다",
    "nuanceKo": "조언·충고. 명령보다 부드럽지만 단정적.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "べきだ",
      "ものだ"
    ],
    "warningKo": "「～ことだ」는 부드러운 충고. べきだ보다 위압감이 낮음. 동사 기본형·ない형에 접속.",
    "examples": [
      {
        "id": "n2-038-ex-1",
        "japanese": "上級の読解力をつけたいのなら、毎日、新聞を読むことだ。",
        "korean": "고급 독해력을 기르고 싶다면 매일 신문을 읽는 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-039",
    "no": 39,
    "noLabel": "39",
    "level": "N2",
    "expression": "ことだし",
    "connection": "普通形+ことだし",
    "meaningKo": "~하고 있고, ~하기도 하고",
    "nuanceKo": "이유 중 하나를 들어 판단을 제안.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "し",
      "ので"
    ],
    "warningKo": "회화체. 여러 이유 중 하나를 들어 제안. し와 달리 「ことだし」만으로도 결론 도출 가능.",
    "examples": [
      {
        "id": "n2-039-ex-1",
        "japanese": "雨も降っていることだし、4時になったからそろそろ終わりにしましょう。",
        "korean": "비도 오고 있고 4시도 되었으니 슬슬 끝냅시다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-040",
    "no": 40,
    "noLabel": "40",
    "level": "N2",
    "expression": "ことだろう",
    "connection": "普通形+ことだろう",
    "meaningKo": "얼마나 ~한 것인가",
    "nuanceKo": "감탄·추측. 문어적.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ことか",
      "ものだ"
    ],
    "warningKo": "문어적 감탄 추측. ことか보다 감탄의 강도가 약간 낮음. 詩·수필에 자주 등장.",
    "examples": [
      {
        "id": "n2-040-ex-1",
        "japanese": "気の合った友だちと酒を飲みながら話すのはなんて楽しいことだろう。",
        "korean": "마음 맞는 친구와 술을 마시며 이야기하는 것은 얼마나 즐거운 일인가."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-041",
    "no": 41,
    "noLabel": "41",
    "level": "N2",
    "expression": "こととなると",
    "connection": "N+のこととなると",
    "meaningKo": "~가 화제가 되면, ~소리만 들으면",
    "nuanceKo": "특정 화제에는 태도가 달라짐.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "となると",
      "というと"
    ],
    "warningKo": "특정 화제에 갑자기 열정을 보이는 패턴. 주로 취미·전문 분야에 씀.",
    "examples": [
      {
        "id": "n2-041-ex-1",
        "japanese": "山川さんは釣りのこととなると目が輝く。",
        "korean": "야마카와 씨는 낚시 얘기만 나오면 눈이 빛난다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-042",
    "no": 42,
    "noLabel": "42",
    "level": "N2",
    "expression": "ことなく",
    "connection": "V辞書形+ことなく",
    "meaningKo": "~하지 않고",
    "nuanceKo": "딱딱한 문어체. ないで와 비슷.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないで",
      "ずに"
    ],
    "warningKo": "문어체. 「ないで」를 격식 표현으로 바꾼 것. 신문·문학에서 자주 등장.",
    "examples": [
      {
        "id": "n2-042-ex-1",
        "japanese": "彼は生活のため、休日も休むことなく働いた。",
        "korean": "그는 생활을 위해 휴일에도 쉬지 않고 일했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-043",
    "no": 43,
    "noLabel": "43",
    "level": "N2",
    "expression": "ことに（は）",
    "connection": "感情形容詞+ことに（は）",
    "meaningKo": "~할 일은, ~한 것은",
    "nuanceKo": "감정을 먼저 제시하고 뒤에 이유를 말함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ことに"
    ],
    "warningKo": "감정 형용사(うれしい, 悲しい, 驚いた 등)에만 씀. 뒤 문장에 그 이유가 옴.",
    "examples": [
      {
        "id": "n2-043-ex-1",
        "japanese": "うれしいことに、来年カナダに留学できそうだ。",
        "korean": "기쁘게도 내년에 캐나다에 유학할 수 있을 것 같다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-044",
    "no": 44,
    "noLabel": "44",
    "level": "N2",
    "expression": "際（に）",
    "connection": "V辞書形+際に / Vた+際に / Nの+際に",
    "meaningKo": "~일 때는, ~때",
    "nuanceKo": "공식적·정중한 '때'.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "とき",
      "折に",
      "にあたって"
    ],
    "warningKo": "공식적·정중한 표현. 「非常の際」처럼 공고·안내문에 자주 쓰임.",
    "examples": [
      {
        "id": "n2-044-ex-1",
        "japanese": "非常の際はエレベーターを使わずに、階段をご利用ください。",
        "korean": "비상시에는 엘리베이터를 쓰지 말고 계단을 이용해 주세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-045",
    "no": 45,
    "noLabel": "45",
    "level": "N2",
    "expression": "最中（に）",
    "connection": "Vている+最中に / Nの+最中に",
    "meaningKo": "~하는 중에",
    "nuanceKo": "한창 진행 중인 바로 그때.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ているところに",
      "ながら"
    ],
    "warningKo": "「最中に」는 한창 진행 중을 강조. 「ているところに」보다 더 강조적.",
    "examples": [
      {
        "id": "n2-045-ex-1",
        "japanese": "新入社員の小林さんは、会議の最中に居眠りをした。",
        "korean": "신입사원 고바야시 씨는 회의 중에 졸았다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-046",
    "no": 46,
    "noLabel": "46",
    "level": "N2",
    "expression": "ざるを得ない",
    "connection": "Vない形語幹+ざるを得ない / する→せざるを得ない",
    "meaningKo": "~할 수밖에 없다, ~해야 한다",
    "nuanceKo": "다른 선택지가 없어 마지못해 함.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "しかない",
      "わけにはいかない"
    ],
    "warningKo": "「する」만 例外的으로 「せざるを得ない」. 가장 빈출 오류 포인트. ない형에서 ない를 뺀 형태.",
    "examples": [
      {
        "id": "n2-046-ex-1",
        "japanese": "会社が倒産したのは社長に責任があるとは言わざるを得ない。",
        "korean": "회사가 도산한 것은 사장에게 책임이 있다고 말할 수밖에 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-047",
    "no": 47,
    "noLabel": "47",
    "level": "N2",
    "expression": "次第",
    "connection": "Vます形語幹+次第",
    "meaningKo": "~되는 대로, ~하는 즉시",
    "nuanceKo": "앞 일이 완료되면 바로 뒤 행동.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たら",
      "てから"
    ],
    "warningKo": "「連絡があり次第」처럼 즉시성 강조. Vます형에 붙고, たら와 달리 완료 즉시 행동.",
    "examples": [
      {
        "id": "n2-047-ex-1",
        "japanese": "向こうから連絡があり次第、出発しましょう。",
        "korean": "저쪽에서 연락이 오는 대로 출발합시다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-048",
    "no": 48,
    "noLabel": "48",
    "level": "N2",
    "expression": "次第だ",
    "connection": "普通形+次第だ",
    "meaningKo": "~입니다, ~인 까닭에",
    "nuanceKo": "사정·경위를 정중히 설명.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "わけだ",
      "のだ"
    ],
    "warningKo": "경위·사정 설명. 비즈니스 메일에서 자주 쓰임. 뒤에 です/ます가 항상 따라옴.",
    "examples": [
      {
        "id": "n2-048-ex-1",
        "japanese": "部長から帰れという連絡が入りまして、急いで帰ってきた次第です。",
        "korean": "부장님에게서 돌아오라는 연락이 와서 급히 돌아온 것입니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-049",
    "no": 49,
    "noLabel": "49",
    "level": "N2",
    "expression": "次第で/次第では",
    "connection": "N+次第で / N+次第では",
    "meaningKo": "~에 따라서, ~에 달렸다",
    "nuanceKo": "결과가 조건에 의해 달라짐.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "によって",
      "に応じて"
    ],
    "warningKo": "「結果次第で」처럼 N+次第で. 결과가 완전히 조건에 달려있다는 뉘앙스 강조.",
    "examples": [
      {
        "id": "n2-049-ex-1",
        "japanese": "私はその日の天気次第で、1日の行動の予定を決めます。",
        "korean": "저는 그날 날씨에 따라 하루 일정을 정합니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-050",
    "no": 50,
    "noLabel": "50",
    "level": "N2",
    "expression": "すえ（に）",
    "connection": "Vた+すえに / Nの+すえに",
    "meaningKo": "~한 끝에",
    "nuanceKo": "오랜 과정 끝의 결론. あげく보다 중립적.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-001",
      "n2-059"
    ],
    "similarExpressionNames": [
      "あげく",
      "結果"
    ],
    "warningKo": "すえに는 중립~긍정 결과도 가능. あげく는 부정 결과에 한정. 핵심 차이점.",
    "examples": [
      {
        "id": "n2-050-ex-1",
        "japanese": "帰国するというのは、さんざん迷った末に出した結論です。",
        "korean": "귀국한다는 것은 한참 고민한 끝에 내린 결론입니다."
      }
    ],
    "tags": [
      "結果"
    ],
    "blankChoiceForms": [
      {
        "formId": "past-verb",
        "label": "Vた + 末に",
        "text": "した末に",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "오랜 과정 끝의 중립적 결과"
      },
      {
        "formId": "noun-no",
        "label": "Nの + 末に",
        "text": "議論の末に",
        "requiredContext": "명사 과정이 필요한 문장",
        "note": "논의·고민 끝의 결론"
      }
    ]
  },
  {
    "id": "n2-051",
    "no": 51,
    "noLabel": "51",
    "level": "N2",
    "expression": "ずじまい",
    "connection": "Vない形語幹+ずじまい",
    "meaningKo": "~하지 못하고 끝났다",
    "nuanceKo": "하려고 했지만 결국 못함.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないまま",
      "ことができなかった"
    ],
    "warningKo": "하려다 결국 못 한 아쉬움. 「見ずじまい」처럼 ない형 어근에 붙음. する→せずじまい.",
    "examples": [
      {
        "id": "n2-051-ex-1",
        "japanese": "あの映画も終わってしまった。あんなに見たいと思っていたのに、とうとう見ずじまいだった。",
        "korean": "그 영화도 끝나 버렸다. 그렇게 보고 싶었는데 결국 못 봤다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-052",
    "no": 52,
    "noLabel": "52",
    "level": "N2",
    "expression": "ずにはいられない",
    "connection": "Vない形語幹+ずにはいられない",
    "meaningKo": "~하지 않고는 견딜 수 없다",
    "nuanceKo": "감정·충동을 억누를 수 없음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないではいられない",
      "てたまらない"
    ],
    "warningKo": "ずにはいられない는 문어적, ないではいられない는 구어적. 의미는 동일.",
    "examples": [
      {
        "id": "n2-052-ex-1",
        "japanese": "お腹が痛くて声を出さずにはいられなかった。",
        "korean": "배가 아파서 소리를 내지 않고는 견딜 수 없었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-053",
    "no": 53,
    "noLabel": "53",
    "level": "N2",
    "expression": "たいものだ",
    "connection": "Vます形語幹+たいものだ",
    "meaningKo": "정말 ~하고 싶다",
    "nuanceKo": "강한 소망. 약간 감상적.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ほしい",
      "てほしいものだ"
    ],
    "warningKo": "화자 자신의 소망. 「～てほしいものだ」는 타인에 대한 바람. 주어가 다름.",
    "examples": [
      {
        "id": "n2-053-ex-1",
        "japanese": "今年こそ海外旅行をしたいものだ。",
        "korean": "올해야말로 해외여행을 가고 싶다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-054",
    "no": 54,
    "noLabel": "54",
    "level": "N2",
    "expression": "だけあって",
    "connection": "普通形+だけあって / N+だけあって",
    "meaningKo": "~이었던 만큼, ~이었기 때문에",
    "nuanceKo": "그만한 이유가 있어 기대대로라는 긍정 평가.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-028",
      "n2-055"
    ],
    "similarExpressionNames": [
      "だけに",
      "だけのことはある"
    ],
    "warningKo": "긍정적 기대 충족. 「さすが～だけあって」형태가 전형. 비판엔 쓸 수 없음.",
    "examples": [
      {
        "id": "n2-054-ex-1",
        "japanese": "木村さんは10年も北京に住んでいただけあって、北京のことは何でも知っている。",
        "korean": "기무라 씨는 10년이나 베이징에 산 만큼 베이징에 대해 뭐든 안다."
      }
    ],
    "tags": [
      "理由",
      "評価",
      "肯定"
    ],
    "blankChoiceForms": [
      {
        "formId": "plain-form",
        "label": "普通形 + だけあって",
        "text": "だけあって",
        "requiredContext": "앞말이 보통형으로 이미 끝난 문장",
        "note": "기대에 맞는 긍정 평가"
      },
      {
        "formId": "past-verb",
        "label": "Vた + だけあって",
        "text": "しただけあって",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "그만한 이유가 있어 납득되는 결과"
      }
    ]
  },
  {
    "id": "n2-055",
    "no": 55,
    "noLabel": "55",
    "level": "N2",
    "expression": "だけに（긍정）",
    "connection": "普通形+だけに / N+だけに",
    "meaningKo": "~인 만큼, ~이기 때문에",
    "nuanceKo": "앞 사실 때문에 뒤가 더 당연하거나 강하게 느껴짐.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけあって",
      "からこそ"
    ],
    "warningKo": "だけに는 당연한 결과, からこそ는 역설적 강조. 뉘앙스가 미묘하게 다름.",
    "examples": [
      {
        "id": "n2-055-ex-1",
        "japanese": "辻さんは子供の時からイギリスで教育を受けただけに、きれいな英語を話す。",
        "korean": "츠지 씨는 어릴 때부터 영국에서 교육받은 만큼 깨끗한 영어를 한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-056",
    "no": 56,
    "noLabel": "56",
    "level": "N2",
    "expression": "だけに（역접）",
    "connection": "普通形+だけに / N+だけに",
    "meaningKo": "~때문에, ~이기에（역설적）",
    "nuanceKo": "예상과 반대 결과가 와서 더 아쉽거나 의외임.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "のに",
      "ばかりに"
    ],
    "warningKo": "같은 「だけに」지만 역접 용법은 아쉬움·실망을 표현. 문맥으로 구별 필요.",
    "examples": [
      {
        "id": "n2-056-ex-1",
        "japanese": "普段から体が丈夫なだけに、かえって癌の発見が遅れたのだそうだ。",
        "korean": "평소 몸이 건강했기 때문에 오히려 암 발견이 늦었다고 한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-057",
    "no": 57,
    "noLabel": "57",
    "level": "N2",
    "expression": "だけの",
    "connection": "V辞書形+だけの+N",
    "meaningKo": "~할 만한, ~할 만큼의",
    "nuanceKo": "그 정도의 가치·자격·이유가 있음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ほどの",
      "くらいの"
    ],
    "warningKo": "「だけの価値がある」처럼 가치·자격 판단에 씀. 뒤에 명사가 반드시 옴.",
    "examples": [
      {
        "id": "n2-057-ex-1",
        "japanese": "この本を買いたいが、5000円払うだけの価値があるだろうか。",
        "korean": "이 책을 사고 싶지만 5000엔을 낼 만한 가치가 있을까."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-058",
    "no": 58,
    "noLabel": "58",
    "level": "N2",
    "expression": "たところ",
    "connection": "Vた+ところ",
    "meaningKo": "~했더니, ~했는데",
    "nuanceKo": "어떤 행동 후 새로 알게 된 결과.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たら",
      "と（결과）"
    ],
    "warningKo": "「たところ」는 시도 후 발견. 과거 사실에만 씀. 미래 가정에는 쓸 수 없음.",
    "examples": [
      {
        "id": "n2-058-ex-1",
        "japanese": "昔住んでいた町を訪ねたところ、全く様子が変わっていて迷ってしまった。",
        "korean": "예전에 살던 동네를 찾아갔더니 완전히 모습이 바뀌어 길을 잃었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-059",
    "no": 59,
    "noLabel": "59",
    "level": "N2",
    "expression": "たところで",
    "connection": "Vた+ところで",
    "meaningKo": "~해봤자, ~한다고 해도",
    "nuanceKo": "해도 원하는 결과가 나오지 않음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-028",
      "n2-003",
      "n2-001"
    ],
    "similarExpressionNames": [
      "ても",
      "ものの"
    ],
    "warningKo": "「いくら～たところで」형태가 전형. 반드시 부정적 결론이 뒤에 옴.",
    "examples": [
      {
        "id": "n2-059-ex-1",
        "japanese": "いくら働いたところで、こう物価が高くては生活は楽にはならない。",
        "korean": "아무리 일해 봤자 이렇게 물가가 높아서는 생활이 편해지지 않는다."
      }
    ],
    "tags": [
      "仮定",
      "否定",
      "制限"
    ],
    "blankChoiceForms": [
      {
        "formId": "past-verb",
        "label": "Vた + ところで",
        "text": "したところで",
        "requiredContext": "앞에 동사 과거형 의미가 필요한 문장",
        "note": "해도 원하는 결과가 나오지 않는 문맥"
      }
    ]
  },
  {
    "id": "n2-060",
    "no": 60,
    "noLabel": "60",
    "level": "N2",
    "expression": "たとたん（に）",
    "connection": "Vた+とたんに",
    "meaningKo": "~하자마자, ~한 순간",
    "nuanceKo": "바로 뒤에 예상 밖 일이 발생.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "と同時に",
      "やいなや",
      "かと思うと"
    ],
    "warningKo": "主語가 바뀌어도 OK. 예상 밖 사건이 잇따를 때 씀. 의지 표현 뒤에는 X.",
    "examples": [
      {
        "id": "n2-060-ex-1",
        "japanese": "ずっと本を読んでいて急に立ち上がったとたん、めまいがしました。",
        "korean": "계속 책을 읽다가 갑자기 일어난 순간 어지러웠다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-061",
    "no": 61,
    "noLabel": "61",
    "level": "N2",
    "expression": "たび（に）",
    "connection": "V辞書形+たびに / Nの+たびに",
    "meaningKo": "~할 때마다",
    "nuanceKo": "매번 반복.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ごとに",
      "につけ"
    ],
    "warningKo": "「会うたびに」처럼 반복 상황에서 항상 같은 결과. ごとに는 규칙적 간격 강조.",
    "examples": [
      {
        "id": "n2-061-ex-1",
        "japanese": "あの人は会うたびにおもしろい話を聞かせてくれる。",
        "korean": "그 사람은 만날 때마다 재미있는 이야기를 들려준다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-062",
    "no": 62,
    "noLabel": "62",
    "level": "N2",
    "expression": "だらけ",
    "connection": "N+だらけ",
    "meaningKo": "~투성이",
    "nuanceKo": "좋지 않은 것이 많이 묻거나 가득함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "まみれ",
      "ばかり"
    ],
    "warningKo": "だらけ는 바람직하지 않은 것이 가득. まみれ는 표면에 묻음(진흙·피 등). 대상이 다름.",
    "examples": [
      {
        "id": "n2-062-ex-1",
        "japanese": "ケンカでもしたのか、彼は傷だらけになって帰ってきた。",
        "korean": "싸움이라도 했는지 그는 상처투성이가 되어 돌아왔다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-063",
    "no": 63,
    "noLabel": "63",
    "level": "N2",
    "expression": "っこない",
    "connection": "Vます形語幹+っこない",
    "meaningKo": "~할 리가 없다",
    "nuanceKo": "강한 부정. 회화적.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はずがない",
      "わけがない"
    ],
    "warningKo": "매우 구어적. 「わかりっこない」처럼 Vます형에 붙음. 격식체에선 절대 X.",
    "examples": [
      {
        "id": "n2-063-ex-1",
        "japanese": "こんな難しい本を買ってやったって、小学校1年生の太郎にはわかりっこない。",
        "korean": "이런 어려운 책을 사 줘 봤자 초등학교 1학년 타로에게는 알 리가 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-064",
    "no": 64,
    "noLabel": "64",
    "level": "N2",
    "expression": "つつ（역접）",
    "connection": "Vます形語幹+つつ",
    "meaningKo": "~하면서도",
    "nuanceKo": "알고 있지만 반대로 행동. 역접.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ながら（역접）",
      "のに"
    ],
    "warningKo": "つつ는 문어적, ながら는 구어적. 「知りつつ」는 의도적 역행이 더 강함.",
    "examples": [
      {
        "id": "n2-064-ex-1",
        "japanese": "悪いと知りつつ、友だちの宿題の答えを書いてそのまま出してしまった。",
        "korean": "나쁘다는 걸 알면서도 친구 숙제 답을 써서 그대로 제출했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-065",
    "no": 65,
    "noLabel": "65",
    "level": "N2",
    "expression": "つつ（동시）",
    "connection": "Vます形語幹+つつ",
    "meaningKo": "~하면서",
    "nuanceKo": "동시 진행. 문어적.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ながら（동시）",
      "て"
    ],
    "warningKo": "동시 동작. ながら는 주동작이 명확하지만 つつ는 양쪽이 동등한 느낌. 문어적.",
    "examples": [
      {
        "id": "n2-065-ex-1",
        "japanese": "山に登りつつ、人は人生についてさまざまなことを考える。",
        "korean": "산에 오르면서 사람은 인생에 대해 여러 가지를 생각한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-066",
    "no": 66,
    "noLabel": "66",
    "level": "N2",
    "expression": "つつある",
    "connection": "Vます形語幹+つつある",
    "meaningKo": "~하고 있는, 점점 ~해 가고 있다",
    "nuanceKo": "변화가 진행 중. 문어적.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ていく",
      "てくる"
    ],
    "warningKo": "진행 중인 변화를 문어적으로 표현. 신문·보고서에서 자주 등장. ていく는 더 구어적.",
    "examples": [
      {
        "id": "n2-066-ex-1",
        "japanese": "職場の環境は改善されつつある。",
        "korean": "직장 환경은 개선되고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-067",
    "no": 67,
    "noLabel": "67",
    "level": "N2",
    "expression": "っぱなし",
    "connection": "Vます形語幹+っぱなし",
    "meaningKo": "계속~한 상태, 계속~인 채",
    "nuanceKo": "방치된 상태. 보통 부정적.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "まま",
      "きり"
    ],
    "warningKo": "방치·방임의 불만. 「出しっぱなし」처럼 부정적 상태 유지. まま보다 감정적.",
    "examples": [
      {
        "id": "n2-067-ex-1",
        "japanese": "道具が出しっぱなしだよ。使ったら、片付けなさい。",
        "korean": "도구가 꺼낸 채로 있잖아. 썼으면 치워라."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-068",
    "no": 68,
    "noLabel": "68",
    "level": "N2",
    "expression": "っぽい",
    "connection": "N+っぽい / Vます形語幹+っぽい",
    "meaningKo": "~같은 느낌이 들다, 자주 그렇게 ~한다",
    "nuanceKo": "그런 성질이 강해 보임. 약간 부정적일 수 있음.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "らしい",
      "げ",
      "みたい"
    ],
    "warningKo": "「子供っぽい」처럼 부정적 뉘앙스 多. らしい는 긍정적 전형성. 구어체 표현.",
    "examples": [
      {
        "id": "n2-068-ex-1",
        "japanese": "君子はもう20歳なのに話すことが子供っぽい。",
        "korean": "기미코는 벌써 20살인데 말하는 것이 아이 같다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-069",
    "no": 69,
    "noLabel": "69",
    "level": "N2",
    "expression": "て以来",
    "connection": "Vて+以来 / N+以来",
    "meaningKo": "~한 이후, ~한 후",
    "nuanceKo": "어떤 시점부터 지금까지 계속.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てから",
      "以降"
    ],
    "warningKo": "「以来」는 지금도 계속되는 상태에 씀. 단순 순서 てから와 달리 현재까지의 지속 강조.",
    "examples": [
      {
        "id": "n2-069-ex-1",
        "japanese": "一人暮らしを始めて以来、ずっと外食が続いている。",
        "korean": "혼자 살기 시작한 이후 계속 외식이 이어지고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-070",
    "no": 70,
    "noLabel": "70",
    "level": "N2",
    "expression": "てこそ",
    "connection": "Vて+こそ",
    "meaningKo": "~해야 비로소",
    "nuanceKo": "앞 조건이 있어야 뒤 평가가 성립.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てはじめて",
      "からこそ"
    ],
    "warningKo": "「てこそ」는 조건 충족 후 비로소. 「てはじめて」도 유사하나 てこそ가 더 강조적.",
    "examples": [
      {
        "id": "n2-070-ex-1",
        "japanese": "試合に勝ってこそ、プロのスポーツ選手と言える。",
        "korean": "시합에서 이겨야 비로소 프로 스포츠 선수라고 할 수 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-071",
    "no": 71,
    "noLabel": "71",
    "level": "N2",
    "expression": "てたまらない",
    "connection": "Vて+たまらない / いAくて+たまらない",
    "meaningKo": "~해서 견딜 수 없다",
    "nuanceKo": "감정·감각이 너무 강함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てならない",
      "てしょうがない"
    ],
    "warningKo": "세 표현 모두 '견딜 수 없음'이지만: たまらない=생리적·충동적, ならない=자연스러운 감정, しょうがない=구어.",
    "examples": [
      {
        "id": "n2-071-ex-1",
        "japanese": "風邪薬を飲んだから、眠くてたまらない。",
        "korean": "감기약을 먹어서 졸려 견딜 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-072",
    "no": 72,
    "noLabel": "72",
    "level": "N2",
    "expression": "てでも",
    "connection": "Vて+でも",
    "meaningKo": "~해서라도",
    "nuanceKo": "수단을 가리지 않고 하겠다는 강한 의지.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "までして",
      "とも"
    ],
    "warningKo": "극단적 수단도 감수하겠다는 강한 의지. 부정적·무모한 상황에도 씀.",
    "examples": [
      {
        "id": "n2-072-ex-1",
        "japanese": "駆け落ちしてでも、私は彼女と結婚する。",
        "korean": "도망쳐서라도 나는 그녀와 결혼하겠다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-073",
    "no": 73,
    "noLabel": "73",
    "level": "N2",
    "expression": "てならない",
    "connection": "Vて+ならない / いAくて+ならない",
    "meaningKo": "~해서 견딜 수 없다（자연스러운 감정）",
    "nuanceKo": "감정이 자연스럽게 강하게 솟음.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てたまらない",
      "てしょうがない"
    ],
    "warningKo": "자연스럽게 솟아오르는 감정. 의지로 억제가 안 됨. 문어적. 「気になってならない」가 전형.",
    "examples": [
      {
        "id": "n2-073-ex-1",
        "japanese": "地球温暖化の問題を考えると、子供たちの将来のことが気になってならない。",
        "korean": "지구온난화 문제를 생각하면 아이들의 미래가 걱정되어 견딜 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-074",
    "no": 74,
    "noLabel": "74",
    "level": "N2",
    "expression": "てはかなわない",
    "connection": "Vて+はかなわない",
    "meaningKo": "~해서 견딜 수 없다（불만）",
    "nuanceKo": "피해·불편을 견디기 어렵다는 불만.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てたまらない",
      "ては困る"
    ],
    "warningKo": "피해·불편에 대한 불만·항의. 「こう～ては」형태와 자주 짝을 이룸.",
    "examples": [
      {
        "id": "n2-074-ex-1",
        "japanese": "課長にこう毎晩のように飲みに誘われてはかなわない。",
        "korean": "과장에게 이렇게 매일 밤처럼 술자리에 불리면 견딜 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-075",
    "no": 75,
    "noLabel": "75",
    "level": "N2",
    "expression": "ではないか（감동）",
    "connection": "普通形+ではないか",
    "meaningKo": "~는 것이 아닌가",
    "nuanceKo": "감동·확인·강한 판단.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "じゃないか",
      "ではありませんか"
    ],
    "warningKo": "발화자 자신의 발견·감탄. 「ではありませんか」는 더 정중. 의문이 아님에 주의.",
    "examples": [
      {
        "id": "n2-075-ex-1",
        "japanese": "この犬は私の喜びや悲しみをみんなわかってくれるではありませんか。",
        "korean": "이 개는 나의 기쁨과 슬픔을 모두 알아주지 않습니까."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-076",
    "no": 76,
    "noLabel": "76",
    "level": "N2",
    "expression": "ではないか（제안）",
    "connection": "普通形+ではないか",
    "meaningKo": "~이지 않느냐",
    "nuanceKo": "상대에게 판단을 촉구하거나 제안.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ようではないか",
      "たらどうか"
    ],
    "warningKo": "청자에게 사실을 인식시키고 행동을 촉구. 수사 의문문.",
    "examples": [
      {
        "id": "n2-076-ex-1",
        "japanese": "外は大雪じゃありませんか。こんな日に外出するのは危険ですよ。",
        "korean": "밖은 폭설이지 않습니까. 이런 날 외출하는 것은 위험합니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-077",
    "no": 77,
    "noLabel": "77",
    "level": "N2",
    "expression": "てほしいものだ",
    "connection": "Vて+ほしいものだ",
    "meaningKo": "~하길 바란다, ~해주었으면 좋겠다",
    "nuanceKo": "강한 바람·소망.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てほしい",
      "ものだ"
    ],
    "warningKo": "「ものだ」가 붙어 소망이 더 강해짐. 타인에 대한 기대·부탁. ものだ 단독보다 감정적.",
    "examples": [
      {
        "id": "n2-077-ex-1",
        "japanese": "災害がもうこれ以上ひどくならないでほしいものだ。",
        "korean": "재해가 더 이상 심해지지 않았으면 좋겠다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-078",
    "no": 78,
    "noLabel": "78",
    "level": "N2",
    "expression": "てもさしつかえない",
    "connection": "Vても+さしつかえない",
    "meaningKo": "~해도 괜찮다, ~해도 상관없다",
    "nuanceKo": "허가·문제없음. 정중한 표현.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てもいい",
      "てもかまわない"
    ],
    "warningKo": "가장 격식체. 비즈니스·공문서에서 허가를 정중하게 표현할 때 씀.",
    "examples": [
      {
        "id": "n2-078-ex-1",
        "japanese": "支払いは今すぐでなくてもさしつかえありません。後でもいいですよ。",
        "korean": "지불은 지금 당장이 아니어도 괜찮습니다. 나중이어도 됩니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-079",
    "no": 79,
    "noLabel": "79",
    "level": "N2",
    "expression": "というと",
    "connection": "N+というと",
    "meaningKo": "~라고 하면",
    "nuanceKo": "어떤 말에서 연상되는 대표 이미지.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "といえば",
      "といったら"
    ],
    "warningKo": "「というと」는 정의·연상, 「といえば」는 화제 전환, 「といったら」는 감탄 강조.",
    "examples": [
      {
        "id": "n2-079-ex-1",
        "japanese": "スイスというと何が思い浮かべますか。",
        "korean": "스위스라고 하면 무엇이 떠오릅니까."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-080",
    "no": 80,
    "noLabel": "80",
    "level": "N2",
    "expression": "というものだ",
    "connection": "普通形+というものだ",
    "meaningKo": "~라고 할 수밖에 없다",
    "nuanceKo": "화자의 평가·단정.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "わけだ",
      "というわけだ"
    ],
    "warningKo": "화자의 평가·단정. 약간 설교조. 「それというものだ」로도 씀.",
    "examples": [
      {
        "id": "n2-080-ex-1",
        "japanese": "あの議員は公費で夫人と私的な海外旅行をした。それは困ったというものだ。",
        "korean": "그 의원은 공금으로 부인과 사적 해외여행을 했다. 그것은 곤란한 일이라고 할 수밖에 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-081",
    "no": 81,
    "noLabel": "81",
    "level": "N2",
    "expression": "というものではない",
    "connection": "普通形+というものではない",
    "meaningKo": "항상 ~라고는 할 수 없다",
    "nuanceKo": "일반화·단순 판단을 부정.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "とは限らない",
      "わけではない"
    ],
    "warningKo": "일반론을 부정. 「とは限らない」는 예외 있음, 「というものではない」는 이치가 그렇지 않음.",
    "examples": [
      {
        "id": "n2-081-ex-1",
        "japanese": "まじめな人だから仕事ができるというものではない。",
        "korean": "성실한 사람이라고 해서 일을 잘한다고는 할 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-082",
    "no": 82,
    "noLabel": "82",
    "level": "N2",
    "expression": "というものは",
    "connection": "N+というものは",
    "meaningKo": "~라는 것은, ~라고 하는 것은",
    "nuanceKo": "어떤 대상의 본질·일반론을 말함.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "とは",
      "というのは"
    ],
    "warningKo": "대상의 본질을 일반론으로 논할 때 씀. 格言·경험담에 자주 등장.",
    "examples": [
      {
        "id": "n2-082-ex-1",
        "japanese": "ふるさとというものは遠く離れるといっそう懐かしくなる。",
        "korean": "고향이라는 것은 멀리 떨어지면 더욱 그리워진다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-083",
    "no": 83,
    "noLabel": "83",
    "level": "N2",
    "expression": "といえば",
    "connection": "N+といえば / 普通形+といえば",
    "meaningKo": "~라고 하면, ~라고 한다면",
    "nuanceKo": "화제 제시·연상.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "というと",
      "にしては"
    ],
    "warningKo": "화제 전환 또는 연상. 「そういえば」와 달리 「といえば」는 주제 명시.",
    "examples": [
      {
        "id": "n2-083-ex-1",
        "japanese": "幼児教育といえば、うちの近くに新しい幼稚園ができたんですよ。",
        "korean": "유아교육이라고 하면, 우리 집 근처에 새 유치원이 생겼어요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-084",
    "no": 84,
    "noLabel": "84",
    "level": "N2",
    "expression": "とか~といった",
    "connection": "N+とか+N+といった+N",
    "meaningKo": "~라는, ~라고 하는",
    "nuanceKo": "여러 예시를 들어 범주를 나타냄.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "など",
      "たり～たり"
    ],
    "warningKo": "예시 열거. 「といった」뒤에 반드시 명사가 옴. 「といった + N」형태.",
    "examples": [
      {
        "id": "n2-084-ex-1",
        "japanese": "駅とかレストランとかいった所では、全面禁煙が望ましい。",
        "korean": "역이나 레스토랑 같은 곳에서는 전면 금연이 바람직하다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-085",
    "no": 85,
    "noLabel": "85",
    "level": "N2",
    "expression": "といったら",
    "connection": "N+といったら",
    "meaningKo": "~은, ~는（강조·감탄）",
    "nuanceKo": "정도가 매우 큼. 감탄·강조.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "というと",
      "ったら"
    ],
    "warningKo": "감탄·강조의 구어체. 「暑さといったら！」처럼 단독으로도 씀.",
    "examples": [
      {
        "id": "n2-085-ex-1",
        "japanese": "この夏の暑さといったらひどかった。",
        "korean": "이번 여름 더위는 정말 심했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-086",
    "no": 86,
    "noLabel": "86",
    "level": "N2",
    "expression": "どころか",
    "connection": "普通形+どころか / N+どころか",
    "meaningKo": "~는커녕, ~는 고사하고",
    "nuanceKo": "예상과 정반대이거나 훨씬 심한 사실 제시.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はもとより",
      "のみならず"
    ],
    "warningKo": "예상 반전. 뒤에 더 심한 사실이 옴. 「楽しいどころか」= 즐겁기는커녕.",
    "examples": [
      {
        "id": "n2-086-ex-1",
        "japanese": "休日に子供連れで遊園地に出かけるのは、楽しいどころか苦しみ半分だ。",
        "korean": "휴일에 아이를 데리고 놀이공원에 가는 것은 즐겁기는커녕 반쯤 고역이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-087",
    "no": 87,
    "noLabel": "87",
    "level": "N2",
    "expression": "ところだった",
    "connection": "V辞書形+ところだった",
    "meaningKo": "~할 뻔했다",
    "nuanceKo": "거의 그렇게 될 상황이었지만 실제로는 피함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "かけた",
      "そうになった"
    ],
    "warningKo": "실제로는 일어나지 않은 아슬아슬한 상황. 과거 사실에만 씀.",
    "examples": [
      {
        "id": "n2-087-ex-1",
        "japanese": "誤解がもとで、危うく大切な親友を失うところだった。",
        "korean": "오해 때문에 하마터면 소중한 친구를 잃을 뻔했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-088",
    "no": 88,
    "noLabel": "88",
    "level": "N2",
    "expression": "ところではない",
    "connection": "V辞書形+ところではない / Nどころではない",
    "meaningKo": "~할 여유는 없다, ~하기는커녕",
    "nuanceKo": "상황이 바쁘거나 심각해서 할 수 없음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "どころか",
      "余裕がない"
    ],
    "warningKo": "「どころではない」=상황이 그럴 여유가 없음. 감탄사처럼도 씀.",
    "examples": [
      {
        "id": "n2-088-ex-1",
        "japanese": "当時はお金もなく、誕生日といっても祝うどころではなかった。",
        "korean": "당시에는 돈도 없어서 생일이라고 해도 축하할 여유가 없었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-089",
    "no": 89,
    "noLabel": "89",
    "level": "N2",
    "expression": "ところをみると",
    "connection": "普通形+ところをみると",
    "meaningKo": "~인 것을 보면",
    "nuanceKo": "관찰한 사실을 근거로 추측.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からみると",
      "ことから"
    ],
    "warningKo": "관찰 근거로 추측. 「ことから」는 이유 설명, 「ところをみると」는 추측에 초점.",
    "examples": [
      {
        "id": "n2-089-ex-1",
        "japanese": "部屋の電気がまだついているところをみると、森さんはまだ起きているようだ。",
        "korean": "방 불이 아직 켜져 있는 것을 보면 모리 씨는 아직 깨어 있는 듯하다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-090",
    "no": 90,
    "noLabel": "90",
    "level": "N2",
    "expression": "として~ない",
    "connection": "1+助数詞+として+ない",
    "meaningKo": "~도, ~조차도（완전 부정）",
    "nuanceKo": "완전 부정. 하나도 없음.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "すら",
      "さえ"
    ],
    "warningKo": "수 표현과 조합. 「1枚として残っていない」처럼 완전 부정. 문어적·강조 표현.",
    "examples": [
      {
        "id": "n2-090-ex-1",
        "japanese": "火事で焼けてしまったので、私の子供のころの写真は1枚として残っていない。",
        "korean": "화재로 타 버려서 내 어린 시절 사진은 한 장도 남아 있지 않다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-091",
    "no": 91,
    "noLabel": "91",
    "level": "N2",
    "expression": "とともに",
    "connection": "V辞書形+とともに / N+とともに",
    "meaningKo": "~와 함께, ~와 같이",
    "nuanceKo": "동시 변화 또는 함께함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に伴って",
      "と同時に"
    ],
    "warningKo": "「に伴って」는 변화 수반, 「とともに」는 동시성·동행 모두 가능. 더 넓은 용법.",
    "examples": [
      {
        "id": "n2-091-ex-1",
        "japanese": "秋の深まりとともに今年も柿がおいしくなってきた。",
        "korean": "가을이 깊어짐과 함께 올해도 감이 맛있어졌다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-092",
    "no": 92,
    "noLabel": "92",
    "level": "N2",
    "expression": "とは",
    "connection": "N+とは / 普通形+とは",
    "meaningKo": "~라는 것은, ~은, ~는",
    "nuanceKo": "정의·설명·화제 제시.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "というのは",
      "とは何か"
    ],
    "warningKo": "정의 제시 또는 강한 감탄. 「雪が降るとは！」처럼 놀람에도 씀.",
    "examples": [
      {
        "id": "n2-092-ex-1",
        "japanese": "赤字とは収入より支出が多いことです。",
        "korean": "적자란 수입보다 지출이 많은 것입니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-093",
    "no": 93,
    "noLabel": "93",
    "level": "N2",
    "expression": "とはいうものの",
    "connection": "普通形+とはいうものの",
    "meaningKo": "~라고 하지만",
    "nuanceKo": "앞 사실은 인정하지만 실제는 다름.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ものの",
      "とはいえ"
    ],
    "warningKo": "앞 사실을 인정하면서 역접. 「とはいえ」보다 문어적. 내용 구성 방식은 동일.",
    "examples": [
      {
        "id": "n2-093-ex-1",
        "japanese": "彼は20歳とはいうものの、まだ子供だ。",
        "korean": "그는 스무 살이라고는 하지만 아직 아이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-094",
    "no": 94,
    "noLabel": "94",
    "level": "N2",
    "expression": "とは限らない",
    "connection": "普通形+とは限らない",
    "meaningKo": "~라고는 할 수 없다",
    "nuanceKo": "항상 그런 것은 아님.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "わけではない",
      "というものではない"
    ],
    "warningKo": "부분 부정. 「いつも～とは限らない」처럼 일반화 오류를 지적할 때 최빈출.",
    "examples": [
      {
        "id": "n2-094-ex-1",
        "japanese": "新聞には書いてあることがいつも真実だとは限らない。",
        "korean": "신문에 쓰여 있는 것이 항상 진실이라고는 할 수 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-095",
    "no": 95,
    "noLabel": "95",
    "level": "N2",
    "expression": "ともなると",
    "connection": "N+ともなると",
    "meaningKo": "~이 되면, ~정도가 되면",
    "nuanceKo": "그 정도 단계가 되면 자연히 상황이 달라짐.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "となると",
      "にもなると"
    ],
    "warningKo": "「社長ともなると」처럼 높은 지위에 도달하면 당연히 따르는 변화를 말함.",
    "examples": [
      {
        "id": "n2-095-ex-1",
        "japanese": "3人の子の親ともなると、自由時間はかなり制限される。",
        "korean": "세 아이의 부모가 되면 자유 시간은 꽤 제한된다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-096",
    "no": 96,
    "noLabel": "96",
    "level": "N2",
    "expression": "ない限り",
    "connection": "Vない形+限り",
    "meaningKo": "~가 없는 한, ~가 없으면",
    "nuanceKo": "그 조건이 없으면 뒤 일이 성립하지 않음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なければ",
      "ないと"
    ],
    "warningKo": "조건 부정. 「許可がない限り」= 허가 없으면 불가. 강한 제한 표현.",
    "examples": [
      {
        "id": "n2-096-ex-1",
        "japanese": "この建物は許可がない限り、見学できません。",
        "korean": "이 건물은 허가가 없는 한 견학할 수 없습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-097",
    "no": 97,
    "noLabel": "97",
    "level": "N2",
    "expression": "ないことには",
    "connection": "Vない形+ことには",
    "meaningKo": "~하기 전에는, ~하지 않고서는",
    "nuanceKo": "앞 조건이 충족되어야 뒤가 가능.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なければ",
      "ないと"
    ],
    "warningKo": "「ことには」가 붙어 전제 조건을 더 명확히 강조. 뒤에 不可能·困難 표현이 옴.",
    "examples": [
      {
        "id": "n2-097-ex-1",
        "japanese": "体が健康でないことには、いい仕事はできないだろう。",
        "korean": "몸이 건강하지 않고서는 좋은 일을 할 수 없을 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-098",
    "no": 98,
    "noLabel": "98",
    "level": "N2",
    "expression": "ないことはない",
    "connection": "Vない形+ことはない",
    "meaningKo": "~하지 않는 것은 아니다, ~하기는 하다",
    "nuanceKo": "완전 긍정은 아니지만 가능성·여지는 있음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なくもない",
      "ないでもない"
    ],
    "warningKo": "이중 부정으로 약한 긍정. 세 표현 모두 유사. 직접 긍정보다 망설임 뉘앙스.",
    "examples": [
      {
        "id": "n2-098-ex-1",
        "japanese": "東京まで快速で20分だから、今すぐ出れば間に合わないことはない。",
        "korean": "도쿄까지 쾌속으로 20분이니 지금 바로 나가면 못 맞출 것도 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-099",
    "no": 99,
    "noLabel": "99",
    "level": "N2",
    "expression": "ないではいられない",
    "connection": "Vない形+ではいられない",
    "meaningKo": "~하지 않을 수 없다",
    "nuanceKo": "감정·충동이 강해 자연히 하게 됨.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ずにはいられない",
      "てたまらない"
    ],
    "warningKo": "구어적. ずにはいられない는 문어적. 억누를 수 없는 충동 표현으로 세트로 암기.",
    "examples": [
      {
        "id": "n2-099-ex-1",
        "japanese": "その話を聞いて、泣かないではいられなかった。",
        "korean": "그 이야기를 듣고 울지 않을 수 없었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-100",
    "no": 100,
    "noLabel": "100",
    "level": "N2",
    "expression": "ないでもない",
    "connection": "Vない形+でもない",
    "meaningKo": "~하지 않는 것은 아니다",
    "nuanceKo": "약한 긍정. 가능성은 조금 있음.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なくもない",
      "ないことはない"
    ],
    "warningKo": "세 표현 중 가장 구어적이고 망설임이 가장 강함. 적극적 동의가 아님에 주의.",
    "examples": [
      {
        "id": "n2-100-ex-1",
        "japanese": "行きたくないでもないが、今日は少し疲れている。",
        "korean": "가고 싶지 않은 것은 아니지만 오늘은 좀 피곤하다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-101",
    "no": 101,
    "noLabel": "101",
    "level": "N2",
    "expression": "ないものか",
    "connection": "Vない形+ものか",
    "meaningKo": "~하지 못하는 것일까",
    "nuanceKo": "실현이 어려운 바람·기대.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ものだろうか",
      "てほしいものだ"
    ],
    "warningKo": "실현이 어려운 바람. 「何とかして」와 자주 함께 씀. 독백에 가까운 표현.",
    "examples": [
      {
        "id": "n2-101-ex-1",
        "japanese": "何とかしてもっと安く買えないものか。",
        "korean": "어떻게 해서든 더 싸게 살 수는 없을까."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-102",
    "no": 102,
    "noLabel": "102",
    "level": "N2",
    "expression": "ながら（역접）",
    "connection": "Vます形語幹+ながら / Nながら",
    "meaningKo": "~이면서, ~이지만",
    "nuanceKo": "역접. 앞 사실과 어긋나는 뒤 내용.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "つつ",
      "のに"
    ],
    "warningKo": "「学生ながら」처럼 상태·자격에도 씀. つつ는 동작 동시 진행, ながら는 상태 대비도 OK.",
    "examples": [
      {
        "id": "n2-102-ex-1",
        "japanese": "彼は学生ながら、会社を経営している。",
        "korean": "그는 학생이면서도 회사를 운영하고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-103",
    "no": 103,
    "noLabel": "103",
    "level": "N2",
    "expression": "なくもない",
    "connection": "Vない形語幹+なくもない",
    "meaningKo": "~하기도 한다, ~하지 않는 것은 아니다",
    "nuanceKo": "약한 인정.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないことはない",
      "ないでもない"
    ],
    "warningKo": "약한 긍정. 「できなくもない」= 불가는 아님. 적극성이 낮은 긍정.",
    "examples": [
      {
        "id": "n2-103-ex-1",
        "japanese": "難しいが、できなくもない。",
        "korean": "어렵지만 못 할 것도 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-104",
    "no": 104,
    "noLabel": "104",
    "level": "N2",
    "expression": "なんて/なんか/など",
    "connection": "N+なんて / なんか / など",
    "meaningKo": "~따위, ~라고, ~라니",
    "nuanceKo": "가볍게 예시, 낮춤, 놀람·비판.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "など",
      "さえ"
    ],
    "warningKo": "なんて는 가장 구어적이고 경시·놀람 뉘앙스. など는 중립적 열거. 격식체에서 なんて는 X.",
    "examples": [
      {
        "id": "n2-104-ex-1",
        "japanese": "私なんかまだまだ経験が足りません。",
        "korean": "저 같은 사람은 아직 경험이 부족합니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-105",
    "no": 105,
    "noLabel": "105",
    "level": "N2",
    "expression": "にあたって",
    "connection": "V辞書形+にあたって / N+にあたって",
    "meaningKo": "~을 맞이해서, ~함에 있어서",
    "nuanceKo": "중요한 시점·행동을 앞두고.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "際に",
      "に先立って"
    ],
    "warningKo": "중요한 시점·행사에만 씀. 「飯を食べるにあたって」같은 일상 행동엔 부자연스러움.",
    "examples": [
      {
        "id": "n2-105-ex-1",
        "japanese": "新しい仕事を始めるにあたって、十分な準備をした。",
        "korean": "새 일을 시작함에 있어서 충분히 준비했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-106",
    "no": 106,
    "noLabel": "106",
    "level": "N2",
    "expression": "に応じて",
    "connection": "N+に応じて",
    "meaningKo": "~에 따라서, ~에 상응해서",
    "nuanceKo": "상황·조건에 맞춰 변화.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "によって",
      "次第で"
    ],
    "warningKo": "「状況に応じて」처럼 유동적 대응. によって는 원인·수단도 포함. に応じて는 적응 초점.",
    "examples": [
      {
        "id": "n2-106-ex-1",
        "japanese": "状況に応じて、計画を変更する必要がある。",
        "korean": "상황에 따라 계획을 변경할 필요가 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-107",
    "no": 107,
    "noLabel": "107",
    "level": "N2",
    "expression": "にかかわらず",
    "connection": "N+にかかわらず / 普通形+にかかわらず",
    "meaningKo": "~에 관계없이",
    "nuanceKo": "조건의 영향을 받지 않음.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "を問わず",
      "に関係なく"
    ],
    "warningKo": "「雨にかかわらず」처럼 조건 무관. を問わず와 거의 동의이나 にかかわらず가 더 문어적.",
    "examples": [
      {
        "id": "n2-107-ex-1",
        "japanese": "年齢にかかわらず、誰でも参加できます。",
        "korean": "나이에 관계없이 누구나 참가할 수 있습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-108",
    "no": 108,
    "noLabel": "108",
    "level": "N2",
    "expression": "に限って",
    "connection": "N+に限って",
    "meaningKo": "~에 한해서, ~만은, ~치고",
    "nuanceKo": "하필 그 경우에만. 예외·특별함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけ",
      "のみ"
    ],
    "warningKo": "「忙しい日に限って」처럼 하필 그때 일어난다는 아이러니 표현. 긍정·부정 모두 가능.",
    "examples": [
      {
        "id": "n2-108-ex-1",
        "japanese": "忙しい日に限って、急な用事が入る。",
        "korean": "바쁜 날에 한해서 갑작스러운 일이 생긴다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-109",
    "no": 109,
    "noLabel": "109",
    "level": "N2",
    "expression": "に限らず",
    "connection": "N+に限らず",
    "meaningKo": "~에 한정되지 않고, ~뿐만 아니라",
    "nuanceKo": "범위를 넓힘.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "のみならず",
      "はもとより"
    ],
    "warningKo": "「日本に限らず」= 일본뿐 아니라. のみならず보다 격식도가 약간 낮음.",
    "examples": [
      {
        "id": "n2-109-ex-1",
        "japanese": "日本に限らず、世界中で環境問題が深刻になっている。",
        "korean": "일본뿐만 아니라 전 세계에서 환경 문제가 심각해지고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-110",
    "no": 110,
    "noLabel": "110",
    "level": "N2",
    "expression": "に限り",
    "connection": "N+に限り",
    "meaningKo": "~에 한해서, ~만",
    "nuanceKo": "조건·대상을 제한. 공지문에서 자주 씀.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけ",
      "のみ"
    ],
    "warningKo": "공지·게시문에 자주 쓰이는 표현. 「本日に限り」처럼 조건 제한. 108번 に限って와 구별.",
    "examples": [
      {
        "id": "n2-110-ex-1",
        "japanese": "本日に限り、全品半額です。",
        "korean": "오늘에 한해 전품 반값입니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-111",
    "no": 111,
    "noLabel": "111",
    "level": "N2",
    "expression": "にかけては",
    "connection": "N+にかけては",
    "meaningKo": "~에 있어서는, ~만큼은",
    "nuanceKo": "특정 분야에서 뛰어남.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "においては",
      "については"
    ],
    "warningKo": "특정 분야 최상의 능력을 강조. 「～に関しては」는 화제 제시, 「にかけては」는 능력 강조.",
    "examples": [
      {
        "id": "n2-111-ex-1",
        "japanese": "数学にかけては、彼に勝てる人はいない。",
        "korean": "수학에 있어서는 그를 이길 사람이 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-112",
    "no": 112,
    "noLabel": "112",
    "level": "N2",
    "expression": "に関して",
    "connection": "N+に関して",
    "meaningKo": "~에 관해서, ~에 대해서",
    "nuanceKo": "화제·대상 제시. 딱딱함.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "について",
      "に関する"
    ],
    "warningKo": "공식적 화제 제시. 「について」보다 딱딱함. 「に関する」는 명사 수식 형태.",
    "examples": [
      {
        "id": "n2-112-ex-1",
        "japanese": "この件に関して、質問があります。",
        "korean": "이 건에 관해서 질문이 있습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-113",
    "no": 113,
    "noLabel": "113",
    "level": "N2",
    "expression": "に加えて",
    "connection": "N+に加えて",
    "meaningKo": "~에 더해서, ~외에",
    "nuanceKo": "추가.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ばかりか",
      "のみならず"
    ],
    "warningKo": "단순 추가. 긍정 추가에도 부정 추가에도 모두 씀. ばかりか는 부정적 추가 강조.",
    "examples": [
      {
        "id": "n2-113-ex-1",
        "japanese": "雨に加えて、風も強くなってきた。",
        "korean": "비에 더해 바람도 강해졌다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-114",
    "no": 114,
    "noLabel": "114",
    "level": "N2",
    "expression": "にこしたことはない",
    "connection": "V辞書形+にこしたことはない",
    "meaningKo": "~해서 나쁠 것이 없다, 가장 좋다",
    "nuanceKo": "가능하면 그게 최선.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ほうがいい",
      "べきだ"
    ],
    "warningKo": "「ないにこしたことはない」= 없는 게 제일 좋음. 조언·당위보다 부드러운 표현.",
    "examples": [
      {
        "id": "n2-114-ex-1",
        "japanese": "準備は早いにこしたことはない。",
        "korean": "준비는 빠를수록 좋다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-115",
    "no": 115,
    "noLabel": "115",
    "level": "N2",
    "expression": "に応えて",
    "connection": "N+に応えて",
    "meaningKo": "~을 받아들여서, ~에 응해서",
    "nuanceKo": "기대·요구·요청에 반응.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に応じて",
      "に従って"
    ],
    "warningKo": "「期待に応えて」처럼 기대·요구에 부응. に応じて는 상황 적응, に応えて는 요청 수락.",
    "examples": [
      {
        "id": "n2-115-ex-1",
        "japanese": "皆の期待に応えて、彼は優勝した。",
        "korean": "모두의 기대에 부응해 그는 우승했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-116",
    "no": 116,
    "noLabel": "116",
    "level": "N2",
    "expression": "に際して",
    "connection": "V辞書形+に際して / N+に際して",
    "meaningKo": "~함에 있어서, ~할 때（공식）",
    "nuanceKo": "공식적 상황에서의 시점.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にあたって",
      "の際に"
    ],
    "warningKo": "にあたって보다 더 공식적. 행사 개회사·연설·안내문에서 자주 씀.",
    "examples": [
      {
        "id": "n2-116-ex-1",
        "japanese": "出発に際して、注意事項を説明します。",
        "korean": "출발에 앞서 주의사항을 설명하겠습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-117",
    "no": 117,
    "noLabel": "117",
    "level": "N2",
    "expression": "に先立って",
    "connection": "N+に先立って",
    "meaningKo": "~에 앞서, ~(하)기에 앞서",
    "nuanceKo": "먼저 시행되는 절차.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "の前に",
      "にあたって"
    ],
    "warningKo": "공식적 순서 표현. 「会議に先立って」= 회의 전에 먼저. 의식·행사에서 자주 씀.",
    "examples": [
      {
        "id": "n2-117-ex-1",
        "japanese": "会議に先立って、資料を配った。",
        "korean": "회의에 앞서 자료를 배포했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-118",
    "no": 118,
    "noLabel": "118",
    "level": "N2",
    "expression": "にしたところで",
    "connection": "N+にしたところで",
    "meaningKo": "~라고 해서, ~라 한들",
    "nuanceKo": "그 경우에도 크게 다르지 않음.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "としても",
      "にしても"
    ],
    "warningKo": "「彼にしたところで」= 그라고 해도. にしても와 거의 동의지만 にしたところで가 더 문어적.",
    "examples": [
      {
        "id": "n2-118-ex-1",
        "japanese": "彼にしたところで、すぐには答えられないだろう。",
        "korean": "그라고 해도 바로 대답하지는 못할 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-119",
    "no": 119,
    "noLabel": "119",
    "level": "N2",
    "expression": "にしたら",
    "connection": "N+にしたら",
    "meaningKo": "~입장에서는",
    "nuanceKo": "특정 사람의 관점.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からすると",
      "にとって"
    ],
    "warningKo": "특정 인물의 관점. 「にとって」는 영향·가치, 「にしたら」는 관점·심정.",
    "examples": [
      {
        "id": "n2-119-ex-1",
        "japanese": "親にしたら、子供の将来が心配なのは当然だ。",
        "korean": "부모 입장에서는 자식의 장래가 걱정되는 것이 당연하다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-120",
    "no": 120,
    "noLabel": "120",
    "level": "N2",
    "expression": "にしては",
    "connection": "N+にしては / 普通形+にしては",
    "meaningKo": "~치고는, ~로서는",
    "nuanceKo": "기대·기준과 비교해서 의외.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "わりに",
      "くせに"
    ],
    "warningKo": "기대·기준 대비 의외. くせに는 비난 뉘앙스, にしては는 중립적 의외. 주어에 주의.",
    "examples": [
      {
        "id": "n2-120-ex-1",
        "japanese": "初めてにしては、よくできた。",
        "korean": "처음 치고는 잘했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-121",
    "no": 121,
    "noLabel": "121",
    "level": "N2",
    "expression": "にしても/にしろ/にせよ",
    "connection": "普通形+にしても/にしろ/にせよ",
    "meaningKo": "~라고 해도",
    "nuanceKo": "양보. 그렇다 해도 뒤 내용은 성립.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "としても",
      "でも"
    ],
    "warningKo": "세 형태는 의미가 동일. にせよ가 가장 문어적. 「にしても」가 가장 일반적.",
    "examples": [
      {
        "id": "n2-121-ex-1",
        "japanese": "忙しいにしても、連絡ぐらいはできるはずだ。",
        "korean": "바쁘다고 해도 연락 정도는 할 수 있을 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-122",
    "no": 122,
    "noLabel": "122",
    "level": "N2",
    "expression": "にしろ~にしろ",
    "connection": "N+にしろ+N+にしろ",
    "meaningKo": "~(이)든 ~(이)든",
    "nuanceKo": "어느 쪽이든 결과가 같음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "でも～でも",
      "にしても～にしても"
    ],
    "warningKo": "「行くにしろ行かないにしろ」처럼 양쪽 조건 모두 포함. 어느 쪽이든 결과 불변.",
    "examples": [
      {
        "id": "n2-122-ex-1",
        "japanese": "行くにしろ行かないにしろ、早く返事してください。",
        "korean": "가든 안 가든 빨리 대답해 주세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-123",
    "no": 123,
    "noLabel": "123",
    "level": "N2",
    "expression": "にすぎない",
    "connection": "普通形+にすぎない / N+にすぎない",
    "meaningKo": "~에 지나지 않는다, 겨우 ~일 뿐이다",
    "nuanceKo": "낮게 평가하거나 제한.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だけだ",
      "ばかりだ"
    ],
    "warningKo": "「個人的な意見にすぎない」처럼 겸손 또는 축소 표현. 뒤에 과소평가 내용이 옴.",
    "examples": [
      {
        "id": "n2-123-ex-1",
        "japanese": "これは私の個人的な意見にすぎない。",
        "korean": "이것은 내 개인적인 의견에 지나지 않는다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-124",
    "no": 124,
    "noLabel": "124",
    "level": "N2",
    "expression": "に相違ない",
    "connection": "普通形+に相違ない",
    "meaningKo": "~임이 틀림없다",
    "nuanceKo": "강한 확신. 문어적.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に違いない",
      "はずだ"
    ],
    "warningKo": "「に違いない」와 거의 동의이나 相違ない가 더 문어적·고어적. 법률 문서에서도 씀.",
    "examples": [
      {
        "id": "n2-124-ex-1",
        "japanese": "この証拠から見ると、彼が犯人に相違ない。",
        "korean": "이 증거로 보면 그가 범인임이 틀림없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-125",
    "no": 125,
    "noLabel": "125",
    "level": "N2",
    "expression": "に沿って",
    "connection": "N+に沿って",
    "meaningKo": "~에 따라, ~에 부응해서",
    "nuanceKo": "방침·계획·기준을 따름.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に従って",
      "に基づいて"
    ],
    "warningKo": "「計画に沿って」= 계획을 따라. に従って는 명령·규칙 준수, に沿って는 방향·기준 추종.",
    "examples": [
      {
        "id": "n2-125-ex-1",
        "japanese": "計画に沿って、作業を進めてください。",
        "korean": "계획에 따라 작업을 진행해 주세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-126",
    "no": 126,
    "noLabel": "126",
    "level": "N2",
    "expression": "につき",
    "connection": "N+につき",
    "meaningKo": "~로 인해, ~때문에 / ~당",
    "nuanceKo": "공지문·문어체. 이유 또는 단위.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ので",
      "あたり"
    ],
    "warningKo": "이유(工事中につき)와 단위(1人につき) 두 용법. 공지문에서 이유 용법이 자주 출제.",
    "examples": [
      {
        "id": "n2-126-ex-1",
        "japanese": "工事中につき、通行止めです。",
        "korean": "공사 중이므로 통행금지입니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-127",
    "no": 127,
    "noLabel": "127",
    "level": "N2",
    "expression": "につけ（て）",
    "connection": "V辞書形+につけ",
    "meaningKo": "~할 때마다, ~할 때나 ~할 때나",
    "nuanceKo": "어떤 때마다 감정이 떠오름.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たびに",
      "ごとに"
    ],
    "warningKo": "「見るにつけ」처럼 어떤 계기마다 감정이 떠오름. たびに보다 더 감성적·문어적.",
    "examples": [
      {
        "id": "n2-127-ex-1",
        "japanese": "写真を見るにつけ、故郷を思い出す。",
        "korean": "사진을 볼 때마다 고향이 떠오른다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-128",
    "no": 128,
    "noLabel": "128",
    "level": "N2",
    "expression": "に伴って",
    "connection": "N+に伴って / V辞書形+に伴って",
    "meaningKo": "~함에 따라서, ~하면서",
    "nuanceKo": "한 변화와 함께 다른 변화가 발생.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "とともに",
      "に応じて"
    ],
    "warningKo": "「増加に伴って」처럼 한 변화→다른 변화 수반. 뉴스·보고서에서 자주 씀.",
    "examples": [
      {
        "id": "n2-128-ex-1",
        "japanese": "人口の増加に伴って、住宅問題が深刻になった。",
        "korean": "인구 증가에 따라 주택 문제가 심각해졌다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-129",
    "no": 129,
    "noLabel": "129",
    "level": "N2",
    "expression": "にほかならない",
    "connection": "N+にほかならない",
    "meaningKo": "바로 ~이다, ~인 것이다",
    "nuanceKo": "강한 단정·강조.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に違いない",
      "こそ"
    ],
    "warningKo": "「バロそのものだ」에 가까운 단정. 「努力にほかならない」처럼 N+にほかならない.",
    "examples": [
      {
        "id": "n2-129-ex-1",
        "japanese": "成功の理由は努力にほかならない。",
        "korean": "성공의 이유는 바로 노력이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-130",
    "no": 130,
    "noLabel": "130",
    "level": "N2",
    "expression": "にもかかわらず",
    "connection": "普通形+にもかかわらず / N+にもかかわらず",
    "meaningKo": "~임에도 불구하고",
    "nuanceKo": "예상과 반대 결과. 딱딱함.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "のに",
      "ても"
    ],
    "warningKo": "역접 중 가장 문어적·강조적. 「のに」는 불만 감정, 「にもかかわらず」는 객관적 역접.",
    "examples": [
      {
        "id": "n2-130-ex-1",
        "japanese": "雨にもかかわらず、多くの人が集まった。",
        "korean": "비가 왔음에도 많은 사람이 모였다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-131",
    "no": 131,
    "noLabel": "131",
    "level": "N2",
    "expression": "にもとづいて",
    "connection": "N+にもとづいて",
    "meaningKo": "~을 기본으로, ~에 준해서",
    "nuanceKo": "자료·근거·기준을 바탕으로.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に沿って",
      "をもとに"
    ],
    "warningKo": "「調査結果にもとづいて」= 근거로 판단. に沿って는 방향성, にもとづいて는 증거·근거.",
    "examples": [
      {
        "id": "n2-131-ex-1",
        "japanese": "調査結果にもとづいて、報告書を書いた。",
        "korean": "조사 결과를 바탕으로 보고서를 썼다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-132",
    "no": 132,
    "noLabel": "132",
    "level": "N2",
    "expression": "ぬきで",
    "connection": "N+ぬきで",
    "meaningKo": "~없이, ~을 빼고",
    "nuanceKo": "어떤 요소를 제외.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "を抜きにして",
      "なしで"
    ],
    "warningKo": "「冗談は抜きで」처럼 어떤 요소를 제외. を抜きにして는 더 격식적.",
    "examples": [
      {
        "id": "n2-132-ex-1",
        "japanese": "冗談は抜きで、まじめに考えてください。",
        "korean": "농담은 빼고 진지하게 생각해 주세요."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-133",
    "no": 133,
    "noLabel": "133",
    "level": "N2",
    "expression": "ぬく",
    "connection": "Vます形語幹+ぬく",
    "meaningKo": "끝까지 ~하다",
    "nuanceKo": "어려움 속에서도 끝까지 완수.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "きる",
      "とおす"
    ],
    "warningKo": "「走りぬく」처럼 어려움을 극복하고 완수. きる는 단순 완료, ぬく는 인내·극복 강조.",
    "examples": [
      {
        "id": "n2-133-ex-1",
        "japanese": "最後まで走りぬいた。",
        "korean": "끝까지 달려냈다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-134",
    "no": 134,
    "noLabel": "134",
    "level": "N2",
    "expression": "の上で",
    "connection": "N+の上で",
    "meaningKo": "~만으로는, ~상으로는",
    "nuanceKo": "표면적·문서상·계산상 관점.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "上で",
      "上は"
    ],
    "warningKo": "「計算の上では」처럼 N+の上で. 표면·형식상의 관점에 한정. 5번·6번 上で와 구별 필요.",
    "examples": [
      {
        "id": "n2-134-ex-1",
        "japanese": "計算の上では問題ない。",
        "korean": "계산상으로는 문제가 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-135",
    "no": 135,
    "noLabel": "135",
    "level": "N2",
    "expression": "のことだから",
    "connection": "N+のことだから",
    "meaningKo": "~이기 때문에",
    "nuanceKo": "그 사람·대상의 성격을 근거로 추측.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "からして",
      "だけあって"
    ],
    "warningKo": "특정 인물의 성격·습관을 근거로 추측. 항상 긍정적 추측에 씀.",
    "examples": [
      {
        "id": "n2-135-ex-1",
        "japanese": "まじめな彼のことだから、きっと時間通りに来るだろう。",
        "korean": "성실한 그이니 분명 시간 맞춰 올 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-136",
    "no": 136,
    "noLabel": "136",
    "level": "N2",
    "expression": "のみならず",
    "connection": "普通形+のみならず / N+のみならず",
    "meaningKo": "~뿐만 아니라",
    "nuanceKo": "딱딱한 추가 표현.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ばかりか",
      "に加えて"
    ],
    "warningKo": "문어적 추가 표현. ばかりか는 부정 내용 추가에 강하고, のみならず는 중립적.",
    "examples": [
      {
        "id": "n2-136-ex-1",
        "japanese": "彼は英語のみならず、フランス語も話せる。",
        "korean": "그는 영어뿐만 아니라 프랑스어도 할 수 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-137",
    "no": 137,
    "noLabel": "137",
    "level": "N2",
    "expression": "のもとで",
    "connection": "N+のもとで",
    "meaningKo": "~아래서, ~밑에서",
    "nuanceKo": "영향·지도·조건 아래.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "の下に",
      "において"
    ],
    "warningKo": "「指導のもとで」처럼 영향·지도 하에. の下で와 거의 동의. 문어적.",
    "examples": [
      {
        "id": "n2-137-ex-1",
        "japanese": "先生の指導のもとで研究を進めた。",
        "korean": "선생님의 지도 아래 연구를 진행했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-138",
    "no": 138,
    "noLabel": "138",
    "level": "N2",
    "expression": "ばかりか",
    "connection": "普通形+ばかりか / N+ばかりか",
    "meaningKo": "~뿐만 아니라",
    "nuanceKo": "추가 내용이 더 강함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "のみならず",
      "に加えて"
    ],
    "warningKo": "「遅刻したばかりか」처럼 더 나쁜 것을 추가. 뒤에 더 강한 내용이 오는 구조.",
    "examples": [
      {
        "id": "n2-138-ex-1",
        "japanese": "彼は遅刻したばかりか、宿題も忘れた。",
        "korean": "그는 지각했을 뿐만 아니라 숙제도 잊었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-139",
    "no": 139,
    "noLabel": "139",
    "level": "N2",
    "expression": "ばかりだ",
    "connection": "V辞書形+ばかりだ",
    "meaningKo": "점점 ~할 뿐이다, 더욱 ~하게 된다",
    "nuanceKo": "변화가 한 방향으로 계속 진행. 주로 부정적.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "一方だ",
      "ていく"
    ],
    "warningKo": "한 방향 진행. 주로 부정적 변화. 「上がるばかり」처럼 좋지 않은 변화에 씀.",
    "examples": [
      {
        "id": "n2-139-ex-1",
        "japanese": "物価は上がるばかりだ。",
        "korean": "물가는 오르기만 한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-140",
    "no": 140,
    "noLabel": "140",
    "level": "N2",
    "expression": "ばかりに",
    "connection": "普通形+ばかりに",
    "meaningKo": "~한 탓에, ~때문에",
    "nuanceKo": "그것 하나 때문에 나쁜 결과.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "あまり",
      "せいで"
    ],
    "warningKo": "「言ったばかりに」처럼 단 하나의 이유로 나쁜 결과. せいで와 유사하나 ばかりに가 더 후회 강조.",
    "examples": [
      {
        "id": "n2-140-ex-1",
        "japanese": "正直に話したばかりに、怒られてしまった。",
        "korean": "솔직히 말한 탓에 혼나고 말았다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-141",
    "no": 141,
    "noLabel": "141",
    "level": "N2",
    "expression": "はさておき",
    "connection": "N+はさておき",
    "meaningKo": "~은 잠시 접어두고",
    "nuanceKo": "중요한 화제를 뒤로 미루고 다른 화제로 전환.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はともかく",
      "を置いといて"
    ],
    "warningKo": "화제를 의도적으로 보류. 「結果はさておき」처럼 중요한 것을 일단 제쳐두는 화법.",
    "examples": [
      {
        "id": "n2-141-ex-1",
        "japanese": "結果はさておき、まず努力を認めたい。",
        "korean": "결과는 잠시 제쳐두고 우선 노력을 인정하고 싶다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-142",
    "no": 142,
    "noLabel": "142",
    "level": "N2",
    "expression": "はというと",
    "connection": "N+はというと",
    "meaningKo": "~로 말하자면, ~은",
    "nuanceKo": "앞 화제와 대비하여 특정 대상을 말함.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "といえば",
      "については"
    ],
    "warningKo": "대비적 화제 전환. 「父は元気だ。母はというと…」처럼 대조 맥락에 씀.",
    "examples": [
      {
        "id": "n2-142-ex-1",
        "japanese": "父は元気だ。母はというと、少し疲れているようだ。",
        "korean": "아버지는 건강하다. 어머니는 말하자면 조금 피곤해 보인다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-143",
    "no": 143,
    "noLabel": "143",
    "level": "N2",
    "expression": "はともかく",
    "connection": "N+はともかく（として）",
    "meaningKo": "~은 우선 제쳐두고",
    "nuanceKo": "하나는 논외로 하고 중요한 것에 집중.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はさておき",
      "にしても"
    ],
    "warningKo": "「値段はともかく」처럼 일단 논외로. はさておきより 조금 더 가벼운 어조.",
    "examples": [
      {
        "id": "n2-143-ex-1",
        "japanese": "値段はともかく、品質はとてもいい。",
        "korean": "가격은 제쳐두고 품질은 매우 좋다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-144",
    "no": 144,
    "noLabel": "144",
    "level": "N2",
    "expression": "はもとより",
    "connection": "N+はもとより",
    "meaningKo": "~은 물론이고",
    "nuanceKo": "당연한 것에 더해 다른 것도 포함.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はもちろん",
      "のみならず"
    ],
    "warningKo": "「英語はもとより」= 영어는 물론. はもちろん은 구어적, はもとより는 문어적.",
    "examples": [
      {
        "id": "n2-144-ex-1",
        "japanese": "彼は英語はもとより、中国語もできる。",
        "korean": "그는 영어는 물론이고 중국어도 할 수 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-145",
    "no": 145,
    "noLabel": "145",
    "level": "N2",
    "expression": "べきだ",
    "connection": "V辞書形+べきだ / する→すべきだ",
    "meaningKo": "반드시 ~해야 한다, ~하는 편이 좋다",
    "nuanceKo": "의무·당위·충고.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なければならない",
      "はずだ"
    ],
    "warningKo": "강한 당위. 「するべき」보다 「すべき」가 더 문어적. は자가 탈락하는 형태에 주의.",
    "examples": [
      {
        "id": "n2-145-ex-1",
        "japanese": "約束は守るべきだ。",
        "korean": "약속은 지켜야 한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-146",
    "no": 146,
    "noLabel": "146",
    "level": "N2",
    "expression": "まい（의지）",
    "connection": "V辞書形+まい / する→するまい",
    "meaningKo": "~하지 않겠다, ~하지 말자",
    "nuanceKo": "강한 부정 의지.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないようにする",
      "つもりはない"
    ],
    "warningKo": "문어적 부정 의지. 「するまい」는 구어적으로 어색. 회화에서는 「するつもりはない」선호.",
    "examples": [
      {
        "id": "n2-146-ex-1",
        "japanese": "もう二度と同じ失敗はするまい。",
        "korean": "다시는 같은 실패를 하지 않겠다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-147",
    "no": 147,
    "noLabel": "147",
    "level": "N2",
    "expression": "まい（추측）",
    "connection": "V辞書形+まい",
    "meaningKo": "~하지 않을 것이다",
    "nuanceKo": "부정 추측. 문어적.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないだろう",
      "はずがない"
    ],
    "warningKo": "부정 추측. 문어적·고어적. 현대 회화에서는 「ないでしょう」를 더 많이 씀.",
    "examples": [
      {
        "id": "n2-147-ex-1",
        "japanese": "彼はそんなことは言うまい。",
        "korean": "그는 그런 말은 하지 않을 것이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-148",
    "no": 148,
    "noLabel": "148",
    "level": "N2",
    "expression": "まいか",
    "connection": "V辞書形+まいか",
    "meaningKo": "~하지 않겠는가, ~지 않을까",
    "nuanceKo": "걱정·부정 추측.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ないかしら",
      "ないだろうか"
    ],
    "warningKo": "걱정·부정 추측. 고어적 표현. 현대 일본어에서는 드물게 씀.",
    "examples": [
      {
        "id": "n2-148-ex-1",
        "japanese": "雨が降るまいかと心配だ。",
        "korean": "비가 오지 않을까 걱정이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-149",
    "no": 149,
    "noLabel": "149",
    "level": "N2",
    "expression": "までして",
    "connection": "Vて+まで / N+までして",
    "meaningKo": "~해서까지",
    "nuanceKo": "그렇게까지 할 필요가 있는지 비판·놀람.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "てまで",
      "にまで"
    ],
    "warningKo": "「借金までして」처럼 과도한 수단에 대한 비판·경고. 뒤에 부정적 판단이 옴.",
    "examples": [
      {
        "id": "n2-149-ex-1",
        "japanese": "借金までして買う必要はない。",
        "korean": "빚까지 내서 살 필요는 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-150",
    "no": 150,
    "noLabel": "150",
    "level": "N2",
    "expression": "まみれ",
    "connection": "N+まみれ",
    "meaningKo": "~투성이, ~범벅",
    "nuanceKo": "액체·먼지·피 등 더러운 것이 묻음.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "だらけ",
      "っぽい"
    ],
    "warningKo": "だらけ는 내용 가득, まみれ는 표면에 묻음. 「汗まみれ」「埃まみれ」처럼 주로 액체·분진.",
    "examples": [
      {
        "id": "n2-150-ex-1",
        "japanese": "子供は泥まみれになって帰ってきた。",
        "korean": "아이는 진흙투성이가 되어 돌아왔다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-151",
    "no": 151,
    "noLabel": "151",
    "level": "N2",
    "expression": "もかまわず",
    "connection": "N+もかまわず",
    "meaningKo": "~도 상관없이, ~도 의식하지 않고",
    "nuanceKo": "주변 상황을 신경 쓰지 않음.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にかかわらず",
      "をものともせず"
    ],
    "warningKo": "「人目もかまわず」처럼 주변 시선 무시. をものともせず는 어려움을 무릅쓰는 긍정적 뉘앙스.",
    "examples": [
      {
        "id": "n2-151-ex-1",
        "japanese": "人目もかまわず泣き出した。",
        "korean": "남의 시선도 아랑곳하지 않고 울기 시작했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-152",
    "no": 152,
    "noLabel": "152",
    "level": "N2",
    "expression": "もしない",
    "connection": "Vます形語幹+もしない",
    "meaningKo": "~도 하지 않다",
    "nuanceKo": "당연히 해야 할 최소 행동도 안 함.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "さえしない",
      "すら"
    ],
    "warningKo": "「挨拶もしない」처럼 최소한의 행동조차 안 함. 강한 비판·불만.",
    "examples": [
      {
        "id": "n2-152-ex-1",
        "japanese": "彼は挨拶もしない。",
        "korean": "그는 인사도 하지 않는다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-153",
    "no": 153,
    "noLabel": "153",
    "level": "N2",
    "expression": "もの（변명）",
    "connection": "普通形+もの",
    "meaningKo": "~는데 뭐, ~는데 어떡해",
    "nuanceKo": "이유·변명. 회화체.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "から",
      "ので"
    ],
    "warningKo": "여성어·아동어 뉘앙스. 이유·변명에서 감정적으로 씀. 남성이 쓰면 약한 인상.",
    "examples": [
      {
        "id": "n2-153-ex-1",
        "japanese": "だって忙しかったんだもの。",
        "korean": "하지만 바빴는걸."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-154",
    "no": 154,
    "noLabel": "154",
    "level": "N2",
    "expression": "ものか",
    "connection": "V辞書形+ものか",
    "meaningKo": "~은 무슨, 절대로 ~하지 않는다",
    "nuanceKo": "강한 반발·부정.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はずがない",
      "わけがない"
    ],
    "warningKo": "강한 부정 의지·반발. 「行くものか！」처럼 단독으로도 씀. 분노·거부감 표현.",
    "examples": [
      {
        "id": "n2-154-ex-1",
        "japanese": "あんな店、二度と行くものか。",
        "korean": "저런 가게, 두 번 다시 갈까 보냐."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-155",
    "no": 155,
    "noLabel": "155",
    "level": "N2",
    "expression": "ものがある",
    "connection": "普通形+ものがある",
    "meaningKo": "~인 부분이 있다, ~이기도 하다",
    "nuanceKo": "어떤 강한 느낌·평가가 있음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ところがある",
      "面がある"
    ],
    "warningKo": "어떤 강한 인상·느낌이 있음. 「感動させるものがある」처럼 평가에 씀. 객관적 판단 뉘앙스.",
    "examples": [
      {
        "id": "n2-155-ex-1",
        "japanese": "彼の演奏には人を感動させるものがある。",
        "korean": "그의 연주에는 사람을 감동시키는 무언가가 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-156",
    "no": 156,
    "noLabel": "156",
    "level": "N2",
    "expression": "ものだ（회상）",
    "connection": "Vた+ものだ",
    "meaningKo": "~했었다",
    "nuanceKo": "과거를 회상.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ていた",
      "した"
    ],
    "warningKo": "과거 습관·회상. 「子供のころ～たものだ」형태. 현재와 달라진 아쉬움 내포.",
    "examples": [
      {
        "id": "n2-156-ex-1",
        "japanese": "子供のころはよく川で遊んだものだ。",
        "korean": "어릴 적에는 자주 강에서 놀곤 했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-157",
    "no": 157,
    "noLabel": "157",
    "level": "N2",
    "expression": "ものだ（감탄）",
    "connection": "普通形+ものだ",
    "meaningKo": "~하다니, 참 ~하다",
    "nuanceKo": "감탄·당연한 이치·충고.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ことか",
      "ものだ（회상）"
    ],
    "warningKo": "「早いものだ」처럼 일반적 진리·감탄. 156번 회상과 혼동 주의. 문맥으로 구별.",
    "examples": [
      {
        "id": "n2-157-ex-1",
        "japanese": "時間がたつのは早いものだ。",
        "korean": "시간이 흐르는 것은 참 빠르다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-158",
    "no": 158,
    "noLabel": "158",
    "level": "N2",
    "expression": "ものだ/ものではない",
    "connection": "V辞書形+ものだ / V辞書形+ものではない",
    "meaningKo": "~해야 한다 / ~해서는 안 된다",
    "nuanceKo": "사회적 상식·도덕적 당위.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "べきだ",
      "ことだ"
    ],
    "warningKo": "사회적 상식·도덕 규범을 말함. べきだ보다 일반론적. 「若者は席を譲るものだ」.",
    "examples": [
      {
        "id": "n2-158-ex-1",
        "japanese": "元気な若い人は乗り物の中でお年寄りに席を譲るものだ。",
        "korean": "건강한 젊은이는 교통수단 안에서 노인에게 자리를 양보해야 한다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-159",
    "no": 159,
    "noLabel": "159",
    "level": "N2",
    "expression": "ものだから",
    "connection": "普通形+ものだから",
    "meaningKo": "~해서, ~때문에, ~인 까닭에",
    "nuanceKo": "변명·이유 제시. 회화적.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "から",
      "ので",
      "もの"
    ],
    "warningKo": "변명·이유. から보다 감정적. 「～ものですから」로 정중하게도 씀. 의외성 이유에 자주 씀.",
    "examples": [
      {
        "id": "n2-159-ex-1",
        "japanese": "いつもは敬語なんか使わないものだから、偉い人の前に出ると緊張します。",
        "korean": "평소에는 경어 같은 것을 쓰지 않기 때문에 높은 사람 앞에 서면 긴장합니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-160",
    "no": 160,
    "noLabel": "160",
    "level": "N2",
    "expression": "ものなら",
    "connection": "V可能形+ものなら",
    "meaningKo": "만약에 ~라면（불가능한 가정）",
    "nuanceKo": "실현이 어렵다는 전제의 가정.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たら",
      "とすれば"
    ],
    "warningKo": "실현 거의 불가능한 가정. 「できるものなら」처럼 희망. 160번과 167번 ようものなら 혼동 주의.",
    "examples": [
      {
        "id": "n2-160-ex-1",
        "japanese": "できるものなら鳥になって国へ帰りたい。",
        "korean": "가능하다면 새가 되어 고향으로 돌아가고 싶다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-161",
    "no": 161,
    "noLabel": "161",
    "level": "N2",
    "expression": "ものの",
    "connection": "普通形+ものの",
    "meaningKo": "~이기는 하지만, ~하기는 했지만",
    "nuanceKo": "앞 사실은 인정하지만 뒤는 기대와 다름.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "が",
      "けれど",
      "とはいうものの"
    ],
    "warningKo": "앞 사실 인정 후 역접. が보다 문어적. 「買ったものの」처럼 기대 불충족.",
    "examples": [
      {
        "id": "n2-161-ex-1",
        "japanese": "新しい服を買ったものの、なかなか着ていく機会がない。",
        "korean": "새 옷을 사기는 했지만 좀처럼 입고 갈 기회가 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-162",
    "no": 162,
    "noLabel": "162",
    "level": "N2",
    "expression": "やら~やら",
    "connection": "N+やら+N+やら",
    "meaningKo": "~하기도 하고 ~하기도 하고",
    "nuanceKo": "여러 가지가 뒤섞여 있음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "たり～たり",
      "とか"
    ],
    "warningKo": "복수 항목 열거. たり～たり는 동작, やら～やら는 감정·상태 혼재에 자주 씀.",
    "examples": [
      {
        "id": "n2-162-ex-1",
        "japanese": "びっくりするやら悲しむやら、ニュースを聞いた人たちの反応は様々だった。",
        "korean": "놀라기도 하고 슬퍼하기도 하고, 뉴스를 들은 사람들의 반응은 다양했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-163",
    "no": 163,
    "noLabel": "163",
    "level": "N2",
    "expression": "ようがない",
    "connection": "Vます形語幹+ようがない",
    "meaningKo": "~하려고 해도 할 수가 없다",
    "nuanceKo": "방법이 없음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "しようがない",
      "にくい"
    ],
    "warningKo": "방법·수단이 아예 없음. 「直しようがない」처럼 Vます형+ようがない. 불가능의 최강 표현.",
    "examples": [
      {
        "id": "n2-163-ex-1",
        "japanese": "この時計はもう部品がないから、直しようがない。",
        "korean": "이 시계는 이제 부품이 없어서 고칠 방법이 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-164",
    "no": 164,
    "noLabel": "164",
    "level": "N2",
    "expression": "ようか~まいか",
    "connection": "V意向形+か+V辞書形+まいか",
    "meaningKo": "~할까 말까, ~할지 말지",
    "nuanceKo": "할지 말지 망설임.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "かどうか",
      "ようかどうか"
    ],
    "warningKo": "할지 말지 망설임. 「まいか」는 문어적이므로 회화에서는 「ようかどうか」가 더 자연스러움.",
    "examples": [
      {
        "id": "n2-164-ex-1",
        "japanese": "この季節には、かさを持って行こうか行くまいかと毎朝迷ってしまう。",
        "korean": "이 계절에는 우산을 가져갈까 말까 매일 아침 망설인다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-165",
    "no": 165,
    "noLabel": "165",
    "level": "N2",
    "expression": "ようではないか",
    "connection": "V意向形+ではないか",
    "meaningKo": "~하자, ~해야 되지 않겠는가",
    "nuanceKo": "함께 행동하자는 강한 제안.",
    "register": "문어체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ようではないか",
      "ましょう"
    ],
    "warningKo": "청중에게 함께 행동하자는 연설체. 「ではないか」뒤에 勧誘 의미. 격식 스피치에 씀.",
    "examples": [
      {
        "id": "n2-165-ex-1",
        "japanese": "これからは少しでも人の役に立つことを考えようではないか。",
        "korean": "앞으로는 조금이라도 남에게 도움이 되는 일을 생각해 보자."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-166",
    "no": 166,
    "noLabel": "166",
    "level": "N2",
    "expression": "ようとしている",
    "connection": "V意向形+としている",
    "meaningKo": "막 ~하려고 하고 있다",
    "nuanceKo": "어떤 일이 막 일어나려는 직전.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ところだ",
      "始める"
    ],
    "warningKo": "직전 상황 강조. 「沈もうとしていた」처럼 자연 현상에도 씀. 의지 있는 주어에도 OK.",
    "examples": [
      {
        "id": "n2-166-ex-1",
        "japanese": "大きな夕日が海に沈もうとしていた。",
        "korean": "큰 석양이 바다로 막 지려 하고 있었다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-167",
    "no": 167,
    "noLabel": "167",
    "level": "N2",
    "expression": "ようものなら",
    "connection": "V意向形+ものなら",
    "meaningKo": "만약에 ~하면（경고）",
    "nuanceKo": "그렇게 하면 큰일 난다는 경고.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ものなら",
      "たら大変だ"
    ],
    "warningKo": "경고·협박 뉘앙스. 「欠席しようものなら、大変だ」처럼 나쁜 결과 경고. 160번과 구별.",
    "examples": [
      {
        "id": "n2-167-ex-1",
        "japanese": "この学校は規則が厳しいから、断らずに欠席しようものなら、大変だ。",
        "korean": "이 학교는 규칙이 엄격해서 말없이 결석하기라도 하면 큰일이다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-168",
    "no": 168,
    "noLabel": "168",
    "level": "N2",
    "expression": "わけがない",
    "connection": "普通形+わけがない",
    "meaningKo": "~할 리가 없다",
    "nuanceKo": "강한 부정. 논리상 그럴 수 없음.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "はずがない",
      "っこない"
    ],
    "warningKo": "논리적 부정. はずがない는 기대·예상의 부정, わけがない는 이치상 불가. 뉘앙스 차이 빈출.",
    "examples": [
      {
        "id": "n2-168-ex-1",
        "japanese": "こんな漢字の多い本をあの子が読むわけがない。",
        "korean": "이런 한자가 많은 책을 그 아이가 읽을 리가 없다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-169",
    "no": 169,
    "noLabel": "169",
    "level": "N2",
    "expression": "わけではない",
    "connection": "普通形+わけではない",
    "meaningKo": "꼭 ~인 것만은 아니다",
    "nuanceKo": "부분 부정. 전면 부정은 아님.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "とは限らない",
      "というものではない"
    ],
    "warningKo": "부분 부정. 「全部わけではない」처럼 전면 부정이 아님을 명시. わけがない와 혼동 주의.",
    "examples": [
      {
        "id": "n2-169-ex-1",
        "japanese": "私は学生時代に勉強ばかりしていたわけではない。よく旅行もした。",
        "korean": "나는 학생 시절 공부만 했던 것은 아니다. 여행도 자주 했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-170",
    "no": 170,
    "noLabel": "170",
    "level": "N2",
    "expression": "わけにはいかない",
    "connection": "V辞書形+わけにはいかない",
    "meaningKo": "~할 수 없다（사회적 이유）",
    "nuanceKo": "사회적·도덕적 이유로 할 수 없음.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ざるを得ない",
      "てはいけない"
    ],
    "warningKo": "사회적·도덕적 이유로 불가. 「あげるわけにはいかない」= 줄 수 없음(내부 규범). 외부 금지 てはいけない와 다름.",
    "examples": [
      {
        "id": "n2-170-ex-1",
        "japanese": "これは亡くなった友人がくれた大切なもので、あげるわけにはいかないんです。",
        "korean": "이것은 세상을 떠난 친구가 준 소중한 물건이라 줄 수 없습니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-171",
    "no": 171,
    "noLabel": "171",
    "level": "N2",
    "expression": "わりに（は）",
    "connection": "普通形+わりに / Nの+わりに",
    "meaningKo": "~에 비해서는, ~보다（는）",
    "nuanceKo": "기준·예상과 비교해 의외.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にしては",
      "くせに"
    ],
    "warningKo": "기대 대비 의외. くせに는 부정적 비난, わりに는 중립적 의외. にしては도 유사하나 わりに가 더 양적 비교.",
    "examples": [
      {
        "id": "n2-171-ex-1",
        "japanese": "このくつは値段が高いわりによく売れる。",
        "korean": "이 신발은 가격이 비싼 것에 비해 잘 팔린다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-172",
    "no": 172,
    "noLabel": "172",
    "level": "N2",
    "expression": "を契機に",
    "connection": "N+を契機に（して）",
    "meaningKo": "~을 계기로 해서",
    "nuanceKo": "어떤 사건이 전환점이 됨.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "をきっかけに",
      "をもとに"
    ],
    "warningKo": "「災害を契機に」처럼 중요 사건이 전환점이 됨. をきっかけに보다 더 격식적·공식적.",
    "examples": [
      {
        "id": "n2-172-ex-1",
        "japanese": "この災害を契機にして、わが家でも防災対策を強化することにした。",
        "korean": "이 재해를 계기로 우리 집에서도 방재 대책을 강화하기로 했다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-173",
    "no": 173,
    "noLabel": "173",
    "level": "N2",
    "expression": "を問わず",
    "connection": "N+を問わず",
    "meaningKo": "~하지 않고, ~을 불문하고",
    "nuanceKo": "조건과 관계없이 모두 포함.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "にかかわらず",
      "を問わず"
    ],
    "warningKo": "「国内外を問わず」처럼 범위 전체 포함. にかかわらず와 거의 동의이나 を問わず는 명사에만.",
    "examples": [
      {
        "id": "n2-173-ex-1",
        "japanese": "近年、文化財保護の問題は、国の内外を問わず大きな関心を呼んでいる。",
        "korean": "최근 문화재 보호 문제는 국내외를 불문하고 큰 관심을 불러일으키고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-174",
    "no": 174,
    "noLabel": "174",
    "level": "N2",
    "expression": "を抜きにして",
    "connection": "N+を抜きにして",
    "meaningKo": "~을 빼고, ~을 제쳐두고",
    "nuanceKo": "어떤 요소를 제외함.",
    "register": "중립",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ぬきで",
      "はさておき"
    ],
    "warningKo": "어떤 요소를 완전히 제외. 「を抜きにしては」= ~없이는. ぬきで보다 조금 더 격식적.",
    "examples": [
      {
        "id": "n2-174-ex-1",
        "japanese": "今日は硬い話を抜きにして、気楽に楽しく飲みましょう。",
        "korean": "오늘은 딱딱한 이야기는 빼고 편하게 즐겁게 마십시다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-175",
    "no": 175,
    "noLabel": "175",
    "level": "N2",
    "expression": "をはじめ",
    "connection": "N+をはじめ / N+をはじめとして",
    "meaningKo": "~을 비롯",
    "nuanceKo": "대표 예시를 들고 전체를 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "など",
      "ばかりか"
    ],
    "warningKo": "「富士山をはじめ」처럼 대표 예시 후 전체. 뒤에 구체적 열거가 이어짐.",
    "examples": [
      {
        "id": "n2-175-ex-1",
        "japanese": "今年は富士山をはじめ、各地の有名な山に登ろう。",
        "korean": "올해는 후지산을 비롯해 각지의 유명한 산에 오르자."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-176",
    "no": 176,
    "noLabel": "176",
    "level": "N2",
    "expression": "をめぐって",
    "connection": "N+をめぐって",
    "meaningKo": "~을 둘러싸고, ~에 관해서",
    "nuanceKo": "논쟁·대립·논의의 중심 주제.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "について",
      "に関して"
    ],
    "warningKo": "「再開発をめぐって」처럼 논쟁·대립 주제. に関して는 단순 화제, をめぐって는 갈등·분쟁 맥락.",
    "examples": [
      {
        "id": "n2-176-ex-1",
        "japanese": "町の再開発をめぐって、住民が争っている。",
        "korean": "마을 재개발을 둘러싸고 주민들이 다투고 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-177",
    "no": 177,
    "noLabel": "177",
    "level": "N2",
    "expression": "をもとに",
    "connection": "N+をもとに（して）",
    "meaningKo": "~에서, ~을 참조해서, ~을 가지고",
    "nuanceKo": "자료·아이디어를 바탕으로 새로 만듦.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "に基づいて",
      "にもとづいて"
    ],
    "warningKo": "「データをもとに」처럼 출발 재료. に基づいて는 규칙·원칙 준수, をもとに는 참조·가공.",
    "examples": [
      {
        "id": "n2-177-ex-1",
        "japanese": "ポップスの中には有名なクラシックの曲の一部をもとにしたものがある。",
        "korean": "팝송 중에는 유명한 클래식 곡의 일부를 바탕으로 한 것이 있다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-178",
    "no": 178,
    "noLabel": "178",
    "level": "N2",
    "expression": "んじゃない",
    "connection": "V辞書形+んじゃない",
    "meaningKo": "~하지 마라, ~하면 안 된다",
    "nuanceKo": "금지. 회화적이고 강한 말투.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "な",
      "てはいけない"
    ],
    "warningKo": "구어체 금지. 「食べるんじゃない」처럼 직접적. てはいけない보다 강하고 거칠음.",
    "examples": [
      {
        "id": "n2-178-ex-1",
        "japanese": "食べ物の好き嫌いを言うんじゃありませんよ。",
        "korean": "음식 좋고 싫음을 말하는 거 아니야."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-179",
    "no": 179,
    "noLabel": "추가1",
    "level": "N2",
    "expression": "んだ",
    "connection": "V辞書形+んだ",
    "meaningKo": "~해라, ~하거라",
    "nuanceKo": "설명·명령. 선생님이나 윗사람이 말하는 느낌.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "なさい",
      "のだ"
    ],
    "warningKo": "설명·명령 兼用. 「勉強するんだ」처럼 강한 지시. のだ보다 더 직접적·구어적.",
    "examples": [
      {
        "id": "n2-179-ex-1",
        "japanese": "漢字は毎日、毎日、書いて覚えるんです。",
        "korean": "한자는 매일매일 써서 외우는 겁니다."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-180",
    "no": 180,
    "noLabel": "추가2",
    "level": "N2",
    "expression": "んだった",
    "connection": "V辞書形+んだった",
    "meaningKo": "~할 걸, ~하면 좋았을 텐데",
    "nuanceKo": "후회.",
    "register": "회화체",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "ばよかった",
      "のだった"
    ],
    "warningKo": "「もっと勉強するんだった」처럼 후회. ばよかった와 거의 동의지만 んだった가 더 구어적.",
    "examples": [
      {
        "id": "n2-180-ex-1",
        "japanese": "こんなことならもっと勉強するんだった。",
        "korean": "이럴 줄 알았으면 더 공부할 걸."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-181",
    "no": 181,
    "noLabel": "추가3",
    "level": "N2",
    "expression": "んだって",
    "connection": "普通形+んだって",
    "meaningKo": "~래, ~한대",
    "nuanceKo": "들은 말 전달. 전문.",
    "register": "회화체",
    "frequency": 1,
    "similarGrammarIds": [],
    "similarExpressionNames": [
      "そうだ（전문）",
      "って"
    ],
    "warningKo": "들은 내용을 전달. 매우 구어적. 「んですって」로 쓰면 약간 더 공손한 표현.",
    "examples": [
      {
        "id": "n2-181-ex-1",
        "japanese": "来年この駅にも駅ビルができるんだって。",
        "korean": "내년에 이 역에도 역 빌딩이 생긴대."
      }
    ],
    "tags": []
  },
  {
    "id": "n2-182",
    "no": 182,
    "noLabel": "부조사1",
    "level": "N2",
    "expression": "だけ",
    "connection": "N+だけ / 普通形+だけ",
    "meaningKo": "~만, ~뿐",
    "nuanceKo": "범위를 한정하는 가장 일반적이고 중립적인 표현.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-183",
      "n2-110"
    ],
    "similarExpressionNames": [
      "のみ",
      "に限り"
    ],
    "warningKo": "のみ보다 일상적이다. 「AだけでなくBも」는 'A뿐만 아니라 B도'라는 뜻이다.",
    "examples": [
      {
        "id": "n2-182-ex-1",
        "japanese": "今日は水だけ飲んだ。",
        "korean": "오늘은 물만 마셨다."
      }
    ],
    "tags": [
      "부조사",
      "제한"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + だけ",
        "text": "だけ",
        "requiredContext": "일반적으로 범위를 한정하는 문장",
        "note": "가장 일반적인 '~만'"
      }
    ]
  },
  {
    "id": "n2-183",
    "no": 183,
    "noLabel": "부조사2",
    "level": "N2",
    "expression": "のみ",
    "connection": "N+のみ / 普通形+のみ",
    "meaningKo": "~만, ~에 한하여",
    "nuanceKo": "범위를 딱 잘라 제한하는 문어적·공식적인 표현.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-182",
      "n2-110"
    ],
    "similarExpressionNames": [
      "だけ",
      "に限り"
    ],
    "warningKo": "안내문·규정처럼 공식적인 상황에 자주 쓴다. 일상 회화에서는 だけ가 더 자연스럽다.",
    "examples": [
      {
        "id": "n2-183-ex-1",
        "japanese": "関係者のみ入場できます。",
        "korean": "관계자만 입장할 수 있습니다."
      }
    ],
    "tags": [
      "부조사",
      "제한",
      "문어"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + のみ",
        "text": "のみ",
        "requiredContext": "공식적으로 범위를 제한하는 문장",
        "note": "문어적·공식적인 '~만'"
      }
    ]
  },
  {
    "id": "n2-184",
    "no": 184,
    "noLabel": "부조사3",
    "level": "N2",
    "expression": "こそ",
    "connection": "N+こそ / 普通形+からこそ",
    "meaningKo": "~야말로, 바로 ~",
    "nuanceKo": "다른 대상이 아니라 바로 그것임을 강하게 강조함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-129",
      "n2-070"
    ],
    "similarExpressionNames": [
      "にほかならない",
      "てこそ"
    ],
    "warningKo": "단순 제한이 아니라 대상을 강하게 내세운다. 「今度こそ」는 '이번에야말로'라는 뜻이다.",
    "examples": [
      {
        "id": "n2-184-ex-1",
        "japanese": "今度こそ合格したい。",
        "korean": "이번에야말로 합격하고 싶다."
      }
    ],
    "tags": [
      "부조사",
      "강조"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + こそ",
        "text": "こそ",
        "requiredContext": "특정 대상을 강하게 강조하는 문장",
        "note": "바로 '~야말로'"
      }
    ]
  },
  {
    "id": "n2-185",
    "no": 185,
    "noLabel": "부조사4",
    "level": "N2",
    "expression": "さえ",
    "connection": "N+さえ / N+さえ+ば",
    "meaningKo": "~조차, ~만 있으면",
    "nuanceKo": "극단적인 예나 최소 조건을 들어 범위를 강조함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-186",
      "n2-090"
    ],
    "similarExpressionNames": [
      "すら",
      "として~ない"
    ],
    "warningKo": "「さえ〜ば」는 '~만 있으면, ~하기만 하면'이라는 최소 조건을 나타낸다.",
    "examples": [
      {
        "id": "n2-185-ex-1",
        "japanese": "名前さえ書けない。",
        "korean": "이름조차 쓰지 못한다."
      },
      {
        "id": "n2-185-ex-2",
        "japanese": "お金さえあれば、留学できる。",
        "korean": "돈만 있으면 유학할 수 있다."
      }
    ],
    "tags": [
      "부조사",
      "극단",
      "최소조건"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + さえ",
        "text": "さえ",
        "requiredContext": "극단적인 예나 최소 조건을 나타내는 문장",
        "note": "'~조차' 또는 '그것만 있으면'"
      }
    ]
  },
  {
    "id": "n2-186",
    "no": 186,
    "noLabel": "부조사5",
    "level": "N2",
    "expression": "すら",
    "connection": "N+すら",
    "meaningKo": "~조차",
    "nuanceKo": "예상 밖의 극단적인 대상을 문어적이고 딱딱하게 강조함.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-185",
      "n2-090"
    ],
    "similarExpressionNames": [
      "さえ",
      "として~ない"
    ],
    "warningKo": "さえ와 뜻은 비슷하지만 더 문어적이며 부정적인 문장에 자주 쓰인다.",
    "examples": [
      {
        "id": "n2-186-ex-1",
        "japanese": "彼は理由すら説明しなかった。",
        "korean": "그는 이유조차 설명하지 않았다."
      }
    ],
    "tags": [
      "부조사",
      "극단",
      "문어"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + すら",
        "text": "すら",
        "requiredContext": "문어적으로 극단적인 예를 강조하는 문장",
        "note": "딱딱한 '~조차'"
      }
    ]
  },
  {
    "id": "n2-187",
    "no": 187,
    "noLabel": "부조사6",
    "level": "N2",
    "expression": "でも",
    "connection": "N+でも",
    "meaningKo": "~라도, ~같은 것이라도",
    "nuanceKo": "부담 없는 예를 가볍게 제시하거나 양보의 대상을 듦.",
    "register": "회화체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-188",
      "n2-189"
    ],
    "similarExpressionNames": [
      "など",
      "なんか"
    ],
    "warningKo": "권유에서는 「お茶でも」처럼 가벼운 예시를 든다. 조건의 '해도'를 나타내는 ても와 구별한다.",
    "examples": [
      {
        "id": "n2-187-ex-1",
        "japanese": "お茶でも飲みませんか。",
        "korean": "차라도 마시지 않을래요?"
      }
    ],
    "tags": [
      "부조사",
      "예시",
      "양보"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + でも",
        "text": "でも",
        "requiredContext": "가벼운 예시나 양보의 대상을 드는 문장",
        "note": "'~라도, ~같은 것이라도'"
      }
    ]
  },
  {
    "id": "n2-188",
    "no": 188,
    "noLabel": "부조사7",
    "level": "N2",
    "expression": "など",
    "connection": "N+など / 普通形+など",
    "meaningKo": "~등, ~따위",
    "nuanceKo": "문어적으로 예를 들거나 대상을 낮추어 말함.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-189",
      "n2-190",
      "n2-104"
    ],
    "similarExpressionNames": [
      "なんか",
      "なんて"
    ],
    "warningKo": "なんか보다 문어적이다. 문맥에 따라 단순 예시인 '~등'과 낮춤인 '~따위'가 된다.",
    "examples": [
      {
        "id": "n2-188-ex-1",
        "japanese": "ゲームなどしている場合ではない。",
        "korean": "게임 따위를 하고 있을 때가 아니다."
      }
    ],
    "tags": [
      "부조사",
      "예시",
      "낮춤",
      "문어"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + など",
        "text": "など",
        "requiredContext": "문어적으로 예를 들거나 낮추어 말하는 문장",
        "note": "문어적 '~등, ~따위'"
      }
    ]
  },
  {
    "id": "n2-189",
    "no": 189,
    "noLabel": "부조사8",
    "level": "N2",
    "expression": "なんか",
    "connection": "N+なんか",
    "meaningKo": "~같은 것, ~따위",
    "nuanceKo": "회화에서 가볍게 예를 들거나 대상을 낮추어 말함.",
    "register": "회화체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-188",
      "n2-190",
      "n2-104"
    ],
    "similarExpressionNames": [
      "など",
      "なんて"
    ],
    "warningKo": "など의 구어적인 형태에 가깝다. 자기 자신에게 쓰면 겸손이나 자기 낮춤을 나타낼 수 있다.",
    "examples": [
      {
        "id": "n2-189-ex-1",
        "japanese": "コーヒーなんかどう？",
        "korean": "커피 같은 거 어때?"
      }
    ],
    "tags": [
      "부조사",
      "예시",
      "낮춤",
      "회화"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + なんか",
        "text": "なんか",
        "requiredContext": "회화에서 가볍게 예를 들거나 낮추어 말하는 문장",
        "note": "구어적 '~같은 것, ~따위'"
      }
    ]
  },
  {
    "id": "n2-190",
    "no": 190,
    "noLabel": "부조사9",
    "level": "N2",
    "expression": "なんて",
    "connection": "N+なんて / 普通形+なんて",
    "meaningKo": "~라니, ~따위",
    "nuanceKo": "놀람·의외·비판을 드러내거나 대상을 낮추어 말함.",
    "register": "회화체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-188",
      "n2-189",
      "n2-104"
    ],
    "similarExpressionNames": [
      "など",
      "なんか"
    ],
    "warningKo": "문장 전체 뒤에서는 '~라니'라는 놀람이 강하다. 명사 뒤에서는 '~따위'라는 낮춤이 될 수 있다.",
    "examples": [
      {
        "id": "n2-190-ex-1",
        "japanese": "彼が合格するなんて信じられない。",
        "korean": "그가 합격하다니 믿을 수 없다."
      }
    ],
    "tags": [
      "부조사",
      "놀람",
      "비판",
      "낮춤"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "普通形 + なんて",
        "text": "なんて",
        "requiredContext": "놀람이나 비판을 나타내는 문장",
        "note": "'~라니, ~따위'"
      }
    ]
  },
  {
    "id": "n2-191",
    "no": 191,
    "noLabel": "부조사10",
    "level": "N2",
    "expression": "くらい / ぐらい",
    "connection": "数量+くらい / N+くらい / 普通形+くらい",
    "meaningKo": "~정도, ~만큼",
    "nuanceKo": "수량이나 상태의 대략적인 정도, 또는 최소한의 수준을 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-192",
      "n2-034"
    ],
    "similarExpressionNames": [
      "ほど",
      "くらいなら"
    ],
    "warningKo": "ぐらい는 くらい의 구어적 변형이다. 강한 정도나 비교 기준에는 ほど가 더 잘 쓰인다.",
    "examples": [
      {
        "id": "n2-191-ex-1",
        "japanese": "駅で十分くらい待った。",
        "korean": "역에서 10분 정도 기다렸다."
      }
    ],
    "tags": [
      "부조사",
      "정도",
      "대략"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "数量 + くらい",
        "text": "くらい",
        "requiredContext": "대략적인 수량이나 정도를 나타내는 문장",
        "note": "대략 '~정도'"
      }
    ]
  },
  {
    "id": "n2-192",
    "no": 192,
    "noLabel": "부조사11",
    "level": "N2",
    "expression": "ほど",
    "connection": "N+ほど / 普通形+ほど / 〜ば〜ほど",
    "meaningKo": "~정도, ~만큼, ~할수록",
    "nuanceKo": "정도가 매우 강함을 나타내거나 비교의 기준을 제시함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-191",
      "n2-057"
    ],
    "similarExpressionNames": [
      "くらい",
      "だけの"
    ],
    "warningKo": "「Aほど〜ない」는 'A만큼 ~하지 않다', 「〜ば〜ほど」는 '~하면 할수록'이라는 뜻이다.",
    "examples": [
      {
        "id": "n2-192-ex-1",
        "japanese": "今日は立っていられないほど疲れた。",
        "korean": "오늘은 서 있을 수 없을 만큼 피곤했다."
      }
    ],
    "tags": [
      "부조사",
      "정도",
      "비교"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "普通形 + ほど",
        "text": "ほど",
        "requiredContext": "강한 정도나 비교 기준을 나타내는 문장",
        "note": "강한 '~만큼, ~할수록'"
      }
    ]
  },
  {
    "id": "n2-193",
    "no": 193,
    "noLabel": "부조사12",
    "level": "N2",
    "expression": "まで",
    "connection": "N+まで",
    "meaningKo": "~까지, 심지어 ~까지",
    "nuanceKo": "범위의 끝을 나타내며 예상 밖의 대상까지 포함됨을 강조함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-149",
      "n2-185"
    ],
    "similarExpressionNames": [
      "までして",
      "さえ"
    ],
    "warningKo": "단순한 도착점뿐 아니라 「親にまで」처럼 의외의 대상까지 포함한다는 뜻으로도 쓴다.",
    "examples": [
      {
        "id": "n2-193-ex-1",
        "japanese": "親にまで反対された。",
        "korean": "부모에게까지 반대당했다."
      }
    ],
    "tags": [
      "부조사",
      "범위",
      "강조"
    ],
    "blankChoiceForms": [
      {
        "formId": "particle",
        "label": "N + まで",
        "text": "まで",
        "requiredContext": "범위의 끝이나 의외의 포함을 나타내는 문장",
        "note": "'~까지, 심지어 ~까지'"
      }
    ]
  },
  {
    "id": "n2-194",
    "no": 194,
    "noLabel": "194",
    "level": "N2",
    "expression": "一方だ",
    "connection": "V辞書形+一方だ",
    "meaningKo": "계속 ~하기만 하다, 점점 ~해 가다",
    "nuanceKo": "변화가 한 방향으로 계속 진행됨. 대체로 부정적인 변화에 자주 사용.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-240",
      "n2-242",
      "n2-249"
    ],
    "similarExpressionNames": [
      "に従って",
      "につれて",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-194-ex-1",
        "japanese": "この町の人口は減る一方だ。",
        "korean": "이 마을의 인구는 계속 줄어들기만 한다."
      }
    ],
    "tags": [
      "변화",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "一方だ",
        "text": "一方だ",
        "requiredContext": "V辞書形 + 一方だ",
        "note": "변화가 한 방향으로 계속 진행됨. 대체로 부정적인 변화에 자주 사용."
      }
    ]
  },
  {
    "id": "n2-195",
    "no": 195,
    "noLabel": "195",
    "level": "N2",
    "expression": "上に",
    "connection": "普通形+上に / なAな・である+上に / Nの・である+上に",
    "meaningKo": "~한 데다가, ~뿐만 아니라",
    "nuanceKo": "같은 방향의 특징이나 사정을 하나 더 덧붙임.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-250"
    ],
    "similarExpressionNames": [
      "はもちろん"
    ],
    "examples": [
      {
        "id": "n2-195-ex-1",
        "japanese": "この店は料理がおいしい上に、値段も安い。",
        "korean": "이 가게는 음식이 맛있는 데다가 가격도 싸다."
      }
    ],
    "tags": [
      "추가",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "上に",
        "text": "上に",
        "requiredContext": "普通形 + 上に / なAな・である + 上に / Nの・である + 上に",
        "note": "같은 방향의 특징이나 사정을 하나 더 덧붙임."
      }
    ]
  },
  {
    "id": "n2-196",
    "no": 196,
    "noLabel": "196",
    "level": "N2",
    "expression": "～上（じょう）",
    "connection": "N+上",
    "meaningKo": "~상, ~의 측면에서",
    "nuanceKo": "제도·법률·계산·이론 등 특정 관점이나 분야를 나타내는 문어적 표현.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-201",
      "n2-232",
      "n2-235",
      "n2-237"
    ],
    "similarExpressionNames": [
      "にすれば",
      "として",
      "において / における",
      "について"
    ],
    "examples": [
      {
        "id": "n2-196-ex-1",
        "japanese": "この建物は法律上の問題がある。",
        "korean": "이 건물은 법률상의 문제가 있다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "～上（じょう）",
        "text": "上",
        "requiredContext": "N + 上",
        "note": "제도·법률·계산·이론 등 특정 관점이나 분야를 나타내는 문어적 표현."
      }
    ]
  },
  {
    "id": "n2-197",
    "no": 197,
    "noLabel": "197",
    "level": "N2",
    "expression": "うちに / ないうちに",
    "connection": "V辞書形・Vている・Vない形+うちに / いA+うちに / なAな+うちに / Nの+うちに",
    "meaningKo": "~하는 동안에, ~하기 전에",
    "nuanceKo": "상태가 유지되는 동안 행동하거나, 변화가 생기기 전에 행동함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-199",
      "n2-200",
      "n2-202",
      "n2-221"
    ],
    "similarExpressionNames": [
      "やいなや",
      "そばから",
      "～から～にかけて",
      "ついでに"
    ],
    "examples": [
      {
        "id": "n2-197-ex-1",
        "japanese": "日本にいるうちに、京都を訪ねたい。",
        "korean": "일본에 있는 동안 교토를 방문하고 싶다."
      },
      {
        "id": "n2-197-ex-2",
        "japanese": "忘れないうちに、メモしておこう。",
        "korean": "잊기 전에 메모해 두자."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "うちに / ないうちに",
        "text": "うちに",
        "requiredContext": "V辞書形・Vている・Vない形 + うちに / いA + うちに / なAな + うちに / Nの + うちに",
        "note": "상태가 유지되는 동안 행동하거나, 변화가 생기기 전에 행동함."
      }
    ]
  },
  {
    "id": "n2-198",
    "no": 198,
    "noLabel": "198",
    "level": "N2",
    "expression": "おかげで / せいで",
    "connection": "普通形+おかげで・せいで / なAな+おかげで・せいで / Nの+おかげで・せいで",
    "meaningKo": "~덕분에 / ~탓에",
    "nuanceKo": "おかげで는 좋은 결과의 원인, せいで는 나쁜 결과의 원인을 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-207",
      "n2-234",
      "n2-246"
    ],
    "similarExpressionNames": [
      "ことから",
      "とみえて",
      "によると / によれば"
    ],
    "examples": [
      {
        "id": "n2-198-ex-1",
        "japanese": "先生のおかげで、試験に合格できた。",
        "korean": "선생님 덕분에 시험에 합격할 수 있었다."
      },
      {
        "id": "n2-198-ex-2",
        "japanese": "電車が遅れたせいで、会議に遅刻した。",
        "korean": "전철이 늦은 탓에 회의에 지각했다."
      }
    ],
    "tags": [
      "원인",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "おかげで / せいで",
        "text": "おかげで",
        "requiredContext": "普通形 + おかげで・せいで / なAな + おかげで・せいで / Nの + おかげで・せいで",
        "note": "おかげで는 좋은 결과의 원인, せいで는 나쁜 결과의 원인을 나타냄."
      }
    ]
  },
  {
    "id": "n2-199",
    "no": 199,
    "noLabel": "199",
    "level": "N2",
    "expression": "やいなや",
    "connection": "V辞書形+やいなや",
    "meaningKo": "~하자마자",
    "nuanceKo": "앞 동작 직후 거의 동시에 다음 일이 일어남. 문어적이고 속도감이 강함.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-200",
      "n2-202",
      "n2-221"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "そばから",
      "～から～にかけて",
      "ついでに"
    ],
    "examples": [
      {
        "id": "n2-199-ex-1",
        "japanese": "ベルが鳴るやいなや、学生たちは教室を飛び出した。",
        "korean": "벨이 울리자마자 학생들은 교실을 뛰쳐나갔다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "やいなや",
        "text": "やいなや",
        "requiredContext": "V辞書形 + やいなや",
        "note": "앞 동작 직후 거의 동시에 다음 일이 일어남. 문어적이고 속도감이 강함."
      }
    ]
  },
  {
    "id": "n2-200",
    "no": 200,
    "noLabel": "200",
    "level": "N2",
    "expression": "そばから",
    "connection": "V辞書形・Vた+そばから",
    "meaningKo": "~하자마자 또, ~하는 족족",
    "nuanceKo": "앞 행동을 해도 곧바로 원래 상태로 돌아가거나 같은 문제가 반복됨.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-202",
      "n2-221"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "～から～にかけて",
      "ついでに"
    ],
    "examples": [
      {
        "id": "n2-200-ex-1",
        "japanese": "覚えたそばから、単語を忘れてしまう。",
        "korean": "외우는 족족 단어를 잊어버린다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "そばから",
        "text": "そばから",
        "requiredContext": "V辞書形・Vた + そばから",
        "note": "앞 행동을 해도 곧바로 원래 상태로 돌아가거나 같은 문제가 반복됨."
      }
    ]
  },
  {
    "id": "n2-201",
    "no": 201,
    "noLabel": "201",
    "level": "N2",
    "expression": "にすれば",
    "connection": "N+にすれば",
    "meaningKo": "~입장에서 보면",
    "nuanceKo": "특정 사람이나 집단의 입장에서 판단함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-196",
      "n2-232",
      "n2-235",
      "n2-237"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "として",
      "において / における",
      "について"
    ],
    "examples": [
      {
        "id": "n2-201-ex-1",
        "japanese": "親にすれば、子供の安全が何より大切だ。",
        "korean": "부모 입장에서 보면 자녀의 안전이 무엇보다 중요하다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "にすれば",
        "text": "にすれば",
        "requiredContext": "N + にすれば",
        "note": "특정 사람이나 집단의 입장에서 판단함."
      }
    ]
  },
  {
    "id": "n2-202",
    "no": 202,
    "noLabel": "202",
    "level": "N2",
    "expression": "～から～にかけて",
    "connection": "N+から+N+にかけて",
    "meaningKo": "~부터 ~에 걸쳐",
    "nuanceKo": "시간이나 장소의 대략적인 범위를 나타냄. 경계가 엄밀하지 않음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-221"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "ついでに"
    ],
    "examples": [
      {
        "id": "n2-202-ex-1",
        "japanese": "今夜から明日の朝にかけて、大雨になるでしょう。",
        "korean": "오늘 밤부터 내일 아침에 걸쳐 큰비가 내릴 것입니다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "～から～にかけて",
        "text": "にかけて",
        "requiredContext": "N + から + N + にかけて",
        "note": "시간이나 장소의 대략적인 범위를 나타냄. 경계가 엄밀하지 않음."
      }
    ]
  },
  {
    "id": "n2-203",
    "no": 203,
    "noLabel": "203",
    "level": "N2",
    "expression": "代わりに",
    "connection": "V普通形+代わりに / Nの+代わりに",
    "meaningKo": "~하는 대신에, ~을 대신하여",
    "nuanceKo": "교환·대체·보상의 관계를 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-204"
    ],
    "similarExpressionNames": [
      "に代わって"
    ],
    "examples": [
      {
        "id": "n2-203-ex-1",
        "japanese": "私が料理する代わりに、あなたは皿を洗ってください。",
        "korean": "내가 요리하는 대신 당신은 설거지를 해 주세요."
      }
    ],
    "tags": [
      "대체",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "代わりに",
        "text": "代わりに",
        "requiredContext": "V普通形 + 代わりに / Nの + 代わりに",
        "note": "교환·대체·보상의 관계를 나타냄."
      }
    ]
  },
  {
    "id": "n2-204",
    "no": 204,
    "noLabel": "204",
    "level": "N2",
    "expression": "に代わって",
    "connection": "N+に代わって",
    "meaningKo": "~을 대신하여",
    "nuanceKo": "사람·조직·기존 수단의 역할을 다른 대상이 대신함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-203"
    ],
    "similarExpressionNames": [
      "代わりに"
    ],
    "examples": [
      {
        "id": "n2-204-ex-1",
        "japanese": "社長に代わって、私がご挨拶申し上げます。",
        "korean": "사장님을 대신하여 제가 인사 말씀을 드리겠습니다."
      }
    ],
    "tags": [
      "대체",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に代わって",
        "text": "に代わって",
        "requiredContext": "N + に代わって",
        "note": "사람·조직·기존 수단의 역할을 다른 대상이 대신함."
      }
    ]
  },
  {
    "id": "n2-205",
    "no": 205,
    "noLabel": "205",
    "level": "N2",
    "expression": "気だ",
    "connection": "V辞書形・Vない形+気だ",
    "meaningKo": "~할 생각이다, ~할 작정이다",
    "nuanceKo": "화자의 의도나 마음가짐을 나타냄.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-211",
      "n2-227"
    ],
    "similarExpressionNames": [
      "ことにする",
      "てみせる"
    ],
    "examples": [
      {
        "id": "n2-205-ex-1",
        "japanese": "来年、日本へ留学する気だ。",
        "korean": "내년에 일본으로 유학할 생각이다."
      }
    ],
    "tags": [
      "의지",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "気だ",
        "text": "気だ",
        "requiredContext": "V辞書形・Vない形 + 気だ",
        "note": "화자의 의도나 마음가짐을 나타냄."
      }
    ]
  },
  {
    "id": "n2-206",
    "no": 206,
    "noLabel": "206",
    "level": "N2",
    "expression": "こそ / こちらこそ / からこそ / ようこそ",
    "connection": "N+こそ / 普通形+からこそ",
    "meaningKo": "바로 ~야말로 / 저야말로 / ~이기 때문에야말로 / 어서 오세요",
    "nuanceKo": "대상을 강하게 강조함. からこそ는 원인을 특별히 강조.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-212",
      "n2-213"
    ],
    "similarExpressionNames": [
      "でさえ / すら",
      "さえ～ば"
    ],
    "examples": [
      {
        "id": "n2-206-ex-1",
        "japanese": "努力したからこそ、成功できたのだ。",
        "korean": "노력했기 때문에야말로 성공할 수 있었던 것이다."
      }
    ],
    "tags": [
      "강조",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "こそ / こちらこそ / からこそ / ようこそ",
        "text": "からこそ",
        "requiredContext": "N + こそ / 普通形 + からこそ",
        "note": "대상을 강하게 강조함. からこそ는 원인을 특별히 강조."
      }
    ]
  },
  {
    "id": "n2-207",
    "no": 207,
    "noLabel": "207",
    "level": "N2",
    "expression": "ことから",
    "connection": "普通形+ことから / Nである+ことから",
    "meaningKo": "~라는 점에서, ~로 인해",
    "nuanceKo": "판단·명칭·결론의 근거를 제시함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-198",
      "n2-234",
      "n2-246"
    ],
    "similarExpressionNames": [
      "おかげで / せいで",
      "とみえて",
      "によると / によれば"
    ],
    "examples": [
      {
        "id": "n2-207-ex-1",
        "japanese": "道が星の形をしていることから、この町は「星の町」と呼ばれている。",
        "korean": "길이 별 모양을 하고 있다는 점에서 이 마을은 ‘별의 마을’이라고 불린다."
      }
    ],
    "tags": [
      "원인",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ことから",
        "text": "ことから",
        "requiredContext": "普通形 + ことから / Nである + ことから",
        "note": "판단·명칭·결론의 근거를 제시함."
      }
    ]
  },
  {
    "id": "n2-208",
    "no": 208,
    "noLabel": "208",
    "level": "N2",
    "expression": "ことは～が",
    "connection": "普通形+ことは+同じ語+が",
    "meaningKo": "~하기는 하지만",
    "nuanceKo": "앞 사실을 인정하면서 뒤에서 제한이나 반대 내용을 덧붙임.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [],
    "examples": [
      {
        "id": "n2-208-ex-1",
        "japanese": "この本は読んだことは読んだが、内容はよく覚えていない。",
        "korean": "이 책을 읽기는 읽었지만 내용은 잘 기억나지 않는다."
      }
    ],
    "tags": [
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ことは～が",
        "text": "ことは読んだが",
        "requiredContext": "普通形 + ことは + 同じ語 + が",
        "note": "앞 사실을 인정하면서 뒤에서 제한이나 반대 내용을 덧붙임."
      }
    ]
  },
  {
    "id": "n2-209",
    "no": 209,
    "noLabel": "209",
    "level": "N2",
    "expression": "ことはない",
    "connection": "V辞書形+ことはない",
    "meaningKo": "~할 필요는 없다",
    "nuanceKo": "상대를 안심시키거나 불필요한 행동을 하지 말라고 조언함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-215"
    ],
    "similarExpressionNames": [
      "しかない / ほかない"
    ],
    "examples": [
      {
        "id": "n2-209-ex-1",
        "japanese": "そんなに心配することはない。",
        "korean": "그렇게 걱정할 필요는 없다."
      }
    ],
    "tags": [
      "불필요",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ことはない",
        "text": "ことはない",
        "requiredContext": "V辞書形 + ことはない",
        "note": "상대를 안심시키거나 불필요한 행동을 하지 말라고 조언함."
      }
    ]
  },
  {
    "id": "n2-210",
    "no": 210,
    "noLabel": "210",
    "level": "N2",
    "expression": "ことになる",
    "connection": "V辞書形・Vない形+ことになる",
    "meaningKo": "~하게 되다, ~하기로 정해지다",
    "nuanceKo": "자신의 직접적인 의지보다 외부 결정이나 상황에 의해 정해짐.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-211"
    ],
    "similarExpressionNames": [
      "ことにする"
    ],
    "examples": [
      {
        "id": "n2-210-ex-1",
        "japanese": "来月、大阪へ転勤することになった。",
        "korean": "다음 달 오사카로 전근하게 되었다."
      }
    ],
    "tags": [
      "결정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ことになる",
        "text": "ことになった",
        "requiredContext": "V辞書形・Vない形 + ことになる",
        "note": "자신의 직접적인 의지보다 외부 결정이나 상황에 의해 정해짐."
      }
    ]
  },
  {
    "id": "n2-211",
    "no": 211,
    "noLabel": "211",
    "level": "N2",
    "expression": "ことにする",
    "connection": "V辞書形・Vない形+ことにする",
    "meaningKo": "~하기로 하다",
    "nuanceKo": "화자가 스스로 결정한 내용을 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-205",
      "n2-227",
      "n2-210"
    ],
    "similarExpressionNames": [
      "気だ",
      "てみせる",
      "ことになる"
    ],
    "examples": [
      {
        "id": "n2-211-ex-1",
        "japanese": "毎朝30分走ることにした。",
        "korean": "매일 아침 30분 달리기로 했다."
      }
    ],
    "tags": [
      "의지",
      "결정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ことにする",
        "text": "ことにした",
        "requiredContext": "V辞書形・Vない形 + ことにする",
        "note": "화자가 스스로 결정한 내용을 나타냄."
      }
    ]
  },
  {
    "id": "n2-212",
    "no": 212,
    "noLabel": "212",
    "level": "N2",
    "expression": "でさえ / すら",
    "connection": "N+でさえ / N+すら",
    "meaningKo": "~조차, ~마저",
    "nuanceKo": "극단적인 예를 들어 예상 밖임을 강조. すら가 더 문어적임.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-206",
      "n2-213"
    ],
    "similarExpressionNames": [
      "こそ / こちらこそ / からこそ / ようこそ",
      "さえ～ば"
    ],
    "examples": [
      {
        "id": "n2-212-ex-1",
        "japanese": "この問題は先生でさえ解けなかった。",
        "korean": "이 문제는 선생님조차 풀지 못했다."
      }
    ],
    "tags": [
      "강조",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "でさえ / すら",
        "text": "でさえ",
        "requiredContext": "N + でさえ / N + すら",
        "note": "극단적인 예를 들어 예상 밖임을 강조. すら가 더 문어적임."
      }
    ]
  },
  {
    "id": "n2-213",
    "no": 213,
    "noLabel": "213",
    "level": "N2",
    "expression": "さえ～ば",
    "connection": "N+さえ+条件形 / Vます形語幹+さえすれば",
    "meaningKo": "~만 하면",
    "nuanceKo": "그것 하나만 충족되면 충분하다는 최소 조건.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-206",
      "n2-212"
    ],
    "similarExpressionNames": [
      "こそ / こちらこそ / からこそ / ようこそ",
      "でさえ / すら"
    ],
    "examples": [
      {
        "id": "n2-213-ex-1",
        "japanese": "時間さえあれば、旅行に行きたい。",
        "korean": "시간만 있으면 여행을 가고 싶다."
      }
    ],
    "tags": [
      "강조",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "さえ～ば",
        "text": "さえあれば",
        "requiredContext": "N + さえ + 条件形 / Vます形語幹 + さえすれば",
        "note": "그것 하나만 충족되면 충분하다는 최소 조건."
      }
    ]
  },
  {
    "id": "n2-214",
    "no": 214,
    "noLabel": "214",
    "level": "N2",
    "expression": "させていただけませんか",
    "connection": "V使役て形+いただけませんか",
    "meaningKo": "제가 ~하게 해 주실 수 없겠습니까",
    "nuanceKo": "상대의 허가를 매우 정중하게 구하는 겸양 표현.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [],
    "examples": [
      {
        "id": "n2-214-ex-1",
        "japanese": "明日は少し早く帰らせていただけませんか。",
        "korean": "내일은 조금 일찍 돌아가게 해 주실 수 없겠습니까?"
      }
    ],
    "tags": [
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "させていただけませんか",
        "text": "らせていただけませんか",
        "requiredContext": "V使役て形 + いただけませんか",
        "note": "상대의 허가를 매우 정중하게 구하는 겸양 표현."
      }
    ]
  },
  {
    "id": "n2-215",
    "no": 215,
    "noLabel": "215",
    "level": "N2",
    "expression": "しかない / ほかない",
    "connection": "V辞書形+しかない・ほかない",
    "meaningKo": "~할 수밖에 없다",
    "nuanceKo": "다른 선택이나 방법이 없음을 나타냄. ほかない가 더 문어적임.",
    "register": "문어체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-209"
    ],
    "similarExpressionNames": [
      "ことはない"
    ],
    "examples": [
      {
        "id": "n2-215-ex-1",
        "japanese": "電車が止まったので、歩いて帰るしかない。",
        "korean": "전철이 멈췄으므로 걸어서 돌아갈 수밖에 없다."
      }
    ],
    "tags": [
      "불필요",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "しかない / ほかない",
        "text": "しかない",
        "requiredContext": "V辞書形 + しかない・ほかない",
        "note": "다른 선택이나 방법이 없음을 나타냄. ほかない가 더 문어적임."
      }
    ]
  },
  {
    "id": "n2-216",
    "no": 216,
    "noLabel": "216",
    "level": "N2",
    "expression": "だけのことはある",
    "connection": "普通形+だけのことはある / N+だけのことはある",
    "meaningKo": "과연 ~할 만하다, ~한 보람이 있다",
    "nuanceKo": "노력·경력·가격 등에 걸맞은 결과가 있음을 긍정적으로 평가.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-217",
      "n2-236"
    ],
    "similarExpressionNames": [
      "だけまし",
      "に限る"
    ],
    "examples": [
      {
        "id": "n2-216-ex-1",
        "japanese": "彼は十年間日本に住んでいただけのことはあって、日本語が上手だ。",
        "korean": "그는 10년 동안 일본에 산 만큼 역시 일본어를 잘한다."
      }
    ],
    "tags": [
      "평가",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "だけのことはある",
        "text": "だけのことはあって",
        "requiredContext": "普通形 + だけのことはある / N + だけのことはある",
        "note": "노력·경력·가격 등에 걸맞은 결과가 있음을 긍정적으로 평가."
      }
    ]
  },
  {
    "id": "n2-217",
    "no": 217,
    "noLabel": "217",
    "level": "N2",
    "expression": "だけまし",
    "connection": "普通形+だけましだ",
    "meaningKo": "~한 것만으로도 낫다",
    "nuanceKo": "좋지 않은 상황 중에서도 그나마 나은 점을 말함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-216",
      "n2-236"
    ],
    "similarExpressionNames": [
      "だけのことはある",
      "に限る"
    ],
    "examples": [
      {
        "id": "n2-217-ex-1",
        "japanese": "給料は安いが、仕事があるだけましだ。",
        "korean": "월급은 적지만 일이 있는 것만으로도 낫다."
      }
    ],
    "tags": [
      "평가",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "だけまし",
        "text": "だけましだ",
        "requiredContext": "普通形 + だけましだ",
        "note": "좋지 않은 상황 중에서도 그나마 나은 점을 말함."
      }
    ]
  },
  {
    "id": "n2-218",
    "no": 218,
    "noLabel": "218",
    "level": "N2",
    "expression": "たとえ～としても",
    "connection": "たとえ+普通形+としても",
    "meaningKo": "설령 ~라고 해도",
    "nuanceKo": "극단적인 가정을 인정해도 뒤의 결론은 변하지 않음.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-219",
      "n2-220"
    ],
    "similarExpressionNames": [
      "もし～としたら",
      "～たら（ば）～だろう（に）"
    ],
    "examples": [
      {
        "id": "n2-218-ex-1",
        "japanese": "たとえ失敗したとしても、もう一度挑戦する。",
        "korean": "설령 실패한다고 해도 다시 한번 도전하겠다."
      }
    ],
    "tags": [
      "가정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "たとえ～としても",
        "text": "としても",
        "requiredContext": "たとえ + 普通形 + としても",
        "note": "극단적인 가정을 인정해도 뒤의 결론은 변하지 않음."
      }
    ]
  },
  {
    "id": "n2-219",
    "no": 219,
    "noLabel": "219",
    "level": "N2",
    "expression": "もし～としたら",
    "connection": "もし+普通形+としたら",
    "meaningKo": "만약 ~라고 한다면",
    "nuanceKo": "현실과 다르거나 불확실한 상황을 가정함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-218",
      "n2-220"
    ],
    "similarExpressionNames": [
      "たとえ～としても",
      "～たら（ば）～だろう（に）"
    ],
    "examples": [
      {
        "id": "n2-219-ex-1",
        "japanese": "もし一億円当たったとしたら、何に使いますか。",
        "korean": "만약 1억 엔에 당첨된다면 무엇에 쓰겠습니까?"
      }
    ],
    "tags": [
      "가정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "もし～としたら",
        "text": "としたら",
        "requiredContext": "もし + 普通形 + としたら",
        "note": "현실과 다르거나 불확실한 상황을 가정함."
      }
    ]
  },
  {
    "id": "n2-220",
    "no": 220,
    "noLabel": "220",
    "level": "N2",
    "expression": "～たら（ば）～だろう（に）",
    "connection": "条件形+だろう（に）",
    "meaningKo": "~하면 ~할 텐데, ~했더라면 ~했을 텐데",
    "nuanceKo": "가정에 따른 예상이나 현실과 다른 결과에 대한 아쉬움을 나타냄.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-218",
      "n2-219"
    ],
    "similarExpressionNames": [
      "たとえ～としても",
      "もし～としたら"
    ],
    "examples": [
      {
        "id": "n2-220-ex-1",
        "japanese": "もっと早く出発していたら、間に合っただろうに。",
        "korean": "좀 더 일찍 출발했더라면 시간에 맞았을 텐데."
      }
    ],
    "tags": [
      "가정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "～たら（ば）～だろう（に）",
        "text": "だろうに",
        "requiredContext": "条件形 + だろう（に）",
        "note": "가정에 따른 예상이나 현실과 다른 결과에 대한 아쉬움을 나타냄."
      }
    ]
  },
  {
    "id": "n2-221",
    "no": 221,
    "noLabel": "221",
    "level": "N2",
    "expression": "ついでに",
    "connection": "V辞書形・Vた+ついでに / Nの+ついでに",
    "meaningKo": "~하는 김에",
    "nuanceKo": "주된 행동을 하는 기회에 부수적인 행동도 함께 함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-221-ex-1",
        "japanese": "銀行へ行くついでに、郵便局にも寄った。",
        "korean": "은행에 가는 김에 우체국에도 들렀다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ついでに",
        "text": "ついでに",
        "requiredContext": "V辞書形・Vた + ついでに / Nの + ついでに",
        "note": "주된 행동을 하는 기회에 부수적인 행동도 함께 함."
      }
    ]
  },
  {
    "id": "n2-222",
    "no": 222,
    "noLabel": "222",
    "level": "N2",
    "expression": "がてら",
    "connection": "Vます形語幹+がてら / N+がてら",
    "meaningKo": "~하는 겸, ~할 겸",
    "nuanceKo": "하나의 행동에 두 가지 목적을 겸함. 다소 문어적임.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-222-ex-1",
        "japanese": "散歩がてら、近くの店まで買い物に行った。",
        "korean": "산책 겸 근처 가게까지 쇼핑하러 갔다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "がてら",
        "text": "がてら",
        "requiredContext": "Vます形語幹 + がてら / N + がてら",
        "note": "하나의 행동에 두 가지 목적을 겸함. 다소 문어적임."
      }
    ]
  },
  {
    "id": "n2-223",
    "no": 223,
    "noLabel": "223",
    "level": "N2",
    "expression": "てからでないと / てからでなければ",
    "connection": "Vて+からでないと・からでなければ",
    "meaningKo": "~한 후가 아니면",
    "nuanceKo": "앞 행동이 완료되어야 뒤 행동이 가능하다는 필수 순서.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-223-ex-1",
        "japanese": "実物を見てからでないと、買うかどうか決められない。",
        "korean": "실물을 본 후가 아니면 살지 결정할 수 없다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "てからでないと / てからでなければ",
        "text": "てからでないと",
        "requiredContext": "Vて + からでないと・からでなければ",
        "note": "앞 행동이 완료되어야 뒤 행동이 가능하다는 필수 순서."
      }
    ]
  },
  {
    "id": "n2-224",
    "no": 224,
    "noLabel": "224",
    "level": "N2",
    "expression": "てしょうがない / てしかたがない",
    "connection": "Vて+しょうがない・しかたがない / いAくて+しょうがない・しかたがない / なAで+しょうがない・しかたがない",
    "meaningKo": "너무 ~해서 견딜 수 없다",
    "nuanceKo": "감정·감각이 매우 강해 통제하기 어려움.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-255"
    ],
    "similarExpressionNames": [
      "を込めて"
    ],
    "examples": [
      {
        "id": "n2-224-ex-1",
        "japanese": "明日の試験が心配でしょうがない。",
        "korean": "내일 시험이 걱정되어 견딜 수 없다."
      }
    ],
    "tags": [
      "감정",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "てしょうがない / てしかたがない",
        "text": "でしょうがない",
        "requiredContext": "Vて + しょうがない・しかたがない / いAくて + しょうがない・しかたがない / なAで + しょうがない・しかたがない",
        "note": "감정·감각이 매우 강해 통제하기 어려움."
      }
    ]
  },
  {
    "id": "n2-225",
    "no": 225,
    "noLabel": "225",
    "level": "N2",
    "expression": "てはじめて",
    "connection": "Vて+はじめて",
    "meaningKo": "~하고 나서야 비로소",
    "nuanceKo": "앞 경험이나 조건을 거친 뒤 처음으로 깨닫거나 가능해짐.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-225-ex-1",
        "japanese": "一人暮らしをしてはじめて、親のありがたさが分かった。",
        "korean": "혼자 살아 보고 나서야 비로소 부모님의 고마움을 알았다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "てはじめて",
        "text": "てはじめて",
        "requiredContext": "Vて + はじめて",
        "note": "앞 경험이나 조건을 거친 뒤 처음으로 깨닫거나 가능해짐."
      }
    ]
  },
  {
    "id": "n2-226",
    "no": 226,
    "noLabel": "226",
    "level": "N2",
    "expression": "手前",
    "connection": "Vた+手前 / Nの+手前",
    "meaningKo": "~한 이상, ~체면상",
    "nuanceKo": "남에게 말하거나 약속한 체면 때문에 행동하지 않을 수 없음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [],
    "examples": [
      {
        "id": "n2-226-ex-1",
        "japanese": "皆の前で約束した手前、途中でやめるわけにはいかない。",
        "korean": "모두 앞에서 약속한 이상 중간에 그만둘 수는 없다."
      }
    ],
    "tags": [
      "책임",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "手前",
        "text": "手前",
        "requiredContext": "Vた + 手前 / Nの + 手前",
        "note": "남에게 말하거나 약속한 체면 때문에 행동하지 않을 수 없음."
      }
    ]
  },
  {
    "id": "n2-227",
    "no": 227,
    "noLabel": "227",
    "level": "N2",
    "expression": "てみせる",
    "connection": "Vて+みせる",
    "meaningKo": "반드시 ~해 보이겠다",
    "nuanceKo": "강한 결의나 자신감을 나타냄. 실제로 보여 주겠다는 느낌.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-205",
      "n2-211"
    ],
    "similarExpressionNames": [
      "気だ",
      "ことにする"
    ],
    "examples": [
      {
        "id": "n2-227-ex-1",
        "japanese": "今度こそ必ず優勝してみせる。",
        "korean": "이번에야말로 반드시 우승해 보이겠다."
      }
    ],
    "tags": [
      "의지",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "てみせる",
        "text": "てみせる",
        "requiredContext": "Vて + みせる",
        "note": "강한 결의나 자신감을 나타냄. 실제로 보여 주겠다는 느낌."
      }
    ]
  },
  {
    "id": "n2-228",
    "no": 228,
    "noLabel": "228",
    "level": "N2",
    "expression": "というか",
    "connection": "普通形+というか / N+というか",
    "meaningKo": "~라고 할까, 아니 ~라고 해야 할까",
    "nuanceKo": "앞 표현을 정정하거나 더 적절한 표현으로 바꿈.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-229",
      "n2-230",
      "n2-231",
      "n2-233"
    ],
    "similarExpressionNames": [
      "ということだ",
      "というより",
      "といっても",
      "というのは"
    ],
    "examples": [
      {
        "id": "n2-228-ex-1",
        "japanese": "彼は親切というか、おせっかいというか、よく人の世話をする。",
        "korean": "그는 친절하다고 할까 오지랖이 넓다고 할까, 남을 자주 돌본다."
      }
    ],
    "tags": [
      "설명",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "というか",
        "text": "というか",
        "requiredContext": "普通形 + というか / N + というか",
        "note": "앞 표현을 정정하거나 더 적절한 표현으로 바꿈."
      }
    ]
  },
  {
    "id": "n2-229",
    "no": 229,
    "noLabel": "229",
    "level": "N2",
    "expression": "ということだ",
    "connection": "普通形+ということだ",
    "meaningKo": "~라고 한다, ~라는 뜻이다",
    "nuanceKo": "전달받은 정보 또는 앞 내용에서 도출되는 의미를 설명함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-228",
      "n2-230",
      "n2-231",
      "n2-233"
    ],
    "similarExpressionNames": [
      "というか",
      "というより",
      "といっても",
      "というのは"
    ],
    "examples": [
      {
        "id": "n2-229-ex-1",
        "japanese": "天気予報によると、明日は雪が降るということだ。",
        "korean": "일기예보에 따르면 내일은 눈이 온다고 한다."
      }
    ],
    "tags": [
      "설명",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "ということだ",
        "text": "ということだ",
        "requiredContext": "普通形 + ということだ",
        "note": "전달받은 정보 또는 앞 내용에서 도출되는 의미를 설명함."
      }
    ]
  },
  {
    "id": "n2-230",
    "no": 230,
    "noLabel": "230",
    "level": "N2",
    "expression": "というより",
    "connection": "普通形+というより / N+というより",
    "meaningKo": "~라기보다",
    "nuanceKo": "앞 표현보다 뒤 표현이 더 정확하다고 정정함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-228",
      "n2-229",
      "n2-231",
      "n2-233"
    ],
    "similarExpressionNames": [
      "というか",
      "ということだ",
      "といっても",
      "というのは"
    ],
    "examples": [
      {
        "id": "n2-230-ex-1",
        "japanese": "彼は厳しいというより、冷たい。",
        "korean": "그는 엄격하다기보다 차갑다."
      }
    ],
    "tags": [
      "설명",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "というより",
        "text": "というより",
        "requiredContext": "普通形 + というより / N + というより",
        "note": "앞 표현보다 뒤 표현이 더 정확하다고 정정함."
      }
    ]
  },
  {
    "id": "n2-231",
    "no": 231,
    "noLabel": "231",
    "level": "N2",
    "expression": "といっても",
    "connection": "普通形+といっても / N+といっても",
    "meaningKo": "~라고 해도",
    "nuanceKo": "앞 표현에서 예상되는 정도와 실제가 다름을 보충 설명.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-228",
      "n2-229",
      "n2-230",
      "n2-233"
    ],
    "similarExpressionNames": [
      "というか",
      "ということだ",
      "というより",
      "というのは"
    ],
    "examples": [
      {
        "id": "n2-231-ex-1",
        "japanese": "日本語が話せるといっても、簡単な会話だけだ。",
        "korean": "일본어를 할 수 있다고 해도 간단한 회화뿐이다."
      }
    ],
    "tags": [
      "설명",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "といっても",
        "text": "といっても",
        "requiredContext": "普通形 + といっても / N + といっても",
        "note": "앞 표현에서 예상되는 정도와 실제가 다름을 보충 설명."
      }
    ]
  },
  {
    "id": "n2-232",
    "no": 232,
    "noLabel": "232",
    "level": "N2",
    "expression": "として",
    "connection": "N+として",
    "meaningKo": "~로서, ~의 자격으로",
    "nuanceKo": "신분·자격·역할·입장을 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-235",
      "n2-237"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "において / における",
      "について"
    ],
    "examples": [
      {
        "id": "n2-232-ex-1",
        "japanese": "留学生として日本の大学で勉強している。",
        "korean": "유학생으로서 일본 대학에서 공부하고 있다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "として",
        "text": "として",
        "requiredContext": "N + として",
        "note": "신분·자격·역할·입장을 나타냄."
      }
    ]
  },
  {
    "id": "n2-233",
    "no": 233,
    "noLabel": "233",
    "level": "N2",
    "expression": "というのは",
    "connection": "N+というのは / 普通形+というのは",
    "meaningKo": "~라는 것은, 왜냐하면",
    "nuanceKo": "용어를 정의하거나 앞 내용의 이유를 설명함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-228",
      "n2-229",
      "n2-230",
      "n2-231"
    ],
    "similarExpressionNames": [
      "というか",
      "ということだ",
      "というより",
      "といっても"
    ],
    "examples": [
      {
        "id": "n2-233-ex-1",
        "japanese": "「少子化」というのは、子供の数が減ることだ。",
        "korean": "‘저출산’이라는 것은 아이의 수가 줄어드는 것이다."
      }
    ],
    "tags": [
      "설명",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "というのは",
        "text": "というのは",
        "requiredContext": "N + というのは / 普通形 + というのは",
        "note": "용어를 정의하거나 앞 내용의 이유를 설명함."
      }
    ]
  },
  {
    "id": "n2-234",
    "no": 234,
    "noLabel": "234",
    "level": "N2",
    "expression": "とみえて",
    "connection": "普通形+とみえて",
    "meaningKo": "~인 듯하여, ~인 모양이라",
    "nuanceKo": "눈에 보이는 결과나 정황을 근거로 원인을 추측함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-198",
      "n2-207",
      "n2-246"
    ],
    "similarExpressionNames": [
      "おかげで / せいで",
      "ことから",
      "によると / によれば"
    ],
    "examples": [
      {
        "id": "n2-234-ex-1",
        "japanese": "昨夜よく眠れなかったとみえて、彼は何度もあくびをしている。",
        "korean": "어젯밤 잘 자지 못한 모양이라 그는 몇 번이나 하품하고 있다."
      }
    ],
    "tags": [
      "원인",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "とみえて",
        "text": "とみえて",
        "requiredContext": "普通形 + とみえて",
        "note": "눈에 보이는 결과나 정황을 근거로 원인을 추측함."
      }
    ]
  },
  {
    "id": "n2-235",
    "no": 235,
    "noLabel": "235",
    "level": "N2",
    "expression": "において / における",
    "connection": "N+において / N+における+N",
    "meaningKo": "~에서, ~에 있어서",
    "nuanceKo": "장소·시대·분야·상황을 나타내는 문어적 표현.",
    "register": "문어체",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-232",
      "n2-237"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "として",
      "について"
    ],
    "examples": [
      {
        "id": "n2-235-ex-1",
        "japanese": "現代社会において、情報技術は重要な役割を果たしている。",
        "korean": "현대 사회에서 정보기술은 중요한 역할을 하고 있다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "において / における",
        "text": "において",
        "requiredContext": "N + において / N + における + N",
        "note": "장소·시대·분야·상황을 나타내는 문어적 표현."
      }
    ]
  },
  {
    "id": "n2-236",
    "no": 236,
    "noLabel": "236",
    "level": "N2",
    "expression": "に限る",
    "connection": "V辞書形・Vない形+に限る / N+に限る",
    "meaningKo": "~하는 것이 최고다, ~만 한 것이 없다",
    "nuanceKo": "화자의 경험에 근거해 최선의 선택을 단정함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-216",
      "n2-217"
    ],
    "similarExpressionNames": [
      "だけのことはある",
      "だけまし"
    ],
    "examples": [
      {
        "id": "n2-236-ex-1",
        "japanese": "疲れたときは、早く寝るに限る。",
        "korean": "피곤할 때는 일찍 자는 것이 최고다."
      }
    ],
    "tags": [
      "평가",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に限る",
        "text": "に限る",
        "requiredContext": "V辞書形・Vない形 + に限る / N + に限る",
        "note": "화자의 경험에 근거해 최선의 선택을 단정함."
      }
    ]
  },
  {
    "id": "n2-237",
    "no": 237,
    "noLabel": "237",
    "level": "N2",
    "expression": "について",
    "connection": "N+について / N+についての+N",
    "meaningKo": "~에 관해서, ~에 대해서",
    "nuanceKo": "이야기·조사·연구 등의 대상을 제시함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-232",
      "n2-235"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "として",
      "において / における"
    ],
    "examples": [
      {
        "id": "n2-237-ex-1",
        "japanese": "日本の教育制度について調べています。",
        "korean": "일본의 교육제도에 관해서 조사하고 있습니다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "について",
        "text": "について",
        "requiredContext": "N + について / N + についての + N",
        "note": "이야기·조사·연구 등의 대상을 제시함."
      }
    ]
  },
  {
    "id": "n2-238",
    "no": 238,
    "noLabel": "238",
    "level": "N2",
    "expression": "に決まっている",
    "connection": "普通形+に決まっている / N+に決まっている",
    "meaningKo": "반드시 ~이다, ~임이 분명하다",
    "nuanceKo": "화자의 강한 주관적 확신. 회화적 표현.",
    "register": "회화체",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-252",
      "n2-253"
    ],
    "similarExpressionNames": [
      "はずがない",
      "わけだ"
    ],
    "examples": [
      {
        "id": "n2-238-ex-1",
        "japanese": "そんな話はうそに決まっている。",
        "korean": "그런 이야기는 거짓말임이 분명하다."
      }
    ],
    "tags": [
      "확신",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に決まっている",
        "text": "に決まっている",
        "requiredContext": "普通形 + に決まっている / N + に決まっている",
        "note": "화자의 강한 주관적 확신. 회화적 표현."
      }
    ]
  },
  {
    "id": "n2-239",
    "no": 239,
    "noLabel": "239",
    "level": "N2",
    "expression": "に比べて",
    "connection": "N+に比べて",
    "meaningKo": "~에 비해서",
    "nuanceKo": "두 대상을 기준으로 차이를 비교함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-241",
      "n2-244",
      "n2-248",
      "n2-249"
    ],
    "similarExpressionNames": [
      "に対して",
      "に反して",
      "は別として",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-239-ex-1",
        "japanese": "去年に比べて、今年は雨が少ない。",
        "korean": "작년에 비해 올해는 비가 적다."
      }
    ],
    "tags": [
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に比べて",
        "text": "に比べて",
        "requiredContext": "N + に比べて",
        "note": "두 대상을 기준으로 차이를 비교함."
      }
    ]
  },
  {
    "id": "n2-240",
    "no": 240,
    "noLabel": "240",
    "level": "N2",
    "expression": "に従って",
    "connection": "V辞書形+に従って / N+に従って",
    "meaningKo": "~함에 따라, ~에 따라서",
    "nuanceKo": "한 변화에 비례해 다른 변화가 일어나거나 규칙·지시에 따름.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-194",
      "n2-242",
      "n2-249"
    ],
    "similarExpressionNames": [
      "一方だ",
      "につれて",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-240-ex-1",
        "japanese": "年を取るに従って、体力が落ちてきた。",
        "korean": "나이가 듦에 따라 체력이 떨어졌다."
      }
    ],
    "tags": [
      "변화",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に従って",
        "text": "に従って",
        "requiredContext": "V辞書形 + に従って / N + に従って",
        "note": "한 변화에 비례해 다른 변화가 일어나거나 규칙·지시에 따름."
      }
    ]
  },
  {
    "id": "n2-241",
    "no": 241,
    "noLabel": "241",
    "level": "N2",
    "expression": "に対して",
    "connection": "N+に対して / 普通形+のに対して",
    "meaningKo": "~에 대해서, ~에 반하여",
    "nuanceKo": "행동의 대상 또는 두 사실의 대조를 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-232",
      "n2-235"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "として",
      "において / における"
    ],
    "examples": [
      {
        "id": "n2-241-ex-1",
        "japanese": "兄が活発なのに対して、弟はおとなしい。",
        "korean": "형이 활발한 데 반해 동생은 얌전하다."
      }
    ],
    "tags": [
      "관점",
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に対して",
        "text": "に対して",
        "requiredContext": "N + に対して / 普通形 + のに対して",
        "note": "행동의 대상 또는 두 사실의 대조를 나타냄."
      }
    ]
  },
  {
    "id": "n2-242",
    "no": 242,
    "noLabel": "242",
    "level": "N2",
    "expression": "につれて",
    "connection": "V辞書形+につれて / N+につれて",
    "meaningKo": "~함에 따라서",
    "nuanceKo": "한쪽의 점진적인 변화와 함께 다른 쪽도 자연스럽게 변화함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-194",
      "n2-240",
      "n2-249"
    ],
    "similarExpressionNames": [
      "一方だ",
      "に従って",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-242-ex-1",
        "japanese": "暖かくなるにつれて、花が咲き始めた。",
        "korean": "따뜻해짐에 따라 꽃이 피기 시작했다."
      }
    ],
    "tags": [
      "변화",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "につれて",
        "text": "につれて",
        "requiredContext": "V辞書形 + につれて / N + につれて",
        "note": "한쪽의 점진적인 변화와 함께 다른 쪽도 자연스럽게 변화함."
      }
    ]
  },
  {
    "id": "n2-243",
    "no": 243,
    "noLabel": "243",
    "level": "N2",
    "expression": "にとって（は）",
    "connection": "N+にとって（は）",
    "meaningKo": "~에게 있어서는, ~의 입장에서는",
    "nuanceKo": "특정 대상의 관점에서 가치·평가·중요성을 말함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-232",
      "n2-235"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "として",
      "において / における"
    ],
    "examples": [
      {
        "id": "n2-243-ex-1",
        "japanese": "私にとって、家族は最も大切な存在だ。",
        "korean": "나에게 가족은 가장 소중한 존재다."
      }
    ],
    "tags": [
      "관점",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "にとって（は）",
        "text": "にとって",
        "requiredContext": "N + にとって（は）",
        "note": "특정 대상의 관점에서 가치·평가·중요성을 말함."
      }
    ]
  },
  {
    "id": "n2-244",
    "no": 244,
    "noLabel": "244",
    "level": "N2",
    "expression": "に反して",
    "connection": "N+に反して / N+に反する+N",
    "meaningKo": "~에 반하여, ~와 반대로",
    "nuanceKo": "예상·규칙·명령·의도와 실제 결과가 어긋남.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-239",
      "n2-241",
      "n2-248",
      "n2-249"
    ],
    "similarExpressionNames": [
      "に比べて",
      "に対して",
      "は別として",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-244-ex-1",
        "japanese": "予想に反して、試験は簡単だった。",
        "korean": "예상과 달리 시험은 쉬웠다."
      }
    ],
    "tags": [
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "に反して",
        "text": "に反して",
        "requiredContext": "N + に反して / N + に反する + N",
        "note": "예상·규칙·명령·의도와 실제 결과가 어긋남."
      }
    ]
  },
  {
    "id": "n2-245",
    "no": 245,
    "noLabel": "245",
    "level": "N2",
    "expression": "によって",
    "connection": "N+によって",
    "meaningKo": "~에 의해, ~에 따라서, ~로 인하여",
    "nuanceKo": "수단·원인·행위자·차이의 기준 등 여러 관계를 나타냄.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-196",
      "n2-201",
      "n2-232",
      "n2-235"
    ],
    "similarExpressionNames": [
      "～上（じょう）",
      "にすれば",
      "として",
      "において / における"
    ],
    "examples": [
      {
        "id": "n2-245-ex-1",
        "japanese": "この寺は千年前に有名な僧によって建てられた。",
        "korean": "이 절은 천 년 전에 유명한 승려에 의해 지어졌다."
      }
    ],
    "tags": [
      "관점",
      "수단",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "によって",
        "text": "によって",
        "requiredContext": "N + によって",
        "note": "수단·원인·행위자·차이의 기준 등 여러 관계를 나타냄."
      }
    ]
  },
  {
    "id": "n2-246",
    "no": 246,
    "noLabel": "246",
    "level": "N2",
    "expression": "によると / によれば",
    "connection": "N+によると・によれば",
    "meaningKo": "~에 따르면",
    "nuanceKo": "정보의 출처나 근거를 제시함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-198",
      "n2-207",
      "n2-234"
    ],
    "similarExpressionNames": [
      "おかげで / せいで",
      "ことから",
      "とみえて"
    ],
    "examples": [
      {
        "id": "n2-246-ex-1",
        "japanese": "ニュースによると、台風が近づいているそうだ。",
        "korean": "뉴스에 따르면 태풍이 다가오고 있다고 한다."
      }
    ],
    "tags": [
      "원인",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "によると / によれば",
        "text": "によると",
        "requiredContext": "N + によると・によれば",
        "note": "정보의 출처나 근거를 제시함."
      }
    ]
  },
  {
    "id": "n2-247",
    "no": 247,
    "noLabel": "247",
    "level": "N2",
    "expression": "にわたって",
    "connection": "N+にわたって / N+にわたる+N",
    "meaningKo": "~에 걸쳐서",
    "nuanceKo": "시간·장소·범위가 넓게 이어짐을 나타냄.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-247-ex-1",
        "japanese": "会議は三時間にわたって行われた。",
        "korean": "회의는 세 시간에 걸쳐 진행되었다."
      }
    ],
    "tags": [
      "시간",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "にわたって",
        "text": "にわたって",
        "requiredContext": "N + にわたって / N + にわたる + N",
        "note": "시간·장소·범위가 넓게 이어짐을 나타냄."
      }
    ]
  },
  {
    "id": "n2-248",
    "no": 248,
    "noLabel": "248",
    "level": "N2",
    "expression": "は別として",
    "connection": "N+は別として",
    "meaningKo": "~은 별개로 하고, ~은 제쳐두고",
    "nuanceKo": "한 요소를 판단 대상에서 제외하고 다른 점을 논함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-239",
      "n2-241",
      "n2-244",
      "n2-249"
    ],
    "similarExpressionNames": [
      "に比べて",
      "に対して",
      "に反して",
      "～ば～ほど"
    ],
    "examples": [
      {
        "id": "n2-248-ex-1",
        "japanese": "値段は別として、この製品の品質は非常に高い。",
        "korean": "가격은 별개로 하고 이 제품의 품질은 매우 높다."
      }
    ],
    "tags": [
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "は別として",
        "text": "は別として",
        "requiredContext": "N + は別として",
        "note": "한 요소를 판단 대상에서 제외하고 다른 점을 논함."
      }
    ]
  },
  {
    "id": "n2-249",
    "no": 249,
    "noLabel": "249",
    "level": "N2",
    "expression": "～ば～ほど",
    "connection": "Vば+V辞書形+ほど / いAければ+いAい+ほど / なAなら+なAな+ほど",
    "meaningKo": "~하면 할수록",
    "nuanceKo": "한 정도가 증가함에 따라 다른 정도도 비례해 변화함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-194",
      "n2-240",
      "n2-242",
      "n2-239"
    ],
    "similarExpressionNames": [
      "一方だ",
      "に従って",
      "につれて",
      "に比べて"
    ],
    "examples": [
      {
        "id": "n2-249-ex-1",
        "japanese": "日本語は勉強すればするほど、おもしろくなる。",
        "korean": "일본어는 공부하면 할수록 재미있어진다."
      }
    ],
    "tags": [
      "변화",
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "～ば～ほど",
        "text": "すればするほど",
        "requiredContext": "Vば + V辞書形 + ほど / いAければ + いAい + ほど / なAなら + なAな + ほど",
        "note": "한 정도가 증가함에 따라 다른 정도도 비례해 변화함."
      }
    ]
  },
  {
    "id": "n2-250",
    "no": 250,
    "noLabel": "250",
    "level": "N2",
    "expression": "はもちろん",
    "connection": "N+はもちろん",
    "meaningKo": "~은 물론이고",
    "nuanceKo": "당연히 포함되는 대상을 먼저 말하고 다른 대상까지 추가함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-195"
    ],
    "similarExpressionNames": [
      "上に"
    ],
    "examples": [
      {
        "id": "n2-250-ex-1",
        "japanese": "彼は英語はもちろん、中国語も話せる。",
        "korean": "그는 영어는 물론이고 중국어도 할 수 있다."
      }
    ],
    "tags": [
      "추가",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "はもちろん",
        "text": "はもちろん",
        "requiredContext": "N + はもちろん",
        "note": "당연히 포함되는 대상을 먼저 말하고 다른 대상까지 추가함."
      }
    ]
  },
  {
    "id": "n2-251",
    "no": 251,
    "noLabel": "251",
    "level": "N2",
    "expression": "反面",
    "connection": "普通形+反面 / なAな・である+反面 / Nである+反面",
    "meaningKo": "~인 반면",
    "nuanceKo": "하나의 대상이 가진 서로 반대되는 두 측면을 제시함.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-239",
      "n2-241",
      "n2-244",
      "n2-248"
    ],
    "similarExpressionNames": [
      "に比べて",
      "に対して",
      "に反して",
      "は別として"
    ],
    "examples": [
      {
        "id": "n2-251-ex-1",
        "japanese": "この仕事は大変な反面、やりがいもある。",
        "korean": "이 일은 힘든 반면 보람도 있다."
      }
    ],
    "tags": [
      "비교",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "反面",
        "text": "反面",
        "requiredContext": "普通形 + 反面 / なAな・である + 反面 / Nである + 反面",
        "note": "하나의 대상이 가진 서로 반대되는 두 측면을 제시함."
      }
    ]
  },
  {
    "id": "n2-252",
    "no": 252,
    "noLabel": "252",
    "level": "N2",
    "expression": "はずがない",
    "connection": "普通形+はずがない / Nの・である+はずがない",
    "meaningKo": "~할 리가 없다",
    "nuanceKo": "논리적 근거나 상식에 따른 강한 부정 추측.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-238",
      "n2-253"
    ],
    "similarExpressionNames": [
      "に決まっている",
      "わけだ"
    ],
    "examples": [
      {
        "id": "n2-252-ex-1",
        "japanese": "まじめな彼が約束を忘れるはずがない。",
        "korean": "성실한 그가 약속을 잊을 리가 없다."
      }
    ],
    "tags": [
      "확신",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "はずがない",
        "text": "はずがない",
        "requiredContext": "普通形 + はずがない / Nの・である + はずがない",
        "note": "논리적 근거나 상식에 따른 강한 부정 추측."
      }
    ]
  },
  {
    "id": "n2-253",
    "no": 253,
    "noLabel": "253",
    "level": "N2",
    "expression": "わけだ",
    "connection": "普通形+わけだ / なAな・である+わけだ / Nな・である+わけだ",
    "meaningKo": "~인 셈이다, 그래서 ~한 것이다",
    "nuanceKo": "앞 정보로부터 자연스럽게 결론을 내리거나 이유를 납득함.",
    "register": "중립",
    "frequency": 3,
    "similarGrammarIds": [
      "n2-238",
      "n2-252"
    ],
    "similarExpressionNames": [
      "に決まっている",
      "はずがない"
    ],
    "examples": [
      {
        "id": "n2-253-ex-1",
        "japanese": "彼は日本に十年住んでいた。日本語が上手なわけだ。",
        "korean": "그는 일본에 10년 살았다. 그래서 일본어를 잘하는 것이구나."
      }
    ],
    "tags": [
      "확신",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "わけだ",
        "text": "わけだ",
        "requiredContext": "普通形 + わけだ / なAな・である + わけだ / Nな・である + わけだ",
        "note": "앞 정보로부터 자연스럽게 결론을 내리거나 이유를 납득함."
      }
    ]
  },
  {
    "id": "n2-254",
    "no": 254,
    "noLabel": "254",
    "level": "N2",
    "expression": "をきっかけに（して）",
    "connection": "N+をきっかけに（して）",
    "meaningKo": "~을 계기로",
    "nuanceKo": "어떤 사건이 새로운 행동이나 변화가 시작되는 계기가 됨.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [],
    "similarExpressionNames": [],
    "examples": [
      {
        "id": "n2-254-ex-1",
        "japanese": "留学をきっかけに、将来について真剣に考えるようになった。",
        "korean": "유학을 계기로 장래에 대해 진지하게 생각하게 되었다."
      }
    ],
    "tags": [
      "계기",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "をきっかけに（して）",
        "text": "をきっかけに",
        "requiredContext": "N + をきっかけに（して）",
        "note": "어떤 사건이 새로운 행동이나 변화가 시작되는 계기가 됨."
      }
    ]
  },
  {
    "id": "n2-255",
    "no": 255,
    "noLabel": "255",
    "level": "N2",
    "expression": "を込めて",
    "connection": "N+を込めて",
    "meaningKo": "~을 담아서",
    "nuanceKo": "감정·마음·의미를 행동이나 물건에 담음.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-224",
      "n2-245",
      "n2-256"
    ],
    "similarExpressionNames": [
      "てしょうがない / てしかたがない",
      "によって",
      "を通じて / を通して"
    ],
    "examples": [
      {
        "id": "n2-255-ex-1",
        "japanese": "感謝の気持ちを込めて、先生に手紙を書いた。",
        "korean": "감사의 마음을 담아 선생님께 편지를 썼다."
      }
    ],
    "tags": [
      "감정",
      "수단",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "を込めて",
        "text": "を込めて",
        "requiredContext": "N + を込めて",
        "note": "감정·마음·의미를 행동이나 물건에 담음."
      }
    ]
  },
  {
    "id": "n2-256",
    "no": 256,
    "noLabel": "256",
    "level": "N2",
    "expression": "を通じて / を通して",
    "connection": "N+を通じて・を通して",
    "meaningKo": "~을 통해서, ~동안 내내",
    "nuanceKo": "매개·수단 또는 일정 기간 전체를 나타냄.",
    "register": "중립",
    "frequency": 2,
    "similarGrammarIds": [
      "n2-197",
      "n2-199",
      "n2-200",
      "n2-202"
    ],
    "similarExpressionNames": [
      "うちに / ないうちに",
      "やいなや",
      "そばから",
      "～から～にかけて"
    ],
    "examples": [
      {
        "id": "n2-256-ex-1",
        "japanese": "インターネットを通じて、世界中の人と交流できる。",
        "korean": "인터넷을 통해 전 세계 사람들과 교류할 수 있다."
      },
      {
        "id": "n2-256-ex-2",
        "japanese": "この地域は一年を通して暖かい。",
        "korean": "이 지역은 일 년 내내 따뜻하다."
      }
    ],
    "tags": [
      "시간",
      "수단",
      "추가문법",
      "rarw-db-추가"
    ],
    "blankChoiceForms": [
      {
        "formId": "raw-example-form",
        "label": "を通じて / を通して",
        "text": "を通じて",
        "requiredContext": "N + を通じて・を通して",
        "note": "매개·수단 또는 일정 기간 전체를 나타냄."
      }
    ]
  }
];

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, Home, Globe } from 'lucide-react'
import Link from "next/link"

// Lexile 레벨별 지문과 빈칸 문제
const lexilePassages = [
  {
    level: "BR",
    title: "나의 가족",
    text: "나는 가족이 있어요. 엄마, 아빠, 그리고 동생이 있어요. 우리는 함께 살아요. 우리는 행복해요.",
    blanks: [
      { word: "가족", options: ["가족", "친구", "선생님", "이웃"] },
      { word: "함께", options: ["함께", "혼자", "멀리", "가끔"] },
      { word: "행복해요", options: ["행복해요", "슬퍼요", "화나요", "피곤해요"] },
    ],
  },
  {
    level: "100",
    title: "학교 생활",
    text: "나는 매일 학교에 갑니다. 학교에서 친구들과 공부합니다. 선생님은 우리에게 많은 것을 가르쳐 주십니다. 점심 시간에는 친구들과 함께 급식을 먹습니다.",
    blanks: [
      { word: "매일", options: ["매일", "가끔", "절대", "항상"] },
      { word: "공부합니다", options: ["공부합니다", "놀아요", "싸워요", "자요"] },
      { word: "가르쳐", options: ["가르쳐", "보여", "말해", "들려"] },
      { word: "급식", options: ["급식", "간식", "과자", "음료"] },
    ],
  },
  {
    level: "200",
    title: "나의 취미",
    text: "주말에 나는 다양한 취미 활동을 즐깁니다. 책을 읽거나 음악을 듣는 것을 좋아합니다. 가끔은 공원에서 자전거를 타기도 합니다. 취미 활동은 스트레스를 해소하는 데 도움이 됩니다.",
    blanks: [
      { word: "다양한", options: ["다양한", "특별한", "어려운", "간단한"] },
      { word: "즐깁니다", options: ["즐깁니다", "싫어합니다", "피합니다", "무시합니다"] },
      { word: "자전거", options: ["자전거", "자동차", "기차", "비행기"] },
      { word: "해소하는", options: ["해소하는", "증가시키는", "유지하는", "발생시키는"] },
    ],
  },
  {
    level: "300",
    title: "건강한 생활",
    text: "건강한 생활을 위해서는 균형 잡힌 식사와 규칙적인 운동이 중요합니다. 신선한 과일과 채소를 충분히 섭취하고, 하루에 최소 30분 이상 운동하는 것이 좋습니다. 또한 충분한 수면은 신체와 정신 건강에 필수적입니다.",
    blanks: [
      { word: "균형", options: ["균형", "영양", "칼로리", "맛"] },
      { word: "규칙적인", options: ["규칙적인", "강도 높은", "간헐적인", "전문적인"] },
      { word: "섭취하고", options: ["섭취하고", "요리하고", "판매하고", "재배하고"] },
      { word: "필수적입니다", options: ["필수적입니다", "불필요합니다", "위험합니다", "비싸습니다"] },
    ],
  },
  {
    level: "400",
    title: "환경 보호",
    text: "환경 보호는 우리 모두의 책임입니다. 지구 온난화와 환경 오염은 심각한 문제가 되고 있습니다. 우리는 에너지를 절약하고, 쓰레기를 줄이며, 재활용을 실천함으로써 환경을 보호할 수 있습니다. 작은 실천이 모여 큰 변화를 만들 수 있습니다.",
    blanks: [
      { word: "책임입니다", options: ["책임입니다", "권리입니다", "특권입니다", "의무입니다"] },
      { word: "심각한", options: ["심각한", "사소한", "일시적인", "흥미로운"] },
      { word: "절약하고", options: ["절약하고", "낭비하고", "생산하고", "판매하고"] },
      { word: "실천함으로써", options: ["실천함으로써", "무시함으로써", "연구함으로써", "관찰함으로써"] },
    ],
  },
  {
    level: "500",
    title: "인터넷의 영향",
    text: "인터넷은 현대 사회에 지대한 영향을 미치고 있습니다. 정보의 접근성이 향상되었고, 전 세계 사람들과의 소통이 용이해졌습니다. 하지만 개인 정보 유출이나 사이버 범죄와 같은 부정적인 측면도 존재합니다. 따라서 인터넷을 사용할 때는 주의와 책임감이 필요합니다.",
    blanks: [
      { word: "지대한", options: ["지대한", "미미한", "일시적인", "부분적인"] },
      { word: "접근성", options: ["접근성", "신뢰성", "안정성", "다양성"] },
      { word: "용이해졌습니다", options: ["용이해졌습니다", "어려워졌습니다", "불가능해졌습니다", "제한되었습니다"] },
      { word: "부정적인", options: ["부정적인", "긍정적인", "중립적인", "과학적인"] },
      { word: "책임감", options: ["책임감", "열정", "인내심", "창의력"] },
    ],
  },
  {
    level: "600",
    title: "문화의 다양성",
    text: "문화의 다양성은 인류의 풍요로운 유산입니다. 각 문화는 고유한 언어, 예술, 음식, 전통을 가지고 있으며, 이러한 다양성은 우리의 삶을 풍요롭게 합니다. 다른 문화를 이해하고 존중하는 것은 글로벌 사회에서 중요한 가치입니다. 문화 간 교류는 새로운 아이디어와 혁신을 촉진할 수 있습니다.",
    blanks: [
      { word: "풍요로운", options: ["풍요로운", "위험한", "단순한", "불필요한"] },
      { word: "고유한", options: ["고유한", "일반적인", "임시적인", "외부적인"] },
      { word: "존중하는", options: ["존중하는", "무시하는", "거부하는", "비판하는"] },
      { word: "가치입니다", options: ["가치입니다", "문제입니다", "오류입니다", "한계입니다"] },
      { word: "촉진할", options: ["촉진할", "방해할", "중단할", "거부할"] },
    ],
  },
  {
    level: "700",
    title: "인공지능의 발전",
    text: "인공지능 기술은 급속도로 발전하고 있으며, 우리의 일상생활과 산업 전반에 혁명적인 변화를 가져오고 있습니다. 자연어 처리, 컴퓨터 비전, 기계 학습 등의 분야에서 놀라운 진전이 이루어지고 있습니다. 이러한 기술은 의료, 교육, 교통 등 다양한 분야에서 활용되어 효율성을 높이고 새로운 가능성을 열고 있습니다.",
    blanks: [
      { word: "급속도로", options: ["급속도로", "점진적으로", "간헐적으로", "부분적으로"] },
      { word: "혁명적인", options: ["혁명적인", "미미한", "일시적인", "부정적인"] },
      { word: "진전", options: ["진전", "후퇴", "정체", "혼란"] },
      { word: "활용되어", options: ["활용되어", "제한되어", "금지되어", "무시되어"] },
      { word: "가능성", options: ["가능성", "위험성", "불확실성", "복잡성"] },
    ],
  },
  {
    level: "800",
    title: "기후 변화와 대응",
    text: "기후 변화는 21세기 인류가 직면한 가장 심각한 환경 문제 중 하나입니다. 온실가스 배출 증가로 인한 지구 온난화는 해수면 상승, 극단적 기상 현상, 생태계 파괴 등 다양한 부정적 영향을 초래하고 있습니다. 이러한 위기에 대응하기 위해 국제사회는 파리 협정과 같은 다자간 협약을 통해 온실가스 감축 목표를 설정하고, 지속 가능한 발전을 추구하고 있습니다.",
    blanks: [
      { word: "직면한", options: ["직면한", "회피한", "해결한", "무시한"] },
      { word: "온실가스", options: ["온실가스", "산소", "질소", "수소"] },
      { word: "초래하고", options: ["초래하고", "감소시키고", "예방하고", "중화시키고"] },
      { word: "다자간", options: ["다자간", "일방적", "개인적", "임시적"] },
      { word: "지속 가능한", options: ["지속 가능한", "단기적인", "비효율적인", "불안정한"] },
    ],
  },
  {
    level: "900",
    title: "현대 의학의 발전",
    text: "현대 의학은 지난 세기 동안 놀라운 발전을 이루었습니다. 항생제, 백신, 수술 기법의 혁신은 많은 질병을 치료하거나 예방할 수 있게 했습니다. 특히 유전체학과 정밀 의학의 발전은 개인의 유전적 특성에 맞춘 맞춤형 치료를 가능하게 하고 있습니다. 또한 첨단 의료 기기와 원격 의료 시스템은 의료 서비스의 접근성과 효율성을 크게 향상시켰습니다. 그러나 이러한 발전에도 불구하고, 의료 불평등과 윤리적 문제는 여전히 중요한 과제로 남아 있습니다.",
    blanks: [
      { word: "혁신", options: ["혁신", "실패", "중단", "감소"] },
      { word: "예방할", options: ["예방할", "악화시킬", "무시할", "확산시킬"] },
      { word: "맞춤형", options: ["맞춤형", "표준화된", "임시적인", "실험적인"] },
      { word: "접근성", options: ["접근성", "비용", "복잡성", "위험성"] },
      { word: "과제", options: ["과제", "성과", "이점", "해결책"] },
    ],
  },
  {
    level: "1000",
    title: "글로벌 경제와 불평등",
    text: "글로벌화는 세계 경제에 상당한 변화를 가져왔습니다. 국제 무역과 투자의 증가는 많은 국가의 경제 성장을 촉진했지만, 동시에 국가 간, 그리고 국가 내 불평등을 심화시키기도 했습니다. 선진국의 다국적 기업들이 개발도상국의 저임금 노동력을 활용하면서 일자리 이동과 임금 격차 문제가 발생하고 있습니다. 또한 금융 시장의 통합은 경제적 불안정성을 증가시키고, 금융 위기가 전 세계로 빠르게 확산될 수 있는 환경을 조성했습니다. 이러한 문제들을 해결하기 위해서는 국제적 협력과 포용적 성장 정책이 필요합니다.",
    blanks: [
      { word: "상당한", options: ["상당한", "미미한", "일시적인", "부정적인"] },
      { word: "촉진했지만", options: ["촉진했지만", "방해했지만", "중단했지만", "무시했지만"] },
      { word: "심화시키기도", options: ["심화시키기도", "해소하기도", "무시하기도", "분석하기도"] },
      { word: "활용하면서", options: ["활용하면서", "보호하면서", "교육하면서", "존중하면서"] },
      { word: "불안정성", options: ["불안정성", "안정성", "예측가능성", "투명성"] },
      { word: "포용적", options: ["포용적", "배타적", "임시적", "이론적"] },
    ],
  },
  {
    level: "1100",
    title: "양자 물리학의 원리",
    text: "양자 물리학은 미시적 세계의 물리적 현상을 설명하는 이론적 체계입니다. 고전 물리학과 달리, 양자 역학에서는 입자가 파동의 특성을 가지며, 위치와 운동량을 동시에 정확하게 측정할 수 없다는 하이젠베르크의 불확정성 원리가 적용됩니다. 또한 슈뢰딩거 방정식은 양자 시스템의 시간에 따른 변화를 기술하며, 양자 중첩과 얽힘 같은 비직관적 현상을 예측합니다. 이러한 양자 역학의 원리는 현대 기술 발전의 기반이 되어 레이저, 트랜지스터, 자기 공명 영상(MRI) 등 다양한 혁신적 기술을 가능하게 했습니다.",
    blanks: [
      { word: "미시적", options: ["미시적", "거시적", "이론적", "실용적"] },
      { word: "파동", options: ["파동", "질량", "에너지", "속도"] },
      { word: "불확정성", options: ["불확정성", "상대성", "인과성", "연속성"] },
      { word: "기술하며", options: ["기술하며", "부정하며", "간소화하며", "과장하며"] },
      { word: "비직관적", options: ["비직관적", "직관적", "논리적", "체계적"] },
      { word: "혁신적", options: ["혁신적", "전통적", "일시적", "비효율적"] },
    ],
  },
  {
    level: "1200",
    title: "철학적 인식론의 발전",
    text: "인식론은 지식의 본질, 범위, 그리고 한계에 관한 철학적 탐구입니다. 고대 그리스의 플라톤과 아리스토텔레스부터 시작하여, 인식론은 인간이 어떻게 세계를 이해하고 지식을 획득하는지에 대한 근본적인 질문을 다루어 왔습니다. 17세기 데카르트의 합리주의는 이성을 통한 확실한 지식의 추구를 강조했으며, 이에 대응하여 로크와 흄의 경험주의는 모든 지식이 감각 경험에서 비롯된다고 주장했습니다. 칸트는 이러한 두 관점을 종합하여, 인간의 인식이 선험적 범주와 경험적 직관의 상호작용을 통해 형성된다는 초월적 관념론을 제시했습니다. 현대에 이르러 인식론은 언어 철학, 인지 과학, 인공지능 연구와 교차하며 지식의 본질에 대한 탐구를 계속하고 있습니다.",
    blanks: [
      { word: "탐구", options: ["탐구", "거부", "회피", "왜곡"] },
      { word: "근본적인", options: ["근본적인", "피상적인", "일시적인", "부차적인"] },
      { word: "합리주의", options: ["합리주의", "신비주의", "허무주의", "상대주의"] },
      { word: "경험주의", options: ["경험주의", "이상주의", "독단주의", "회의주의"] },
      { word: "선험적", options: ["선험적", "경험적", "직관적", "분석적"] },
      { word: "초월적", options: ["초월적", "물질적", "실용적", "감정적"] },
      { word: "교차하며", options: ["교차하며", "분리되며", "대립하며", "정체되며"] },
    ],
  },
]

// English Lexile passages
const englishLexilePassages = [
  {
    level: "BR",
    title: "My Family",
    text: "I have a family. I have a mom, a dad, and a little brother. We live together. We are happy.",
    blanks: [
      { word: "family", options: ["family", "friend", "teacher", "neighbor"] },
      { word: "together", options: ["together", "alone", "far", "sometimes"] },
      { word: "happy", options: ["happy", "sad", "angry", "tired"] },
    ],
  },
  {
    level: "100",
    title: "School Life",
    text: "I go to school every day. I study with my friends at school. The teacher teaches us many things. During lunch time, I eat with my friends.",
    blanks: [
      { word: "every", options: ["every", "some", "never", "always"] },
      { word: "study", options: ["study", "play", "fight", "sleep"] },
      { word: "teaches", options: ["teaches", "shows", "tells", "hears"] },
      { word: "lunch", options: ["lunch", "snack", "candy", "drink"] },
    ],
  },
  {
    level: "200",
    title: "My Hobbies",
    text: "On weekends, I enjoy various hobby activities. I like reading books or listening to music. Sometimes I ride my bicycle in the park. Hobbies help me reduce stress.",
    blanks: [
      { word: "various", options: ["various", "special", "difficult", "simple"] },
      { word: "enjoy", options: ["enjoy", "dislike", "avoid", "ignore"] },
      { word: "bicycle", options: ["bicycle", "car", "train", "airplane"] },
      { word: "reduce", options: ["reduce", "increase", "maintain", "cause"] },
    ],
  },
  {
    level: "300",
    title: "Healthy Living",
    text: "For a healthy life, balanced meals and regular exercise are important. It is good to eat plenty of fresh fruits and vegetables, and exercise for at least 30 minutes every day. Also, sufficient sleep is essential for physical and mental health.",
    blanks: [
      { word: "balanced", options: ["balanced", "nutritious", "caloric", "tasty"] },
      { word: "regular", options: ["regular", "intense", "intermittent", "professional"] },
      { word: "eat", options: ["eat", "cook", "sell", "grow"] },
      { word: "essential", options: ["essential", "unnecessary", "dangerous", "expensive"] },
    ],
  },
  {
    level: "400",
    title: "Environmental Protection",
    text: "Environmental protection is everyone's responsibility. Global warming and pollution have become serious problems. We can protect the environment by saving energy, reducing waste, and practicing recycling. Small actions can make a big difference.",
    blanks: [
      { word: "responsibility", options: ["responsibility", "right", "privilege", "duty"] },
      { word: "serious", options: ["serious", "minor", "temporary", "interesting"] },
      { word: "saving", options: ["saving", "wasting", "producing", "selling"] },
      { word: "practicing", options: ["practicing", "ignoring", "researching", "observing"] },
    ],
  },
  {
    level: "500",
    title: "The Impact of the Internet",
    text: "The Internet has a profound impact on modern society. Information accessibility has improved, and communication with people around the world has become easier. However, there are also negative aspects such as personal information leaks and cybercrime. Therefore, caution and responsibility are needed when using the Internet.",
    blanks: [
      { word: "profound", options: ["profound", "minimal", "temporary", "partial"] },
      { word: "accessibility", options: ["accessibility", "reliability", "stability", "diversity"] },
      { word: "easier", options: ["easier", "harder", "impossible", "limited"] },
      { word: "negative", options: ["negative", "positive", "neutral", "scientific"] },
      { word: "responsibility", options: ["responsibility", "passion", "patience", "creativity"] },
    ],
  },
  {
    level: "600",
    title: "Cultural Diversity",
    text: "Cultural diversity is humanity's rich heritage. Each culture has its unique language, art, food, and traditions, and this diversity enriches our lives. Understanding and respecting other cultures is an important value in global society. Cultural exchange can promote new ideas and innovation.",
    blanks: [
      { word: "rich", options: ["rich", "dangerous", "simple", "unnecessary"] },
      { word: "unique", options: ["unique", "common", "temporary", "external"] },
      { word: "respecting", options: ["respecting", "ignoring", "rejecting", "criticizing"] },
      { word: "value", options: ["value", "problem", "error", "limitation"] },
      { word: "promote", options: ["promote", "hinder", "stop", "reject"] },
    ],
  },
  {
    level: "700",
    title: "The Development of Artificial Intelligence",
    text: "Artificial intelligence technology is developing rapidly and bringing revolutionary changes to our daily lives and industries. Amazing progress is being made in fields such as natural language processing, computer vision, and machine learning. These technologies are being used in various fields such as medicine, education, and transportation to increase efficiency and open new possibilities.",
    blanks: [
      { word: "rapidly", options: ["rapidly", "gradually", "intermittently", "partially"] },
      { word: "revolutionary", options: ["revolutionary", "minimal", "temporary", "negative"] },
      { word: "progress", options: ["progress", "regression", "stagnation", "confusion"] },
      { word: "used", options: ["used", "limited", "prohibited", "ignored"] },
      { word: "possibilities", options: ["possibilities", "risks", "uncertainties", "complexities"] },
    ],
  },
  {
    level: "800",
    title: "Climate Change and Response",
    text: "Climate change is one of the most serious environmental problems facing humanity in the 21st century. Global warming due to increased greenhouse gas emissions is causing various negative effects such as sea level rise, extreme weather events, and ecosystem destruction. To respond to this crisis, the international community is pursuing sustainable development and setting greenhouse gas reduction targets through multilateral agreements such as the Paris Agreement.",
    blanks: [
      { word: "facing", options: ["facing", "avoiding", "solving", "ignoring"] },
      { word: "greenhouse", options: ["greenhouse", "oxygen", "nitrogen", "hydrogen"] },
      { word: "causing", options: ["causing", "reducing", "preventing", "neutralizing"] },
      { word: "multilateral", options: ["multilateral", "unilateral", "personal", "temporary"] },
      { word: "sustainable", options: ["sustainable", "short-term", "inefficient", "unstable"] },
    ],
  },
  {
    level: "900",
    title: "The Development of Modern Medicine",
    text: "Modern medicine has made remarkable progress over the past century. Innovations in antibiotics, vaccines, and surgical techniques have made it possible to treat or prevent many diseases. In particular, the development of genomics and precision medicine is enabling personalized treatment tailored to individual genetic characteristics. Advanced medical devices and telemedicine systems have also greatly improved the accessibility and efficiency of medical services. However, despite these advances, healthcare inequality and ethical issues remain important challenges.",
    blanks: [
      { word: "innovations", options: ["innovations", "failures", "interruptions", "reductions"] },
      { word: "prevent", options: ["prevent", "worsen", "ignore", "spread"] },
      { word: "personalized", options: ["personalized", "standardized", "temporary", "experimental"] },
      { word: "accessibility", options: ["accessibility", "cost", "complexity", "risk"] },
      { word: "challenges", options: ["challenges", "achievements", "benefits", "solutions"] },
    ],
  },
  {
    level: "1000",
    title: "Global Economy and Inequality",
    text: "Globalization has brought significant changes to the world economy. The increase in international trade and investment has promoted economic growth in many countries, but at the same time has deepened inequality between and within countries. As multinational corporations in developed countries utilize low-wage labor in developing countries, job displacement and wage gap issues are occurring. Additionally, the integration of financial markets has increased economic instability and created an environment where financial crises can spread rapidly around the world. International cooperation and inclusive growth policies are needed to address these issues.",
    blanks: [
      { word: "significant", options: ["significant", "minimal", "temporary", "negative"] },
      { word: "promoted", options: ["promoted", "hindered", "stopped", "ignored"] },
      { word: "deepened", options: ["deepened", "resolved", "ignored", "analyzed"] },
      { word: "utilize", options: ["utilize", "protect", "educate", "respect"] },
      { word: "instability", options: ["instability", "stability", "predictability", "transparency"] },
      { word: "inclusive", options: ["inclusive", "exclusive", "temporary", "theoretical"] },
    ],
  },
  {
    level: "1100",
    title: "Principles of Quantum Physics",
    text: "Quantum physics is a theoretical framework that explains physical phenomena in the microscopic world. Unlike classical physics, in quantum mechanics, particles have wave-like properties, and Heisenberg's uncertainty principle applies, which states that the position and momentum of a particle cannot be measured simultaneously with perfect accuracy. The Schrödinger equation describes how quantum systems change over time and predicts non-intuitive phenomena such as quantum superposition and entanglement. These principles of quantum mechanics have become the foundation of modern technological development, enabling various innovative technologies such as lasers, transistors, and magnetic resonance imaging (MRI).",
    blanks: [
      { word: "microscopic", options: ["microscopic", "macroscopic", "theoretical", "practical"] },
      { word: "wave", options: ["wave", "mass", "energy", "velocity"] },
      { word: "uncertainty", options: ["uncertainty", "relativity", "causality", "continuity"] },
      { word: "describes", options: ["describes", "denies", "simplifies", "exaggerates"] },
      { word: "non-intuitive", options: ["non-intuitive", "intuitive", "logical", "systematic"] },
      { word: "innovative", options: ["innovative", "traditional", "temporary", "inefficient"] },
    ],
  },
  {
    level: "1200",
    title: "The Development of Philosophical Epistemology",
    text: "Epistemology is a philosophical inquiry into the nature, scope, and limits of knowledge. Beginning with Plato and Aristotle in ancient Greece, epistemology has addressed fundamental questions about how humans understand the world and acquire knowledge. Descartes' rationalism in the 17th century emphasized the pursuit of certain knowledge through reason, while in response, Locke and Hume's empiricism argued that all knowledge derives from sensory experience. Kant synthesized these two perspectives by presenting transcendental idealism, which suggests that human cognition is formed through the interaction of a priori categories and empirical intuition. In modern times, epistemology continues to explore the nature of knowledge, intersecting with philosophy of language, cognitive science, and artificial intelligence research.",
    blanks: [
      { word: "inquiry", options: ["inquiry", "rejection", "avoidance", "distortion"] },
      { word: "fundamental", options: ["fundamental", "superficial", "temporary", "secondary"] },
      { word: "rationalism", options: ["rationalism", "mysticism", "nihilism", "relativism"] },
      { word: "empiricism", options: ["empiricism", "idealism", "dogmatism", "skepticism"] },
      { word: "a priori", options: ["a priori", "empirical", "intuitive", "analytical"] },
      { word: "transcendental", options: ["transcendental", "material", "practical", "emotional"] },
      { word: "intersecting", options: ["intersecting", "separating", "opposing", "stagnating"] },
    ],
  },
]

export default function LexileTest() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [showResult, setShowResult] = useState(false)
  const [userLevel, setUserLevel] = useState("")
  const [progress, setProgress] = useState(0)
  const [language, setLanguage: any] = useState<"ko" | "en">("ko")

  const currentPassage = language === "ko" ? lexilePassages[currentLevelIndex] : englishLexilePassages[currentLevelIndex]

  useEffect(() => {
    // Initialize answers for the current passage
    if (!answers[currentPassage.level]) {
      setAnswers((prev) => ({
        ...prev,
        [currentPassage.level]: Array(currentPassage.blanks.length).fill(""),
      }))
    }

    // Update progress
    setProgress(((currentLevelIndex + 1) / (language === "ko" ? lexilePassages.length : englishLexilePassages.length)) * 100)
  }, [currentLevelIndex, currentPassage.level, currentPassage.blanks.length, answers, language])

  // Initialize the test with the correct language on page load
  useEffect(() => {
    // You could also get the language from URL parameters or localStorage if needed
    const initialLanguage = "ko"; // Default to Korean
    setLanguage(initialLanguage);
    setCurrentLevelIndex(0);
    setAnswers({});
    setShowResult(false);
  }, []);

  const handleAnswerChange = (blankIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentPassage.level]: prev[currentPassage.level].map((ans, idx) => (idx === blankIndex ? value : ans)),
    }))
  }

  const handleNext = () => {
    // 현재 레벨의 정확도 계산
    const currentAnswers = answers[currentPassage.level] || [];
    const correctCount = currentAnswers.reduce((count, answer, index) => {
      return answer === currentPassage.blanks[index].word ? count + 1 : count;
    }, 0);
    
    const correctPercentage = (correctCount / currentPassage.blanks.length) * 100;
    
    // 70% 미만의 정확도를 달성했다면 테스트 중단하고 결과 표시
    if (correctPercentage < 70) {
      calculateResult();
      setShowResult(true);
      return;
    }
    
    // 다음 레벨로 진행
    if (currentLevelIndex < (language === "ko" ? lexilePassages.length : englishLexilePassages.length) - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      calculateResult();
      setShowResult(true);
    }
  }

  const handlePrevious = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex((prev) => prev - 1)
    }
  }

  const calculateResult = () => {
    let highestCorrectLevel = "BR";
    let highestCorrectIndex = 0;

    // Calculate correct answers for each level
    Object.entries(answers).forEach(([level, levelAnswers]) => {
      const passageIndex = (language === "ko" ? lexilePassages : englishLexilePassages).findIndex((p) => p.level === level);
      if (passageIndex === -1) return;

      const passage = (language === "ko" ? lexilePassages : englishLexilePassages)[passageIndex];
      const correctCount = levelAnswers.reduce((count, answer, index) => {
        return answer === passage.blanks[index].word ? count + 1 : count;
      }, 0);

      // If at least 70% correct and higher than current highest
      const correctPercentage = (correctCount / passage.blanks.length) * 100;
      if (correctPercentage >= 70 && passageIndex >= highestCorrectIndex) {
        highestCorrectLevel = level;
        highestCorrectIndex = passageIndex;
      }
    });

    setUserLevel(highestCorrectLevel);
  }

  const renderPassageWithBlanks = () => {
    const passage = currentPassage
    const words = passage.text.split(" ")

    return (
      <div className="space-y-6">
        <div className="p-4 bg-white rounded-lg border">
          {words.map((word, wordIndex) => {
            const blankIndex = passage.blanks.findIndex(
              (blank) => word.includes(blank.word) && !answers[passage.level]?.includes(blank.word),
            )

            if (blankIndex !== -1 && !answers[passage.level]?.[blankIndex]) {
              return (
                <span key={wordIndex} className="inline-block mx-1">
                  <select
                    className="border-b-2 border-blue-500 bg-blue-50 px-1 py-0.5 rounded text-sm"
                    value={answers[passage.level]?.[blankIndex] || ""}
                    onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
                  >
                    <option value="">{language === "ko" ? "선택..." : "Select..."}</option>
                    {passage.blanks[blankIndex].options.map((option, optIndex) => (
                      <option key={optIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </span>
              )
            }

            return (
              <span key={wordIndex} className="mx-0.5">
                {word}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  const renderResultPage = () => {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{language === "ko" ? "테스트 완료!" : "Test Complete!"}</h2>
          <p className="text-lg mb-4">
            {language === "ko" ? (
              <>귀하의 Lexile 레벨은 <span className="font-bold text-blue-600">{userLevel}</span> 입니다.</>
            ) : (
              <>Your Lexile level is <span className="font-bold text-blue-600">{userLevel}</span>.</>
            )}
          </p>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-left mb-6">
          <h3 className="font-medium mb-2">
            {language === "ko" ? `Lexile 레벨 ${userLevel}의 의미:` : `What Lexile level ${userLevel} means:`}
          </h3>
          <p className="text-sm">
            {language === "ko" ? (
              userLevel === "BR"
                ? "BR(Beginning Reader) 레벨은 초기 독자 수준으로, 기본적인 단어와 문장을 이해할 수 있습니다. 간단한 그림책이나 초기 독자용 도서가 적합합니다."
                : `Lexile ${userLevel} 레벨은 ${Number.parseInt(userLevel) < 500 ? "초급" : Number.parseInt(userLevel) < 900 ? "중급" : "고급"} 독자 수준입니다. 
                이 수준에서는 ${
                  Number.parseInt(userLevel) < 500
                    ? "간단한 문장과 기본 어휘를 이해할 수 있습니다."
                    : Number.parseInt(userLevel) < 900
                      ? "복잡한 문장 구조와 다양한 어휘를 이해할 수 있습니다."
                      : "추상적인 개념과 학술적인 내용을 이해할 수 있는 고급 수준입니다."
                }`
            ) : (
              userLevel === "BR"
                ? "BR (Beginning Reader) level indicates an early reader who can understand basic words and sentences. Simple picture books or early reader books are appropriate."
                : `Lexile ${userLevel} level indicates a ${Number.parseInt(userLevel) < 500 ? "beginner" : Number.parseInt(userLevel) < 900 ? "intermediate" : "advanced"} reader. 
                At this level, you can understand ${
                  Number.parseInt(userLevel) < 500
                    ? "simple sentences and basic vocabulary."
                    : Number.parseInt(userLevel) < 900
                      ? "complex sentence structures and diverse vocabulary."
                      : "abstract concepts and academic content at an advanced level."
                }`
            )}
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {language === "ko" ? "홈으로" : "Home"}
            </Link>
          </Button>
          <Button
            onClick={() => {
              setCurrentLevelIndex(0)
              setShowResult(false)
              setAnswers({})
            }}
          >
            {language === "ko" ? "테스트 다시 하기" : "Retake Test"}
          </Button>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>{language === "ko" ? "홈으로" : "Home"}</span>
              </Button>
              </Link>
              <Link href="/vocabulary-level">
                <Button variant="outline" size="sm" className="ml-2">
                  {language === "ko" ? "어휘 레벨" : "Vocabulary Level"}
                </Button>
              </Link>
              <Link href="/reading-standards">
                <Button variant="outline" size="sm">
                  {language === "ko" ? "reading 성취기준 레벨" : "Reading Standards Level"}
                </Button>
              </Link>
            <h1 className="text-3xl font-bold text-slate-900">Lexile {language === "ko" ? "레벨 테스트" : "Level Test"}</h1>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 gap-1"
              onClick={() => {
                // Set the language first
                const newLanguage = language === "ko" ? "en" : "ko";
                setLanguage(newLanguage);
                
                // Reset the test state
                setCurrentLevelIndex(0);
                setAnswers({});
                setShowResult(false);
              }}
            >
              <Globe className="h-4 w-4" />
              <span>{language === "ko" ? "English Test" : "한국어 테스트"}</span>
            </Button>
          </div>
          <p className="text-slate-600 mt-1">
            {language === "ko"
              ? "빈칸 채우기 문제를 통해 귀하의 Lexile 독해 레벨을 측정합니다"
              : "Measure your Lexile reading level through cloze tests"}
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {!showResult ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {language === "ko" ? "레벨" : "Level"} {currentPassage.level} - {currentPassage.title}
                  </CardTitle>
                  <CardDescription>
                    {language === "ko"
                      ? "아래 지문의 빈칸에 들어갈 가장 적절한 단어를 선택하세요"
                      : "Select the most appropriate word to fill in the blank in the passage below"}
                  </CardDescription>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                    <h4 className="font-medium mb-1">{language === "ko" ? "테스트 방법 안내" : "Test Method Guide"}</h4>
                    <p className="text-xs text-slate-600">
                      {language === "ko"
                        ? "이 테스트는 다양한 Lexile 레벨(BR부터 1200L까지)의 지문을 제시하고, 각 지문에서 빈칸에 들어갈 적절한 단어를 선택하게 합니다. 각 레벨에서 70% 이상의 정답률을 보인 가장 높은 레벨이 귀하의 Lexile 레벨로 결정됩니다. 테스트는 순차적으로 진행되며, 모든 레벨을 완료하면 최종 결과를 확인할 수 있습니다."
                        : "This test presents passages at various Lexile levels (from BR to 1200L) and asks you to select appropriate words for the blanks in each passage. Your Lexile level will be determined by the highest level at which you achieve at least 70% accuracy. The test progresses sequentially, and you can see your final result after completing all levels."}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {currentLevelIndex + 1} / {language === "ko" ? lexilePassages.length : englishLexilePassages.length}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Progress value={progress} className="h-2" />
              </div>
              {renderPassageWithBlanks()}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentLevelIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === "ko" ? "이전" : "Previous"}
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[currentPassage.level] || answers[currentPassage.level].some((a) => !a)}
              >
                {currentLevelIndex < (language === "ko" ? lexilePassages.length : englishLexilePassages.length) - 1 ? (
                  <>
                    {language === "ko" ? "다음" : "Next"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  language === "ko" ? "결과 보기" : "See Result"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          renderResultPage()
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{language === "ko" ? "Lexile 레벨이란?" : "What is a Lexile Level?"}</CardTitle>
            <CardDescription>
              {language === "ko"
                ? "Lexile 프레임워크는 독자의 읽기 능력과 텍스트의 난이도를 측정하는 과학적인 접근법입니다"
                : "The Lexile Framework is a scientific approach to measuring a reader's ability and text difficulty"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                {language === "ko"
                  ? "Lexile 측정은 BR(Beginning Reader)부터 1600L 이상까지 다양한 레벨로 구성되어 있습니다. 숫자가 높을수록 더 높은 읽기 능력이나 더 어려운 텍스트를 나타냅니다."
                  : "Lexile measures range from BR (Beginning Reader) to 1600L and above. Higher numbers indicate higher reading ability or more difficult texts."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <h3 className="font-medium mb-1">{language === "ko" ? "초급 독자 (BR-500L)" : "Beginning Reader (BR-500L)"}</h3>
                  <p className="text-xs text-slate-600">
                    {language === "ko"
                      ? "기본적인 어휘와 간단한 문장 구조를 이해할 수 있습니다. 그림책, 초기 독자용 도서에 적합합니다."
                      : "Can understand basic vocabulary and simple sentence structures. Suitable for picture books and early reader books."}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border">
                  <h3 className="font-medium mb-1">{language === "ko" ? "중급 독자 (500L-900L)" : "Intermediate Reader (500L-900L)"}</h3>
                  <p className="text-xs text-slate-600">
                    {language === "ko"
                      ? "더 복잡한 문장과 다양한 어휘를 이해할 수 있습니다. 청소년 소설, 일반 잡지 기사에 적합합니다."
                      : "Can understand more complex sentences and diverse vocabulary. Suitable for young adult novels and general magazine articles."}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border">
                  <h3 className="font-medium mb-1">{language === "ko" ? "고급 독자 (900L-1200L)" : "Advanced Reader (900L-1200L)"}</h3>
                  <p className="text-xs text-slate-600">
                    {language === "ko"
                      ? "복잡한 아이디어와 추상적인 개념을 이해할 수 있습니다. 고등학교 교과서, 대학 입시 자료에 적합합니다."
                      : "Can understand complex ideas and abstract concepts. Suitable for high school textbooks and college entrance materials."}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border">
                  <h3 className="font-medium mb-1">{language === "ko" ? "전문 독자 (1200L+)" : "Expert Reader (1200L+)"}</h3>
                  <p className="text-xs text-slate-600">
                    {language === "ko"
                      ? "학술적이고 전문적인 텍스트를 이해할 수 있습니다. 대학 교재, 학술 논문, 전문 서적에 적합합니다."
                      : "Can understand academic and professional texts. Suitable for college textbooks, academic papers, and specialized books."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="container mx-auto">
          <div className="text-center text-sm text-slate-500">
            <p>© 2025 {language === "ko" ? "대한민국 영어교육 개선 시스템" : "Korean English Education Improvement System"}. All rights reserved.</p>
            <p className="mt-1">
              {language === "ko"
                ? '출처: MetaMetrics Inc., "The Lexile Framework for Reading", 2023'
                : 'Source: MetaMetrics Inc., "The Lexile Framework for Reading", 2023'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

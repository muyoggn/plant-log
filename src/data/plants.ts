// =============================================================
// 植物の「育て方データ」
// よく育てられる観葉植物について、育て方の目安をまとめた表です。
// ここに 1 行足すだけで、登録画面の「種類」に選べる植物が増えます。
//
// ※ 数字は一般的な目安です。鉢の大きさ・土・置き場所で大きく変わるので、
//   「土の表面が乾いたらあげる」を基本にして、参考として使ってください。
// =============================================================

export type CareProfile = {
  id: string;
  name: string; // 日本語の名前
  scientific: string; // 学名（世界共通の名前）
  wikiTitle: string; // 日本語版 Wikipedia の記事名（説明と写真を取ってくるのに使う）
  light: string; // 日当たり
  minTemp: number; // 冬に下回らせたくない気温（℃）
  // 水やり間隔の目安（日）。暖かくてよく育つ時期と、寒くて休んでいる時期の 2 つ
  intervalWarm: number; // 気温 25℃ くらいのとき
  intervalCool: number; // 気温 10℃ くらいのとき
  humidity: string; // 湿度の好み
  tips: string; // ひとことメモ
};

export const careProfiles: CareProfile[] = [
  {
    id: "pothos",
    name: "ポトス",
    scientific: "Epipremnum aureum",
    wikiTitle: "ポトス",
    light: "明るい日陰〜レースカーテン越しの光",
    minTemp: 10,
    intervalWarm: 4,
    intervalCool: 10,
    humidity: "高めが好き。葉に霧吹きをすると元気",
    tips: "つるが伸びすぎたら切って水に挿すと増やせます。",
  },
  {
    id: "monstera",
    name: "モンステラ",
    scientific: "Monstera deliciosa",
    wikiTitle: "モンステラ",
    light: "明るい日陰。直射日光は葉焼けのもと",
    minTemp: 10,
    intervalWarm: 5,
    intervalCool: 12,
    humidity: "高めが好き",
    tips: "気根（茎から出る根）は切っても大丈夫です。",
  },
  {
    id: "sansevieria",
    name: "サンスベリア",
    scientific: "Dracaena trifasciata",
    wikiTitle: "サンスベリア",
    light: "日なた〜明るい日陰",
    minTemp: 10,
    intervalWarm: 10,
    intervalCool: 30,
    humidity: "乾燥に強い",
    tips: "水のあげすぎで根が腐りやすい植物。冬はほぼ水やりなしでOK。",
  },
  {
    id: "pachira",
    name: "パキラ",
    scientific: "Pachira glabra",
    wikiTitle: "パキラ属",
    light: "日なた〜明るい日陰",
    minTemp: 5,
    intervalWarm: 5,
    intervalCool: 12,
    humidity: "普通",
    tips: "幹に水をためるので、少し乾かし気味でも元気です。",
  },
  {
    id: "gajumaru",
    name: "ガジュマル",
    scientific: "Ficus microcarpa",
    wikiTitle: "ガジュマル",
    light: "日なたが好き",
    minTemp: 5,
    intervalWarm: 4,
    intervalCool: 10,
    humidity: "普通",
    tips: "日光が足りないと葉が落ちやすくなります。",
  },
  {
    id: "rubber-tree",
    name: "フィカス・エラスティカ（ゴムの木）",
    scientific: "Ficus elastica",
    wikiTitle: "インドゴムノキ",
    light: "日なた〜明るい日陰",
    minTemp: 5,
    intervalWarm: 5,
    intervalCool: 12,
    humidity: "普通",
    tips: "葉のほこりを拭くと光をよく吸えます。",
  },
  {
    id: "umbellata",
    name: "フィカス・ウンベラータ",
    scientific: "Ficus umbellata",
    wikiTitle: "フィカス・ウンベラータ",
    light: "明るい場所",
    minTemp: 10,
    intervalWarm: 4,
    intervalCool: 10,
    humidity: "高めが好き",
    tips: "置き場所を急に変えると葉を落とすことがあります。",
  },
  {
    id: "dracaena",
    name: "ドラセナ（幸福の木）",
    scientific: "Dracaena fragrans",
    wikiTitle: "ドラセナ属",
    light: "明るい日陰",
    minTemp: 10,
    intervalWarm: 6,
    intervalCool: 14,
    humidity: "普通",
    tips: "葉先が茶色くなったら空気の乾燥サインです。",
  },
  {
    id: "schefflera",
    name: "シェフレラ（カポック）",
    scientific: "Schefflera arboricola",
    wikiTitle: "シェフレラ",
    light: "日なた〜明るい日陰",
    minTemp: 5,
    intervalWarm: 5,
    intervalCool: 12,
    humidity: "普通",
    tips: "丈夫で育てやすく、初めての1鉢に向いています。",
  },
  {
    id: "zamioculcas",
    name: "ザミオクルカス（ZZプラント）",
    scientific: "Zamioculcas zamiifolia",
    wikiTitle: "ザミオクルカス",
    light: "明るい日陰。暗めの部屋でも育つ",
    minTemp: 10,
    intervalWarm: 10,
    intervalCool: 25,
    humidity: "乾燥に強い",
    tips: "地下の芋に水をためるので、乾かし気味に育てます。",
  },
  {
    id: "spider-plant",
    name: "オリヅルラン",
    scientific: "Chlorophytum comosum",
    wikiTitle: "オリヅルラン",
    light: "明るい日陰",
    minTemp: 5,
    intervalWarm: 4,
    intervalCool: 10,
    humidity: "普通",
    tips: "伸びたランナーの先の子株を植えると増やせます。",
  },
  {
    id: "ivy",
    name: "アイビー（ヘデラ）",
    scientific: "Hedera helix",
    wikiTitle: "セイヨウキヅタ",
    light: "日なた〜日陰まで幅広くOK",
    minTemp: 0,
    intervalWarm: 4,
    intervalCool: 8,
    humidity: "普通",
    tips: "寒さに強く、ベランダでも育てられます。",
  },
  {
    id: "peperomia",
    name: "ペペロミア",
    scientific: "Peperomia spp.",
    wikiTitle: "ペペロミア",
    light: "明るい日陰",
    minTemp: 10,
    intervalWarm: 7,
    intervalCool: 14,
    humidity: "普通",
    tips: "葉が厚く水をためるので、乾いてからたっぷりと。",
  },
  {
    id: "echeveria",
    name: "エケベリア（多肉植物）",
    scientific: "Echeveria spp.",
    wikiTitle: "エケベリア属",
    light: "日なたが大好き",
    minTemp: 5,
    intervalWarm: 10,
    intervalCool: 25,
    humidity: "乾燥が好き",
    tips: "真夏は休む時期なので水を控えめに。",
  },
  {
    id: "cactus",
    name: "サボテン",
    scientific: "Cactaceae",
    wikiTitle: "サボテン",
    light: "日なたが大好き",
    minTemp: 5,
    intervalWarm: 14,
    intervalCool: 40,
    humidity: "乾燥が好き",
    tips: "冬はほとんど水をあげずに休ませます。",
  },
];

// 一覧にない植物を登録したとき用の「ふつうの観葉植物」の目安
export const defaultCare: Omit<CareProfile, "id" | "name" | "scientific" | "wikiTitle"> = {
  light: "明るい日陰（レースカーテン越しの光）",
  minTemp: 10,
  intervalWarm: 5,
  intervalCool: 12,
  humidity: "普通",
  tips: "土の表面が乾いたら、鉢底から流れるくらいたっぷりあげましょう。",
};

export function findCare(id: string | undefined): CareProfile | undefined {
  return careProfiles.find((p) => p.id === id);
}

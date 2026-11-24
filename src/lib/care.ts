import { defaultCare, findCare } from "@/data/plants";
import type { Plant } from "./types";

// 植物の育て方データを取り出す（一覧にない植物は「ふつうの観葉植物」の目安）
export function careOf(plant: Plant) {
  return findCare(plant.careId) ?? { ...defaultCare, name: plant.speciesName };
}

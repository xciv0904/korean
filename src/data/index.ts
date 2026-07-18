import type { Sentence, VocabWord, GrammarPoint } from "../types/sentence";

// hotel_frontdesk
import hotelCheckIn from "./hotel_frontdesk/check_in.json";
import hotelAmenitiesInfo from "./hotel_frontdesk/amenities_info.json";
import hotelBedsheetChange from "./hotel_frontdesk/bedsheet_change.json";
import hotelFacilitiesInfo from "./hotel_frontdesk/facilities_info.json";
import hotelItemRequests from "./hotel_frontdesk/item_requests.json";
import hotelPhoneHandling from "./hotel_frontdesk/phone_handling.json";
import hotelRoomIssues from "./hotel_frontdesk/room_issues.json";
import hotelRoomKeyWifi from "./hotel_frontdesk/room_key_wifi.json";

// daily_dating
import datingCasualChat from "./daily_dating/casual_chat.json";
import datingExpressingInterest from "./daily_dating/expressing_interest.json";
import datingFirstMeeting from "./daily_dating/first_meeting.json";
import datingMakingPlans from "./daily_dating/making_plans.json";
import datingRestaurantOrdering from "./daily_dating/restaurant_ordering.json";
import datingTextingPhrases from "./daily_dating/texting_phrases.json";

import vocabularyRaw from "./vocabulary.json";

import grammarHotel from "./grammar/hotel_frontdesk.json";
import grammarDating from "./grammar/daily_dating.json";

// 完整句庫(共 121 句,取自使用者提供的文字檔 + 後續新增,涵蓋飯店櫃檯 8 個情境 +
// 日常約會 6 個情境)。新增/擴充句子時,在對應 domain 資料夾新增 JSON 檔,
// 並在下方陣列 push 進去即可,元件端不需要改動。
export const ALL_SENTENCES: Sentence[] = [
  ...(hotelCheckIn as Sentence[]),
  ...(hotelAmenitiesInfo as Sentence[]),
  ...(hotelBedsheetChange as Sentence[]),
  ...(hotelFacilitiesInfo as Sentence[]),
  ...(hotelItemRequests as Sentence[]),
  ...(hotelPhoneHandling as Sentence[]),
  ...(hotelRoomIssues as Sentence[]),
  ...(hotelRoomKeyWifi as Sentence[]),
  ...(datingCasualChat as Sentence[]),
  ...(datingExpressingInterest as Sentence[]),
  ...(datingFirstMeeting as Sentence[]),
  ...(datingMakingPlans as Sentence[]),
  ...(datingRestaurantOrdering as Sentence[]),
  ...(datingTextingPhrases as Sentence[]),
];

export function getSentencesByDomain(domain: Sentence["domain"]): Sentence[] {
  return ALL_SENTENCES.filter((s) => s.domain === domain);
}

export function getSentencesByCategory(category: string): Sentence[] {
  return ALL_SENTENCES.filter((s) => s.category === category);
}

export function getSentenceById(id: string): Sentence | undefined {
  return ALL_SENTENCES.find((s) => s.id === id);
}

// 單字表(韓中對照,依 domain 分飯店/約會)。跟 ALL_SENTENCES 是分開的
// 資料集,沒有 SRS/情境分類,VocabBrowser 元件直接讀這個陣列。
export const ALL_VOCAB: VocabWord[] = vocabularyRaw as VocabWord[];

// 文法點(句型 + 中文說明 + 應用例句),依 domain 分飯店/約會。跟
// ALL_SENTENCES 是分開的資料集,GrammarBrowser 元件直接讀這個陣列。
export const ALL_GRAMMAR: GrammarPoint[] = [
  ...(grammarHotel as GrammarPoint[]),
  ...(grammarDating as GrammarPoint[]),
];

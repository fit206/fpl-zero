// lib/advisor/logic_pro_suggest.ts
import { suggestSingleTransfers } from './logic';
import { PlayerElement } from '../fpl/types';

type Suggestion = {
  pos: string;
  outId: number;
  outName: string;
  priceOut: number;
  ePtsOut: number;
  inId: number;
  inName: string;
  priceIn: number;
  ePtsIn: number;
  delta: number;
};

const fullName = (p: PlayerElement) => `${p.first_name} ${p.second_name}`.trim();

export async function suggestSingleTransfersPro(entryId: number, eventId?: number) {
  // PRO MODE: Guna standard mode dengan visual indicator
  // (Untuk masa depan: boleh tambah odds & API-Football integration)
  const result = await suggestSingleTransfers(entryId, { event: eventId ? eventId : 'next' });
  return result;
}

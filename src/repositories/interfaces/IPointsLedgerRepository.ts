import { LedgerEntry } from '../../types/misc';

export interface IPointsLedgerRepository {
    create(entry: Omit<LedgerEntry, 'ledgerId'>): Promise<LedgerEntry>;
    findByPhone(phone: string): Promise<LedgerEntry[]>;
}
import { IPointsLedgerRepository } from '../../interfaces';
import { LedgerEntry } from '../../../types/misc';

import { points_ledger } from '../../../data/points_ledger';
import { counters } from '../../../data/counters';

import { writeData } from '../../../utils/data';

export class FilePointsLedgerRepository implements IPointsLedgerRepository {
    async create(entry: Omit<LedgerEntry, 'ledgerId'>): Promise<LedgerEntry> {
        const newEntry: LedgerEntry = {
            ...entry,
            ledgerId: `ledger_${counters.nextLedgerId++}`
        };
        
        points_ledger.push(newEntry);
        writeData('counters', counters);
        writeData('points_ledger', points_ledger);
        
        return newEntry;
    }

    async findByPhone(phone: string): Promise<LedgerEntry[]> {
        return points_ledger.filter(entry => entry.phone === phone) as LedgerEntry[];
    }
}
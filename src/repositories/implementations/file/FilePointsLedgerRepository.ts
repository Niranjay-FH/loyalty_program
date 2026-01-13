import { IPointsLedgerRepository } from '../../interfaces';
import { LedgerEntry } from '../../../types/misc';

import { points_ledger } from '../../../data/points_ledger';
import { counters } from '../../../data/counters';

import { writeData } from '../../../utils/data';

export class FilePointsLedgerRepository implements IPointsLedgerRepository {
    async create(entry: Omit<LedgerEntry, 'ledgerId'>): Promise<LedgerEntry> {
        if (!entry.basketId) {
            throw new Error('Ledger entry requires valid basketId');
        }

        const nextId = counters.nextLedgerId;
        const ledgerId = `ledger_${nextId}`;
        
        const newEntry: LedgerEntry = {
            ledgerId,
            ...entry
        };
        
        points_ledger.push(newEntry);
        counters.nextLedgerId = nextId + 1;
        
        await writeData('counters', counters, "Counter");
        await writeData('points_ledger', points_ledger, "LedgerEntry");
        
        return newEntry;
    }

    async findByPhone(phone: string): Promise<LedgerEntry[]> {
        return points_ledger.filter(entry => entry.phone === phone);
    }
}
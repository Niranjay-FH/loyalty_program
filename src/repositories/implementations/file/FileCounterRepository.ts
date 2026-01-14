import { ICounterRepository } from '../../interfaces';
import { counters } from '../../../data/counters';
import { writeData } from '../../../utils/data';

export class FileCounterRepository implements ICounterRepository {
    async getNextLedgerId(): Promise<number> {
        const id = counters.nextLedgerId++;
        writeData('counters', counters, "Counter");
        return id;
    }

    async getNextCustomerId(): Promise<number> {
        const id = counters.nextCustomerId++;
        writeData('counters', counters, "Counter");
        return id;
    }
}
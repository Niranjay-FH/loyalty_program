// repositories/file-store.repository.ts
import { IStoreRepository } from '../../interfaces/IStoreRepository';
import { Store } from '../../../types/restaurant';
import { restaurants } from '../../../data/restaurants';
import { writeData } from '../../../utils/data';

export class FileStoreRepository implements IStoreRepository {
    async findById(storeId: string): Promise<Store | null> {
        for (const restaurant of restaurants) {
            const store = restaurant.stores.find(s => s.storeId === storeId);
            if (store) return store;
        }
        return null;
    }
}
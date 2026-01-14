import { Store } from '../../types/restaurant'

export interface IStoreRepository {
    findById(storeId: string): Promise<Store | null>;
}
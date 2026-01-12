export interface ICounterRepository {
    getNextLedgerId(): Promise<number>;
    getNextCustomerId(): Promise<number>;
}
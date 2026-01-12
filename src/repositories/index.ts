import { FileCustomerRepository } from './implementations/file/FileCustomerRepository';
import { FileBasketRepository } from './implementations/file/FileBasketRepository';
import { FilePointsLedgerRepository } from './implementations/file/FilePointsLedgerRepository';
import { FileCounterRepository } from './implementations/file/FileCounterRepository';

// File
export const customerRepository = new FileCustomerRepository();
export const basketRepository = new FileBasketRepository();
export const pointsLedgerRepository = new FilePointsLedgerRepository();
export const counterRepository = new FileCounterRepository();
// File

// import { FileCustomerRepository } from './implementations/file/FileCustomerRepository';
// import { FileBasketRepository } from './implementations/file/FileBasketRepository';
// import { FilePointsLedgerRepository } from './implementations/file/FilePointsLedgerRepository';
// import { FileCounterRepository } from './implementations/file/FileCounterRepository';
// import { FileStoreRepository } from './implementations/file/FileStoreRepository';

// export const customerRepository = new FileCustomerRepository();
// export const basketRepository = new FileBasketRepository();
// export const pointsLedgerRepository = new FilePointsLedgerRepository();
// export const counterRepository = new FileCounterRepository();
// export const storeRepository = new FileStoreRepository();

// Postgres
import { PostgresBasketRepository } from '../repositories/implementations/postgres/PostgresBasketRepository';
import { PostgresCounterRepository } from '../repositories/implementations/postgres/PostgresCounterRepository';
import { PostgresCustomerRepository } from '../repositories/implementations/postgres/PostgresCustomerRepository';
import { PostgresPointsLedgerRepository } from '../repositories/implementations/postgres/PostgresPointsLedgerRepository';
import { PostgresStoreRepository } from '../repositories/implementations/postgres/PostgresStoreRepository';

export const customerRepository = new PostgresCustomerRepository();
export const basketRepository = new PostgresBasketRepository();
export const pointsLedgerRepository = new PostgresPointsLedgerRepository();
export const counterRepository = new PostgresCounterRepository();
export const storeRepository = new PostgresStoreRepository();
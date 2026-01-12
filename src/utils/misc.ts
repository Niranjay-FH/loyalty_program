import type { Customer } from '../types/customer';

export function isBirthday(customer: Customer): number {
    if (!customer.birthday) return 1.0;

    const birthdayDate = new Date(customer.birthday);
    const today = new Date();

    const isBirthdayToday =
        birthdayDate.getMonth() === today.getMonth() &&
        birthdayDate.getDate() === today.getDate();

    return isBirthdayToday ? 1.5 : 1.0;
}
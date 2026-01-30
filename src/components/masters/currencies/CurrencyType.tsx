export interface Currency {
    id: number;
    currency_id?: number;
    name: string;
    code: string;
    symbol: string;
    symbol_native: string;
    decimal_digits: number;
    rounding: number;
    name_plural: string;
    is_base: number;
    created_at: string;
    updated_at: string;
    exchangeRate: number;
}

export type Currencies = Currency[];
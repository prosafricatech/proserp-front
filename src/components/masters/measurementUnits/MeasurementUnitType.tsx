export interface MeasurementUnit {
  id: number;
  name?: string;
  symbol?: string;
  unit_symbol?: string;
  description?: string | null;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  conversion_factor?: number;
}
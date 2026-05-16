export type UserRole = "admin" | "shop_account";
export type BaseUnit = "kg" | "unit";
export type UnitType = "weight" | "count";
export type AnalyticsPeriod = "date" | "month" | "year";

export interface UserSession {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  shop_id?: number | null;
  shop_name?: string | null;
  requires_price_setup?: boolean;
  next_screen: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserSession;
}

export interface ItemPriceRead {
  item_id: number;
  item_name: string;
  unit_type: UnitType;
  base_unit: BaseUnit;
  current_price?: string | null;
}

export interface ShopBootstrapResponse {
  shop_id: number;
  shop_name: string;
  price_date: string;
  prices_set: boolean;
  next_screen: string;
  items: ItemPriceRead[];
}

export interface DailyPriceEntry {
  item_id: number;
  price_per_unit: string;
}

export interface DailyPriceCreate {
  entries: DailyPriceEntry[];
  price_date?: string | null;
}

export interface DailyPriceRead {
  id: number;
  item_id: number;
  price_per_unit: string;
  unit: BaseUnit;
  price_date: string;
  created_at: string;
}

export interface BillItemInput {
  item_id: number;
  quantity: string;
}

export interface CheckoutPaymentInput {
  cash_amount: string;
  upi_amount: string;
}

export interface BillCheckoutRequest {
  items: BillItemInput[];
  payment: CheckoutPaymentInput;
}

export interface BillLineRead {
  item_id: number;
  item_name: string;
  quantity: string;
  unit: BaseUnit;
  price_per_unit: string;
  line_total: string;
}

export interface PaymentRead {
  id: number;
  cash_amount: string;
  upi_amount: string;
  total_paid: string;
  balance: string;
  is_settled: boolean;
}

export interface ReceiptRead {
  id: number;
  receipt_number: string;
  printed_at: string;
}

export interface BillRead {
  id: number;
  bill_no: string;
  shop_id: number;
  shop_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  items: BillLineRead[];
  payment: PaymentRead;
  receipt: ReceiptRead;
}

export interface ShopCreate {
  name: string;
  username: string;
  password: string;
  code?: string | null;
}

export interface ShopUpdate {
  name: string;
  username: string;
  code: string;
  password?: string | null;
}

export interface ShopRead {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  username: string;
}

export interface ShopStatusUpdate {
  is_active: boolean;
}

export interface ShopSalesSummary {
  shop_id: number;
  shop_name: string;
  shop_code: string;
  total_sales: string;
}

export interface PaymentSplitSummary {
  shop_id: number;
  shop_name: string;
  cash_total: string;
  upi_total: string;
}

export interface ItemSalesSummary {
  item_id: number;
  item_name: string;
  base_unit: BaseUnit;
  quantity_sold: string;
  total_amount: string;
  bill_count: number;
}

export interface AdminBillSummary {
  bill_id: number;
  bill_no: string;
  shop_id: number;
  shop_name: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export interface AuditLogRead {
  id: number;
  user_id?: number | null;
  action: string;
  details: string;
  created_at: string;
}

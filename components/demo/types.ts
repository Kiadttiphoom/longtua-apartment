import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type RoleKey = "super_admin" | "owner" | "manager" | "accounting" | "staff";
export type SubscriptionState = "trialing" | "active" | "expired";

export type PageKey =
  | "dashboard" | "companies" | "properties" | "rooms" | "tenants" | "contracts"
  | "meters" | "invoices" | "payments" | "receivables" | "reports" | "line"
  | "users" | "roles" | "permissions" | "menus" | "subscriptions" | "audit" | "settings";

export type NavItem = { code: PageKey; label: string; icon: ComponentType<LucideProps>; addon?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export type Company = {
  name: string;
  owner: string;
  phone?: string;
  plan: string;
  properties?: number;
  dorms?: number;
  rooms?: number;
  users?: number;
  status: string;
  date: string;
};

export type AppSettings = {
  electricRate: number;
  waterRate: number;
  billDay: number;
  dueDay: number;
  lateFee: number;
  promptpay: string;
  accountName: string;
  invoiceHeader: string;
  invoiceNote: string;
  attachQR: boolean;
};

export type RoomRecord = {
  number: string;
  tenant: string;
  rent: number;
  prevElec: number;
  newElec: number | null;
  contractStart: string;
  contractEnd: string;
};

export type ContractRecord = {
  id: string;
  roomNumber: string;
  tenantName: string;
  tenantIdCard: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  advanceRent: number;
  customClauses: string;
  status: "active" | "expired" | "draft";
};

export type Property = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  settings: AppSettings;
  rooms: RoomRecord[];
  contracts: ContractRecord[];
};

export type PageContentProps = {
  activePage: PageKey;
  role: RoleKey;
  isLocked: boolean;
  lineEnabled: boolean;
  onLineChange: (enabled: boolean) => void;
  onOpenPanel: () => void;
  onNavigate: (page: PageKey) => void;
  onToast: (msg: string) => void;
  companies: Company[];
  onDeleteCompany: (idx: number) => void;
  appSettings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  meterRooms: RoomRecord[];
  onMeterChange: (room: string, newElec: number | null) => void;
  contracts: ContractRecord[];
  onViewContract: (contract: ContractRecord) => void;
  onEditContract: (contract: ContractRecord) => void;
  onDeleteContract: (id: string) => void;
  onViewInvoice: (room: RoomRecord) => void;
  activeProperty: Property;
  ownerName: string;
  properties: Property[];
  onSwitchProperty: (id: string) => void;
  onAddProperty: () => void;
  onAddRoom: (room: RoomRecord) => void;
};

export interface BankOption {
  key: string;
  name: string;
  shortName: string;
  image: string;
  color: string;
}

export const SUPPORTED_BANKS: BankOption[] = [
  {
    key: "promptpay",
    name: "พร้อมเพย์ (PromptPay)",
    shortName: "พร้อมเพย์",
    image: "/images/bank/พร้อมเพย์.png",
    color: "#003d6b",
  },
  {
    key: "kbank",
    name: "ธนาคารกสิกรไทย (KBANK)",
    shortName: "กสิกรไทย",
    image: "/images/bank/ธนาคาร กสิกร.png",
    color: "#138f2d",
  },
  {
    key: "scb",
    name: "ธนาคารไทยพาณิชย์ (SCB)",
    shortName: "ไทยพาณิชย์",
    image: "/images/bank/ไทยพาณิชย์ SCB.png",
    color: "#4e2e7f",
  },
  {
    key: "bbl",
    name: "ธนาคารกรุงเทพ (BBL)",
    shortName: "กรุงเทพ",
    image: "/images/bank/ธนาคาร กรุงเทพ.png",
    color: "#1e3f8b",
  },
  {
    key: "ktb",
    name: "ธนาคารกรุงไทย (KTB)",
    shortName: "กรุงไทย",
    image: "/images/bank/ธนาคาร กรุงไทย.png",
    color: "#00a5e5",
  },
  {
    key: "bay",
    name: "ธนาคารกรุงศรีอยุธยา (BAY)",
    shortName: "กรุงศรี",
    image: "/images/bank/ธนาคาร กรุงศรี.png",
    color: "#fec43b",
  },
  {
    key: "ttb",
    name: "ธนาคารทหารไทยธนชาต (ttb)",
    shortName: "ทีทีบี",
    image: "/images/bank/ธนาคาร ttb.png",
    color: "#002d63",
  },
  {
    key: "gsb",
    name: "ธนาคารออมสิน (GSB)",
    shortName: "ออมสิน",
    image: "/images/bank/ธนาคาร ออมสิน.png",
    color: "#eb1985",
  },
  {
    key: "baac",
    name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
    shortName: "ธ.ก.ส.",
    image: "/images/bank/ธนาคาร ธกส.png",
    color: "#216c37",
  },
  {
    key: "uob",
    name: "ธนาคารยูโอบี (UOB)",
    shortName: "ยูโอบี",
    image: "/images/bank/ธนาคาร UOB.png",
    color: "#002c6c",
  },
  {
    key: "kkp",
    name: "ธนาคารเกียรตินาคินภัทร (KKP)",
    shortName: "เกียรตินาคินภัทร",
    image: "/images/bank/ธนาคาร เกียรตินาคิน.png",
    color: "#1990c6",
  },
  {
    key: "tisco",
    name: "ธนาคารทิสโก้ (TISCO)",
    shortName: "ทิสโก้",
    image: "/images/bank/ธนาคาร ทิสโก้.png",
    color: "#124f9e",
  },
  {
    key: "tbank",
    name: "ธนาคารธนชาต (TBANK)",
    shortName: "ธนชาต",
    image: "/images/bank/ธนาคาร ธนชาติ.png",
    color: "#f15a22",
  },
  {
    key: "lhb",
    name: "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
    shortName: "แลนด์ แอนด์ เฮ้าส์",
    image: "/images/bank/ธนาคาร แลนด์แลนด์เฮ้าท์ .png",
    color: "#6d6e71",
  },
  {
    key: "ibank",
    name: "ธนาคารอิสลามแห่งประเทศไทย (iBank)",
    shortName: "อิสลาม",
    image: "/images/bank/ธนาคารอิสลาม.png",
    color: "#0c6a38",
  },
  {
    key: "boc",
    name: "ธนาคารแห่งประเทศจีน (Bank of China)",
    shortName: "แห่งประเทศจีน",
    image: "/images/bank/ธนาคารแห่งประเทศจีน.png",
    color: "#b61a21",
  },
];

/**
 * Searches for a bank by key, name, or shortName.
 * If bankKeyOrText contains an embedded tag e.g. [bank:kbank], extracts it.
 */
export function findBank(bankKeyOrText?: string | null): BankOption | undefined {
  if (!bankKeyOrText) return undefined;
  const raw = bankKeyOrText.trim();

  // Check for embedded [bank:xxx] tag
  const match = raw.match(/\[bank:([a-z0-9_-]+)\]/i);
  if (match) {
    const key = match[1].toLowerCase();
    const found = SUPPORTED_BANKS.find((b) => b.key.toLowerCase() === key);
    if (found) return found;
  }

  const clean = raw.toLowerCase();
  return SUPPORTED_BANKS.find(
    (b) =>
      b.key.toLowerCase() === clean ||
      b.name.toLowerCase() === clean ||
      b.shortName.toLowerCase() === clean ||
      clean.includes(b.shortName.toLowerCase()) ||
      b.name.toLowerCase().includes(clean)
  );
}

/**
 * Helper to strip [bank:xxx] tag from account name for display
 */
export function cleanAccountName(name?: string | null): string {
  if (!name) return "";
  if (name.startsWith("{") && name.endsWith("}")) {
    try {
      const parsed = JSON.parse(name);
      return parsed.bankAccountName || parsed.accountName || parsed.promptpayName || "";
    } catch {
      // ignore
    }
  }
  return name.replace(/\[bank:[a-z0-9_-]+\]/gi, "").trim();
}

export interface PaymentSettingsInput {
  promptpay_id?: string | null;
  account_name?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
}

export interface ParsedPaymentSettings {
  hasBank: boolean;
  bank?: BankOption;
  bankKey: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  hasPromptpay: boolean;
  promptpayId: string;
  promptpayName: string;
  hasAny: boolean;
}

/**
 * Parses settings to extract both Bank Account and PromptPay information,
 * handling backward compatibility and fallback JSON encoding if columns do not exist.
 */
export function parsePaymentSettings(setting?: PaymentSettingsInput | null): ParsedPaymentSettings {
  if (!setting) {
    return {
      hasBank: false,
      bankKey: "",
      bankName: "",
      bankAccountNo: "",
      bankAccountName: "",
      hasPromptpay: false,
      promptpayId: "",
      promptpayName: "",
      hasAny: false,
    };
  }

  // 1. Check if account_name contains encoded JSON fallback
  let jsonFallback: Record<string, string> | null = null;
  if (setting.account_name && setting.account_name.startsWith("{") && setting.account_name.endsWith("}")) {
    try {
      jsonFallback = JSON.parse(setting.account_name);
    } catch {
      jsonFallback = null;
    }
  }

  // Bank Info
  const bankKey = (
    setting.bank_name ||
    jsonFallback?.bankKey ||
    jsonFallback?.bankName ||
    ""
  ).trim();

  const bankAccountNo = (
    setting.bank_account_no ||
    jsonFallback?.bankAccountNo ||
    ""
  ).trim();

  const bankAccountName = (
    setting.bank_account_name ||
    jsonFallback?.bankAccountName ||
    (bankAccountNo ? cleanAccountName(setting.account_name) : "")
  ).trim();

  const bank = bankKey ? findBank(bankKey) : undefined;
  const hasBank = Boolean((bankKey || bank) && bankAccountNo);

  // PromptPay Info
  const promptpayId = (
    setting.promptpay_id ||
    jsonFallback?.promptpayId ||
    ""
  ).trim();

  const promptpayName = (
    jsonFallback?.promptpayName ||
    jsonFallback?.accountName ||
    cleanAccountName(setting.account_name)
  ).trim();

  const hasPromptpay = Boolean(promptpayId);

  // Fallback: If bankAccountNo wasn't set, but bankKey was set and promptpay_id is present
  // and bankKey is NOT promptpay, user might have used old promptpay_id as bank account.
  if (!hasBank && !hasPromptpay && bankKey && bankKey !== "promptpay" && setting.promptpay_id) {
    return {
      hasBank: true,
      bank,
      bankKey,
      bankName: bank?.name || bankKey,
      bankAccountNo: setting.promptpay_id,
      bankAccountName: cleanAccountName(setting.account_name),
      hasPromptpay: false,
      promptpayId: "",
      promptpayName: "",
      hasAny: true,
    };
  }

  return {
    hasBank,
    bank,
    bankKey,
    bankName: bank?.name || bankKey,
    bankAccountNo,
    bankAccountName,
    hasPromptpay,
    promptpayId,
    promptpayName,
    hasAny: hasBank || hasPromptpay,
  };
}


import { Pencil, Printer, X } from "lucide-react";
import { ThaiResidentialLeaseDocument } from "@/components/contracts/ThaiResidentialLeaseDocument";
import type { AppSettings, ContractRecord, Property } from "../types";

export function ContractModal({
  contract,
  settings,
  property,
  ownerName,
  onClose,
  onEdit,
}: {
  contract: ContractRecord;
  settings: AppSettings;
  property: Property;
  ownerName: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={onClose}
              title="ปิด"
              type="button"
            >
              <X size={18} />
            </button>
            <span className="font-bold text-sm text-slate-800">
              สัญญาเช่า · ห้อง {contract.roomNumber} · {contract.tenantName} ({contract.id})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              onClick={onEdit}
              type="button"
            >
              <Pencil size={14} />
              <span>แก้ไข</span>
            </button>
            <button
              className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={14} />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-10 overflow-y-auto bg-white print:p-0 print:overflow-visible">
          <ThaiResidentialLeaseDocument
            advanceAmount={contract.advanceRent}
            contractDate={contract.startDate}
            customTerms={contract.customClauses}
            depositAmount={contract.deposit}
            dueDay={settings.dueDay}
            electricRate={settings.electricRate}
            endDate={contract.endDate}
            landlordName={`กิจการ ${property.name}`}
            landlordRepresentative={settings.accountName || ownerName}
            leaseNumber={contract.id}
            occupantCount={1}
            propertyAddress={property.address}
            propertyName={property.name}
            propertyPhone={property.phone}
            rentAmount={contract.rent}
            roomNumber={contract.roomNumber}
            startDate={contract.startDate}
            tenantIdCard={contract.tenantIdCard}
            tenantName={contract.tenantName}
            tenantPhone={contract.tenantPhone}
            waterBillingMethod="flat_room"
            waterRate={settings.waterRate}
          />
        </div>
      </div>
    </div>
  );
}

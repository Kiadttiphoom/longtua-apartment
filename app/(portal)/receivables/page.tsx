import { ReceivablesPage } from "@/components/portal/ReceivablesPage";
import { loadPortalData } from "@/lib/portal/data";

export default async function Page() { const data = await loadPortalData(); return <ReceivablesPage invoices={data.invoices} properties={data.properties} rooms={data.rooms} />; }

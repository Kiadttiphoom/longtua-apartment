import { ReportsPage } from "@/components/portal/ReportsPage";
import { loadPortalData } from "@/lib/portal/data";

export default async function Page() { return <ReportsPage data={await loadPortalData()} />; }

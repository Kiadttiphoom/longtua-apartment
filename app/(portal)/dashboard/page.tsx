import { DashboardOverview } from "@/components/portal/DashboardOverview";
import { loadPortalData } from "@/lib/portal/data";

export default async function DashboardPage() { return <DashboardOverview data={await loadPortalData()} />; }

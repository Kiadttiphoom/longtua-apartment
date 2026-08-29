import { SubscriptionPage } from "@/components/portal/SubscriptionPage";
import { requirePortalContext } from "@/lib/portal/context";

export default async function Page() { const context = await requirePortalContext(); return <SubscriptionPage subscription={context.subscription} />; }

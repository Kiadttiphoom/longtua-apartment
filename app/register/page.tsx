import { RegisterForm } from "@/components/auth/RegisterForm";
import { isRegistrationEnabled } from "@/lib/auth/system-admin";
import { getRegistrationCapacity } from "@/lib/auth/registration-capacity";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const registration = await isRegistrationEnabled().catch(() => ({ enabled: false, configured: false }));
  const capacity = await getRegistrationCapacity().catch(() => null);
  return <RegisterForm enabled={registration.configured && registration.enabled && capacity !== null && !capacity.full} full={capacity?.full ?? false} />;
}

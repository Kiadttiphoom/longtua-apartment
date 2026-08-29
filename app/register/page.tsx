import { permanentRedirect } from "next/navigation";
import { marketingRegistrationUrl } from "@/lib/auth/trial-registration";

export default function RegisterPage() {
  permanentRedirect(marketingRegistrationUrl());
}

import { redirect } from "next/navigation";

/** Legacy route — fin de journée is automatic; keep deep link out of parcours. */
export default function ProCloturePage() {
  redirect("/pro");
}

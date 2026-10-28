import { redirect } from "next/navigation";
export default function DataQualityRoute() { redirect("/search?scope=words&status=needs-review"); }

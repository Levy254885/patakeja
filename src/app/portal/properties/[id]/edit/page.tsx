"use client";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/Misc";
import { PropertyWizard } from "@/components/portal/PropertyWizard";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  return (<><PageHeader title="Edit property" description="Changes to a published listing may be reviewed again." /><PropertyWizard propertyId={id} /></>);
}

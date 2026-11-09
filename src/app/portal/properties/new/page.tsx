"use client";
import { PageHeader } from "@/components/ui/Misc";
import { PropertyWizard } from "@/components/portal/PropertyWizard";

export default function NewPropertyPage() {
  return (<><PageHeader title="Add a property" description="Five short steps. You can save a draft at any point." /><PropertyWizard /></>);
}

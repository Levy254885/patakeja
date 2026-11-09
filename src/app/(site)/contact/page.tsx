import { Mail, MessageCircle, Phone } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/content/ContentPage";
import { ContactPanel } from "@/components/content/ContactPanel";

export const metadata = pageMeta("Contact us", "Get in touch with the PataKeja support team.", "/contact");
export const revalidate = 300;

export default function ContactPage() {
  return (
    <ContentPage title="Contact us" intro="Questions about a listing, a payment or your account? We are here to help.">
      <ContactPanel icons={{ mail: <Mail className="h-4 w-4 text-forest" />, phone: <Phone className="h-4 w-4 text-forest" />, chat: <MessageCircle className="h-4 w-4 text-forest" /> }} />
    </ContentPage>
  );
}

import { pageMeta } from "@/lib/seo";
import { ContentPage, LegalDraftNotice, prose } from "@/components/content/ContentPage";

export const metadata = pageMeta("Terms of Use", "The terms that apply when you use PataKeja.", "/terms");

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Use" intro="Please read these terms before using PataKeja.">
      <LegalDraftNotice />
      <div className={prose}>
        <h2>1. The service</h2>
        <p>PataKeja is an online marketplace that lets listers advertise properties and lets users find them. We are not a party to any tenancy or sale agreement between users.</p>
        <h2>2. Accounts</h2>
        <p>You must give accurate information and keep your login secure. You are responsible for activity on your account.</p>
        <h2>3. Listings</h2>
        <p>Listers must be authorised to advertise the property and ensure the details, photos and price are accurate. We may reject, edit or remove listings that breach these terms or the law.</p>
        <h2>4. Fees</h2>
        <p>Landlord registration, contact access and listing boosts are paid through M-Pesa at the prices shown at checkout. Fees are charged for access to the service and are not a deposit or rent. Refunds are considered case by case where a payment succeeded but the service was not delivered.</p>
        <h2>5. Your responsibility</h2>
        <p>Verify a property and its owner yourself before paying any rent, deposit or sale price. Do not pay before viewing. Do not post false, misleading or unlawful content.</p>
        <h2>6. Liability</h2>
        <p>To the extent permitted by Kenyan law, we are not liable for disputes between users or for loss arising from reliance on listings.</p>
        <h2>7. Governing law</h2>
        <p>These terms are governed by the laws of Kenya.</p>
      </div>
    </ContentPage>
  );
}

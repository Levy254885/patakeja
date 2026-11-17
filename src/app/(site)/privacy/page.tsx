import { pageMeta } from "@/lib/seo";
import { ContentPage, LegalDraftNotice, prose } from "@/components/content/ContentPage";

export const metadata = pageMeta("Privacy Policy", "How PataKeja collects, uses and protects your personal data under the Kenya Data Protection Act, 2019.", "/privacy");

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" intro="How we handle your personal data, in line with the Kenya Data Protection Act, 2019.">
      <LegalDraftNotice />
      <div className={prose}>
        <h2>1. Who we are</h2>
        <p>PataKeja is the data controller for personal data collected through this website. Contact us at the support email on our Contact page.</p>
        <h2>2. Data we collect</h2>
        <ul>
          <li>Account data: name, email, phone number, role and, optionally, a profile photo.</li>
          <li>Activity data: saved properties, enquiries, viewing requests and recently viewed listings.</li>
          <li>Payment data: M-Pesa phone number, amount and receipt reference. We do not see or store your M-Pesa PIN.</li>
          <li>Landlord and agent verification documents, where you submit them.</li>
        </ul>
        <h2>3. Why we use it</h2>
        <p>To run your account, show listings, connect tenants with listers, process payments, prevent fraud and meet legal obligations. Optional details such as your workplace or school are used only for location suggestions and are never shown publicly unless you choose to share them.</p>
        <h2>4. Sharing</h2>
        <p>Your enquiry details are shared with the lister you contact. Landlord contact details are shown only to users who unlock them. We use service providers (hosting, payments, image storage) who process data on our behalf. We do not sell personal data.</p>
        <h2>5. Your rights</h2>
        <p>Under the Data Protection Act, 2019 you may ask to access, correct or delete your data, object to processing, and withdraw consent. Contact support to exercise these rights. You may also complain to the Office of the Data Protection Commissioner.</p>
        <h2>6. Retention and security</h2>
        <p>We keep data while your account is active and as required for legal, tax and fraud-prevention purposes. We use access controls and encrypted connections to protect it.</p>
        <h2>7. Changes</h2>
        <p>We will post updates to this policy on this page.</p>
      </div>
    </ContentPage>
  );
}

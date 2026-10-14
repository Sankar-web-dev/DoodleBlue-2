import { CertificateRequestForm } from "../_components/certificate-request-form";

export default function RequestCertificatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create certificate
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the event and the student. The request goes to the faculty
          coordinator for approval.
        </p>
      </div>
      <div className="max-w-3xl">
        <CertificateRequestForm />
      </div>
    </div>
  );
}

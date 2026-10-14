import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function CertificatesPage() {
  return (
    <RequirePermission resource="certificates">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage certificate requests and issuance.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}

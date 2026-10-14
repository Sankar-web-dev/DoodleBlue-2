import { MembershipForm } from "../_components/membership-form";

export default function CreateMembershipPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add membership</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign a member to a club — optionally as its coordinator.
        </p>
      </div>
      <div className="max-w-3xl">
        <MembershipForm />
      </div>
    </div>
  );
}

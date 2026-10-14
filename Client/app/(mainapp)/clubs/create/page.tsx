import { ClubForm } from "../_components/club-form";

export default function CreateClubPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create club</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new club and assign its faculty coordinator.
        </p>
      </div>
      <div className="max-w-3xl">
        <ClubForm />
      </div>
    </div>
  );
}

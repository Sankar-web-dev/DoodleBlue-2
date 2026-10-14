import { EventForm } from "../_components/event-form";

export default function CreateEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new campus event. It starts as a draft — submit it for approval
          when ready.
        </p>
      </div>
      <div className="max-w-3xl">
        <EventForm />
      </div>
    </div>
  );
}

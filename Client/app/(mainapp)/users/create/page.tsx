import { UserForm } from "../_components/user-form";

export default function CreateUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create user</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision a new account with an active role and a temporary password.
        </p>
      </div>
      <div className="max-w-3xl">
        <UserForm />
      </div>
    </div>
  );
}

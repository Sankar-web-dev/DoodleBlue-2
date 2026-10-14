import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";
import UsersView from "./_components/user-view";


export default function UsersPage() {
  return (
    <RequirePermission resource="users">
      <UsersView/>
    </RequirePermission>
  );
}

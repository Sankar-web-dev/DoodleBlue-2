import { authService } from "@/api/auth.api";

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  return authService.changePassword(currentPassword, newPassword);
}

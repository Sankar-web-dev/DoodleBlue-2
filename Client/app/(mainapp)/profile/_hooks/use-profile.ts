"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/use-auth-user";
import { useUser } from "../../users/_hooks/use-users";
import { AUTH_ME_KEY } from "@/api/auth.api";
import { changePasswordAction } from "../_actions/profile.actions";

export function useProfile() {
  const { user: authUser, isPending: authPending } = useAuthUser();
  const { data: userDetail, isLoading: userDetailLoading } = useUser(authUser?.id ?? "");

  const user = userDetail?.user ?? authUser;
  const isLoading = authPending || (!!authUser?.id && userDetailLoading);

  return {
    user,
    isLoading,
  };
}

export function useChangePassword(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePasswordAction(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed successfully", {
        description: "Your account password has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: AUTH_ME_KEY });
      onSuccess?.();
    },
  });
}

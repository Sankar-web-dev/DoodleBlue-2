'use client';


import { Button, type ButtonProps  } from "./button";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authApi } from "@/api/auth.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";


interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({ 
  showIcon = false, 
  className,
  ...props 
}: LogoutButtonProps) {
  
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged out successfully");
      router.replace('/login');
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to logout");
      console.error('Logout error:', error);
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className={cn(className, "w-full")}
      {...props}
    >
      {logoutMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{logoutMutation.isPending ? "Logging out…" : "Log out"}</span>
    </Button>
  );
}
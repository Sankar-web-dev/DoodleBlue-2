import {
  usersApi,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/api/users.api";

export async function createUserAction(input: CreateUserInput) {
  return usersApi.createUser({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    roleId: input.roleId,
    ...(input.image?.trim() ? { image: input.image.trim() } : {}),
  });
}

export async function updateUserAction(id: string, input: UpdateUserInput) {
  return usersApi.updateUser(id, {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
    ...(input.password ? { password: input.password } : {}),
    ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
    ...(input.image !== undefined ? { image: input.image.trim() || undefined } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });
}

export async function deleteUserAction(id: string) {
  return usersApi.deleteUser(id);
}

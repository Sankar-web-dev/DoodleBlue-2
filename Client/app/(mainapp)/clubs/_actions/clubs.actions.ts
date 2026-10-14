import { clubsApi } from "@/api/clubs.api";
import type { CreateClubInput, UpdateClubInput } from "@/api/clubs.api";

export async function createClubAction(input: CreateClubInput) {
  return clubsApi.createClub(input);
}

export async function updateClubAction(id: string, input: UpdateClubInput) {
  return clubsApi.updateClub(id, input);
}

export async function deleteClubAction(id: string) {
  return clubsApi.deleteClub(id);
}

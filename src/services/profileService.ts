import { request } from "./http";

export type ProfileUpdate = {
  displayName?: string;
  bio?: string;
};

export const profileService = {
  update(patch: ProfileUpdate): Promise<{ displayName: string; bio: string }> {
    return request<{ displayName: string; bio: string }>({
      url: "/api/profile",
      method: "PATCH",
      data: patch,
    });
  },

  changePhoto(file: File): Promise<{ photoUrl: string }> {
    const fd = new FormData();
    fd.append("photo", file);
    return request<{ photoUrl: string }>({
      url: "/api/profile/photo",
      method: "POST",
      data: fd,
    });
  },
};

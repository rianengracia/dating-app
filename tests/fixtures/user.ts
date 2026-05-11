export type UserFixture = {
  id: string;
  email: string;
  displayName: string;
  age: number;
  bio: string;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
};

let n = 0;

export function makeUser(over: Partial<UserFixture> = {}): UserFixture {
  n += 1;
  return {
    id: `user-${n}`,
    email: `agent${n}@truematch.test`,
    displayName: `Agent ${n}`,
    age: 25,
    bio: "Looking for a duo.",
    photoUrl: `https://blob.example/photo-${n}.jpg`,
    latitude: 14.5995,
    longitude: 120.9842,
    ...over,
  };
}

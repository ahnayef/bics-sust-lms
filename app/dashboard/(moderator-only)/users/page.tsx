import { getDivisions } from "@/server/geo";
import { getUsers } from "@/server/library";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const [users, { data: divisions }] = await Promise.all([
    getUsers(),
    getDivisions(),
  ]);
  return <UsersClient users={users} divisions={divisions} />;
}

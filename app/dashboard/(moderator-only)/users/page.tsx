import { getUsers } from "@/server/library";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const users = await getUsers();
  return <UsersClient users={users} />;
}

import { getAdmin, getUser, jsonError, SIGN_IN_AGAIN } from "@/lib/server";

// Deletes the signed-in user's account. Every table cascades from auth.users
// (via profiles), so this wipes their words, conversations, progress and usage too.
// Apple requires in-app account deletion for any app that lets people sign up.
export async function DELETE(request) {
  const user = await getUser(request);
  if (!user) return jsonError(SIGN_IN_AGAIN, 401);

  const { error } = await getAdmin().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Account deletion failed:", error);
    return jsonError("Couldn't delete your account. Try again in a moment.", 500);
  }
  return Response.json({ ok: true });
}

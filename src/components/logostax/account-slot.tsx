import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useHouse } from "@/lib/firebase/house-provider";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function ClubSignIn({ label, className }: { label: string; className?: string }) {
  return (
    <Link to="/login" search={{ next: "/logostax" }} className={className ?? "x-btn"}>
      <span>{label}</span>
    </Link>
  );
}

export function AccountSlot({ onError }: { onError: (message: string) => void }) {
  const { user, isPending } = useCurrentUserState();
  const house = useHouse();
  const [signingOut, setSigningOut] = useState(false);
  const signedIn = Boolean(user && !user.isDevFallback);

  if (isPending) return <span className="avatar ghost" aria-hidden="true" />;
  if (!signedIn) return <ClubSignIn label="Sign in" className="texty" />;

  const label = user?.displayName ?? user?.primaryEmail ?? "You";
  return (
    <span className="account">
      {user?.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="avatar" />
      ) : (
        <span className="avatar" aria-hidden="true">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="account-name">{label}</span>
      <button
        type="button"
        className="texty"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void house.signOut().catch((error: unknown) => {
            setSigningOut(false);
            onError(error instanceof Error ? error.message : "Couldn't sign out");
          });
        }}
      >
        {signingOut ? "Signing out" : "Sign out"}
      </button>
    </span>
  );
}

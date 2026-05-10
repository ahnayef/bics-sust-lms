"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { verifyUser, unVerifyUser } from "@/server/profiles";
import ConfirmModal from "@/components/ui/confirm-modal";

interface Props {
  userId: string;
  isVerified: boolean;
  userName: string;
}

export default function UserActions({ userId, isVerified, userName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUnverifyModal, setShowUnverifyModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleVerify = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await verifyUser(userId);
      if (result?.error) {
        setActionError(result.error);
      }
      setShowVerifyModal(false);
      router.refresh();
    });
  };

  const handleUnverify = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await unVerifyUser(userId);
      if (result?.error) {
        setActionError(result.error);
      }
      setShowUnverifyModal(false);
      router.refresh();
    });
  };

  return (
    <>
      {actionError && (
        <div className="mb-3 px-4 py-2.5 border border-[#b0665c] bg-[#f6e3df] text-[#7d2d23] text-sm rounded-sm ink-text">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowVerifyModal(true)}
          disabled={isVerified || isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium text-sm ink-text disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaCheckCircle className="w-4 h-4" />
          Verify User
        </button>

        <button
          type="button"
          onClick={() => setShowUnverifyModal(true)}
          disabled={!isVerified || isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f6ecdd] text-[#6a4e3d] border border-[#c4ad91] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaTimesCircle className="w-4 h-4" />
          Unverify User
        </button>
      </div>

      <ConfirmModal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onConfirm={handleVerify}
        title="Verify Member"
        preview={`Verifying grants ${userName} full library access.`}
        confirmLabel="Verify Member"
        loading={isPending}
      />

      <ConfirmModal
        open={showUnverifyModal}
        onClose={() => setShowUnverifyModal(false)}
        onConfirm={handleUnverify}
        title="Remove Verification"
        description="This will revoke their verified status. They will need to be re-verified by an admin."
        preview={userName}
        danger={true}
        confirmLabel="Remove Verification"
        loading={isPending}
      />
    </>
  );
}

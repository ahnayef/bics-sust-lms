"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { verifyUser, unVerifyUser } from "@/server/profiles";
import ConfirmModal from "@/components/ui/confirm-modal";

interface Props {
  userId: string;
  isVerified: boolean;
  userName: string;
}

export default function ProfileUserActions({
  userId,
  isVerified,
  userName,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUnverifyModal, setShowUnverifyModal] = useState(false);

  const handleVerify = () => {
    startTransition(async () => {
      await verifyUser(userId);
      setShowVerifyModal(false);
      router.refresh();
    });
  };

  const handleUnverify = () => {
    startTransition(async () => {
      await unVerifyUser(userId);
      setShowUnverifyModal(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {!isVerified ? (
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium text-sm ink-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaCheckCircle className="w-4 h-4" /> Verify
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowUnverifyModal(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f0e4d1] text-[#4c3e31] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaClock className="w-4 h-4" /> Remove Verification
          </button>
        )}
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

"use client";

import ConfirmModal from "@/components/ui/confirm-modal";
import { unVerifyUser, verifyUser, makeAdmin } from "@/server/profiles";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface Props {
  userId: string;
  isVerified: boolean;
  userName: string;
  userRole: string;
  isAdmin: boolean;
}

export default function UserActions({
  userId,
  isVerified,
  userName,
  userRole,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUnverifyModal, setShowUnverifyModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showMakeAdminModal1, setShowMakeAdminModal1] = useState(false);
  const [showMakeAdminModal2, setShowMakeAdminModal2] = useState(false);

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

  const handleMakeAdmin = () => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", userId);
      const result = await makeAdmin(fd);
      if (result?.error) {
        setActionError(result.error);
      }
      setShowMakeAdminModal2(false);
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

        {isAdmin && userRole !== "admin" && (
          <button
            type="button"
            onClick={() => setShowMakeAdminModal1(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b2b2b] text-[#f4e8d4] border border-[#6b2222] rounded-sm hover:bg-[#a63333] transition-colors font-medium text-sm ink-text disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Make Admin
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

      <ConfirmModal
        open={showMakeAdminModal1}
        onClose={() => setShowMakeAdminModal1(false)}
        onConfirm={() => {
          setShowMakeAdminModal1(false);
          setShowMakeAdminModal2(true);
        }}
        title="Make Admin - First Confirmation"
        description="Are you absolutely sure you want to make this user an Admin? Admins have full access to everything."
        preview={userName}
        danger={true}
        confirmLabel="Yes, I am sure"
        loading={isPending}
      />

      <ConfirmModal
        open={showMakeAdminModal2}
        onClose={() => setShowMakeAdminModal2(false)}
        onConfirm={handleMakeAdmin}
        title="Make Admin - Final Confirmation"
        description="This is a destructive action. Once an Admin, they can modify other users, including moderators. Are you REALLY sure?"
        preview={`Target User: ${userName}`}
        danger={true}
        confirmLabel="Yes, Make Admin"
        loading={isPending}
      />
    </>
  );
}

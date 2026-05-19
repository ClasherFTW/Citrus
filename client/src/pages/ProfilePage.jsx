import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/AuthContext";
import { getMyProfile, uploadMyAvatar } from "../features/profile/profileApi";
import { fetchRecentUserAnswers, fetchRecentUserQuestions } from "../features/profile/profileQueries";
import AppShell from "../components/layout/AppShell";
import ProfileSummary from "../components/profile/ProfileSummary";
import EmptyState from "../components/shared/EmptyState";
import { useToast } from "../features/ui/ToastContext";

function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });

  const questionsQuery = useQuery({
    queryKey: ["profile", "me", "questions", user?.id || user?._id],
    queryFn: () => fetchRecentUserQuestions(user?.id || user?._id),
    enabled: Boolean(user?.id || user?._id),
  });

  const answersQuery = useQuery({
    queryKey: ["profile", "me", "answers", user?.id || user?._id],
    queryFn: () => fetchRecentUserAnswers(user?.id || user?._id),
    enabled: Boolean(user?.id || user?._id),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: () => {
      setSelectedAvatar(null);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Profile photo updated", "Your avatar is now stored in Cloudinary.");
    },
    onError: (error) => {
      toast.error("Upload failed", error.message || "Please try another image.");
    },
  });

  const isUploadingAvatar = uploadAvatarMutation.isPending;

  async function handleUploadAvatar(event) {
    event.preventDefault();

    if (!selectedAvatar) {
      toast.info("Choose an image", "Please select a profile photo first.");
      return;
    }

    await uploadAvatarMutation.mutateAsync(selectedAvatar);
  }

  return (
    <AppShell title="My Profile" subtitle="Your contributions and activity">
      {profileQuery.isLoading ? <section className="content-panel"><p>Loading profile...</p></section> : null}

      {profileQuery.isError ? (
        <EmptyState
          title="Could not load your profile"
          description={profileQuery.error?.message || "Please refresh and try again."}
          action={
            <button type="button" className="btn btn--primary" onClick={() => profileQuery.refetch()}>
              Retry
            </button>
          }
        />
      ) : null}

      {profileQuery.data ? (
        <ProfileSummary
          profile={profileQuery.data}
          questions={questionsQuery.data || []}
          answers={answersQuery.data || []}
          isLoadingQuestions={questionsQuery.isLoading}
          isLoadingAnswers={answersQuery.isLoading}
          avatarActions={
            <form className="profile-avatar-upload" onSubmit={handleUploadAvatar}>
              <label htmlFor="profile-avatar-input">
                Profile photo
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedAvatar(event.target.files?.[0] || null)}
                  disabled={isUploadingAvatar}
                />
              </label>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!selectedAvatar || isUploadingAvatar}
              >
                {isUploadingAvatar ? "Uploading..." : "Upload to Cloudinary"}
              </button>
            </form>
          }
        />
      ) : null}
    </AppShell>
  );
}

export default ProfilePage;

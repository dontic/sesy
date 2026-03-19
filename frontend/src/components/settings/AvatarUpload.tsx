import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/stores/UserStore";
import { ImageCropper } from "./ImageCropper";
import { profileAvatarDelete, profileAvatarUpload } from "@/api/django/authentication-profile/authentication-profile";

export function AvatarUpload() {
  const { user, updateAvatar } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      // Read file and open cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    setSelectedFile(null);

    // Immediately upload after cropping
    setIsUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "avatar.png", { type: "image/png" });

      const uploadResponse = await profileAvatarUpload({ avatar: file });

      // Update the user store with the new avatar
      updateAvatar(uploadResponse.avatar ?? null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast.error("Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsUploading(true);
    try {
      await profileAvatarDelete();

      // Update the user store to remove the avatar
      updateAvatar(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile picture removed");
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      toast.error("Failed to remove profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <ImageCropper
        dialogOpen={cropperOpen}
        setDialogOpen={setCropperOpen}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onCropComplete={handleCropComplete}
      />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar Preview */}
        <div className="relative group">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user?.profile?.avatar ?? undefined}
              alt={user?.full_name}
            />
            <AvatarFallback className="text-2xl">
              {user?.first_name?.charAt(0) ?? "?"}
              {user?.last_name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 hover:cursor-pointer"
            disabled={isUploading}
          >
            <Camera className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="flex flex-1 flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
              className="hover:cursor-pointer"
            >
              <Camera className="mr-2 h-4 w-4" />
              Upload New
            </Button>
            {user?.profile.avatar && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                loading={isUploading}
                className="text-destructive hover:text-destructive hover:cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>
    </>
  );
}

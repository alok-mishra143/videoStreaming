import React, { useState, useContext } from "react";
import API from "../services/api";
import { getMyOrgs, type Organization } from "../services/orgService";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const { user } = useContext(AuthContext)!;
  const queryClient = useQueryClient();

  const { data: orgs = [] } = useQuery({
    queryKey: ["writableOrgs", user?._id],
    queryFn: async () => {
      const data = await getMyOrgs();
      return data.filter((org: Organization) => {
        if (org.owner._id === user?._id) return true;
        const member = org.members.find((m) => m.user._id === user?._id);
        return member && member.role === "editor";
      });
    },
    enabled: !!user,
  });

  const activeOrgId = selectedOrg || (orgs.length > 0 ? orgs[0]._id : "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await API.post("/videos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      setUploading(false);
      setTitle("");
      setDescription("");
      setFile(null);
      toast.success("Video uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error) => {
      console.error(error);
      setUploading(false);
      toast.error("Failed to upload video.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);
    if (activeOrgId) {
      formData.append("orgId", activeOrgId);
    }

    setUploading(true);
    uploadMutation.mutate(formData);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Upload New Video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="org">Organization</Label>
            <Select value={activeOrgId} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Video Title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Video Description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video">Video File</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              required
              className="cursor-pointer"
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUpload;

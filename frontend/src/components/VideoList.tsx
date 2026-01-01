import { useEffect, useContext } from "react";
import API from "../services/api";
import socket from "../services/socket";
import {
  getMyOrgs,
  type Organization as ServiceOrganization,
} from "../services/orgService";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Video {
  _id: string;
  title: string;
  description: string;
  status: string;
  sensitivity: string;
  progress?: number;
  organization?: {
    _id: string;
    name: string;
  };
  user: string;
}

const VideoList = () => {
  const { user } = useContext(AuthContext)!;
  const queryClient = useQueryClient();

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data } = await API.get<Video[]>("/videos");
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: userOrgs = [] } = useQuery({
    queryKey: ["userOrgs", user?._id],
    queryFn: async () => {
      const data = await getMyOrgs();
      return data.map((org: ServiceOrganization) => {
        let role = "viewer";
        if (org.owner._id === user?._id) {
          role = "owner";
        } else {
          const member = org.members.find((m) => m.user._id === user?._id);
          if (member) role = member.role;
        }
        return { _id: org._id, role };
      });
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/videos/${id}`);
    },
    onSuccess: () => {
      toast.success("Video deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error) => {
      console.error("Failed to delete video", error);
      toast.error("Failed to delete video. You might not have permission.");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate(id);
    }
  };

  useEffect(() => {
    if (!Array.isArray(videos)) return;
    videos.forEach((video) => {
      if (video.status === "processing") {
        const eventName = `video-progress-${video._id}`;
        const handler = (data: Partial<Video>) => {
          queryClient.setQueryData(
            ["videos"],
            (oldVideos: Video[] | undefined) => {
              if (!oldVideos) return [];
              return oldVideos.map((v) =>
                v._id === video._id ? { ...v, ...data } : v
              );
            }
          );
        };

        socket.on(eventName, handler);

        return () => {
          socket.off(eventName, handler);
        };
      }
    });
  }, [videos, queryClient]);

  const canDelete = (video: Video) => {
    if (!video.organization) return true; // Fallback for legacy videos
    const org = userOrgs.find((o) => o._id === video.organization!._id);
    return org?.role === "owner" || org?.role === "editor";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.isArray(videos) &&
        videos.map((video) => (
          <Card key={video._id} className="flex flex-col relative group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <CardTitle className="truncate" title={video.title}>
                    {video.title}
                  </CardTitle>
                  {video.organization && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {video.organization.name}
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    video.status === "completed"
                      ? "default"
                      : video.status === "processing"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {video.status}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {video.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grow">
              {video.status === "processing" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing</span>
                    <span>{video.progress || 0}%</span>
                  </div>
                  <Progress value={video.progress || 0} />
                </div>
              )}
              {video.sensitivity && video.status === "completed" && (
                <div className="mt-2">
                  <Badge
                    variant={
                      video.sensitivity === "safe" ? "outline" : "destructive"
                    }
                  >
                    Sensitivity: {video.sensitivity}
                  </Badge>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              {video.status === "completed" && (
                <Button asChild className="flex-1">
                  <Link to={`/video/${video._id}`}>Watch Video</Link>
                </Button>
              )}
              {canDelete(video) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(video._id)}
                  title="Delete Video"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      {videos.length === 0 && (
        <div className="col-span-full text-center py-10 text-muted-foreground">
          No videos found. Upload one to get started!
        </div>
      )}
    </div>
  );
};

export default VideoList;

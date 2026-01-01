import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  createdAt: string;
}

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: async () => {
      const { data } = await API.get<Video>(`/videos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !video)
    return (
      <div className="flex justify-center items-center h-full py-20">
        Loading...
      </div>
    );

  return (
    <div className="flex flex-col space-y-6">
      <header className="border-b p-4">
        <div className="container mx-auto">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="grow container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-6">
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-xl">
            <video controls className="w-full h-full" crossOrigin="anonymous">
              <source
                src={`${
                  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
                }/videos/stream/${id}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{video.title}</CardTitle>
              <CardDescription>
                Uploaded on {new Date(video.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {video.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VideoPlayer;

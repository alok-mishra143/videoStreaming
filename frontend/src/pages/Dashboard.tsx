import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import VideoUpload from "../components/VideoUpload";
import VideoList from "../components/VideoList";
import OrgManagement from "../components/OrgManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const { user } = useContext(AuthContext)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos">My Videos</TabsTrigger>
          {user?.role !== "viewer" && (
            <TabsTrigger value="upload">Upload Video</TabsTrigger>
          )}
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight">
              Your Videos
            </h3>
          </div>
          <VideoList />
        </TabsContent>

        {user?.role !== "viewer" && (
          <TabsContent value="upload">
            <VideoUpload />
          </TabsContent>
        )}

        <TabsContent value="organization">
          <OrgManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

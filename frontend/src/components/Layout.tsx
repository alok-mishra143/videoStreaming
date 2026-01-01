import { Outlet, Link } from "react-router-dom";
import { ModeToggle } from "./theme/modeToggle";
import { Button } from "./ui/button";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Video } from "lucide-react";

export const Layout = () => {
  const { user, logout } = useContext(AuthContext)!;

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Video className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                VideoStream
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none"></div>
            <nav className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden md:inline-block">
                    {user.username}
                  </span>
                  <Button variant="ghost" onClick={logout} size="sm">
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </div>
              )}
              <ModeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-6 mx-auto flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

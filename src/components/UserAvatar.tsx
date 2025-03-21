
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppUser } from "@/context/AuthContext";

export const UserAvatar = ({ user }: { user?: AppUser | null }) => {
  if (!user) return null;
  
  const initials = user.email ? user.email.charAt(0).toUpperCase() : "U";
  
  return (
    <Avatar className="h-10 w-10 border-2 border-background transition-all hover:scale-105">
      <AvatarImage 
        src={user.avatar || ""} 
        alt={user.email || "User avatar"} 
        className="object-cover"
      />
      <AvatarFallback 
        className="bg-primary text-primary-foreground font-medium"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

import { Avatar as HeroAvatar } from "@heroui/react";

interface AvatarProps {
  src?: string;
  name?: string;
}

export default function Avatar({ src, name }: AvatarProps) {
  return <HeroAvatar src={src} name={name} />;
} 
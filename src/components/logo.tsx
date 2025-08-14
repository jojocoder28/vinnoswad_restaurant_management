
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo_vinnoswad.png"
      alt="Vinnoswad Logo"
      width={112} // 28 * 4
      height={64} // 16 * 4
      className={cn("object-contain", className)}
    />
  );
}

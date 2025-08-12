import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground',
        className
      )}
    >
      <UtensilsCrossed className="h-6 w-6" />
    </div>
  );
}

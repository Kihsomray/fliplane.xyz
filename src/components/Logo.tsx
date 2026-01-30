import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="Fliplane"
      width={160}
      height={30}
      className={className}
      priority
    />
  );
}

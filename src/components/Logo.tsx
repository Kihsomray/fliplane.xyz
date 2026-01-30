import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export const LogoIcon = ({ className = '' }: LogoProps) => (
  <Image
    src="/logo.svg"
    alt="Fliplane Icon"
    width={32}
    height={32}
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

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

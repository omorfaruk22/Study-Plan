import Brand from "@/components/site/Brand";
import SiteNavigation from "@/components/site/SiteNavigation";

type HeaderProps = {
  owner?: boolean;
};

export default function Header({ owner = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-green-100 bg-white/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-2 sm:h-[72px] sm:gap-4">
        <Brand />
        <SiteNavigation owner={owner} />
      </div>
    </header>
  );
}

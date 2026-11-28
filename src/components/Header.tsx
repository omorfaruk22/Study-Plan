import Brand from "@/components/site/Brand";
import LiveClocks from "@/components/home/LiveClocks";
import SiteNavigation from "@/components/site/SiteNavigation";

type HeaderProps = {
  owner?: boolean;
  publicMode?: boolean;
};

export default function Header({ owner = false, publicMode = false }: HeaderProps) {
  return (
    <header className={publicMode ? "public-header sticky top-0 z-30" : "sticky top-0 z-30 border-b border-green-100 bg-white/90 backdrop-blur-xl"}>
      <div className={publicMode ? "public-header-inner public-container" : "container flex h-16 items-center justify-between gap-2 sm:h-[72px] sm:gap-4"}>
        <Brand publicMode={publicMode} />
        <div className={publicMode ? "public-header-actions" : "contents"}>
          {publicMode && <LiveClocks compact />}
          <SiteNavigation owner={owner} publicMode={publicMode} />
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Eye, ShieldCheck } from "lucide-react";

export default function WorkspaceHeader() {
  return (
    <div className="workspace-header">
      <div className="workspace-header-copy">
        <span className="workspace-header-icon"><ShieldCheck size={16} /></span>
        <div>
          <p>STUDYPLAN · PRIVATE WORKSPACE</p>
          <span>তোমার পড়াশোনার command center</span>
        </div>
      </div>
      <Link href="/" className="workspace-public-link">
        <Eye size={15} /> <span>Public view</span>
      </Link>
    </div>
  );
}

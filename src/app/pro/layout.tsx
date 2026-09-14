import { ProChrome } from "@/components/pro/ProChrome";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <ProChrome>{children}</ProChrome>;
}

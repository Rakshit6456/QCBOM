"use client";
import { Suspense, useState } from "react";
import FindingsExplorer from "@/components/FindingsExplorer";
import { PageHead } from "@/components/ui";

export default function Page() {
  const [open, setOpen] = useState(null);
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "CBOM Findings", href: open ? "/findings" : undefined }, ...(open ? [{ label: open.finding_id }] : [])];
  return (<>
    <PageHead crumbs={crumbs} title="CBOM Findings" subtitle="Every cryptographic asset discovered across all scanner modules." />
    <Suspense><FindingsExplorer onOpenChange={setOpen} showCorrelation exportName="qcbom-findings" /></Suspense>
  </>);
}

import { PublicContractPage } from "@/components/contracts";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicContractPage token={token} />;
}

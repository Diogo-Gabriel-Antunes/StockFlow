import { AppLayout } from "./app-layout";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

type PrivatePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PrivatePlaceholder({
  eyebrow,
  title,
  description,
}: PrivatePlaceholderProps) {
  return (
    <AppLayout maxWidth="wide">
      <PageHeader eyebrow={eyebrow} subtitle={description} title={title} />
      <Card>
        <CardBody>
          <p className="text-sm text-muted">Tela reservada para a próxima fase do MVP.</p>
        </CardBody>
      </Card>
    </AppLayout>
  );
}

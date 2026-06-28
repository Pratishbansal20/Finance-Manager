import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Temporary placeholder used by routes whose real content arrives in a later
// milestone. Keeps the navigation fully browsable from Milestone 1.
export function PagePlaceholder({
  title,
  description,
  milestone,
}: {
  title: string;
  description: string;
  milestone: string;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-border text-muted-foreground flex h-48 items-center justify-center rounded-lg border border-dashed text-sm">
            Coming in {milestone}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

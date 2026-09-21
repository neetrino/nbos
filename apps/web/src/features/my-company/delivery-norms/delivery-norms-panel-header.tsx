export function DeliveryNormsPanelHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
        {index}
      </p>
      <h2 className="text-foreground text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function CallDetailField(props: {
  label: string;
  value: string | null | undefined;
  empty?: string;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{props.label}</dt>
      <dd className="text-foreground font-medium">{props.value ?? props.empty ?? '—'}</dd>
    </>
  );
}

'use client';

interface DeliveryItemPaymentSummaryProps {
  paymentType: string | null | undefined;
}

export function DeliveryItemPaymentSummary({ paymentType }: DeliveryItemPaymentSummaryProps) {
  const label = paymentType?.replace(/_/g, ' ') ?? '—';
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
        Payment
      </p>
      <p className="text-foreground text-sm font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">From order · read only</p>
    </div>
  );
}

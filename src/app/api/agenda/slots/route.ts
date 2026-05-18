import { availableSlots } from "@/lib/mock-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const modality = url.searchParams.get("modality");

  const slots = modality
    ? availableSlots.filter((slot) => slot.modality === modality)
    : availableSlots;

  return Response.json({
    slots,
    count: slots.length,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ManualRefundResponse {
  id: string;
  reservationId: string;
  licensePlate: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  depositAmount: number;
  reason: string;
  bankInfo: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
}

export function useAllRefundRequests() {
  return useQuery({
    queryKey: ["allRefundRequests"],
    queryFn: async () => {
      const response = await api.get<ManualRefundResponse[]>("/manager/manual-refunds");
      return response;
    },
  });
}

export function useMarkRefundProcessed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<ManualRefundResponse>(
        `/manager/manual-refunds/${id}/mark-processed`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRefundRequests"] });
    },
  });
}

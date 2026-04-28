"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsRight, MoreHorizontal, Paperclip, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select";
import type { InsuranceClaimDetail, InsuranceClaimFilters, InsuranceClaimStatus } from "@/types/finance";
import { getInsuranceClaimsWithDetails, updateInsuranceClaim, saveInsuranceClaimDocument } from "@/services/finance";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import isArrayHasData from "@/lib/isArrayHasData";
import currencyFormat from "@/lib/currencyFormat";
import { statusColors } from "@/constants/status";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

const NEXT_STATUSES: Partial<Record<InsuranceClaimStatus, InsuranceClaimStatus[]>> = {
  pending: ["submitted"],
  submitted: ["approved", "partial", "rejected"],
};

export function InsuranceClaimList() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const globalSearch = useSelector((state: RootState) => state?.uiShared.searchQuery);
  const dateRange = useSelector((state: RootState) => state.finance.dateRange);
  const [status, setStatus] = useState<InsuranceClaimStatus | "all">("all");

  // partial-amount dialog state
  const [partialClaim, setPartialClaim] = useState<InsuranceClaimDetail | null>(null);
  const [approvedAmount, setApprovedAmount] = useState(0);

  // upload state
  const [uploadingClaimId, setUploadingClaimId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<InsuranceClaimDetail | null>(null);

  const filters: InsuranceClaimFilters = { status, dateFrom: dateRange?.from, dateTo: dateRange?.to };

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ["insurance-claims", filters],
    queryFn: () => getInsuranceClaimsWithDetails(filters),
    staleTime: 60_000,
  });

  const claims = claimsData || [];

  const commonT = useTranslations("Common");
  const currency = commonT("currency");
  const patientT = useTranslations("Patients.table");
  const invoiceT = useTranslations("Finance.invoices");
  const insuranceT = useTranslations("Finance.insurance");

  const filteredData = useMemo(() => {
    if (!globalSearch) return claims;
    const q = globalSearch.toLowerCase();
    return claims.filter((c) =>
      c.patient_name?.toLowerCase().includes(q) ||
      c.patient_code?.toLowerCase().includes(q) ||
      c.invoice_number?.toLowerCase().includes(q) ||
      c.policy_number?.toLowerCase().includes(q) ||
      c.provider?.toLowerCase().includes(q)
    );
  }, [claims, globalSearch]);

  const total = filteredData.length;

  const statusOptions: { key: string; label: string }[] = [
    { key: "all", label: "All statuses" },
    { key: "pending", label: "Pending" },
    { key: "submitted", label: "Submitted" },
    { key: "approved", label: "Approved" },
    { key: "partial", label: "Partial" },
    { key: "rejected", label: "Rejected" },
  ];

  // ── Status mutation ────────────────────────────────────────────────────────
  const { mutate: changeClaimStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: ({ id, status, amount }: { id: string; status: InsuranceClaimStatus; amount?: number }) =>
      updateInsuranceClaim(id, status, amount),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["insurance-claims"] });
        toast.success(commonT("success"));
        setPartialClaim(null);
      } else {
        toast.error(res.error ?? commonT("error"));
      }
    },
    onError: () => toast.error(commonT("error")),
  });

  const handleStatusClick = (claim: InsuranceClaimDetail, s: InsuranceClaimStatus) => {
    if (s === "partial") {
      setApprovedAmount(0);
      setPartialClaim(claim);
    } else {
      changeClaimStatus({ id: claim.id, status: s });
    }
  };

  const handlePartialConfirm = () => {
    if (!partialClaim) return;
    if (approvedAmount <= 0) {
      toast.error("Enter a valid approved amount");
      return;
    }
    changeClaimStatus({ id: partialClaim.id, status: "partial", amount: approvedAmount });
  };

  // ── Document upload ────────────────────────────────────────────────────────
  const { mutate: saveDocument } = useMutation({
    mutationFn: ({ claimId, url }: { claimId: string; url: string }) =>
      saveInsuranceClaimDocument(claimId, url),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["insurance-claims"] });
        toast.success("Document uploaded");
      } else {
        toast.error(res.error ?? commonT("error"));
      }
      setUploadingClaimId(null);
    },
    onError: () => {
      toast.error(commonT("error"));
      setUploadingClaimId(null);
    },
  });

  const handleUploadClick = (claim: InsuranceClaimDetail) => {
    uploadTargetRef.current = claim;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const claim = uploadTargetRef.current;
    if (!file || !claim) return;
    e.target.value = "";

    setUploadingClaimId(claim.id);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${claim.id}/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("insurance-claims")
        .upload(path, file, { upsert: true });

      if (storageError) throw new Error(storageError.message);

      const { data: { publicUrl } } = supabase.storage.from("insurance-claims").getPublicUrl(path);
      saveDocument({ claimId: claim.id, url: publicUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploadingClaimId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <SelectField
          options={statusOptions}
          label={commonT("status")}
          onValueChange={setStatus}
          value={status}
          name=""
          containerClassName="w-[15%]"
        />
        <span className="text-sm text-muted-foreground">{total} claim{total !== 1 ? "s" : ""}</span>
      </div>

      <LoadingOverlay loading={isLoading}>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{patientT("patient")}</TableHead>
                <TableHead className="text-start">{invoiceT("invoiceNumber")}</TableHead>
                <TableHead className="text-start">{insuranceT("provider")}</TableHead>
                <TableHead className="text-start">{insuranceT("policyNumber")}</TableHead>
                <TableHead className="text-start">{insuranceT("claimedAmount")}</TableHead>
                <TableHead className="text-start">{insuranceT("approvedAmount")}</TableHead>
                <TableHead className="text-start">{insuranceT("status")}</TableHead>
                <TableHead className="text-start">{commonT("date")}</TableHead>
                <TableHead className="w-10">{patientT("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isArrayHasData(filteredData) ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    {commonT("ndf")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-muted/50">
                    <TableCell>
                      <p className="text-sm font-medium">{claim.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{claim.patient_code}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{claim.invoice_number}</TableCell>
                    <TableCell className="text-sm">{claim.provider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.policy_number ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {currencyFormat(claim.claimed_amount, currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {claim.approved_amount > 0 ? currencyFormat(claim.approved_amount, currency) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-none ${statusColors[claim.status]}`}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(claim.created_at, "yyyy/MM/dd")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUploadClick(claim)}
                            disabled={uploadingClaimId === claim.id}
                          >
                            {claim.document_url ? (
                              <>
                                <Paperclip className="h-3.5 w-3.5 mr-2 opacity-50" />
                                Replace document
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 mr-2 opacity-50" />
                                {uploadingClaimId === claim.id ? "Uploading…" : "Upload document"}
                              </>
                            )}
                          </DropdownMenuItem>

                          {claim.document_url && (
                            <DropdownMenuItem asChild>
                              <a href={claim.document_url} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="h-3.5 w-3.5 mr-2 opacity-50" />
                                View document
                              </a>
                            </DropdownMenuItem>
                          )}

                          {NEXT_STATUSES[claim.status] && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <ChevronsRight className="h-3.5 w-3.5 mr-2 opacity-50" />
                                Update status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {NEXT_STATUSES[claim.status]!.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => handleStatusClick(claim, s)}
                                  >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingOverlay>

      {/* Partial approved amount dialog */}
      <Dialog open={!!partialClaim} onOpenChange={(v) => !v && setPartialClaim(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Partial approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {partialClaim && (
              <p className="text-sm text-muted-foreground">
                Claimed: <span className="font-medium text-foreground">{currencyFormat(partialClaim.claimed_amount, currency)}</span>
                {" "}for {partialClaim.patient_name}
              </p>
            )}
            <div className="space-y-1">
              <Label>Approved amount</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                autoFocus
                value={approvedAmount || ""}
                onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialClaim(null)}>
              {commonT("cancel")}
            </Button>
            <Button onClick={handlePartialConfirm} disabled={isChangingStatus}>
              {isChangingStatus ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

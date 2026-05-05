import { useEffect, useState } from "react";
import { Alert, Modal, Switch, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  createShop,
  fetchAuditLogs,
  fetchDailyBills,
  fetchPaymentSummary,
  fetchSalesSummary,
  fetchShops,
  updateShopStatus,
} from "@/api/admin";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import type {
  AdminBillSummary,
  AuditLogRead,
  PaymentSplitSummary,
  ShopRead,
  ShopSalesSummary,
} from "@/types/api";
import { money } from "@/utils/decimal";
import { formatCurrency, formatDateTime } from "@/utils/format";

const createShopSchema = z.object({
  name: z.string().min(2, "Shop name is required"),
  code: z.string().optional(),
});

type CreateShopFormValues = z.infer<typeof createShopSchema>;

export function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [shops, setShops] = useState<ShopRead[]>([]);
  const [salesSummary, setSalesSummary] = useState<ShopSalesSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSplitSummary[]>([]);
  const [dailyBills, setDailyBills] = useState<AdminBillSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRead[]>([]);

  const form = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", code: "" },
  });

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [shopsData, salesData, paymentsData, billsData, logsData] = await Promise.all([
        fetchShops(),
        fetchSalesSummary(),
        fetchPaymentSummary(),
        fetchDailyBills(),
        fetchAuditLogs(),
      ]);
      setShops(shopsData);
      setSalesSummary(salesData);
      setPaymentSummary(paymentsData);
      setDailyBills(billsData);
      setAuditLogs(logsData);
    } catch (error) {
      Alert.alert("Unable to load dashboard", toApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateShop(values: CreateShopFormValues) {
    setCreating(true);
    try {
      await createShop({
        name: values.name,
        code: values.code?.trim() ? values.code.trim() : null,
      });
      form.reset();
      setModalOpen(false);
      await loadDashboard(true);
      Alert.alert("Shop created", "New shop credentials are ready in the admin list.");
    } catch (error) {
      Alert.alert("Unable to create shop", toApiError(error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleShop(shop: ShopRead, isActive: boolean) {
    try {
      await updateShopStatus(shop.id, { is_active: isActive });
      await loadDashboard(true);
    } catch (error) {
      Alert.alert("Unable to update shop", toApiError(error).message);
    }
  }

  const totalSales = salesSummary.reduce((sum, item) => sum.plus(money(item.total_sales)), money(0));
  const totalCash = paymentSummary.reduce((sum, item) => sum.plus(money(item.cash_total)), money(0));
  const totalUpi = paymentSummary.reduce((sum, item) => sum.plus(money(item.upi_total)), money(0));

  if (loading) {
    return <LoadingState fullscreen label="Loading admin dashboard..." />;
  }

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={() => void loadDashboard(true)}>
        <View className="gap-4">
          <Card className="gap-4 bg-ink">
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-amber-200">
              Operations
            </Text>
            <Text className="text-[28px] font-bold leading-[36px] text-white">
              Control shops, track live sales, and manage the day.
            </Text>
            <Button label="Create Shop Account" onPress={() => setModalOpen(true)} />
          </Card>

          <View className="flex-row flex-wrap gap-3">
            <StatCard label="Active Shops" value={`${shops.filter((shop) => shop.is_active).length}`} />
            <StatCard label="Total Sales" value={formatCurrency(totalSales.toString())} />
            <StatCard label="Cash Collected" value={formatCurrency(totalCash.toString())} />
            <StatCard label="UPI Collected" value={formatCurrency(totalUpi.toString())} />
          </View>

          <SectionHeading title="Shop Accounts" subtitle="Enable or disable each shop from one place." />
          {shops.length === 0 ? (
            <EmptyState
              title="No shops yet"
              description="Create your first shop account to start day-to-day billing."
              actionLabel="Create Shop"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            shops.map((shop) => (
              <Card key={shop.id} className="gap-3">
                <View className="flex-row flex-wrap items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-semibold text-ink">{shop.name}</Text>
                    <Text className="text-sm leading-6 text-muted">
                      {shop.code} • {shop.username}
                    </Text>
                  </View>
                  <StatusPill label={shop.is_active ? "Active" : "Disabled"} tone={shop.is_active ? "success" : "danger"} />
                </View>
                <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-3xl bg-surface px-4 py-3">
                  <Text className="text-sm text-ink">Shop access</Text>
                  <Switch value={shop.is_active} onValueChange={(value) => void handleToggleShop(shop, value)} />
                </View>
              </Card>
            ))
          )}

          <SectionHeading title="Sales Summary" subtitle="Backend totals per shop." />
          {salesSummary.length === 0 ? (
            <EmptyState
              title="No sales yet"
              description="Sales totals will appear here as soon as shops start billing."
            />
          ) : (
            salesSummary.map((item) => (
              <Card key={item.shop_id} className="gap-1">
                <Text className="text-base font-semibold text-ink">{item.shop_name}</Text>
                <Text className="text-sm text-muted">{item.shop_code}</Text>
                <Text className="text-xl font-bold text-ink">{formatCurrency(item.total_sales)}</Text>
              </Card>
            ))
          )}

          <SectionHeading title="Payment Split" subtitle="Cash and UPI totals by shop." />
          {paymentSummary.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Payment splits will show up here after the first completed bills."
            />
          ) : (
            paymentSummary.map((item) => (
              <Card key={item.shop_id} className="gap-2">
                <Text className="text-base font-semibold text-ink">{item.shop_name}</Text>
                <View className="flex-row flex-wrap justify-between gap-2">
                  <Text className="text-sm text-muted">Cash</Text>
                  <Text className="text-sm font-semibold text-ink">{formatCurrency(item.cash_total)}</Text>
                </View>
                <View className="flex-row flex-wrap justify-between gap-2">
                  <Text className="text-sm text-muted">UPI</Text>
                  <Text className="text-sm font-semibold text-ink">{formatCurrency(item.upi_total)}</Text>
                </View>
              </Card>
            ))
          )}

          <SectionHeading title="Daily Bills" subtitle="Recent receipts generated by shops." />
          {dailyBills.length === 0 ? (
            <EmptyState
              title="No bills yet"
              description="New receipts will land here once the shops start processing sales."
            />
          ) : (
            dailyBills.slice(0, 10).map((bill) => (
              <Card key={bill.bill_id} className="gap-2">
                <View className="flex-row flex-wrap items-center justify-between gap-3">
                  <Text className="text-base font-semibold text-ink">{bill.bill_no}</Text>
                  <StatusPill label={bill.status} tone="success" />
                </View>
                <Text className="text-sm text-muted">{bill.shop_name}</Text>
                <Text className="text-lg font-bold text-ink">{formatCurrency(bill.total_amount)}</Text>
                <Text className="text-xs text-muted">{formatDateTime(bill.created_at)}</Text>
              </Card>
            ))
          )}

          <SectionHeading title="Activity Logs" subtitle="Audit-friendly backend events." />
          {auditLogs.length === 0 ? (
            <EmptyState
              title="No activity logs"
              description="Audit events will appear here as soon as admins and shop users take actions."
            />
          ) : (
            auditLogs.slice(0, 12).map((log) => (
              <Card key={log.id} className="gap-1">
                <Text className="text-sm font-semibold uppercase tracking-[1px] text-accent">
                  {log.action}
                </Text>
                <Text className="text-sm leading-6 text-ink">{log.details}</Text>
                <Text className="text-xs text-muted">{formatDateTime(log.created_at)}</Text>
              </Card>
            ))
          )}
        </View>
      </Screen>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/30">
          <View className="max-h-[90%] rounded-t-[32px] bg-white p-5">
            <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
              <View className="flex-1">
                <SectionHeading title="Create Shop" subtitle="New shops get the backend default password." />
              </View>
              <Button label="Close" onPress={() => setModalOpen(false)} variant="secondary" size="sm" />
            </View>
            <View className="gap-4">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Shop name"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Shop code (optional)"
                    autoCapitalize="characters"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                label="Create Shop Account"
                onPress={form.handleSubmit(handleCreateShop)}
                loading={creating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

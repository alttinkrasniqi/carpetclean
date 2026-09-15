"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { nextOrderNumber, STATUS_STEPS } from "@/lib/data";

export async function createOrder(formData) {
  let customerId = formData.get("customer_id");
  const pricePerSqm = parseFloat(formData.get("price_per_sqm"));

  if (!customerId || customerId === "__new__") {
    const name = (formData.get("new_customer_name") || "").toString().trim();
    const phone = (formData.get("new_customer_phone") || "").toString().trim();
    const address = (formData.get("new_customer_address") || "").toString().trim();
    if (!name || !phone) {
      throw new Error("Customer name and phone are required.");
    }
    const { data: newCustomer, error: custErr } = await supabase
      .from("customers")
      .insert({ name, phone, address })
      .select()
      .single();
    if (custErr) throw new Error(custErr.message);
    customerId = newCustomer.id;
  } else {
    customerId = parseInt(customerId, 10);
  }

  const { data: lastOrder } = await supabase
    .from("orders")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderNumber = nextOrderNumber(lastOrder?.id);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "New Order",
      price_per_sqm: pricePerSqm,
      notes: (formData.get("notes") || "").toString().trim(),
      collection_date: formData.get("collection_date") || null,
      collection_notes: (formData.get("collection_notes") || "").toString().trim(),
    })
    .select()
    .single();

  if (orderErr) throw new Error(orderErr.message);

  const lengths = formData.getAll("carpet_length[]");
  const widths = formData.getAll("carpet_width[]");
  const labels = formData.getAll("carpet_label[]");

  const carpetRows = [];
  for (let i = 0; i < lengths.length; i++) {
    const length = parseFloat(lengths[i]);
    const width = parseFloat(widths[i]);
    if (!length || !width || length <= 0 || width <= 0) continue;
    carpetRows.push({
      order_id: order.id,
      length,
      width,
      price_per_sqm: pricePerSqm,
      label: labels[i] || `Carpet ${i + 1}`,
    });
  }

  if (carpetRows.length === 0) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("Please add at least one carpet with valid measurements.");
  }

  const { error: carpetErr } = await supabase.from("carpets").insert(carpetRows);
  if (carpetErr) throw new Error(carpetErr.message);

  const amountPaid = parseFloat(formData.get("amount_paid"));
  if (amountPaid && amountPaid > 0) {
    await supabase.from("payments").insert({
      order_id: order.id,
      amount: amountPaid,
      note: "Initial payment",
    });
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/customers");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatus(orderId, status) {
  if (!STATUS_STEPS.includes(status)) return;

  const patch = { status };
  const today = new Date().toISOString().slice(0, 10);

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (order) {
    if (status === "Collected" && !order.collection_date) patch.collection_date = today;
    if (status === "At Factory" && !order.factory_received_date) patch.factory_received_date = today;
    if (status === "Ready" && !order.cleaning_completed_date) patch.cleaning_completed_date = today;
    if (status === "Delivered" && !order.delivery_date) patch.delivery_date = today;
  }

  await supabase.from("orders").update(patch).eq("id", orderId);

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function updateOrderDetails(orderId, formData) {
  const patch = {
    collection_date: formData.get("collection_date") || null,
    factory_received_date: formData.get("factory_received_date") || null,
    cleaning_completed_date: formData.get("cleaning_completed_date") || null,
    delivery_date: formData.get("delivery_date") || null,
    collection_notes: (formData.get("collection_notes") || "").toString().trim(),
    delivery_notes: (formData.get("delivery_notes") || "").toString().trim(),
    notes: (formData.get("notes") || "").toString().trim(),
  };
  await supabase.from("orders").update(patch).eq("id", orderId);
  revalidatePath(`/orders/${orderId}`);
}

export async function addPayment(orderId, formData) {
  const amount = parseFloat(formData.get("amount"));
  if (!amount || amount <= 0) throw new Error("Enter a valid payment amount.");
  const note = (formData.get("note") || "").toString().trim();

  await supabase.from("payments").insert({ order_id: orderId, amount, note });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function archiveOrder(orderId) {
  await supabase.from("orders").update({ is_archived: true }).eq("id", orderId);
  revalidatePath("/orders");
  revalidatePath("/settings");
  redirect("/orders");
}

export async function restoreOrder(orderId) {
  await supabase.from("orders").update({ is_archived: false }).eq("id", orderId);
  revalidatePath("/settings");
  revalidatePath("/orders");
}

export async function updateSettings(formData) {
  const businessName = (formData.get("business_name") || "").toString().trim();
  const defaultPrice = parseFloat(formData.get("default_price_per_sqm"));

  const { data: existing } = await supabase.from("settings").select("id").limit(1).maybeSingle();
  if (existing) {
    await supabase
      .from("settings")
      .update({ business_name: businessName, default_price_per_sqm: defaultPrice })
      .eq("id", existing.id);
  } else {
    await supabase.from("settings").insert({ business_name: businessName, default_price_per_sqm: defaultPrice });
  }

  revalidatePath("/");
  revalidatePath("/settings");
}
